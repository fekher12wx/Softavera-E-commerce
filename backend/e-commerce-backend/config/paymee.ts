import axios from 'axios';
import paymentConfigService from '../src/services/paymentConfigService';

// This file is kept for backward compatibility but now uses dynamic configuration
export async function getPaymeeClient() {
  const config = await paymentConfigService.getProviderConfig('paymee');
  if (!config) {
    throw new Error('Paymee configuration not found or inactive');
  }

  // Create axios instance with configuration
  const paymeeClient = axios.create({
    baseURL: config.baseUrl,
    headers: {
      'Authorization': `Token ${config.apiToken}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000,
    // Add retry configuration
    maxRedirects: 5,
    // Better connection handling
    httpAgent: new (require('http').Agent)({
      keepAlive: true,
      maxSockets: 10,
      timeout: 30000
    }),
    httpsAgent: new (require('https').Agent)({
      keepAlive: true,
      maxSockets: 10,
      timeout: 30000
    })
  });

  // Add request interceptor for logging
  paymeeClient.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor for logging
  paymeeClient.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return {
    client: paymeeClient,
    config
  };
}

// Legacy exports for backward compatibility
export const paymeeConfig = null; // This will be replaced by dynamic configuration
export const paymeeClient = null; // This will be replaced by dynamic configuration