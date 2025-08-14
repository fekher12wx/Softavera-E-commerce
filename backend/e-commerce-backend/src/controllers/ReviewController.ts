import { Request, Response } from 'express';
import dataService from '../services/dataService';

export class ReviewController {
  // GET /api/products/:productId/reviews
  async getProductReviews(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const reviews = await dataService.getReviewsByProductId(productId);
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }

  // POST /api/products/:productId/reviews
  async createReview(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { rating, comment } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!rating || rating < 1 || rating > 5) {
        res.status(400).json({ error: 'Rating must be between 1 and 5' });
        return;
      }

      if (!comment || comment.trim().length === 0) {
        res.status(400).json({ error: 'Comment is required' });
        return;
      }

      // Get user info
      const user = await dataService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const review = await dataService.createReview({
        productId,
        userId,
        userName: user.name,
        rating,
        comment: comment.trim()
      });

      // Update product rating
      await dataService.updateProductRating(productId);

      res.status(201).json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ error: 'Failed to create review' });
    }
  }

  // PUT /api/reviews/:id
  async updateReview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Check if review exists and belongs to user
      const existingReview = await dataService.getReviewById(id);
      if (!existingReview) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }

      if (existingReview.userId !== userId) {
        res.status(403).json({ error: 'Not authorized to update this review' });
        return;
      }

      if (rating && (rating < 1 || rating > 5)) {
        res.status(400).json({ error: 'Rating must be between 1 and 5' });
        return;
      }

      const updates: Partial<typeof existingReview> = {};
      if (rating !== undefined) updates.rating = rating;
      if (comment !== undefined) updates.comment = comment.trim();

      const updatedReview = await dataService.updateReview(id, updates);

      if (!updatedReview) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }

      // Update product rating
      await dataService.updateProductRating(existingReview.productId);

      res.json(updatedReview);
    } catch (error) {
      console.error('Error updating review:', error);
      res.status(500).json({ error: 'Failed to update review' });
    }
  }

  // DELETE /api/reviews/:id
  async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Check if review exists and belongs to user
      const existingReview = await dataService.getReviewById(id);
      if (!existingReview) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }

      if (existingReview.userId !== userId) {
        res.status(403).json({ error: 'Not authorized to delete this review' });
        return;
      }

      const deleted = await dataService.deleteReview(id);

      if (!deleted) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }

      // Update product rating
      await dataService.updateProductRating(existingReview.productId);

      res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error('Error deleting review:', error);
      res.status(500).json({ error: 'Failed to delete review' });
    }
  }
}

export default new ReviewController(); 