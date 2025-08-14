const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecommerce_db',
  password: process.env.DB_PASSWORD || '0000',
  port: parseInt(process.env.DB_PORT || '5433'),
});

async function forceUpdateTax() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting FORCE update of ALL products to 10% tax...');
    
    // Start transaction
    await client.query('BEGIN');
    console.log('📋 Transaction started...');
    
    // First, ensure the 10% tax exists
    console.log('🔍 Checking if 10% tax exists...');
    const taxCheck = await client.query(
      'SELECT id FROM taxes WHERE rate = 10 AND is_active = true LIMIT 1'
    );
    
    let defaultTaxId;
    if (taxCheck.rows.length === 0) {
      console.log('❌ 10% tax not found. Creating it first...');
      const createTax = await client.query(`
        INSERT INTO taxes (name, rate, is_active, created_at, updated_at)
        VALUES ('10%', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
      `);
      defaultTaxId = createTax.rows[0].id;
      console.log('✅ 10% tax created with ID:', defaultTaxId);
    } else {
      defaultTaxId = taxCheck.rows[0].id;
      console.log('✅ 10% tax found with ID:', defaultTaxId);
    }
    
    // Check current status
    console.log('\n📊 Current status before update:');
    
    // Count products by tax rate
    const currentTaxDistribution = await client.query(`
      SELECT 
        COALESCE(t.rate, -1) as tax_rate,
        COUNT(p.id) as product_count
      FROM products p
      LEFT JOIN taxes t ON p.tax_id = t.id
      GROUP BY t.rate
      ORDER BY tax_rate
    `);
    
    currentTaxDistribution.rows.forEach(stat => {
      if (stat.tax_rate === -1) {
        console.log(`   - No tax assigned: ${stat.product_count} products`);
      } else {
        console.log(`   - ${stat.tax_rate}% tax: ${stat.product_count} products`);
      }
    });
    
    // Show some examples
    const sampleProducts = await client.query(`
      SELECT p.name, p.tax_id, t.rate as tax_rate
      FROM products p
      LEFT JOIN taxes t ON p.tax_id = t.id
      ORDER BY p.name
      LIMIT 5
    `);
    
    console.log('\n📋 Sample products before update:');
    sampleProducts.rows.forEach(product => {
      if (product.tax_id) {
        console.log(`   - ${product.name}: tax_id=${product.tax_id}, rate=${product.tax_rate}%`);
      } else {
        console.log(`   - ${product.name}: NO TAX ASSIGNED`);
      }
    });
    
    // Update ALL products to use 10% tax (force update)
    console.log('\n🔄 FORCE updating ALL products to use 10% tax...');
    const updateResult = await client.query(`
      UPDATE products 
      SET tax_id = $1, updated_at = CURRENT_TIMESTAMP
    `, [defaultTaxId]);
    
    console.log(`✅ Successfully updated ${updateResult.rowCount} products to 10% tax`);
    
    // Verify the update
    const verifyResult = await client.query(`
      SELECT COUNT(*) as count FROM products WHERE tax_id != $1
    `, [defaultTaxId]);
    
    if (parseInt(verifyResult.rows[0].count) === 0) {
      console.log('✅ Verification successful: All products now have 10% tax!');
    } else {
      console.log('⚠️  Warning: Some products still don\'t have 10% tax');
    }
    
    // Show final status
    console.log('\n📊 Final status after update:');
    const finalDistribution = await client.query(`
      SELECT 
        t.rate as tax_rate,
        COUNT(p.id) as product_count
      FROM products p
      JOIN taxes t ON p.tax_id = t.id
      GROUP BY t.rate
      ORDER BY t.rate
    `);
    
    finalDistribution.rows.forEach(stat => {
      console.log(`   - ${stat.tax_rate}% tax: ${stat.product_count} products`);
    });
    
    // Show sample products after update
    const finalSample = await client.query(`
      SELECT p.name, p.tax_id, t.rate as tax_rate
      FROM products p
      JOIN taxes t ON p.tax_id = t.id
      ORDER BY p.name
      LIMIT 10
    `);
    
    console.log('\n📋 Sample products after update:');
    finalSample.rows.forEach(product => {
      console.log(`   - ${product.name}: tax_id=${product.tax_id}, rate=${product.tax_rate}%`);
    });
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('\n✅ Transaction committed successfully!');
    
    // Double-check after commit
    console.log('\n🔍 Double-checking after commit...');
    const doubleCheck = await client.query(`
      SELECT COUNT(*) as total_products, 
             COUNT(CASE WHEN tax_id = $1 THEN 1 END) as products_with_10_percent
      FROM products
    `, [defaultTaxId]);
    
    const totalProducts = parseInt(doubleCheck.rows[0].total_products);
    const productsWith10Percent = parseInt(doubleCheck.rows[0].products_with_10_percent);
    
    console.log(`   - Total products: ${totalProducts}`);
    console.log(`   - Products with 10% tax: ${productsWith10Percent}`);
    console.log(`   - Success rate: ${((productsWith10Percent / totalProducts) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Force update failed:', error);
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the force update
forceUpdateTax()
  .then(() => {
    console.log('\n🎉 FORCE tax update completed successfully!');
    console.log('\n💡 All products now have 10% tax assigned!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 FORCE tax update failed:', error);
    process.exit(1);
  });
