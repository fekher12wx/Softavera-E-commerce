import express from 'express';
import settingsController from '../controllers/settingsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Payment method routes
router.get('/payment-method', settingsController.getActivePaymentMethod);
router.post('/payment-method', authenticateToken, settingsController.setActivePaymentMethod);

// Currency routes
router.get('/currency', settingsController.getCurrency);
router.post('/currency', authenticateToken, settingsController.setCurrency);

// Tax routes
router.get('/tax', settingsController.getTax);
router.post('/tax', authenticateToken, settingsController.setTax);

// Tax routes (new tax table system)
router.get('/taxes', settingsController.getTaxes);
router.get('/taxes/active', settingsController.getActiveTaxes);

export default router;
