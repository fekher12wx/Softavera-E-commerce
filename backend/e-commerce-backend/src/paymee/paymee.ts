import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import paymentConfigService from '../services/paymentConfigService';

// Paymee API response types
export interface PaymeePaymentResponse {
  success: boolean;
  data: {
    token: string;
    payment_url: string;
    amount: number;
    vendor: number;
    note: string;
    status: string;
  };
  message?: string;
}

export interface PaymeeStatusResponse {
  success: boolean;
  data: {
    token: string;
    payment_status: boolean;
    amount: number;
    vendor: number;
    note: string;
    transaction_id?: string;
    payment_date?: string;
  };
  message?: string;
}

// Payment creation parameters
export interface CreatePaymeePaymentParams {
  amount: number;
  note: string;
  vendor?: number;
  reference?: string;
  returnUrl?: string;
  // Customer information (required by Paymee API)
  email: string;
  first_name: string;
  last_name: string;
  webhook_url?: string;
}

/**
 * Create a new Paymee payment
 * @param params Payment parameters
 * @returns Payment response with token and payment URL
 */
export async function createPaymeePayment(params: CreatePaymeePaymentParams): Promise<PaymeePaymentResponse> {
  try {
    // Get configuration from database
    const config = await paymentConfigService.getProviderConfig('paymee');
    console.log('🔍 Paymee config retrieved:', JSON.stringify(config, null, 2));
    
    if (!config) {
      throw new Error('Paymee configuration not found or inactive');
    }

    // Log the specific fields we're looking for
    console.log('🔍 Paymee config fields:', {
      apiToken: config.apiToken,
      vendorId: config.vendorId,
      baseUrl: config.baseUrl,
      environment: config.environment,
      isActive: config.isActive
    });

    if (!config.apiToken) {
      throw new Error('Paymee API Token is not configured');
    }

    if (!config.vendorId) {
      throw new Error('Paymee Vendor ID is not configured');
    }

    const {
      amount,
      note,
      vendor = config.vendorId,
      reference = uuidv4(),
      email,
      first_name,
      last_name,
      webhook_url = config.webhookUrl || `${config.baseUrl}/webhook/paymee`, // Default webhook URL
      returnUrl
    } = params;

    // Validate required parameters
    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    if (!note || note.trim().length === 0) {
      throw new Error('Note is required');
    }
    if (!vendor) {
      throw new Error('Vendor ID is required');
    }
    if (!email || email.trim().length === 0) {
      throw new Error('Customer email is required');
    }
    if (!first_name || first_name.trim().length === 0) {
      throw new Error('Customer first name is required');
    }
    if (!last_name || last_name.trim().length === 0) {
      throw new Error('Customer last name is required');
    }

    const paymentData: Record<string, any> = {
      vendor,
      amount,
      note: `${note} - Ref: ${reference}`,
      email: email.trim(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      webhook_url
    };

    // If a return URL is provided, include it using a common key name Paymee accepts
    // Some integrations expect `return_url` or `redirect_url`; include both defensively
    // Note: Paymee requires HTTPS URLs, so skip for localhost development
    if (returnUrl && !returnUrl.includes('localhost')) {
      paymentData.return_url = returnUrl;
      paymentData.redirect_url = returnUrl;
    } else if (returnUrl && returnUrl.includes('localhost')) {
      console.log('⚠️ Skipping return_url for localhost (Paymee requires HTTPS)');
    }


    // Create axios instance with configuration
    const paymeeClient = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Token ${config.apiToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Log the request details
    console.log('🔍 Paymee API Request Details:');
    console.log('  - URL:', `${config.baseUrl}/payments/create`);
    console.log('  - Authorization:', `Token ${config.apiToken.substring(0, 10)}...`);
    console.log('  - Request Data:', JSON.stringify(paymentData, null, 2));

    const response = await paymeeClient.post('/payments/create', paymentData);

    // Add detailed logging to debug the response
    console.log('🔍 Paymee API Response Status:', response.status);
    console.log('🔍 Paymee API Response Headers:', response.headers);
    console.log('🔍 Paymee API Response Data:', JSON.stringify(response.data, null, 2));

    // Check if Paymee returned an error response
    if (response.data && response.data.status === false) {
      const errorMessage = response.data.message || 'Payment creation failed';
      const errorDetails = response.data.errors ? response.data.errors.map((e: any) => Object.values(e).join(': ')).join(', ') : '';
      throw new Error(`Paymee API Error: ${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`);
    }

    if (!response.data || !response.data.data) {
      console.error('❌ Paymee API Response validation failed:');
      console.error('  - response.data exists:', !!response.data);
      console.error('  - response.data.data exists:', !!(response.data && response.data.data));
      console.error('  - Full response structure:', JSON.stringify(response.data, null, 2));
      throw new Error('Invalid response from Paymee API');
    }

    const paymentResponse: PaymeePaymentResponse = {
      success: true,
      data: {
        token: response.data.data.token,
        payment_url: response.data.data.payment_url || `https://sandbox.paymee.tn/gateway/${response.data.data.token}`,
        amount,
        vendor,
        note: paymentData.note,
        status: 'pending'
      }
    };

    return paymentResponse;

  } catch (error: any) {
    console.error('Paymee payment creation error:', error);
    
    // Handle axios errors
    if (error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Payment creation failed';
      throw new Error(`Paymee API Error: ${errorMessage}`);
    }
    
    // Handle network errors
    if (error.request) {
      throw new Error('Network error: Unable to connect to Paymee API');
    }
    
    // Handle other errors
    throw new Error(error.message || 'Unknown error occurred during payment creation');
  }
}

/**
 * Check the status of a Paymee payment
 * @param token Payment token
 * @returns Payment status response
 */
export async function checkPaymeePaymentStatus(token: string): Promise<PaymeeStatusResponse> {
  try {
    // Get configuration from database
    const config = await paymentConfigService.getProviderConfig('paymee');
    if (!config) {
      throw new Error('Paymee configuration not found or inactive');
    }

    if (!config.apiToken) {
      throw new Error('Paymee API Token is not configured');
    }

    if (!token || token.trim().length === 0) {
      throw new Error('Payment token is required');
    }


    // Create axios instance with configuration
    const paymeeClient = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Token ${config.apiToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Retry logic for DNS failures
    let lastError: any;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await paymeeClient.get(`/payments/${token}/check`);
        
        if (!response.data || !response.data.data) {
          throw new Error('Invalid response from Paymee API');
        }

        const statusResponse: PaymeeStatusResponse = {
          success: true,
          data: {
            token,
            payment_status: response.data.data.payment_status === true || response.data.data.payment_status === 'true',
            amount: response.data.data.amount,
            vendor: response.data.data.vendor,
            note: response.data.data.note,
            transaction_id: response.data.data.transaction_id,
            payment_date: response.data.data.payment_date
          }
        };

        return statusResponse;
        
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a DNS error
        if (error.code === 'ENOTFOUND' || error.message.includes('getaddrinfo ENOTFOUND')) {
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }
        
        // For non-DNS errors or after max retries, break and throw
        break;
      }
    }

    // If we get here, all retries failed
    throw lastError;

  } catch (error: any) {
    console.error('Paymee payment status check error:', error);
    
    // Handle axios errors
    if (error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Status check failed';
      throw new Error(`Paymee API Error: ${errorMessage}`);
    }
    
    // Handle network errors
    if (error.request) {
      throw new Error('Network error: Unable to connect to Paymee API');
    }
    
    // Handle other errors
    throw new Error(error.message || 'Unknown error occurred during status check');
  }
}

/**
 * Validate Paymee configuration
 * @returns boolean indicating if configuration is valid
 */
export async function validatePaymeeConfig(): Promise<boolean> {
  try {
    const config = await paymentConfigService.getProviderConfig('paymee');
    if (!config) {
      return false;
    }

    const requiredFields = [
      { field: 'apiToken', value: config.apiToken },
      { field: 'baseUrl', value: config.baseUrl },
      { field: 'vendorId', value: config.vendorId }
    ];

    for (const { field, value } of requiredFields) {
      if (!value) {
        console.error(`Paymee configuration error: ${field} is not set`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating Paymee config:', error);
    return false;
  }
}

/**
 * Generate payment reference
 * @param prefix Optional prefix for the reference
 * @returns Unique payment reference
 */
export function generatePaymentReference(prefix: string = 'PAY'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Format amount for Paymee (ensure it's a valid number)
 * @param amount Amount to format
 * @returns Formatted amount
 */
export function formatPaymeeAmount(amount: number): number {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    throw new Error('Invalid amount: must be a positive number');
  }
  
  // Round to 2 decimal places and ensure it's a valid number
  return Math.round(amount * 100) / 100;
}
