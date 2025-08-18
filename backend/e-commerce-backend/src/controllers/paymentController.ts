import { Request, Response } from 'express';
import { createCheckoutSession, getPaymentMethods } from '../adyen/adyen';
import { 
  createPaymeePayment, 
  checkPaymeePaymentStatus, 
  validatePaymeeConfig,
  generatePaymentReference,
  formatPaymeeAmount 
} from '../paymee/paymee';
import { createKonnectPayment, checkKonnectPaymentStatus } from '../konnect/konnect';
import paymentConfigService from '../services/paymentConfigService';

const paymentController = {
  async createCheckoutSession(req: Request, res: Response): Promise<void> {
    try {
      const { amount, currency, countryCode, reference, returnUrl, lineItems, store } = req.body;
      
      // Validate required fields
      if (!amount || !currency || !countryCode || !returnUrl) {
        res.status(400).json({ 
          error: 'Missing required fields: amount, currency, countryCode, returnUrl' 
        });
        return;
      }

     
      // Create the session
      const session = await createCheckoutSession({
        amount,
        currency,
        countryCode,
        reference,
        returnUrl,
        lineItems,
        store
      });

      // Get client key from database configuration
      const adyenConfig = await paymentConfigService.getProviderConfig('adyen');
      if (!adyenConfig || !adyenConfig.clientKey) {
        throw new Error('Adyen client key not found in configuration');
      }
      const clientKey = adyenConfig.clientKey;

      // Don't pass paymentMethodsConfiguration to the session
      // The Drop-in will handle this automatically
      const response = { 
        session, 
        clientKey
      };

      
      res.status(200).json(response);
    } catch (error) {
      console.error('Adyen session error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        error: 'Failed to create Adyen session', 
        details: message 
      });
    }
  },

  // Konnect: Create payment
  async createKonnectPayment(req: Request, res: Response): Promise<void> {
    try {
      const { amount, note, email, first_name, last_name, reference, returnUrl } = req.body;
      if (!amount || !note || !email || !first_name || !last_name) {
        res.status(400).json({ error: 'Missing required fields: amount, note, email, first_name, last_name' });
        return;
      }
      const result = await createKonnectPayment({ amount, note, email, first_name, last_name, reference, returnUrl });
      if (!result.success) {
        res.status(400).json({ error: result.error || 'Failed to create Konnect payment' });
        return;
      }
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to create Konnect payment', details: message });
    }
  },

  // Konnect: Check status
  async checkKonnectPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params as { token: string };
      const result = await checkKonnectPaymentStatus(token);
      if (!result.success) {
        res.status(400).json({ error: result.error || 'Failed to check Konnect status' });
        return;
      }
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to check Konnect payment status', details: message });
    }
  },

  // Konnect: Webhook (placeholder)
  async handleKonnectWebhook(req: Request, res: Response): Promise<void> {
    try {
      // In real implementation, verify signature and update order
      res.status(200).json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to process Konnect webhook', details: message });
    }
  },

  // Optional: Add a separate endpoint to test payment methods
  async getPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const { amount, currency, countryCode } = req.body;
      
      if (!amount || !currency || !countryCode) {
        res.status(400).json({ 
          error: 'Missing required fields: amount, currency, countryCode' 
        });
        return;
      }

      const paymentMethods = await getPaymentMethods({
        amount,
        currency,
        countryCode
      });

      res.status(200).json(paymentMethods);
    } catch (error) {
      console.error('Payment methods error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        error: 'Failed to fetch payment methods', 
        details: message 
      });
    }
  },

  // Paymee Payment Methods
  async createPaymeePayment(req: Request, res: Response): Promise<void> {
    try {
      const { 
        amount, 
        note, 
        email, 
        first_name, 
        last_name, 
        reference,
        returnUrl 
      } = req.body;

      // Validate required fields
      if (!amount || !note || !email || !first_name || !last_name) {
        res.status(400).json({
          error: 'Missing required fields: amount, note, email, first_name, last_name'
        });
        return;
      }

      // Validate Paymee configuration
      const isConfigValid = await validatePaymeeConfig();
      if (!isConfigValid) {
        res.status(500).json({
          error: 'Paymee configuration is invalid. Please check your environment variables.'
        });
        return;
      }

      // Format amount
      const formattedAmount = formatPaymeeAmount(amount);
      
      // Generate reference if not provided
      const paymentReference = reference || generatePaymentReference('PAYMEE');

   

      const paymentResponse = await createPaymeePayment({
        amount: formattedAmount,
        note,
        email,
        first_name,
        last_name,
        reference: paymentReference,
        returnUrl
      });

      res.status(200).json(paymentResponse);
    } catch (error) {
      console.error('Paymee payment creation error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Failed to create Paymee payment',
        details: message
      });
    }
  },

  async checkPaymeePaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({
          error: 'Payment token is required'
        });
        return;
      }


      const statusResponse = await checkPaymeePaymentStatus(token);

      res.status(200).json(statusResponse);
    } catch (error) {
      console.error('Paymee payment status check error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Failed to check Paymee payment status',
        details: message
      });
    }
  },

  async getPaymeeConfig(req: Request, res: Response): Promise<void> {
    try {
      const isConfigValid = await validatePaymeeConfig();
      
      res.status(200).json({
        success: isConfigValid,
        message: isConfigValid ? 'Paymee configuration is valid' : 'Paymee configuration is invalid',
        environment: process.env.PAYMEE_ENVIRONMENT || 'sandbox'
      });
    } catch (error) {
      console.error('Paymee config check error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Failed to check Paymee configuration',
        details: message
      });
    }
  },

  async handlePaymeeWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { 
        token, 
        payment_status, 
        amount, 
        vendor, 
        note, 
        transaction_id, 
        payment_date 
      } = req.body;

     

      // Validate webhook data
      if (!token || payment_status === undefined) {
        console.error('Invalid webhook data received');
        res.status(400).json({ error: 'Invalid webhook data' });
        return;
      }

      // Verify the payment status
      const isPaymentSuccessful = payment_status === true || payment_status === 'true';

      if (isPaymentSuccessful) {
        // Payment was successful - update order status
        
        // TODO: Update order status in database
        // await updateOrderStatus(token, 'paid');
        
        // TODO: Send confirmation email to customer
        // await sendPaymentConfirmationEmail(token);
        
        // TODO: Update inventory
        // await updateInventory(token);
      } else {
        // Payment failed or is pending
        
        // TODO: Update order status in database
        // await updateOrderStatus(token, 'failed');
      }

      // Always respond with success to acknowledge receipt
      res.status(200).json({ 
        success: true, 
        message: 'Webhook received successfully' 
      });
    } catch (error) {
      console.error('Paymee webhook error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Failed to process Paymee webhook',
        details: message
      });
    }
  }
};

export default paymentController;