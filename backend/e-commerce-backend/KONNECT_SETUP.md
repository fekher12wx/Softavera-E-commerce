# Konnect Payment Integration Setup

## Overview
Konnect is a Tunisian digital payment network that allows businesses to accept payments from customers.

## Current Issue
The system is currently running in **demo mode** because the Konnect configuration is not properly set up. This causes:
- 404 errors when checking payment status
- Payments are simulated locally instead of using real Konnect API

## Configuration Requirements

### 1. Database Configuration
Update the `payment_methods` table with your Konnect credentials:

```sql
UPDATE payment_methods 
SET config = jsonb_set(config, '{apiKey}', '"your-actual-konnect-api-key"')
WHERE code = 'konnect';

UPDATE payment_methods 
SET config = jsonb_set(config, '{merchantId}', '"your-actual-merchant-id"')
WHERE code = 'konnect';

UPDATE payment_methods 
SET config = jsonb_set(config, '{environment}', '"live"')
WHERE code = 'konnect';

-- Set as active
UPDATE payment_methods 
SET is_active = true 
WHERE code = 'konnect';
```

### 2. Required Fields
- **apiKey**: Your Konnect API key (Bearer token)
- **merchantId**: Your Konnect merchant ID
- **baseUrl**: `https://api.konnect.network` (production) or test URL
- **environment**: `live` for production, `test` for testing

### 3. Get Konnect Credentials
1. Contact Konnect support to get your merchant account
2. Request API access and credentials
3. Get your merchant ID and API key

## Demo Mode vs Production Mode

### Demo Mode (Current)
- ✅ No configuration required
- ✅ Payments are simulated locally
- ✅ Good for testing and development
- ❌ No real payments processed
- ❌ 404 errors in logs (expected)

### Production Mode
- ✅ Real payments processed
- ✅ Real money transactions
- ✅ Production webhooks
- ❌ Requires valid Konnect credentials
- ❌ Requires proper configuration

## Testing

### Test Demo Mode
```bash
# Create a test payment
curl -X POST http://localhost:3001/api/payments/konnect/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "note": "Test payment"
  }'
```

### Test Status Check
```bash
# Check payment status (use token from create response)
curl http://localhost:3001/api/payments/konnect/status/TOKEN_HERE
```

## Troubleshooting

### 404 Errors
- **Expected in demo mode**: These are normal when using demo tokens
- **Unexpected in production**: Check your API credentials and base URL

### Configuration Issues
- Verify API key is not `your-konnect-api-key` (placeholder)
- Ensure merchant ID is set
- Check if payment method is active

### Logs
Look for these log messages:
- `🎭 Konnect: Using demo mode due to incomplete configuration`
- `🔧 Konnect Config: baseUrl=..., hasApiKey=..., apiKeyValid=...`
- `⚠️ Konnect: No configuration found, using demo mode`

## Next Steps
1. **For Development**: Keep demo mode, ignore 404 errors
2. **For Production**: 
   - Get real Konnect credentials
   - Update database configuration
   - Test with small amounts first
   - Monitor logs for real API calls

## Support
- Konnect Documentation: [https://api.konnect.network](https://api.konnect.network)
- Konnect Support: Contact their business development team
- Technical Issues: Check logs and configuration validation
