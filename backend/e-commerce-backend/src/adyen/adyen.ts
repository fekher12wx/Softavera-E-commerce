import { v4 as uuidv4 } from 'uuid';
import { Client, Config, CheckoutAPI, Types } from '@adyen/api-library';
import paymentConfigService from '../services/paymentConfigService';

export async function createCheckoutSession({
  amount,
  currency,
  countryCode,
  reference,
  returnUrl,
  lineItems,
  store
}: {
  amount: number,
  currency: string,
  countryCode: string,
  reference?: string,
  returnUrl: string,
  lineItems?: Array<{ quantity: number; amountIncludingTax: number; description: string }>,
  store?: string
}) {
  // Get configuration from database
  const config = await paymentConfigService.getProviderConfig('adyen');
  if (!config) {
    throw new Error('Adyen configuration not found or inactive');
  }



  if (!config.apiKey) {
    throw new Error('Adyen API Key is not configured');
  }

  if (!config.merchantAccount) {
    throw new Error('Adyen Merchant Account is not configured');
  }

  // Adyen NodeJS library configuration
  const adyenConfig = new Config();
  adyenConfig.apiKey = config.apiKey;
  

  
  const client = new Client({ config: adyenConfig });
  client.setEnvironment(config.environment === 'LIVE' || config.environment === 'live' ? 'LIVE' : 'TEST');
  const checkout = new CheckoutAPI(client);

  const orderReference = reference || uuidv4();

  try {
    // Create session request - this should include payment methods automatically
    const sessionRequest: Types.checkout.CreateCheckoutSessionRequest = {
      reference: orderReference,
      amount: {
        currency,
        value: amount
      },
      merchantAccount: config.merchantAccount,
      countryCode,
      returnUrl,
      // Add line items if provided
      ...(lineItems && lineItems.length > 0 ? { lineItems } : {}),
      // Add store if provided
      ...(store ? { store } : {}),
      // Specify channel
      channel: Types.checkout.CreateCheckoutSessionRequest.ChannelEnum.Web,
      shopperInteraction: Types.checkout.CreateCheckoutSessionRequest.ShopperInteractionEnum.Ecommerce // Use enum value
    };

    console.log('Creating session with request:', JSON.stringify(sessionRequest, null, 2));

    const session = await checkout.PaymentsApi.sessions(sessionRequest, { 
      idempotencyKey: uuidv4() 
    });
    
    console.log('Session created successfully:', JSON.stringify(session, null, 2));
    
    return session;
  } catch (err: any) {
    console.error(`Adyen session creation error: ${err.message}, error code: ${err.errorCode}`);
    console.error('Full error:', err);
    throw err;
  }
}

// Separate function to get payment methods (for debugging)
export async function getPaymentMethods({
  amount,
  currency,
  countryCode
}: {
  amount: number,
  currency: string,
  countryCode: string
}): Promise<Types.checkout.PaymentMethodsResponse> {
  // Get configuration from database
  const config = await paymentConfigService.getProviderConfig('adyen');
  if (!config) {
    throw new Error('Adyen configuration not found or inactive');
  }

  if (!config.apiKey) {
    throw new Error('Adyen API Key is not configured');
  }

  if (!config.merchantAccount) {
    throw new Error('Adyen Merchant Account is not configured');
  }

  const adyenConfig = new Config();
  adyenConfig.apiKey = config.apiKey;
  const client = new Client({ config: adyenConfig });
  client.setEnvironment(config.environment === 'LIVE' || config.environment === 'live' ? 'LIVE' : 'TEST');
  const checkout = new CheckoutAPI(client);

  try {
    const paymentMethodsRequest: Types.checkout.PaymentMethodsRequest = {
      merchantAccount: config.merchantAccount,
      countryCode,
      amount: {
        currency,
        value: amount
      },
      channel: Types.checkout.PaymentMethodsRequest.ChannelEnum.Web
    };

    const paymentMethods = await checkout.PaymentsApi.paymentMethods(paymentMethodsRequest);
    console.log('Payment methods fetched:', JSON.stringify(paymentMethods, null, 2));
    return paymentMethods;
  } catch (err: any) {
    console.error(`Error fetching payment methods: ${err.message}, error code: ${err.errorCode}`);
    throw err;
  }
}