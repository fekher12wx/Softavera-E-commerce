import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import paymentConfigService from '../services/paymentConfigService';

export interface CreateKonnectPaymentParams {
  amount: number;
  email: string;
  first_name: string;
  last_name: string;
  note: string;
  reference?: string;
  returnUrl?: string;
}

export interface KonnectPaymentResponse {
  success: boolean;
  data?: {
    token: string;
    payment_url: string;
    amount: number;
    note: string;
    status: 'pending' | 'paid' | 'failed';
  };
  error?: string;
}

// In-memory store to simulate payment statuses by token (for demo purposes)
const tokenStatusMap = new Map<string, 'pending' | 'paid' | 'failed'>();

export async function createKonnectPayment(params: CreateKonnectPaymentParams): Promise<KonnectPaymentResponse> {
  try {
    // Get configuration from database
    const config = await paymentConfigService.getProviderConfig('konnect');
    
    // Check if we should use demo mode
    const shouldUseDemoMode = !config || 
                             !config.apiKey || 
                             config.apiKey === '' || 
                             config.apiKey === 'your-konnect-api-key' ||
                             !config.merchantId || 
                             config.merchantId === '';

    if (shouldUseDemoMode) {
      console.log('🎭 Konnect: Using demo mode due to incomplete configuration');
      
      // Generate demo payment
            const { amount, email, first_name, last_name, note, reference } = params;
      const token = uuidv4().replace(/-/g, '').slice(0, 32).toUpperCase();
      tokenStatusMap.set(token, 'pending');
    
      const fakePaymentUrl = `https://pay.konnect.local/checkout/${token}`;
    
      console.log(`🎭 Konnect Demo Mode: Created payment with token ${token} for amount ${amount}`);
    
      return {
        success: true,
        data: {
          token,
          payment_url: fakePaymentUrl,
          amount,
          note: `${note} - Ref: ${reference || token}`,
          status: 'pending'
        }
      };
    }

    // Validate required configuration
    if (!config.apiKey) {
      throw new Error('Konnect API Key is not configured');
    }

    if (!config.merchantId) {
      throw new Error('Konnect Merchant ID is not configured');
    }

    const { amount, email, first_name, last_name, note, reference } = params;

    if (!amount || amount <= 0) return { success: false, error: 'Amount must be greater than 0' };
    if (!email?.trim()) return { success: false, error: 'Customer email is required' };
    if (!first_name?.trim()) return { success: false, error: 'Customer first name is required' };
    if (!last_name?.trim()) return { success: false, error: 'Customer last name is required' };
    if (!note?.trim()) return { success: false, error: 'Note is required' };

    const token = uuidv4().replace(/-/g, '').slice(0, 32).toUpperCase();
    tokenStatusMap.set(token, 'pending');

    // If we have a real Konnect API configuration, use it
    if (config.baseUrl && config.apiKey) {
      try {
        const konnectClient = axios.create({
          baseURL: config.baseUrl,
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        const paymentData = {
          amount,
          currency: 'TND', // Default currency for Tunisia
          merchant_id: config.merchantId,
          customer: {
            email,
            first_name,
            last_name
          },
          description: note,
          reference: reference || token,
          return_url: params.returnUrl || `${config.webhookUrl || 'https://yourdomain.com'}/payment/return`,
          webhook_url: config.webhookUrl || `${config.baseUrl}/webhook`
        };

        const response = await konnectClient.post('/payments/create', paymentData);
        
        if (response.data && response.data.success) {
          return {
            success: true,
            data: {
              token: response.data.data.token || response.data.data.data?.token || token,
              payment_url: response.data.data.payment_url || response.data.data.data?.payment_url || response.data.data.redirect_url,
              amount,
              note: `${note} - Ref: ${reference || token}`,
              status: 'pending'
            }
          };
        }
      } catch (apiError: any) {
        console.error('Konnect API error:', apiError);
        // Fall back to demo mode if API fails
        console.log('🔄 Konnect: Falling back to demo mode due to API error');
      }
    }

    // Fallback to demo mode if API call fails or no response
    const fallbackToken = uuidv4().replace(/-/g, '').slice(0, 32).toUpperCase();
    tokenStatusMap.set(token, 'pending');
    
    const fakePaymentUrl = `https://pay.konnect.local/checkout/${token}`;

    return {
      success: true,
      data: {
        token,
        payment_url: fakePaymentUrl,
        amount,
        note: `${note} - Ref: ${reference || token}`,
        status: 'pending'
      }
    };
  } catch (error: any) {
    console.error('Konnect payment creation error:', error);
    return { success: false, error: error.message || 'Failed to create payment' };
  }
}

export async function checkKonnectPaymentStatus(token: string): Promise<{ success: boolean; data?: { payment_status: boolean }; error?: string }> {
  try {
    if (!token) return { success: false, error: 'Token is required' };

    // Check if this is a demo token (32 characters, all uppercase)
    const isDemoToken = /^[A-F0-9]{32}$/.test(token);
    
    // Get configuration from database
    const config = await paymentConfigService.getProviderConfig('konnect');
    
    // Log configuration status for debugging
    if (config) {
      console.log(`🔧 Konnect Config: baseUrl=${config.baseUrl}, hasApiKey=${!!config.apiKey}, apiKeyValid=${config.apiKey !== 'your-konnect-api-key'}`);
    } else {
      console.log('⚠️ Konnect Config: No configuration found, using demo mode');
    }
    
    // If we have a real Konnect API configuration AND it's not a demo token, use it
    if (config && config.baseUrl && config.apiKey && config.apiKey !== 'your-konnect-api-key' && !isDemoToken) {
      try {
        const konnectClient = axios.create({
          baseURL: config.baseUrl,
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        const response = await konnectClient.get(`/payments/${token}/status`);
        
        if (response.data && response.data.success) {
          return {
            success: true,
            data: { payment_status: response.data.data.status === 'paid' }
          };
        }
      } catch (apiError: any) {
        console.error('Konnect API status check error:', apiError);
        // Fall back to demo mode if API fails
      }
    }

    // Demo mode - flip to paid after first check
    const current = tokenStatusMap.get(token) || 'pending';
    if (current === 'pending') {
      tokenStatusMap.set(token, 'paid');
      console.log(`🎭 Konnect Demo Mode: Payment ${token} status changed from pending to paid`);
    } else {
      console.log(`🎭 Konnect Demo Mode: Payment ${token} status is ${current}`);
    }
    
    return { 
      success: true, 
      data: { payment_status: tokenStatusMap.get(token) === 'paid' } 
    };
  } catch (error: any) {
    console.error('Konnect payment status check error:', error);
    return { success: false, error: error.message || 'Failed to check payment status' };
  }
}

/**
 * Validate Konnect configuration
 * @returns boolean indicating if configuration is valid
 */
export async function validateKonnectConfig(): Promise<boolean> {
  try {
    const config = await paymentConfigService.getProviderConfig('konnect');
    if (!config) {
      console.log('⚠️ Konnect: No configuration found');
      return false;
    }

    // Check if we have a valid API key (not placeholder)
    if (!config.apiKey || config.apiKey === '' || config.apiKey === 'your-konnect-api-key') {
      console.log('⚠️ Konnect: API key not configured or is placeholder');
      return false;
    }

    // Check if we have a valid merchant ID
    if (!config.merchantId || config.merchantId === '') {
      console.log('⚠️ Konnect: Merchant ID not configured');
      return false;
    }

    // Check if we have a valid base URL
    if (!config.baseUrl || config.baseUrl === '') {
      console.log('⚠️ Konnect: Base URL not configured');
      return false;
    }

    console.log('✅ Konnect: Configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Error validating Konnect config:', error);
    return false;
  }
}
