import express from 'express';
import authController from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));

// Protected routes
router.get('/verify', requireAuth, authController.verify.bind(authController)); // 🆕 NEW
router.get('/profile', requireAuth, authController.getProfile.bind(authController));
router.put('/profile', requireAuth, authController.updateProfile.bind(authController));
router.put('/change-password', requireAuth, authController.changePassword.bind(authController));
router.post('/logout', requireAuth, authController.logout.bind(authController)); // 🆕 NEW (optional)

export default router;