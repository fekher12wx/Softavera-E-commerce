import { Router } from 'express';
import auth from './auth';
import products from './productRoute';
import users from './userRoute';
import orders from './orderRoute';
import payments from './paymentRoute';
import reviews from './reviewRoute';
import settingsRoute from './settingsRoute';
import taxes from './taxRoute';
import paymentMethods from './paymentMethodRoute';

const router = Router();

router.use('/products', products); 
router.use('/users',users); 
router.use('/orders',orders);
router.use('/auth', auth);
router.use('/payments', payments);
router.use('/settings', settingsRoute);
router.use('/taxes', taxes);
router.use('/payment-methods', paymentMethods);
router.use('/', reviews);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;