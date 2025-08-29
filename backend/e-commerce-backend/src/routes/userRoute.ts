import { Router } from 'express';
import userController from '../controllers/userController';
import { requireAuth, requireAdminAuth } from '../middleware/auth';

const router = Router();

// GET /api/users
router.get('/', requireAuth, userController.getAllUsers);

// GET /api/users/me
router.get('/me', requireAuth, userController.getMe);

// GET /api/users/:id
router.get('/:id', requireAuth, userController.getUserById);

// POST /api/users
router.post('/', requireAuth, userController.createUser);

// PUT /api/users/:id (requires auth, role updates require admin)
router.patch('/:id', requireAuth, userController.updateUser);

// GET /api/users/:id/check-delete
router.get('/:id/check-delete', requireAuth, userController.checkUserDeletion);

// DELETE /api/users/:id
router.delete('/:id', requireAuth, userController.deleteUser);

export default router;