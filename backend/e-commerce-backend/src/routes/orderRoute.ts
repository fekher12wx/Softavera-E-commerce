import { Router } from 'express';
import orderController from '../controllers/OrderController';

const router = Router();

// GET /api/orders
router.get('/', orderController.getAllOrders);

// GET /api/orders/:id
router.get('/:id', orderController.getOrderById);

// GET /api/orders/user/:userId
router.get('/user/:userId', orderController.getOrdersByUserId);

// POST /api/orders
router.post('/', orderController.createOrder);

// PUT /api/orders/:id/status
router.patch('/:id/status', orderController.updateOrderStatus);

// PUT /api/orders/:id
router.put('/:id', orderController.updateOrder);


// DELETE /api/orders/:id
router.delete('/:id', orderController.deleteOrder);

export default router;