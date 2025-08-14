import express from 'express';
import { authenticateToken } from '../middleware/auth';
import dataService from '../services/dataService';
import paymentConfigService from '../services/paymentConfigService';
import encryptionService from '../services/encryptionService';

const router = express.Router();

// Get all payment methods
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('=== Fetching All Payment Methods ===');
    const paymentMethods = await dataService.getPaymentMethods();
    console.log('Found payment methods:', paymentMethods.map(pm => ({ id: pm.id, name: pm.name, code: pm.code })));
    return res.json(paymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// Get active payment methods only (must come before /:id route)
router.get('/active', async (req, res) => {
  try {
    console.log('=== Fetching Active Payment Methods ===');
    const paymentMethods = await dataService.getActivePaymentMethods();
    console.log('Active payment methods:', paymentMethods.map(pm => ({ id: pm.id, name: pm.name, code: pm.code, isActive: pm.isActive })));
    return res.json(paymentMethods);
  } catch (error) {
    console.error('Error fetching active payment methods:', error);
    return res.status(500).json({ error: 'Failed to fetch active payment methods' });
  }
});

// Get payment method by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const paymentMethod = await dataService.getPaymentMethodById(req.params.id);
    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    return res.json(paymentMethod);
  } catch (error) {
    console.error('Error fetching payment method:', error);
    return res.status(500).json({ error: 'Failed to fetch payment method' });
  }
});

// Create new payment method
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('=== Creating Payment Method ===');
    console.log('Request body:', req.body);
    
    const { name, code, description, isActive, config } = req.body;
    
    if (!name || !code) {
      console.log('Validation failed: missing name or code');
      return res.status(400).json({ error: 'Name and code are required' });
    }

    console.log('Checking for existing payment method with code:', code);
    
    // Check if payment method with this code already exists
    const existingPaymentMethod = await dataService.getPaymentMethodByCode(code);
    if (existingPaymentMethod) {
      console.log('Duplicate code found:', existingPaymentMethod);
      return res.status(400).json({ error: `Payment method with code '${code}' already exists` });
    }
    
    console.log('Creating payment method with data:', { name, code, description, isActive, config });
    
    // Encode sensitive configuration data before saving
    const encryptionServiceInstance = new encryptionService();
    const encodedConfig = config ? encryptionServiceInstance.encodePaymentConfig(config) : {};
    
    // If this payment method is being created as active, deactivate all others first
    if (isActive !== false) { // Default to true if not specified
      console.log('Creating active payment method, deactivating all others...');
      await dataService.deactivateAllOtherPaymentMethods('temp'); // Will be updated after creation
    }
    
    const paymentMethod = await dataService.createPaymentMethod({
      name,
      code,
      description: description || '',
      isActive: isActive !== undefined ? isActive : true,
      config: encodedConfig
    });
    
    // If this payment method is active, ensure all others are deactivated
    if (paymentMethod.isActive) {
      await dataService.deactivateAllOtherPaymentMethods(paymentMethod.id);
    }
    
    console.log('Payment method created successfully:', paymentMethod);
    
    // Clear the configuration cache for this provider
    paymentConfigService.clearCache(code.toLowerCase());
    
    return res.status(201).json(paymentMethod);
  } catch (error: any) {
    console.error('=== Error Creating Payment Method ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Payment method with this code already exists' });
    } else {
      return res.status(500).json({ error: 'Failed to create payment method' });
    }
  }
});

// Update payment method
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, code, description, isActive, config } = req.body;
    
    // If code is being changed, check for duplicates
    if (code !== undefined) {
      const existingPaymentMethod = await dataService.getPaymentMethodByCode(code);
      if (existingPaymentMethod && existingPaymentMethod.id !== req.params.id) {
        return res.status(400).json({ error: `Payment method with code '${code}' already exists` });
      }
    }
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
          if (config !== undefined) {
        // Encode sensitive configuration data before saving
        const encryptionServiceInstance = new encryptionService();
        updateData.config = encryptionServiceInstance.encodePaymentConfig(config);
      }
    
    // If this payment method is being activated, deactivate all others
    if (isActive === true) {
      console.log('Activating payment method, deactivating all others...');
      await dataService.deactivateAllOtherPaymentMethods(req.params.id);
    }
    
    const paymentMethod = await dataService.updatePaymentMethod(req.params.id, updateData);
    
    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    // Clear the configuration cache for this provider
    paymentConfigService.clearCache(paymentMethod.code.toLowerCase());
    
    return res.json(paymentMethod);
  } catch (error: any) {
    console.error('Error updating payment method:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Payment method with this code already exists' });
    } else {
      return res.status(500).json({ error: 'Failed to update payment method' });
    }
  }
});

