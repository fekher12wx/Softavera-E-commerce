const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecommerce_db',
  password: process.env.DB_PASSWORD || '0000',
  port: parseInt(process.env.DB_PORT || '5433'),
});

async function updateOldProductsTax() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting update of old products to assign default 10% tax...');
    
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
    
    // Find products without tax
    console.log('🔍 Finding products without tax assignment...');
    const productsWithoutTax = await client.query(`
      SELECT id, name, tax_id FROM products WHERE tax_id IS NULL
    `);
    
    if (productsWithoutTax.rows.length === 0) {
      console.log('✅ All products already have tax assigned!');
      
      // Show current tax distribution
      const currentStats = await client.query(`
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
      
      console.log('\n📊 Current tax distribution:');
      currentStats.rows.forEach(stat => {
        console.log(`   - ${stat.tax_name} (${stat.tax_rate}%): ${stat.product_count} products`);
      });
      
      await client.query('COMMIT');
      return;
    }
    
    console.log(`📦 Found ${productsWithoutTax.rows.length} products without tax:`);
    productsWithoutTax.rows.forEach(product => {
      console.log(`   - ${product.name} (ID: ${product.id}) - Current tax_id: ${product.tax_id}`);
    });
    
    // Update products to use default 10% tax
    console.log('🔄 Updating products to use default 10% tax...');
    const updateResult = await client.query(`
      UPDATE products 
      SET tax_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE tax_id IS NULL
    `, [defaultTaxId]);
    
    console.log(`✅ Successfully updated ${updateResult.rowCount} products with default 10% tax`);
    
    // Verify the update immediately
    const verifyResult = await client.query(`
      SELECT COUNT(*) as count FROM products WHERE tax_id IS NULL
    `);
    
    if (parseInt(verifyResult.rows[0].count) === 0) {
      console.log('✅ Verification successful: All products now have tax assigned!');
    } else {
      console.log('⚠️  Warning: Some products still don\'t have tax assigned');
    }
    
    // Show some examples of updated products
    const updatedProducts = await client.query(`
      SELECT p.name, p.tax_id, t.name as tax_name, t.rate as tax_rate
      FROM products p
      JOIN taxes t ON p.tax_id = t.id
      WHERE t.rate = 10
      ORDER BY p.name
      LIMIT 10
    `);
    
    if (updatedProducts.rows.length > 0) {
      console.log('\n📋 Sample of products now with 10% tax:');
      updatedProducts.rows.forEach(product => {
        console.log(`   - ${product.name}: tax_id=${product.tax_id}, ${product.tax_name} (${product.tax_rate}%)`);
      });
      
      if (updatedProducts.rows.length === 10) {
        console.log('   ... and more products');
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('✅ Transaction committed successfully!');
    
    // Double-check after commit
    console.log('\n🔍 Double-checking after commit...');
    const finalCheck = await client.query(`
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
    
    console.log('\n📊 Final tax distribution:');
    finalCheck.rows.forEach(stat => {
      console.log(`   - ${stat.tax_name} (${stat.tax_rate}%): ${stat.product_count} products`);
    });
    
    // Show specific products that should have been updated
    const specificCheck = await client.query(`
      SELECT p.name, p.tax_id, t.rate as tax_rate
      FROM products p
      LEFT JOIN taxes t ON p.tax_id = t.id
      WHERE p.tax_id IS NOT NULL
      ORDER BY p.name
      LIMIT 15
    `);
    
    console.log('\n📋 Sample of products with their tax assignments:');
    specificCheck.rows.forEach(product => {
      console.log(`   - ${product.name}: tax_id=${product.tax_id}, rate=${product.tax_rate || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Update failed:', error);
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the update
updateOldProductsTax()
  .then(() => {
    console.log('\n🎉 Old products tax update completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. All products now have tax assigned');
    console.log('   2. You can now make tax_id NOT NULL in database if needed');
    console.log('   3. New products will require tax selection');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Old products tax update failed:', error);
    process.exit(1);
  });
