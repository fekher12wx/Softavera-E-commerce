# Payment Configuration Setup Guide

This guide explains how to set up and configure payment methods (Adyen, Paymee, and Konnect) through the admin interface instead of using environment variables.

## Overview

The new system allows administrators to:
- Configure payment method API keys and settings through the web interface
- Store configurations securely in the database
- Switch between test and production environments easily
- Manage multiple payment providers without code changes

## Database Setup

1. **Run the SQL script** to create the payment_methods table:
   ```bash
   psql -U your_user -d your_database -f setup-payment-methods.sql
   ```

2. **Verify the table was created**:
   ```sql
   \d payment_methods
   SELECT * FROM payment_methods;
   ```

## Default Payment Methods

The system automatically creates three default payment methods:

### 1. Adyen
- **Code**: `adyen`
- **Required Fields**:
  - API Key (from Adyen dashboard)
  - Merchant Account ID
  - Environment (test/live)
- **Optional Fields**:
  - Webhook URL

### 2. Paymee
- **Code**: `paymee`
- **Required Fields**:
  - API Token
  - Vendor ID
  - Environment (sandbox/test/live)
- **Optional Fields**:
  - Base URL (defaults to sandbox)
  - Webhook URL

### 3. Konnect
- **Code**: `konnect`
- **Required Fields**:
  - API Key
  - Merchant ID
  - Environment (test/live)
- **Optional Fields**:
  - Base URL (defaults to production API)
  - Webhook URL

## Configuration Process

### Step 1: Access Admin Panel
1. Log in as an admin user
2. Navigate to the "Payment Methods" tab
3. You'll see the three default payment methods (initially inactive)

### Step 2: Configure Adyen
1. Click "Edit Configuration" on the Adyen tab
2. Fill in the required fields:
   - **API Key**: Get this from your Adyen dashboard
   - **Merchant Account**: Your Adyen merchant account ID
   - **Environment**: Choose "test" for development, "live" for production
   - **Webhook URL**: Your webhook endpoint for payment notifications
3. Click "Save"

### Step 3: Configure Paymee
1. Click "Edit Configuration" on the Paymee tab
2. Fill in the required fields:
   - **API Token**: Your Paymee API token
   - **Vendor ID**: Your Paymee vendor ID
   - **Environment**: Choose "sandbox" for testing
   - **Base URL**: Usually "https://sandbox.paymee.tn/api/v2"
   - **Webhook URL**: Your webhook endpoint
3. Click "Save"

### Step 4: Configure Konnect
1. Click "Edit Configuration" on the Konnect tab
2. Fill in the required fields:
   - **API Key**: Your Konnect API key
   - **Merchant ID**: Your Konnect merchant ID
   - **Environment**: Choose "test" for development
   - **Base URL**: Usually "https://api.konnect.network"
   - **Webhook URL**: Your webhook endpoint
3. Click "Save"

### Step 5: Activate Payment Methods
1. After configuring each method, check the "Active" checkbox
2. Click "Save" to activate the payment method
3. The system will now use the configured settings for payments

## Security Features

- **Database Storage**: All configurations are stored securely in the database
- **Caching**: Configurations are cached for 5 minutes to improve performance
- **Cache Invalidation**: Cache is automatically cleared when configurations are updated
- **Validation**: Required fields are validated before saving

## Testing

### Test Mode
- Set environment to "test" or "sandbox"
- Use test API keys and credentials
- Test payments won't charge real money

### Production Mode
- Set environment to "live"
- Use production API keys and credentials
- Real payments will be processed

## Troubleshooting

### Common Issues

1. **"Configuration not found" error**
   - Ensure the payment method is active
   - Check that all required fields are filled
   - Verify the payment method code matches exactly

2. **API authentication errors**
   - Verify API keys are correct
   - Check that the environment setting matches your API keys
   - Ensure the payment method is active

3. **Configuration not updating**
   - Clear your browser cache
   - Check the browser console for errors
   - Verify the backend is running

### Debug Mode

Enable debug logging by checking the browser console and backend logs for detailed error messages.

## Migration from Environment Variables

If you were previously using environment variables:

1. **Remove old environment variables** from your `.env` file:
   ```
   # Remove these lines
   ADYEN_API_KEY=...
   ADYEN_MERCHANT_ACCOUNT=...
   ADYEN_ENVIRONMENT=...
   PAYMEE_API_TOKEN=...
   PAYMEE_VENDOR_ID=...
   ```

2. **Configure through the admin interface** as described above

3. **Test the new configuration** with a small payment

4. **Remove old config files** if no longer needed

## API Integration

The system automatically uses the configured settings when processing payments:

```typescript
// Example: Creating an Adyen payment
import { createCheckoutSession } from '../adyen/adyen';

const session = await createCheckoutSession({
  amount: 1000,
  currency: 'EUR',
  countryCode: 'NL',
  returnUrl: 'https://yoursite.com/return'
});
```

The configuration is automatically loaded from the database based on the provider code.

## Support

For issues or questions:
1. Check the browser console for frontend errors
2. Check the backend logs for server errors
3. Verify database connectivity and table structure
4. Ensure all required fields are properly configured
