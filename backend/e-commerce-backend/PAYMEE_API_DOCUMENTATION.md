# Paymee Payment Integration API Documentation

## Overview
This document describes the Paymee payment integration endpoints available in your e-commerce backend.

## Base URL
```
http://localhost:3001/api/payments
```

## Authentication
All Paymee endpoints require proper configuration in your environment variables:
- `PAYMEE_API_TOKEN`
- `PAYMEE_BASE_URL`
- `PAYMEE_VENDOR_ID`
- `PAYMEE_ENVIRONMENT`

## Endpoints

### 1. Create Paymee Payment
**POST** `/paymee/create`

Creates a new payment session with Paymee.

#### Request Body
```json
{
  "amount": 100.50,
  "note": "Payment for Order #12345",
  "email": "customer@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "reference": "ORDER-12345",
  "returnUrl": "https://yourapp.com/payment/result"
}
```

#### Required Fields
- `amount` (number): Payment amount
- `note` (string): Payment description
- `email` (string): Customer email
- `first_name` (string): Customer first name
- `last_name` (string): Customer last name

#### Optional Fields
- `reference` (string): Custom payment reference
- `returnUrl` (string): URL to redirect after payment

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "token": "9D320F732CE972A47E8C73E0A4D23BB0947",
    "payment_url": "https://sandbox.paymee.tn/gateway/9D320F732CE972A47E8C73E0A4D23BB0947",
    "amount": 100.50,
    "vendor": 1265,
    "note": "Payment for Order #12345 - Ref: ORDER-12345",
    "status": "pending"
  }
}
```

#### Response (Error - 400/500)
```json
{
  "error": "Missing required fields: amount, note, email, first_name, last_name"
}
```

### 2. Check Payment Status
**GET** `/paymee/status/:token`

Checks the status of a payment using its token.

#### URL Parameters
- `token` (string): Payment token received from create payment

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "token": "9D320F732CE972A47E8C73E0A4D23BB0947",
    "payment_status": true,
    "amount": 100.50,
    "vendor": 1265,
    "note": "Payment for Order #12345 - Ref: ORDER-12345",
    "transaction_id": "TXN123456789",
    "payment_date": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Response (Error - 400/500)
```json
{
  "error": "Payment token is required"
}
```

### 3. Check Paymee Configuration
**GET** `/paymee/config`

Validates the Paymee configuration and returns the current setup.

#### Response (Success - 200)
```json
{
  "success": true,
  "message": "Paymee configuration is valid",
  "environment": "sandbox"
}
```

#### Response (Error - 500)
```json
{
  "success": false,
  "message": "Paymee configuration is invalid",
  "environment": "sandbox"
}
```

### 4. Paymee Webhook
**POST** `/paymee/webhook`

Receives payment notifications from Paymee. This endpoint should be configured in your Paymee dashboard.

#### Request Body (from Paymee)
```json
{
  "token": "9D320F732CE972A47E8C73E0A4D23BB0947",
  "payment_status": true,
  "amount": 100.50,
  "vendor": 1265,
  "note": "Payment for Order #12345 - Ref: ORDER-12345",
  "transaction_id": "TXN123456789",
  "payment_date": "2024-01-01T12:00:00.000Z"
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "message": "Webhook received successfully"
}
```

## Usage Examples

### Frontend Integration

#### 1. Create Payment
```javascript
const createPayment = async (paymentData) => {
  try {
    const response = await fetch('/api/payments/paymee/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Redirect user to payment URL
      window.location.href = result.data.payment_url;
    } else {
      console.error('Payment creation failed:', result.error);
    }
  } catch (error) {
    console.error('Error creating payment:', error);
  }
};

// Usage
createPayment({
  amount: 100.50,
  note: "Payment for Order #12345",
  email: "customer@example.com",
  first_name: "John",
  last_name: "Doe",
  reference: "ORDER-12345"
});
```

#### 2. Check Payment Status
```javascript
const checkPaymentStatus = async (token) => {
  try {
    const response = await fetch(`/api/payments/paymee/status/${token}`);
    const result = await response.json();
    
    if (result.success) {
      if (result.data.payment_status) {
        console.log('Payment successful!');
        // Handle successful payment
      } else {
        console.log('Payment pending or failed');
        // Handle pending/failed payment
      }
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
  }
};
```

### cURL Examples

#### Create Payment
```bash
curl -X POST http://localhost:3001/api/payments/paymee/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.50,
    "note": "Payment for Order #12345",
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "reference": "ORDER-12345"
  }'
```

#### Check Payment Status
```bash
curl -X GET http://localhost:3001/api/payments/paymee/status/YOUR_PAYMENT_TOKEN
```

#### Check Configuration
```bash
curl -X GET http://localhost:3001/api/payments/paymee/config
```

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "Missing required fields: amount, note, email, first_name, last_name"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Failed to create Paymee payment",
  "details": "Paymee API Error: Invalid token"
}
```

## Environment Variables

Make sure these variables are set in your `.env` file:

```env
PAYMEE_API_TOKEN=your_api_token_here
PAYMEE_BASE_URL=https://sandbox.paymee.tn/api/v2
PAYMEE_VENDOR_ID=your_vendor_id_here
PAYMEE_ENVIRONMENT=sandbox
```

## Testing

### Test the Integration
1. Start your backend server
2. Use the test script: `npm run test:paymee`
3. Or test manually using the endpoints above

### Webhook Testing
For webhook testing, you can use tools like:
- ngrok (to expose local server)
- Postman
- Webhook.site

## Security Notes

1. **Never expose API tokens** in frontend code
2. **Always validate payment status** on the backend
3. **Use HTTPS** in production
4. **Implement proper error handling** and logging
5. **Validate webhook signatures** (if supported by Paymee)

## Next Steps

1. Integrate with your order management system
2. Add payment confirmation emails
3. Update inventory after successful payments
4. Add payment analytics and reporting
5. Implement retry logic for failed payments
