import dotenv from 'dotenv';
import { 
  createPaymeePayment, 
  checkPaymeePaymentStatus, 
  validatePaymeeConfig,
  generatePaymentReference,
  formatPaymeeAmount
} from './paymee';

// Load environment variables
dotenv.config();

/**
 * Test script for Paymee integration
 * This script tests the basic functionality of the Paymee service
 */
async function testPaymeeIntegration() {
  console.log('🧪 Starting Paymee Integration Tests...\n');

  try {
    // Test 1: Validate configuration
    console.log('1️⃣ Testing Paymee configuration...');
    const isConfigValid = await validatePaymeeConfig();
    if (isConfigValid) {
      console.log('✅ Paymee configuration is valid\n');
    } else {
      console.log('❌ Paymee configuration is invalid\n');
      return;
    }

    // Test 2: Test utility functions
    console.log('2️⃣ Testing utility functions...');
    const reference = generatePaymentReference('TEST');
    console.log(`✅ Generated reference: ${reference}`);
    
    const formattedAmount = formatPaymeeAmount(45.99);
    console.log(`✅ Formatted amount: ${formattedAmount}\n`);

    // Test 3: Create a test payment
    console.log('3️⃣ Testing payment creation...');
    const paymentParams = {
      amount: 45,
      note: `Test payment - ${new Date().toISOString()}`,
      reference: reference,
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe'
    };

    console.log('Payment parameters:', paymentParams);
    
    const paymentResponse = await createPaymeePayment(paymentParams);
    
    if (paymentResponse.success && paymentResponse.data.token) {
      console.log('✅ Payment created successfully!');
      console.log(`   Token: ${paymentResponse.data.token}`);
      console.log(`   Payment URL: ${paymentResponse.data.payment_url}`);
      console.log(`   Amount: ${paymentResponse.data.amount}`);
      console.log(`   Status: ${paymentResponse.data.status}\n`);

      // Test 4: Check payment status
      console.log('4️⃣ Testing payment status check...');
      const statusResponse = await checkPaymeePaymentStatus(paymentResponse.data.token);
      
      if (statusResponse.success) {
        console.log('✅ Payment status checked successfully!');
        console.log(`   Token: ${statusResponse.data.token}`);
        console.log(`   Payment Status: ${statusResponse.data.payment_status ? 'PAID' : 'PENDING'}`);
        console.log(`   Amount: ${statusResponse.data.amount}`);
        console.log(`   Note: ${statusResponse.data.note}`);
        if (statusResponse.data.transaction_id) {
          console.log(`   Transaction ID: ${statusResponse.data.transaction_id}`);
        }
        if (statusResponse.data.payment_date) {
          console.log(`   Payment Date: ${statusResponse.data.payment_date}`);
        }
      } else {
        console.log('❌ Failed to check payment status');
      }

    } else {
      console.log('❌ Failed to create payment');
      console.log('Response:', paymentResponse);
    }

  } catch (error: any) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Full error:', error);
  }

  console.log('\n🏁 Paymee Integration Tests Completed');
}

/**
 * Test error handling
 */
async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...\n');

  try {
    // Test invalid amount
    console.log('1️⃣ Testing invalid amount...');
    try {
      await createPaymeePayment({
        amount: -10,
        note: 'Invalid amount test',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      });
      console.log('❌ Should have thrown error for negative amount');
    } catch (error: any) {
      console.log('✅ Correctly caught invalid amount error:', error.message);
    }

    // Test empty note
    console.log('\n2️⃣ Testing empty note...');
    try {
      await createPaymeePayment({
        amount: 50,
        note: '',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      });
      console.log('❌ Should have thrown error for empty note');
    } catch (error: any) {
      console.log('✅ Correctly caught empty note error:', error.message);
    }

    // Test missing email
    console.log('\n3️⃣ Testing missing email...');
    try {
      await createPaymeePayment({
        amount: 50,
        note: 'Test payment',
        email: '',
        first_name: 'John',
        last_name: 'Doe'
      });
      console.log('❌ Should have thrown error for missing email');
    } catch (error: any) {
      console.log('✅ Correctly caught missing email error:', error.message);
    }

    // Test missing first name
    console.log('\n4️⃣ Testing missing first name...');
    try {
      await createPaymeePayment({
        amount: 50,
        note: 'Test payment',
        email: 'test@example.com',
        first_name: '',
        last_name: 'Doe'
      });
      console.log('❌ Should have thrown error for missing first name');
    } catch (error: any) {
      console.log('✅ Correctly caught missing first name error:', error.message);
    }

    // Test missing last name
    console.log('\n5️⃣ Testing missing last name...');
    try {
      await createPaymeePayment({
        amount: 50,
        note: 'Test payment',
        email: 'test@example.com',
        first_name: 'John',
        last_name: ''
      });
      console.log('❌ Should have thrown error for missing last name');
    } catch (error: any) {
      console.log('✅ Correctly caught missing last name error:', error.message);
    }

    // Test invalid token for status check
    console.log('\n6️⃣ Testing invalid token...');
    try {
      await checkPaymeePaymentStatus('');
      console.log('❌ Should have thrown error for empty token');
    } catch (error: any) {
      console.log('✅ Correctly caught empty token error:', error.message);
    }

  } catch (error: any) {
    console.error('❌ Error handling test failed:', error.message);
  }

  console.log('\n🏁 Error Handling Tests Completed');
}

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('🚀 Running Paymee Service Tests...\n');
  
  testPaymeeIntegration()
    .then(() => testErrorHandling())
    .then(() => {
      console.log('\n✨ All tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

export { testPaymeeIntegration, testErrorHandling };