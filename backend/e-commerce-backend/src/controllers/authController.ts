import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';
import { safeRedis } from '../config/redis';
import dataService from '../services/dataService';

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  address?: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
}

interface LoginRequest {
  email: string;
  password: string;
}

class AuthController {
  generateTokens(user: any) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

    return { token, refreshToken };
  }

  async register(req: Request, res: Response) {
    try {
      const { email, password, name, address }: RegisterRequest = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
      }

      const existingUser = await dataService.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const newUser = await dataService.createUserWithPassword({
        email,
        name,
        password,
        address,
      });

      const { token, refreshToken } = this.generateTokens(newUser);
      const { password: _, ...userWithoutPassword } = newUser;

      return res.status(201).json({
        message: `Welcome ${name}, your account has been created 🎉`,
        user: userWithoutPassword,
        token,
        refreshToken,
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Registration failed' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password }: LoginRequest = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await dataService.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const { token, refreshToken } = this.generateTokens(user);
      const { password: _, ...userWithoutPassword } = user;

      // Store session data in Redis (hybrid session)
      await safeRedis.set(
        `session:${user.id}`,
        JSON.stringify({
          userId: user.id,
          email: user.email,
          role: user.role,
          lastLogin: new Date().toISOString()
        }),
        { EX: 3600 } // 1 hour
      );

      return res.json({
        user: userWithoutPassword,
        token,
        refreshToken
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  }

  async verify(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      const user = await dataService.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({
        user: user,
        message: 'Token is valid'
      });
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(500).json({ error: 'Token verification failed' });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

      const user = await dataService.getUserModelById(decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { token, refreshToken: newRefreshToken } = this.generateTokens(user);

      return res.json({
        token,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await dataService.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json(user);
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const { name, email, address } = req.body;
      const userId = req.user!.id;

      if (email && email !== req.user!.email) {
        const existingUser = await dataService.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ error: 'Email already in use' });
        }
      }

      const updatedUser = await dataService.updateUser(userId, {
        name,
        email,
        address
      });

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({ 
        message: 'Profile updated successfully',
        user: updatedUser 
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  async changePassword(req: AuthRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      const user = await dataService.getUserModelById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const success = await dataService.updateUserPassword(userId, newPassword);
      if (!success) {
        return res.status(500).json({ error: 'Failed to update password' });
      }

      return res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({ error: 'Failed to change password' });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const token = req.headers['authorization']?.split(' ')[1];
      
      // Remove session data from Redis
      if (userId) {
        await safeRedis.del(`session:${userId}`);
      }
      
      // Blacklist the JWT for the remainder of its life (optional, for immediate logout)
      if (token) {
        // Decode to get exp
        const decoded: any = jwt.decode(token);
        if (decoded && decoded.exp) {
          const now = Math.floor(Date.now() / 1000);
          const ttl = decoded.exp - now;
          if (ttl > 0) {
            await safeRedis.set(`blacklist:${token}`, '1', { EX: ttl });
          }
        }
      }
      
      return res.json({ 
        message: 'Logged out successfully' 
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Logout failed' });
    }
  }
}

export default new AuthController();