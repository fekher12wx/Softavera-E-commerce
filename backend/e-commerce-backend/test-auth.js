const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_TOKEN = 'your_test_token_here'; // Replace with a valid token

async function testEndpoints() {
  console.log('🧪 Testing Invoice Settings endpoints...\n');

  try {
    // Test 1: Get invoice settings (no auth required)
    console.log('1️⃣ Testing GET /api/settings/invoice (no auth)...');
    const getResponse = await fetch(`${BASE_URL}/api/settings/invoice`);
    console.log(`   Status: ${getResponse.status}`);
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log(`   ✅ Success: ${Object.keys(data.settings).length} settings loaded`);
    } else {
      const error = await getResponse.text();
      console.log(`   ❌ Error: ${error}`);
    }

    // Test 2: Update invoice settings (auth required)
    console.log('\n2️⃣ Testing PUT /api/settings/invoice (auth required)...');
    const updateResponse = await fetch(`${BASE_URL}/api/settings/invoice`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify({
        companyName: 'Test Company',
        companyTagline: 'Test Tagline',
        companyEmail: 'test@company.com',
        companyWebsite: 'test.com',
        companyAddress: 'Test Address',
        companyCity: 'Test City',
        companyCountry: 'Test Country',
        paymentText: 'Test Payment Text',
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
        accentColor: '#0000FF',
        fiscalNumber: 'TEST123',
        taxRegistrationNumber: 'TAX123',
        siretNumber: 'SIRET123'
      })
    });
    console.log(`   Status: ${updateResponse.status}`);
    if (updateResponse.ok) {
      const data = await updateResponse.json();
      console.log(`   ✅ Success: Settings updated`);
    } else {
      const error = await updateResponse.text();
      console.log(`   ❌ Error: ${error}`);
    }

    // Test 3: Upload logo (auth required)
    console.log('\n3️⃣ Testing POST /api/settings/upload-logo (auth required)...');
    const FormData = require('form-data');
    const form = new FormData();
    
    // Create a dummy file
    const dummyFile = Buffer.from('dummy image content');
    form.append('logo', dummyFile, {
      filename: 'test-logo.png',
      contentType: 'image/png'
    });

    const uploadResponse = await fetch(`${BASE_URL}/api/settings/upload-logo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...form.getHeaders()
      },
      body: form
    });
    console.log(`   Status: ${uploadResponse.status}`);
    if (uploadResponse.ok) {
      const data = await uploadResponse.json();
      console.log(`   ✅ Success: Logo uploaded - ${data.logoUrl}`);
    } else {
      const error = await uploadResponse.text();
      console.log(`   ❌ Error: ${error}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n🎉 Testing completed!');
}

// Instructions
console.log('📋 Instructions:');
console.log('1. Make sure your backend server is running on port 3001');
console.log('2. Replace "your_test_token_here" with a valid JWT token');
console.log('3. Run: node test-auth.js');
console.log('');

// Run tests if token is provided
if (TEST_TOKEN !== 'your_test_token_here') {
  testEndpoints();
} else {
  console.log('⚠️  Please set a valid test token first!');
}
