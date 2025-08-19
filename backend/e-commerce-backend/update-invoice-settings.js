const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ecommerce',
  password: 'your_password', // Change this to your actual password
  port: 5432,
});

async function updateInvoiceSettingsTable() {
  try {
    console.log('🔄 Updating invoice_settings table with fiscal fields...');

    // Add fiscal fields to existing table
    await pool.query(`
      ALTER TABLE invoice_settings 
      ADD COLUMN IF NOT EXISTS fiscal_number VARCHAR(255) DEFAULT '',
      ADD COLUMN IF NOT EXISTS tax_registration_number VARCHAR(255) DEFAULT '',
      ADD COLUMN IF NOT EXISTS siret_number VARCHAR(255) DEFAULT ''
    `);

    console.log('✅ Fiscal fields added successfully');

    // Update existing records to have empty fiscal fields
    const updateResult = await pool.query(`
      UPDATE invoice_settings 
      SET 
        fiscal_number = COALESCE(fiscal_number, ''),
        tax_registration_number = COALESCE(tax_registration_number, ''),
        siret_number = COALESCE(siret_number, '')
      WHERE fiscal_number IS NULL 
         OR tax_registration_number IS NULL 
         OR siret_number IS NULL
    `);

    console.log(`✅ Updated ${updateResult.rowCount} existing records`);

    // Verify the table structure
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'invoice_settings' 
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Table structure:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });

    console.log('\n🎉 Invoice settings table updated successfully!');

  } catch (error) {
    console.error('❌ Error updating invoice settings table:', error);
  } finally {
    await pool.end();
  }
}

// Run the update
updateInvoiceSettingsTable();
