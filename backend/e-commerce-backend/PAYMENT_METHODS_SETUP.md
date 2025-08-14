# Payment Methods Setup Guide

This guide explains how to set up and use the new payment methods system in the e-commerce backend.

## Overview

The payment methods system allows administrators to:
- Add custom payment methods with unique codes
- Configure payment method settings and API keys
- Enable/disable payment methods
- Store configuration data in JSON format

## Database Setup

1. Run the SQL migration to create the payment_methods table:

```sql
-- Run this SQL file in your PostgreSQL database
\i config/create-payment-methods-table.sql
```

This will create:
- `payment_methods` table with all necessary fields
- Default payment methods (Adyen, Paymee, Konnect)
- Proper indexes for performance
- Automatic timestamp updates

## Default Payment Methods

The system comes with three pre-configured payment methods:

1. **Adyen - Global Payments**
   - Code: `adyen`
   - Description: Global payment processor with support for multiple currencies
   - Config: API key, merchant ID, environment

2. **Paymee - Local Processing**
   - Code: `paymee`
   - Description: Local Tunisian payment processor
   - Config: Vendor ID, API key, environment

3. **Konnect - Regional Gateway**
   - Code: `konnect`
   - Description: Regional payment gateway for MENA region
   - Config: API key, merchant ID, environment

## API Endpoints

### Get All Payment Methods
```
GET /api/payment-methods
Authorization: Bearer <token>
```

### Get Active Payment Methods Only
```
GET /api/payment-methods/active
```

### Get Payment Method by ID
```
GET /api/payment-methods/:id
Authorization: Bearer <token>
```

### Create New Payment Method
```
POST /api/payment-methods
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Custom Payment",
  "code": "custom",
  "description": "Custom payment processor",
  "isActive": true,
  "config": {
    "apiKey": "your-api-key",
    "merchantId": "your-merchant-id"
  }
}
```

### Update Payment Method
```
PUT /api/payment-methods/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "isActive": false
}
```

### Delete Payment Method
```
DELETE /api/payment-methods/:id
Authorization: Bearer <token>
```

## Frontend Integration

The admin dashboard now includes a "Payment Methods" tab where you can:

1. **View** all payment methods in a table format
2. **Add** new payment methods with custom names and codes
3. **Edit** existing payment methods
4. **Delete** payment methods (if not in use)
5. **Enable/Disable** payment methods

## Configuration Storage

The `config` field stores payment method-specific settings as JSON:

```json
{
  "apiKey": "your-secret-api-key",
  "merchantId": "merchant-123",
  "environment": "production",
  "webhookUrl": "https://your-domain.com/webhook",
  "customSettings": "any-additional-data"
}
```

## Security Considerations

- All payment method operations require admin authentication
- API keys and sensitive data are stored in the database
- Consider encrypting sensitive configuration data in production
- Validate all input data before storing

## Usage Examples

### Adding a New Payment Method

1. Go to Admin Dashboard → Payment Methods tab
2. Click "Add New"
3. Fill in:
   - Name: "Stripe Payments"
   - Code: "stripe"
   - Description: "Credit card processing via Stripe"
   - Active: Checked
4. Click Save

### Updating Configuration

1. Click the Edit button on a payment method
2. Modify the configuration as needed
3. Save changes

### Disabling a Payment Method

1. Edit the payment method
2. Uncheck "Active"
3. Save changes

## Troubleshooting

### Common Issues

1. **Duplicate Code Error**: Ensure each payment method has a unique code
2. **Database Connection**: Verify PostgreSQL is running and accessible
3. **Permissions**: Ensure the database user has CREATE/ALTER permissions

### Validation Rules

- Name: Required, max 255 characters
- Code: Required, max 100 characters, must be unique
- Description: Optional, text field
- isActive: Boolean, defaults to true
- Config: JSON object, defaults to empty object

## Future Enhancements

Potential improvements for the payment methods system:

1. **Encryption**: Encrypt sensitive configuration data
2. **Webhook Management**: Built-in webhook endpoint management
3. **Payment Flow Integration**: Direct integration with checkout process
4. **Analytics**: Payment method usage statistics
5. **Multi-currency Support**: Per-method currency configuration
