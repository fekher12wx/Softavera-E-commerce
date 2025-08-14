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
      
      console.log('Updating user with ID:', id);
      console.log('Update data received:', updates);

      // Convert flat address fields to address object
      const addressFields = ['street', 'city', 'zipCode', 'country'];
      const hasAddressFields = addressFields.some(field => field in updates);
      
      let updateData: UpdateUser = { ...updates };
      
      if (hasAddressFields) {
        updateData = {
          address: {
            street: updates.street || '',
            city: updates.city || '',
            zipCode: updates.zipCode || '',
            country: updates.country || ''
          }
        };
      }

      console.log('Processed update data:', updateData);
      const user = await dataService.updateUser(id, updateData);

      if (!user) {
        console.log('User not found with ID:', id);
        res.status(404).json({ error: 'User not found' });
        return;
      }

      console.log('User updated successfully:', user);
      res.json(user);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;


      const deleted = await dataService.deleteUser(id);

      if (!deleted) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
}

export default new UserController();
