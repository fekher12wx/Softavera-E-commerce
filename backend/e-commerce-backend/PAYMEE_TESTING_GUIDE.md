# Paymee Integration Testing Guide

## Overview
This guide explains how to test the Paymee payment integration in your e-commerce backend.

## Prerequisites
1. Make sure your `.env` file has the correct Paymee configuration:
   ```
   PAYMEE_API_TOKEN=48ac2e525d715f1ea0d88dde494504aa0e1b95fe
   PAYMEE_BASE_URL=https://sandbox.paymee.tn/api/v2
   PAYMEE_VENDOR_ID=1265
   PAYMEE_ENVIRONMENT=sandbox
   ```

2. Ensure all dependencies are installed:
   ```bash
   npm install
   ```

## Testing Methods

### Method 1: Run the Test Script (Recommended)
```bash
# Navigate to backend directory
cd backend/e-commerce-backend

# Run the Paymee test script
npm run test:paymee
```

**What this test does:**
- ✅ Validates Paymee configuration
- ✅ Tests utility functions (reference generation, amount formatting)
- ✅ Creates a test payment with Paymee API
- ✅ Checks the payment status
- ✅ Tests error handling scenarios

**Expected Output:**
```
🧪 Starting Paymee Integration Tests...

1️⃣ Testing Paymee configuration...
✅ Paymee configuration is valid

2️⃣ Testing utility functions...
✅ Generated reference: TEST-1704123456789-ABC123
✅ Formatted amount: 45.99

3️⃣ Testing payment creation...
✅ Payment created successfully!
   Token: 9D320F732CE972A47E8C73E0A4D23BB0947
   Payment URL: https://sandbox.paymee.tn/gateway/9D320F732CE972A47E8C73E0A4D23BB0947
   Amount: 45
   Status: pending

4️⃣ Testing payment status check...
✅ Payment status checked successfully!
   Token: 9D320F732CE972A47E8C73E0A4D23BB0947
   Payment Status: PENDING
   Amount: 45
   Note: Test payment - 2024-01-01T12:00:00.000Z - Ref: TEST-1704123456789-ABC123
```

### Method 2: Manual API Testing with Postman/curl

#### Test Payment Creation
```bash
curl -X POST http://localhost:3001/api/payments/paymee/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 45,
    "note": "Test payment from API",
    "reference": "TEST-001",
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

#### Test Payment Status Check
```bash
curl -X GET http://localhost:3001/api/payments/paymee/status/YOUR_PAYMENT_TOKEN
```

### Method 3: Direct TypeScript Execution
```bash
# Navigate to backend directory
cd backend/e-commerce-backend

# Run test directly with ts-node
npx ts-node src/paymee/test-paymee.ts
```

### Method 4: Integration with Your Backend Server
1. Start your backend server:
   ```bash
   npm run dev
   ```

2. The Paymee endpoints will be available at:
   - `POST /api/payments/paymee/create` - Create payment
   - `GET /api/payments/paymee/status/:token` - Check status

## Troubleshooting

### Common Issues and Solutions

#### 1. "Network error: Unable to connect to Paymee API"
- **Cause:** Internet connection or Paymee API is down
- **Solution:** Check your internet connection and try again

#### 2. "Paymee API Error: Invalid token"
- **Cause:** Wrong API token in environment variables
- **Solution:** Verify your `PAYMEE_API_TOKEN` in `.env` file

#### 3. "Vendor ID is required"
- **Cause:** Missing or invalid vendor ID
- **Solution:** Check `PAYMEE_VENDOR_ID` in `.env` file

#### 4. "Amount must be greater than 0"
- **Cause:** Invalid amount provided
- **Solution:** Ensure amount is a positive number

### API Response Examples

#### Successful Payment Creation
```json
{
  "success": true,
  "data": {
    "token": "9D320F732CE972A47E8C73E0A4D23BB0947",
    "payment_url": "https://sandbox.paymee.tn/gateway/9D320F732CE972A47E8C73E0A4D23BB0947",
    "amount": 45,
    "vendor": 1265,
    "note": "Test payment - Ref: TEST-001",
    "status": "pending"
  }
}
```

#### Payment Status Check
```json
{
  "success": true,
  "data": {
    "token": "9D320F732CE972A47E8C73E0A4D23BB0947",
    "payment_status": false,
    "amount": 45,
    "vendor": 1265,
    "note": "Test payment - Ref: TEST-001"
  }
}
```

## Testing Flow

1. **Create Payment** → Get payment token and URL
2. **Simulate User Payment** → Visit the payment URL (optional)
3. **Check Status** → Verify payment status using the token
4. **Handle Result** → Process based on payment status

## Next Steps

After successful testing:
1. Integrate Paymee with your payment controller
2. Add Paymee routes to your Express app
3. Create frontend components for Paymee payments
4. Test the complete payment flow

## Security Notes

- Never expose your API token in frontend code
- Always validate payment status on the backend
- Use HTTPS in production
- Implement proper error handling and logging