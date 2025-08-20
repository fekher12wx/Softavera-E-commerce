const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecommerce',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function migrateAddPhoneAndQuote() {
  try {
    console.log('🔄 Starting migration to add phone and quote fields...');
    
    // Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'invoice_settings'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ invoice_settings table does not exist. Please run the setup-invoice-settings.sql script first.');
      return;
    }

    // Add new company_phone and company_quote columns
    console.log('📝 Adding new company_phone and company_quote columns...');
    await pool.query(`
      ALTER TABLE invoice_settings 
      ADD COLUMN IF NOT EXISTS company_phone VARCHAR(255) DEFAULT '+216 71 234 567',
      ADD COLUMN IF NOT EXISTS company_quote TEXT DEFAULT 'Your trusted partner in business';
    `);

    // Update existing records with default values
    console.log('🔄 Updating existing records with default values...');
    await pool.query(`
      UPDATE invoice_settings 
      SET 
        company_phone = COALESCE(company_phone, '+216 71 234 567'),
        company_quote = COALESCE(company_quote, 'Your trusted partner in business')
      WHERE company_phone IS NULL 
      OR company_quote IS NULL;
    `);

    // Verify the migration
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'invoice_settings' 
      ORDER BY ordinal_position;
    `);

    console.log('✅ Migration completed successfully!');
    console.log('📊 Table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (default: ${row.column_default})`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateAddPhoneAndQuote();
