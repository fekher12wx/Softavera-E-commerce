import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/index';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('🔑 Token decoded:', { 
      id: decoded.id, 
      email: decoded.email, 
      role: decoded.role,
      user: decoded.user 
    });
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): Response | void =>{
    // Check for both lowercase and uppercase admin roles
    const userRole = req.user?.role;
    const isAdmin = userRole === UserRole.ADMIN || String(userRole).toUpperCase() === 'ADMIN';
    
    console.log('🔐 Admin check:', { 
      userRole, 
      UserRoleAdmin: UserRole.ADMIN, 
      isAdmin,
      userId: req.user?.id,
      userEmail: req.user?.email
    });
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };

export const requireAuth = [authenticateToken];
export const requireAdminAuth = [authenticateToken, requireAdmin];