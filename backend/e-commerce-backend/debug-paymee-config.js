const { Pool } = require('pg');

// Database configuration - adjust these values
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ecommerce',
  password: 'your_password', // Replace with your actual password
  port: 5432,
});

async function debugPaymeeConfig() {
  try {
    console.log('🔍 Checking Paymee configuration in database...\n');
    
    // Check if payment_methods table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'payment_methods'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ payment_methods table does not exist!');
      return;
    }
    
    console.log('✅ payment_methods table exists\n');
    
    // Check all payment methods
    const allMethods = await pool.query(`
      SELECT id, name, code, is_active, config, created_at, updated_at 
      FROM payment_methods 
      ORDER BY created_at;
    `);
    
    console.log('📋 All Payment Methods:');
    allMethods.rows.forEach((method, index) => {
      console.log(`\n${index + 1}. ${method.name} (${method.code})`);
      console.log(`   Active: ${method.is_active ? '✅ Yes' : '❌ No'}`);
      console.log(`   Config:`, JSON.stringify(method.config, null, 2));
      console.log(`   Created: ${method.created_at}`);
      console.log(`   Updated: ${method.updated_at}`);
    });
    
    // Specifically check Paymee
    const paymeeMethod = await pool.query(`
      SELECT * FROM payment_methods WHERE code = 'paymee';
    `);
    
    if (paymeeMethod.rows.length === 0) {
      console.log('\n❌ No Paymee payment method found in database!');
      return;
    }
    
    const paymee = paymeeMethod.rows[0];
    console.log('\n🎯 Paymee Configuration Details:');
    console.log(`   ID: ${paymee.id}`);
    console.log(`   Name: ${paymee.name}`);
    console.log(`   Code: ${paymee.code}`);
    console.log(`   Active: ${paymee.is_active ? '✅ Yes' : '❌ No'}`);
    console.log(`   Config:`, JSON.stringify(paymee.config, null, 2));
    
    // Check if required fields are present
    const config = paymee.config || {};
    const requiredFields = {
      'API Token': config.apiToken || config.apiKey,
      'Vendor ID': config.vendorId || config.vendor,
      'Environment': config.environment,
      'Base URL': config.baseUrl
    };
    
    console.log('\n🔍 Required Fields Check:');
    Object.entries(requiredFields).forEach(([field, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`   ${field}: ${status} ${value || 'Missing'}`);
    });
    
    // Check if Paymee is active
    if (!paymee.is_active) {
      console.log('\n⚠️  Paymee is NOT ACTIVE! This is why you get configuration errors.');
      console.log('   You need to activate it in the admin panel.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugPaymeeConfig();