// Delete payment method
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Get the payment method before deleting to clear cache
    const paymentMethod = await dataService.getPaymentMethodById(req.params.id);
    
    const deleted = await dataService.deletePaymentMethod(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    // Clear the configuration cache for this provider if it existed
    if (paymentMethod) {
      paymentConfigService.clearCache(paymentMethod.code.toLowerCase());
    }
    
    return res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

// Toggle payment method active status (single active payment method system)
router.post('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const paymentMethod = await dataService.getPaymentMethodById(id);
    
    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    const newActiveStatus = !paymentMethod.isActive;
    
    if (newActiveStatus) {
      // If activating, deactivate all others first
      console.log('Activating payment method, deactivating all others...');
      await dataService.deactivateAllOtherPaymentMethods(id);
    }
    
    const updatedPaymentMethod = await dataService.updatePaymentMethod(id, {
      isActive: newActiveStatus
    });
    
    if (!updatedPaymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    // Clear the configuration cache for this provider
    paymentConfigService.clearCache(updatedPaymentMethod.code.toLowerCase());
    
    return res.json({
      ...updatedPaymentMethod,
      message: newActiveStatus 
        ? 'Payment method activated (others deactivated)' 
        : 'Payment method deactivated'
    });
  } catch (error) {
    console.error('Error toggling payment method status:', error);
    return res.status(500).json({ error: 'Failed to toggle payment method status' });
  }
});

// Validate payment method configuration
router.post('/:id/validate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { config } = req.body;
    
    if (!config) {
      return res.status(400).json({ error: 'Configuration is required' });
    }

    // Get the payment method to know which provider to validate
    const paymentMethod = await dataService.getPaymentMethodById(id);
    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Validate the configuration
    const validation = paymentConfigService.validateProviderConfig(paymentMethod.code, config);
    
    if (validation.isValid) {
      return res.json({ 
        valid: true, 
        message: 'Configuration is valid' 
      });
    } else {
      return res.status(400).json({ 
        valid: false, 
        errors: validation.errors 
      });
    }
  } catch (error) {
    console.error('Error validating payment method configuration:', error);
    return res.status(500).json({ error: 'Failed to validate configuration' });
    }
  });

// Test payment method connection
router.post('/:id/test', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the payment method
    const paymentMethod = await dataService.getPaymentMethodById(id);
    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    if (!paymentMethod.isActive) {
      return res.status(400).json({ error: 'Payment method must be active to test' });
    }

    let testResult;
    
    // Test based on provider type
    switch (paymentMethod.code.toLowerCase()) {
      case 'adyen':
        try {
          // Test by getting payment methods (lightweight test)
          const { getPaymentMethods } = await import('../adyen/adyen');
          await getPaymentMethods({
            amount: 100,
            currency: 'EUR',
            countryCode: 'NL'
          });
          testResult = { success: true, message: 'Adyen connection successful' };
        } catch (error: any) {
          testResult = { success: false, message: `Adyen test failed: ${error.message}` };
        }
        break;
        
      case 'paymee':
        try {
          const { validatePaymeeConfig } = await import('../paymee/paymee');
          const isValid = await validatePaymeeConfig();
          if (isValid) {
            testResult = { success: true, message: 'Paymee configuration valid' };
          } else {
            testResult = { success: false, message: 'Paymee configuration invalid' };
          }
        } catch (error: any) {
          testResult = { success: false, message: `Paymee test failed: ${error.message}` };
        }
        break;
        
      case 'konnect':
        try {
          const { validateKonnectConfig } = await import('../konnect/konnect');
          const isValid = await validateKonnectConfig();
          if (isValid) {
            testResult = { success: true, message: 'Konnect configuration valid' };
          } else {
            testResult = { success: false, message: 'Konnect configuration invalid' };
          }
        } catch (error: any) {
          testResult = { success: false, message: `Konnect test failed: ${error.message}` };
        }
        break;
        
      default:
        testResult = { success: false, message: 'Unknown payment provider' };
    }
    
    return res.json(testResult);
  } catch (error) {
    console.error('Error testing payment method:', error);
    return res.status(500).json({ error: 'Failed to test payment method' });
  }
});

export default router;
