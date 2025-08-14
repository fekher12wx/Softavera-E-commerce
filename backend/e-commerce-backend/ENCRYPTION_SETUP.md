# Payment Configuration Encryption Setup

This document explains how to set up and use the encrypted payment configuration system for your e-commerce application.

## Overview

The system now encrypts sensitive payment configuration data (API keys, merchant accounts, etc.) before storing them in the database. This provides an additional layer of security for your payment gateway credentials.

## Features

- **AES-256-CBC Encryption**: Uses industry-standard encryption for sensitive data
- **Automatic Encryption/Decryption**: Transparently handles encryption when saving and decryption when retrieving
- **Secure Key Management**: Uses environment variables for encryption keys
- **Migration Support**: Includes scripts to encrypt existing data

## Setup Instructions

### 1. Set Encryption Key

Set the `ENCRYPTION_KEY` environment variable in your `.env` file:

```bash
ENCRYPTION_KEY=your-secure-encryption-key-32-chars-long!!
```

**Important**: 
- The key must be at least 32 characters long
- Keep this key secure and never commit it to version control
- Use different keys for development, staging, and production

### 2. Database Setup

Ensure your database has the `payment_methods` table with a `config` column of type `JSONB`:

```sql
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Populate Payment Credentials

Run the script to populate your payment credentials:

```bash
cd backend/e-commerce-backend
node populate-payment-credentials.js
```

This script will:
- Create/update payment methods for Adyen, Paymee, and Konnect
- Encrypt all sensitive fields before storage
- Set the payment methods as active

### 4. Migration (if you have existing data)

If you have existing payment configurations that need encryption:

```bash
cd backend/e-commerce-backend
node migrate-encrypt-payment-configs.js
```

## How It Works

### Encryption Process

1. **Saving Configuration**: When you save payment configuration through the admin panel, sensitive fields are automatically encrypted
2. **Storage**: Encrypted data is stored in the database
3. **Retrieval**: When the system needs the configuration, it automatically decrypts the data
4. **Caching**: Decrypted configurations are cached for performance

### Sensitive Fields

The following fields are automatically encrypted:
- `apiKey` - API keys for payment gateways
- `apiToken` - API tokens (Paymee)
- `merchantAccount` - Merchant account identifiers (Adyen)
- `merchantId` - Merchant IDs (Konnect)
- `vendorId` - Vendor IDs (Paymee)

### Non-Sensitive Fields

These fields are stored as plain text:
- `environment` - Test/Live environment setting
- `baseUrl` - API base URLs
- Any custom configuration fields

## Security Considerations

### Encryption Key Security

- **Never commit encryption keys to version control**
- **Use different keys for different environments**
- **Rotate keys periodically in production**
- **Store production keys securely (e.g., AWS Secrets Manager, Azure Key Vault)**

### Database Security

- **Ensure database access is restricted**
- **Use SSL connections to the database**
- **Implement proper access controls**
- **Regular security audits**

### Application Security

- **Use HTTPS in production**
- **Implement proper authentication and authorization**
- **Log access to sensitive configuration data**
- **Regular security updates**

## Troubleshooting

### Common Issues

1. **Encryption Key Not Set**
   ```
   ENCRYPTION_KEY not set, using default key for development
   ```
   - Set the `ENCRYPTION_KEY` environment variable
   - Restart your application

2. **Decryption Failed**
   ```
   Failed to decrypt field apiKey, keeping as-is
   ```
   - This usually means the field wasn't encrypted yet
   - Run the migration script if needed

3. **Invalid Encrypted Data Format**
   ```
   Invalid encrypted data format
   ```
   - Data corruption or wrong encryption format
   - Check if the encryption key is correct

### Debug Mode

To enable debug logging, set the environment variable:

```bash
DEBUG_ENCRYPTION=true
```

## API Usage

### Frontend (Admin Panel)

The admin panel automatically handles encryption/decryption. You can:
- View decrypted configuration values
- Edit configuration (encryption happens automatically)
- Test connections using decrypted values

### Backend Services

Payment services automatically get decrypted configurations:

```typescript
import paymentConfigService from '../services/paymentConfigService';

// Get decrypted Adyen configuration
const adyenConfig = await paymentConfigService.getProviderConfig('adyen');
console.log(adyenConfig.apiKey); // Decrypted API key
```

## Monitoring and Logging

### Logs to Monitor

- Encryption/decryption operations
- Failed decryption attempts
- Configuration cache hits/misses
- Payment method updates

### Metrics to Track

- Encryption operation performance
- Decryption success rates
- Configuration access patterns
- Cache hit ratios

## Production Deployment

### Environment Variables

```bash
# Required
ENCRYPTION_KEY=your-production-encryption-key-32-chars-long!!

# Optional
DEBUG_ENCRYPTION=false
```

### Key Rotation

1. Generate a new encryption key
2. Update the environment variable
3. Re-encrypt all existing data
4. Restart the application

### Backup and Recovery

- **Backup encryption keys securely**
- **Test decryption with backup keys**
- **Document key recovery procedures**
- **Regular backup testing**

## Support

If you encounter issues:

1. Check the logs for error messages
2. Verify environment variables are set correctly
3. Ensure database connectivity
4. Check encryption key format and length
5. Review the troubleshooting section above

## Changelog

- **v1.0.0**: Initial encryption implementation
- **v1.1.0**: Added migration scripts
- **v1.2.0**: Removed webhookUrl field
- **v1.3.0**: Enhanced security and error handling
