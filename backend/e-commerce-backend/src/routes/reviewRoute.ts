import { Router } from 'express';
import ReviewController from '../controllers/ReviewController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all reviews for a product
router.get('/products/:productId/reviews', ReviewController.getProductReviews);

// Create a new review (requires authentication)
router.post('/products/:productId/reviews', authenticateToken, ReviewController.createReview);

// Update a review (requires authentication)
router.put('/reviews/:id', authenticateToken, ReviewController.updateReview);

// Delete a review (requires authentication)
router.delete('/reviews/:id', authenticateToken, ReviewController.deleteReview);

export default router; 