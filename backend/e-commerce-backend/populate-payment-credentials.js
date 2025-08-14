const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecommerce_db',
  password: process.env.DB_PASSWORD || '0000',
  port: parseInt(process.env.DB_PORT || '5433'),
});

// Simple base64 encoding service
class EncodingService {
  // Simple base64 encoding
  encode(text) {
    try {
      return Buffer.from(text, 'utf8').toString('base64');
    } catch (error) {
      console.error('Base64 encoding failed:', error);
      throw new Error('Failed to encode data');
    }
  }

  encodePaymentConfig(config) {
    const sensitiveFields = ['apiKey', 'apiToken', 'merchantAccount', 'merchantId', 'vendorId', 'clientKey'];
    const encodedConfig = { ...config };

    for (const field of sensitiveFields) {
      if (encodedConfig[field] && typeof encodedConfig[field] === 'string') {
        // Always encode sensitive fields
        encodedConfig[field] = this.encode(encodedConfig[field]);
      }
    }

    return encodedConfig;
  }

  // Check if a string is base64 encoded
  isEncoded(text) {
    try {
      // Check if it's valid base64
      const decoded = Buffer.from(text, 'base64').toString('utf8');
      // If it can be decoded and the decoded result is different from original, it's encoded
      return decoded !== text;
    } catch {
      // If decoding fails, it's not base64
      return false;
    }
  }
}

async function populatePaymentCredentials() {
  const encodingService = new EncodingService();
  
  try {
    console.log('Starting to populate payment credentials...');
    
    // First, let's check if the table exists and create it if needed
    try {
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'payment_methods'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('Creating payment_methods table...');
        await pool.query(`
          CREATE TABLE payment_methods (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            code VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            config JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Table created successfully');
      } else {
        console.log('Table payment_methods already exists');
        // Check the table structure
        const tableInfo = await pool.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'payment_methods' 
          ORDER BY ordinal_position
        `);
        console.log('Table structure:');
        tableInfo.rows.forEach(row => {
          console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
      }
    } catch (error) {
      console.log('Could not check/create table:', error.message);
      throw error;
    }
    
    // Your payment credentials (these will be base64 encoded before storage)
    const paymentCredentials = {
      adyen: {
        name: 'Adyen',
        code: 'adyen',
        description: 'Global payment platform supporting multiple payment methods',
        isActive: true,
        config: {
          apiKey: "AQEnhmfuXNWTK0Qc+iSRp1YdlMWYS4RYA4cRkZRioSE334JkKdoSBnDDEMFdWw2+5HzctViMSCJMYAc=-6QO8fIrGtndQrpjryx98FYKxAnLfcijkLM37bEPnwwI=-x#6Z$LL(zk8}sC~%",
          merchantAccount: 'AURESAccountPOS',
          environment: 'test',
          clientKey: "test_U6OJZI3TA5EDFOIMDHPMV2HUTARAZ6WV"
        }
      },
      paymee: {
        name: 'Paymee',
        code: 'paymee',
        description: 'Tunisian payment gateway for local and international payments',
        isActive: true,
        config: {
          apiToken: '48ac2e525d715f1ea0d88dde494504aa0e1b95fe',
          vendorId: '3931',
          baseUrl: 'https://sandbox.paymee.tn/api/v2',
          environment: 'sandbox'
        }
      },
      konnect: {
        name: 'Konnect',
        code: 'konnect',
        description: 'Tunisian digital payment network',
        isActive: true,
        config: {
          apiKey: 'your-konnect-api-key', // Replace with actual Konnect API key
          merchantId: 'your-konnect-merchant-id', // Replace with actual Konnect merchant ID
          baseUrl: 'https://api.konnect.network',
          environment: 'test'
        }
      }
    };

    for (const [provider, paymentMethod] of Object.entries(paymentCredentials)) {
      console.log(`\nProcessing ${provider}...`);
      
      // Check if payment method already exists
      const existingResult = await pool.query(
        'SELECT id FROM payment_methods WHERE code = $1',
        [paymentMethod.code]
      );

      if (existingResult.rows.length > 0) {
        console.log(`Updating existing ${provider} payment method...`);
        
        // Encode the configuration
        const encodedConfig = encodingService.encodePaymentConfig(paymentMethod.config);
        console.log(`  Encoding config for ${provider}...`);
        console.log(`  Original API Key length: ${paymentMethod.config.apiKey ? paymentMethod.config.apiKey.length : 'undefined'}`);
        console.log(`  Encoded API Key length: ${encodedConfig.apiKey ? encodedConfig.apiKey.length : 'undefined'}`);
        
        // Update existing payment method
        await pool.query(
          'UPDATE payment_methods SET name = $1, description = $2, is_active = $3, config = $4, updated_at = CURRENT_TIMESTAMP WHERE code = $5',
          [paymentMethod.name, paymentMethod.description, paymentMethod.isActive, encodedConfig, paymentMethod.code]
        );
        
        console.log(`✅ Updated ${provider} payment method`);
      } else {
        console.log(`Creating new ${provider} payment method...`);
        
        // Encode the configuration
        const encodedConfig = encodingService.encodePaymentConfig(paymentMethod.config);
        console.log(`  Encoding config for ${provider}...`);
        console.log(`  Original API Key length: ${paymentMethod.config.apiKey ? paymentMethod.config.apiKey.length : 'undefined'}`);
        console.log(`  Encoded API Key length: ${encodedConfig.apiKey ? encodedConfig.apiKey.length : 'undefined'}`);
        
        // Create new payment method
        await pool.query(
          'INSERT INTO payment_methods (name, code, description, is_active, config) VALUES ($1, $2, $3, $4, $5)',
          [paymentMethod.name, paymentMethod.code, paymentMethod.description, paymentMethod.isActive, encodedConfig]
        );
        
        console.log(`✅ Created ${provider} payment method`);
      }
    }

    console.log('\n🎉 Payment credentials populated successfully!');
    console.log('\nNote: All sensitive data has been base64 encoded before storage.');
    console.log('You can now use the admin panel to manage these payment methods.');
    
  } catch (error) {
    console.error('Failed to populate payment credentials:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  populatePaymentCredentials()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { populatePaymentCredentials };
