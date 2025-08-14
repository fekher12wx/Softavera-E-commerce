const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecommerce_db',
  password: process.env.DB_PASSWORD || '0000',
  port: parseInt(process.env.DB_PORT || '5433'),
});

async function setupTaxes() {
  try {
    console.log('Starting to setup taxes table...');
    
    // First, let's check if the table exists and create it if needed
    try {
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'taxes'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('Creating taxes table...');
        await pool.query(`
          CREATE TABLE taxes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            rate DECIMAL(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Taxes table created successfully');
      } else {
        console.log('Taxes table already exists');
      }
    } catch (error) {
      console.log('Could not check/create taxes table:', error.message);
      throw error;
    }
    
    // Default tax rates
    const defaultTaxes = [
      { name: '0%', rate: 0, isActive: true },
      { name: '5%', rate: 5, isActive: true },
      { name: '10%', rate: 10, isActive: true },
      { name: '15%', rate: 15, isActive: true },
      { name: '20%', rate: 20, isActive: true },
      { name: '25%', rate: 25, isActive: true }
    ];

    for (const tax of defaultTaxes) {
      console.log(`\nProcessing tax: ${tax.name} (${tax.rate}%)`);
      
      // Check if tax already exists
      const existingResult = await pool.query(
        'SELECT id FROM taxes WHERE rate = $1',
        [tax.rate]
      );

      if (existingResult.rows.length > 0) {
        console.log(`Updating existing tax: ${tax.name}`);
        
        // Update existing tax
        await pool.query(
          'UPDATE taxes SET name = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP WHERE rate = $3',
          [tax.name, tax.isActive, tax.rate]
        );
        
        console.log(`✅ Updated tax: ${tax.name}`);
      } else {
        console.log(`Creating new tax: ${tax.name}`);
        
        // Create new tax
        await pool.query(
          'INSERT INTO taxes (name, rate, is_active) VALUES ($1, $2, $3)',
          [tax.name, tax.rate, tax.isActive]
        );
        
        console.log(`✅ Created tax: ${tax.name}`);
      }
    }

    console.log('\n🎉 Taxes setup completed successfully!');
    console.log('Default tax rates have been created and are ready to use.');
    
  } catch (error) {
    console.error('Failed to setup taxes:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  setupTaxes()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { setupTaxes };

