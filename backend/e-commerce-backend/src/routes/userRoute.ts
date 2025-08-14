import { Router } from 'express';
import userController from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/users
router.get('/', userController.getAllUsers);

// GET /api/users/me
router.get('/me', authenticateToken, userController.getMe);

// GET /api/users/:id
router.get('/:id', userController.getUserById);

// POST /api/users
router.post('/', userController.createUser);

// PUT /api/users/:id
router.patch('/:id', userController.updateUser);

// DELETE /api/users/:id
router.delete('/:id', userController.deleteUser);

export default router;