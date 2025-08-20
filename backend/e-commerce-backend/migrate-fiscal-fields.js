const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecommerce',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function migrateFiscalFields() {
  try {
    console.log('🔄 Starting fiscal fields migration...');
    
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

    // Add new fiscal field columns
    console.log('📝 Adding new fiscal field columns...');
    await pool.query(`
      ALTER TABLE invoice_settings 
      ADD COLUMN IF NOT EXISTS fiscal_field1_label VARCHAR(255) DEFAULT 'champ 1',
      ADD COLUMN IF NOT EXISTS fiscal_field1_value VARCHAR(255) DEFAULT '',
      ADD COLUMN IF NOT EXISTS fiscal_field2_label VARCHAR(255) DEFAULT 'champ 2',
      ADD COLUMN IF NOT EXISTS fiscal_field2_value VARCHAR(255) DEFAULT '',
      ADD COLUMN IF NOT EXISTS fiscal_field3_label VARCHAR(255) DEFAULT 'champ 3',
      ADD COLUMN IF NOT EXISTS fiscal_field3_value VARCHAR(255) DEFAULT '';
    `);

    // Update existing records with default values
    console.log('🔄 Updating existing records with default fiscal field labels...');
    await pool.query(`
      UPDATE invoice_settings 
      SET 
        fiscal_field1_label = COALESCE(fiscal_field1_label, 'champ 1'),
        fiscal_field2_label = COALESCE(fiscal_field2_label, 'champ 2'),
        fiscal_field3_label = COALESCE(fiscal_field3_label, 'champ 3')
      WHERE fiscal_field1_label IS NULL 
      OR fiscal_field2_label IS NULL 
      OR fiscal_field3_label IS NULL;
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

migrateFiscalFields();
