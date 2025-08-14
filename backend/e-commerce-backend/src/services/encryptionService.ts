import crypto from 'crypto';

class EncryptionService {
  constructor() {
    // No need for encryption key with base64
  }

  // Simple base64 encoding
  encode(text: string): string {
    try {
      return Buffer.from(text, 'utf8').toString('base64');
    } catch (error) {
      console.error('Base64 encoding failed:', error);
      throw new Error('Failed to encode data');
    }
  }

  // Simple base64 decoding
  decode(encodedText: string): string {
    try {
      return Buffer.from(encodedText, 'base64').toString('utf8');
    } catch (error) {
      console.error('Base64 decoding failed:', error);
      throw new Error('Failed to decode data');
    }
  }

  // Encode sensitive fields in payment configuration
  encodePaymentConfig(config: any): any {
    const sensitiveFields = ['apiKey', 'apiToken', 'merchantAccount', 'merchantId', 'vendorId', 'clientKey'];
    const encodedConfig = { ...config };

    for (const field of sensitiveFields) {
      if (encodedConfig[field] && typeof encodedConfig[field] === 'string') {
        // Always encode sensitive fields
        encodedConfig[field] = this.encode(encodedConfig[field]);
      }
    }

    return encodedConfig;
  }

  // Decode sensitive fields in payment configuration
  decodePaymentConfig(config: any): any {
    const sensitiveFields = ['apiKey', 'apiToken', 'merchantAccount', 'merchantId', 'vendorId', 'clientKey'];
    const decodedConfig = { ...config };

    for (const field of sensitiveFields) {
      if (decodedConfig[field] && typeof decodedConfig[field] === 'string') {
        try {
          // Try to decode - if it fails, keep original
          decodedConfig[field] = this.decode(decodedConfig[field]);
        } catch (error) {
          // If decoding fails, the field might not be encoded yet
          console.warn(`Failed to decode field ${field}, keeping as-is`);
        }
      }
    }

    return decodedConfig;
  }

  // Check if a string is base64 encoded
  isEncoded(text: string): boolean {
    try {
      // Check if it's valid base64
      const decoded = Buffer.from(text, 'base64').toString('utf8');
      // If it can be decoded and the decoded result is different from original, it's encoded
      return decoded !== text;
    } catch {
      // If decoding fails, it's not base64
      return false;
    }
  }
}

export default EncryptionService;
