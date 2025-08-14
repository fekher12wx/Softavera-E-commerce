const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecommerce_db',
  password: process.env.DB_PASSWORD || '0000',
  port: parseInt(process.env.DB_PORT || '5433'),
});

async function checkTaxStatus() {
  try {
    console.log('🔍 Checking current tax status in database...\n');
    
    // Check taxes table
    console.log('📋 Available taxes:');
    const taxes = await pool.query('SELECT id, name, rate, is_active FROM taxes ORDER BY rate');
    taxes.rows.forEach(tax => {
      console.log(`   - ID: ${tax.id}, Name: ${tax.name}, Rate: ${tax.rate}%, Active: ${tax.is_active}`);
    });
    
    console.log('\n📦 Products tax status:');
    
    // Check products without tax
    const productsWithoutTax = await pool.query(`
      SELECT COUNT(*) as count FROM products WHERE tax_id IS NULL
    `);
    console.log(`   - Products without tax: ${productsWithoutTax.rows[0].count}`);
    
    // Check products with tax
    const productsWithTax = await pool.query(`
      SELECT COUNT(*) as count FROM products WHERE tax_id IS NOT NULL
    `);
    console.log(`   - Products with tax: ${productsWithTax.rows[0].count}`);
    
    // Show tax distribution
    console.log('\n📊 Tax distribution:');
    const taxDistribution = await pool.query(`
      SELECT 
        t.name as tax_name,
        t.rate as tax_rate,
        COUNT(p.id) as product_count
      FROM taxes t
      LEFT JOIN products p ON t.id = p.tax_id
      WHERE t.is_active = true
      GROUP BY t.id, t.name, t.rate
      ORDER BY t.rate
    `);
    
    taxDistribution.rows.forEach(stat => {
      console.log(`   - ${stat.tax_name} (${stat.tax_rate}%): ${stat.product_count} products`);
    });
    
    // Show sample products
    console.log('\n📋 Sample products with their tax:');
    const sampleProducts = await pool.query(`
      SELECT p.name, p.tax_id, t.name as tax_name, t.rate as tax_rate
      FROM products p
      LEFT JOIN taxes t ON p.tax_id = t.id
      ORDER BY p.name
      LIMIT 10
    `);
    
    sampleProducts.rows.forEach(product => {
      if (product.tax_id) {
        console.log(`   - ${product.name}: ${product.tax_name} (${product.tax_rate}%)`);
      } else {
        console.log(`   - ${product.name}: NO TAX ASSIGNED`);
      }
    });
    
    // Check if there are products with 0% tax
    console.log('\n🔍 Checking for products with 0% tax:');
    const productsWithZeroTax = await pool.query(`
      SELECT p.name, p.tax_id, t.rate as tax_rate
      FROM products p
      JOIN taxes t ON p.tax_id = t.id
      WHERE t.rate = 0
      ORDER BY p.name
      LIMIT 10
    `);
    
    if (productsWithZeroTax.rows.length > 0) {
      console.log(`   Found ${productsWithZeroTax.rows.length} products with 0% tax:`);
      productsWithZeroTax.rows.forEach(product => {
        console.log(`     - ${product.name}: ${product.tax_rate}%`);
      });
    } else {
      console.log('   No products with 0% tax found');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the check
checkTaxStatus()
  .then(() => {
    console.log('\n✅ Tax status check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Tax status check failed:', error);
    process.exit(1);
  });
