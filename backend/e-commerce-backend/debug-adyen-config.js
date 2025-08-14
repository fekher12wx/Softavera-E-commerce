const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecommerce_db',
  password: process.env.DB_PASSWORD || '0000',
  port: parseInt(process.env.DB_PORT || '5433'),
});

async function debugAdyenConfig() {
  try {
    console.log('🔍 Debugging Adyen Configuration...\n');
    
    // Get the raw data from the database
    const result = await pool.query(
      'SELECT * FROM payment_methods WHERE code = $1',
      ['adyen']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ No Adyen configuration found!');
      return;
    }
    
    const config = result.rows[0];
    console.log('📊 Raw Database Record:');
    console.log(JSON.stringify(config, null, 2));
    
    console.log('\n🔐 Configuration Analysis:');
    console.log(`   ID: ${config.id}`);
    console.log(`   Name: ${config.name}`);
    console.log(`   Code: ${config.code}`);
    console.log(`   Active: ${config.is_active}`);
    console.log(`   Created: ${config.created_at}`);
    console.log(`   Updated: ${config.updated_at}`);
    
    // Check if config exists and its structure
    if (config.config) {
      console.log('\n📋 Config Object:');
      console.log(JSON.stringify(config.config, null, 2));
      
      // Check each field
      const configData = config.config;
      console.log('\n🔍 Field Analysis:');
      console.log(`   apiKey: ${configData.apiKey ? '✅ Present' : '❌ Missing'}`);
      console.log(`   merchantAccount: ${configData.merchantAccount ? '✅ Present' : '❌ Missing'}`);
      console.log(`   environment: ${configData.environment || '❌ Missing'}`);
      console.log(`   clientKey: ${configData.clientKey ? '✅ Present' : '❌ Missing'}`);
      
      // Check if fields are encrypted
      if (configData.apiKey) {
        if (configData.apiKey.includes(':')) {
          console.log('   API Key: 🔒 Encrypted');
        } else {
          console.log('   API Key: 📝 Plain text');
        }
      }
      
      if (configData.clientKey) {
        if (configData.clientKey.includes(':')) {
          console.log('   Client Key: 🔒 Encrypted');
        } else {
          console.log('   Client Key: 📝 Plain text');
        }
      }
      
      // Check for invalid characters in API key
      if (configData.apiKey) {
        const invalidChars = configData.apiKey.match(/[#$(){}~%]/g);
        if (invalidChars) {
          console.log('\n⚠️  WARNING: API Key contains invalid characters:');
          console.log(`   Invalid chars: ${invalidChars.join(', ')}`);
        } else {
          console.log('\n✅ API Key format looks valid');
        }
      }
    } else {
      console.log('\n❌ No config object found in database!');
    }
    
    // Check if there are any other payment methods
    const allMethods = await pool.query('SELECT code, name, is_active FROM payment_methods');
    console.log('\n📋 All Payment Methods:');
    allMethods.rows.forEach(row => {
      console.log(`   ${row.code}: ${row.name} (Active: ${row.is_active})`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging configuration:', error);
  } finally {
    await pool.end();
  }
}

// Run the debug
if (require.main === module) {
  debugAdyenConfig()
    .then(() => {
      console.log('\n🎯 Debug completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Debug failed:', error);
      process.exit(1);
    });
}

module.exports = { debugAdyenConfig };
