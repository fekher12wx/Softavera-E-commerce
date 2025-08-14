import { Router } from 'express';
import paymentController from '../controllers/paymentController';

const router = Router();

// Adyen Payment Routes
// POST /api/payments/session
router.post('/session', paymentController.createCheckoutSession);

// Paymee Payment Routes
// POST /api/payments/paymee/create
router.post('/paymee/create', paymentController.createPaymeePayment);

// GET /api/payments/paymee/status/:token
router.get('/paymee/status/:token', paymentController.checkPaymeePaymentStatus);

// GET /api/payments/paymee/config
router.get('/paymee/config', paymentController.getPaymeeConfig);

// POST /api/payments/paymee/webhook
router.post('/paymee/webhook', paymentController.handlePaymeeWebhook);

// Konnect Payment Routes
// POST /api/payments/konnect/create
router.post('/konnect/create', paymentController.createKonnectPayment);

// GET /api/payments/konnect/status/:token
router.get('/konnect/status/:token', paymentController.checkKonnectPaymentStatus);

// POST /api/payments/konnect/webhook
router.post('/konnect/webhook', paymentController.handleKonnectWebhook);

export default router; 