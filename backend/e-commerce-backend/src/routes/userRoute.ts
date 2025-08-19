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

// GET /api/users/:id/check-delete
router.get('/:id/check-delete', authenticateToken, userController.checkUserDeletion);

// DELETE /api/users/:id
router.delete('/:id', authenticateToken, userController.deleteUser);

export default router;