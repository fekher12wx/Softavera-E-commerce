import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  UpdateUser,
  Address,
  UserRole,
  AuthResponse,
  RegisterCredentials,
  User,
} from '../models/index';
import dataService from '../services/dataService';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail } from '../utils/mailer';
import { safeRedis } from '../config/redis';

export class UserController {
  async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const users = await dataService.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cacheKey = `user:profile:${id}`;
      const cached = await safeRedis.get(cacheKey);
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }
      const user = await dataService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      await safeRedis.set(cacheKey, JSON.stringify(user), { EX: 600 }); // 10 min
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  async createUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, name, password, address } = req.body as RegisterCredentials;

    if (!email || !name || !password) {
      res.status(400).json({ error: 'Email, name, and password are required' });
      return;
    }

    // ✅ Check if user exists
    const existingUser = await dataService.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    const newUser = await dataService.createUserWithPassword({
      email,
      name,
      password,
      role: UserRole.USER,
      address: address
        ? {
            street: address.street,
            city: address.city,
            zipCode: address.zipCode,
            country: address.country,
          }
        : undefined,
    });

    // ✅ Send welcome email
    await sendWelcomeEmail(email, name);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' },
    );
    const refreshToken = jwt.sign(
      { id: newUser.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' },
    );

    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: `Welcome ${name}, your account has been created 🎉`,
      user: userWithoutPassword,
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

  async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const user = await dataService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json(user); // Return the full user object including id
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user info' });
    }
  }

  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const currentUser = req.user!;
      
      // Check if user is trying to update role
      if (updates.role && updates.role !== currentUser.role) {
        // Only admins can change roles
        if (currentUser.role !== UserRole.ADMIN) {
          res.status(403).json({ error: 'Insufficient permissions. Admin access required to change user roles.' });
          return;
        }
        
        // Prevent admin from removing their own admin role
        if (id === currentUser.id && updates.role !== UserRole.ADMIN) {
          res.status(400).json({ error: 'Cannot remove your own admin role' });
          return;
        }
        
        // Validate role
        const validRoles = ['USER', 'ADMIN'];
        if (!validRoles.includes(updates.role)) {
          res.status(400).json({ error: 'Invalid role. Must be USER or ADMIN.' });
          return;
        }
      }

      // Convert flat address fields to address object
      const addressFields = ['street', 'city', 'zipCode', 'country'];
      const hasAddressFields = addressFields.some(field => field in updates);
      
      let updateData: UpdateUser = { ...updates };
      
      if (hasAddressFields) {
        updateData = {
          ...updateData, // Keep all existing fields including role
          address: {
            street: updates.street || '',
            city: updates.city || '',
            zipCode: updates.zipCode || '',
            country: updates.country || ''
          }
        };
      }

      const user = await dataService.updateUser(id, updateData);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  async checkUserDeletion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const isAdmin = req.user?.role === UserRole.ADMIN;
      
      // For admin users, always allow deletion (with force delete)
      if (isAdmin) {
        res.json({ canDelete: true, adminOverride: true });
        return;
      }
      
      const result = await dataService.deleteUser(id);
      
      if (!result.userExists) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      if (!result.success && result.dependencies) {
        const { orders, reviews } = result.dependencies;
        let reason = 'User has ';
        const reasons = [];
        
        if (orders && orders.length > 0) {
          reasons.push(`${orders.length} order(s)`);
        }
        if (reviews && reviews.length > 0) {
          reasons.push(`${reviews.length} review(s)`);
        }
        
        reason += `${reasons.join(' and ')}`;
        
        res.json({ 
          canDelete: false, 
          reason,
          dependencies: result.dependencies
        });
        return;
      }
      
      res.json({ canDelete: true });
    } catch (error) {
      console.error('Error checking user deletion:', error);
      res.status(500).json({ error: 'Failed to check user deletion' });
    }
  }

  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const isAdmin = req.user?.role === UserRole.ADMIN;

      // Use force delete for admin users
      const result = await dataService.deleteUser(id, isAdmin);

      if (!result.success) {
        if (!result.userExists) {
          res.status(404).json({ error: 'User not found' });
          return;
        }
        
        if (result.dependencies && !isAdmin) {
          const { orders, reviews } = result.dependencies;
          let message = 'Cannot delete user. ';
          const reasons = [];
          
          if (orders && orders.length > 0) {
            reasons.push(`${orders.length} order(s)`);
          }
          if (reviews && reviews.length > 0) {
            reasons.push(`${reviews.length} review(s)`);
          }
          
          message += `User has ${reasons.join(' and ')}. Please delete these first or reassign them.`;
          
          res.status(400).json({ 
            error: message,
            dependencies: result.dependencies
          });
          return;
        }
        
        // This should not happen with the new logic, but handle it gracefully
        res.status(500).json({ error: 'Failed to delete user' });
        return;
      }

      const message = isAdmin ? 'User deleted successfully (admin override)' : 'User deleted successfully';
      res.json({ message });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
}

export default new UserController();
