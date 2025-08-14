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
        // Only encode if not already encoded
        if (!this.isEncoded(encodedConfig[field])) {
          encodedConfig[field] = this.encode(encodedConfig[field]);
        }
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

async function migratePaymentConfigs() {
  const encodingService = new EncodingService();
  
  try {
    console.log('Starting payment configuration base64 encoding migration...');
    
    // Get all payment methods
    const result = await pool.query('SELECT id, code, config FROM payment_methods');
    
    if (result.rows.length === 0) {
      console.log('No payment methods found to migrate.');
      return;
    }

    console.log(`Found ${result.rows.length} payment methods to process.`);

    for (const row of result.rows) {
      const { id, code, config } = row;
      
      if (!config || typeof config !== 'object') {
        console.log(`Skipping ${code}: no config or invalid config`);
        continue;
      }

      console.log(`Processing ${code} (ID: ${id})...`);
      
      // Check if any sensitive fields need encoding
      const sensitiveFields = ['apiKey', 'apiToken', 'merchantAccount', 'merchantId', 'vendorId', 'clientKey'];
      let needsUpdate = false;
      
      for (const field of sensitiveFields) {
        if (config[field] && typeof config[field] === 'string' && !encodingService.isEncoded(config[field])) {
          needsUpdate = true;
          break;
        }
      }

      if (needsUpdate) {
        // Encode the configuration
        const encodedConfig = encodingService.encodePaymentConfig(config);
        
        // Update the database
        await pool.query(
          'UPDATE payment_methods SET config = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [encodedConfig, id]
        );
        
        console.log(`✅ Encoded and updated ${code}`);
      } else {
        console.log(`⏭️  ${code} already encoded or no sensitive data`);
      }
    }

    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
if (require.main === module) {
  migratePaymentConfigs()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migratePaymentConfigs };


