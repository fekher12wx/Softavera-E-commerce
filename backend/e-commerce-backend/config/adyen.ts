import { Client, Config, CheckoutAPI } from '@adyen/api-library';
import paymentConfigService from '../src/services/paymentConfigService';

// This file is kept for backward compatibility but now uses dynamic configuration
export async function getAdyenClient() {
  const config = await paymentConfigService.getProviderConfig('adyen');
  if (!config) {
    throw new Error('Adyen configuration not found or inactive');
  }

  const adyenConfig = new Config();
  adyenConfig.apiKey = config.apiKey;
  const client = new Client({ config: adyenConfig });
  client.setEnvironment(config.environment === 'LIVE' || config.environment === 'live' ? 'LIVE' : 'TEST');
  
  return {
    client,
    checkout: new CheckoutAPI(client),
    config
  };
}

// Legacy export for backward compatibility
export const checkout = null; // This will be replaced by dynamic configuration
