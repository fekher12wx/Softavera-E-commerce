const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecommerce_db',
  password: process.env.DB_PASSWORD || '0000',
  port: parseInt(process.env.DB_PORT || '5433'),
});

async function clearPaymentMethods() {
  try {
    console.log('🧹 Clearing payment methods table...\n');
    
    // Delete all payment methods
    const result = await pool.query('DELETE FROM payment_methods');
    
    console.log(`✅ Deleted ${result.rowCount} payment methods`);
    console.log('🔄 Table is now empty and ready for fresh data');
    
  } catch (error) {
    console.error('❌ Error clearing payment methods:', error);
  } finally {
    await pool.end();
  }
}

// Run the clear function
if (require.main === module) {
  clearPaymentMethods()
    .then(() => {
      console.log('\n🎯 Clear operation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Clear operation failed:', error);
      process.exit(1);
    });
}

module.exports = { clearPaymentMethods };
