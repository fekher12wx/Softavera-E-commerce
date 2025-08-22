import dataService from './dataService';
import encryptionService from './encryptionService';

export interface PaymentProviderConfig {
  apiKey: string;
  merchantId?: string;
  merchantAccount?: string;
  environment: 'test' | 'live' | 'sandbox' | 'TEST' | 'LIVE';
  baseUrl?: string;
  vendorId?: number;
  apiToken?: string;
  [key: string]: any; // Allow additional custom fields
}

export class PaymentConfigService {
  private static instance: PaymentConfigService;
  private configCache: Map<string, PaymentProviderConfig> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): PaymentConfigService {
    if (!PaymentConfigService.instance) {
      PaymentConfigService.instance = new PaymentConfigService();
    }
    return PaymentConfigService.instance;
  }

  /**
   * Get configuration for a specific payment provider
   */
  async getProviderConfig(providerCode: string): Promise<PaymentProviderConfig | null> {
    try {
      // Check cache first
      const cached = this.configCache.get(providerCode);
      const expiry = this.cacheExpiry.get(providerCode);
      
      if (cached && expiry && Date.now() < expiry) {
        console.log(`📦 Using cached ${providerCode} configuration`);
        return cached;
      }

      console.log(`🔍 Fetching ${providerCode} configuration from database...`);
      
      // Fetch from database
      const paymentMethod = await dataService.getPaymentMethodByCode(providerCode);
      if (!paymentMethod) {
        console.log(`❌ ${providerCode} payment method not found in database`);
        return null;
      }
      
      if (!paymentMethod.isActive) {
        console.log(`❌ ${providerCode} payment method is not active`);
        return null;
      }

      console.log(`📋 Raw ${providerCode} config from database:`, JSON.stringify(paymentMethod.config, null, 2));
      
      const config = this.parseProviderConfig(providerCode, paymentMethod.config);
      console.log(`🔧 Parsed ${providerCode} config:`, JSON.stringify(config, null, 2));
      
      // For Paymee, we've already manually decoded the sensitive fields, so skip encryption service
      if (providerCode.toLowerCase() === 'paymee') {
        console.log(`🔓 Skipping encryption service for ${providerCode} (already manually decoded)`);
        // Cache the manually decoded result
        this.configCache.set(providerCode, config);
        this.cacheExpiry.set(providerCode, Date.now() + this.CACHE_DURATION);
        return config;
      }
      
      // Decode sensitive fields before returning (for other providers)
      const encryptionServiceInstance = new encryptionService();
      const decryptedConfig = encryptionServiceInstance.decodePaymentConfig(config);
      console.log(`🔓 Decrypted ${providerCode} config:`, JSON.stringify(decryptedConfig, null, 2));
      
      // Cache the decrypted result
      this.configCache.set(providerCode, decryptedConfig);
      this.cacheExpiry.set(providerCode, Date.now() + this.CACHE_DURATION);
      
      return decryptedConfig;
    } catch (error) {
      console.error(`❌ Error getting ${providerCode} configuration:`, error);
      return null;
    }
  }

  /**
   * Parse provider-specific configuration
   */
  private parseProviderConfig(providerCode: string, config: any): PaymentProviderConfig {
    const baseConfig: PaymentProviderConfig = {
      apiKey: config.apiKey || '',
      environment: config.environment || 'test'
    };

    switch (providerCode.toLowerCase()) {
      case 'adyen':
        return {
          ...baseConfig,
          merchantAccount: config.merchantAccount || config.merchantId || '',
          environment: config.environment === 'live' ? 'LIVE' : 'TEST',
          clientKey: config.clientKey || ''
        };

      case 'paymee':
        console.log('🔍 Parsing Paymee config with fields:', {
          apiToken: config.apiToken || config.apiKey || 'MISSING',
          vendorId: config.vendorId || config.vendor || 'MISSING',
          baseUrl: config.baseUrl || 'DEFAULT',
          environment: config.environment || 'DEFAULT'
        });
        
        // Handle vendorId - it might be double-encoded
        let vendorId = 0;
        if (config.vendorId) {
          try {
            // First try to parse as integer
            vendorId = parseInt(config.vendorId);
            if (isNaN(vendorId)) {
              // If that fails, try to decode from base64 first
              const decodedVendorId = Buffer.from(config.vendorId, 'base64').toString('utf8');
              vendorId = parseInt(decodedVendorId);
              if (isNaN(vendorId)) {
                console.warn('⚠️ Could not parse vendorId:', config.vendorId);
                vendorId = 0;
              }
            }
          } catch (error) {
            console.warn('⚠️ Error parsing vendorId:', error);
            vendorId = 0;
          }
        }
        
        // Handle apiToken - it might be double-encoded
        let apiToken = '';
        if (config.apiToken || config.apiKey) {
          try {
            const rawToken = config.apiToken || config.apiKey;
            // First try to decode from base64
            const decodedToken = Buffer.from(rawToken, 'base64').toString('utf8');
            // Check if the decoded result is also base64 encoded
            if (decodedToken.match(/^[A-Za-z0-9+/=]+$/)) {
              // If it looks like base64, decode it again
              try {
                const doubleDecodedToken = Buffer.from(decodedToken, 'base64').toString('utf8');
                apiToken = doubleDecodedToken;
                console.log('🔍 Double-decoded apiToken from:', rawToken, 'to:', apiToken);
              } catch {
                // If double decoding fails, use single decoded
                apiToken = decodedToken;
                console.log('🔍 Single-decoded apiToken from:', rawToken, 'to:', apiToken);
              }
            } else {
              // If it doesn't look like base64, use as-is
              apiToken = decodedToken;
              console.log('🔍 Decoded apiToken from:', rawToken, 'to:', apiToken);
            }
          } catch (error) {
            console.warn('⚠️ Error decoding apiToken:', error);
            apiToken = config.apiToken || config.apiKey || '';
          }
        }
        
        console.log('🔍 Parsed vendorId:', vendorId);
        console.log('🔍 Parsed apiToken:', apiToken);
        
        return {
          ...baseConfig,
          apiToken: apiToken,
          baseUrl: config.baseUrl || 'https://sandbox.paymee.tn/api/v2',
          vendorId: vendorId,
          environment: config.environment || 'sandbox'
        };

      case 'konnect':
        return {
          ...baseConfig,
          merchantId: config.merchantId || config.merchantAccount || '',
          baseUrl: config.baseUrl || 'https://api.konnect.network',
          environment: config.environment || 'test'
        };

      default:
        return {
          ...baseConfig,
          merchantId: config.merchantId || config.merchantAccount || '',
          ...config // Include any additional custom fields
        };
    }
  }

  /**
   * Clear cache for a specific provider or all providers
   */
  clearCache(providerCode?: string): void {
    if (providerCode) {
      this.configCache.delete(providerCode);
      this.cacheExpiry.delete(providerCode);
    } else {
      this.configCache.clear();
      this.cacheExpiry.clear();
    }
  }

  /**
   * Validate configuration for a specific provider
   */
  validateProviderConfig(providerCode: string, config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    switch (providerCode.toLowerCase()) {
      case 'adyen':
        if (!config.apiKey) errors.push('API Key is required');
        if (!config.merchantAccount && !config.merchantId) errors.push('Merchant Account is required');
        if (!['test', 'live', 'TEST', 'LIVE'].includes(config.environment)) errors.push('Environment must be "test" or "live"');
        break;

      case 'paymee':
        if (!config.apiToken && !config.apiKey) errors.push('API Token is required');
        if (!config.vendorId && !config.vendor) errors.push('Vendor ID is required');
        if (!['test', 'sandbox', 'live'].includes(config.environment)) errors.push('Environment must be "test", "sandbox", or "live"');
        break;

      case 'konnect':
        if (!config.apiKey) errors.push('API Key is required');
        if (!config.merchantId && !config.merchantAccount) errors.push('Merchant ID is required');
        if (!['test', 'live'].includes(config.environment)) errors.push('Environment must be "test" or "live"');
        break;

      default:
        if (!config.apiKey) errors.push('API Key is required');
        if (!['test', 'live', 'sandbox'].includes(config.environment)) errors.push('Environment must be "test", "live", or "sandbox"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get default configuration template for a provider
   */
  getDefaultConfig(providerCode: string): any {
    switch (providerCode.toLowerCase()) {
      case 'adyen':
        return {
          apiKey: '',
          merchantAccount: '',
          environment: 'test',
          clientKey: ''
        };

      case 'paymee':
        return {
          apiToken: '',
          baseUrl: 'https://sandbox.paymee.tn/api/v2',
          vendorId: '',
          environment: 'sandbox'
        };

      case 'konnect':
        return {
          apiKey: '',
          merchantId: '',
          baseUrl: 'https://api.konnect.network',
          environment: 'test'
        };

      default:
        return {
          apiKey: '',
          merchantId: '',
          environment: 'test'
        };
    }
  }
}

export default PaymentConfigService.getInstance();
