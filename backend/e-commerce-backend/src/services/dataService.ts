import pool from '../../config/database';
import { Product, ProductWithTax, User, Order, UserRole, Review, Tax, PaymentMethod } from '../models';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export interface UserModel extends User {
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export class DatabaseService {
  async updateProductImage(id: string, imageUrl: string): Promise<Product | null> {
    const now = new Date();
    const result = await pool.query(
      `UPDATE products SET image = $1, updated_at = $2 WHERE id = $3 RETURNING *`,
      [imageUrl, now, id]
    );
    return result.rows.length > 0 ? this.mapProductRow(result.rows[0]) : null;
  }
  
  // Auth-related User methods
  async createUserWithPassword(userData: {
    email: string;
    name: string;
    password: string;
    role?: UserRole;
    address?: {
      street: string;
      city: string;
      zipCode: string;
      country: string;
    };
  }): Promise<UserModel> {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const now = new Date();
    
    const query = `
      INSERT INTO users (id, email, name, password, role, street, city, zip_code, country, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      id,
      userData.email,
      userData.name,
      hashedPassword,
      userData.role || UserRole.USER,
      userData.address?.street || null,
      userData.address?.city || null,
      userData.address?.zipCode || null,
      userData.address?.country || null,
      now,
      now
    ];
    
    const result = await pool.query(query, values);
    return this.mapUserModelRow(result.rows[0]);
  }

  async getUserByEmail(email: string): Promise<UserModel | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows.length > 0 ? this.mapUserModelRow(result.rows[0]) : null;
  }

  async getUserModelById(id: string): Promise<UserModel | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows.length > 0 ? this.mapUserModelRow(result.rows[0]) : null;
  }

  async updateUserPassword(id: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      'UPDATE users SET password = $1, updated_at = $2 WHERE id = $3',
      [hashedPassword, new Date(), id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  // Product methods
  async getAllProducts(): Promise<ProductWithTax[]> {
    const result = await pool.query(`
      SELECT 
        p.*,
        t.rate as tax_rate,
        t.name as tax_name
      FROM products p
      LEFT JOIN taxes t ON p.tax_id = t.id
      ORDER BY p.created_at DESC
    `);

    
    const mappedProducts = result.rows.map(this.mapProductRowWithTax);

    
    return mappedProducts;
  }

  // Get products by category
  async getProductsByCategory(category: string): Promise<ProductWithTax[]> {
    const result = await pool.query(`
      SELECT 
        p.*,
        t.rate as tax_rate,
        t.name as tax_name
      FROM products p
      LEFT JOIN taxes t ON p.tax_id = t.id
      WHERE p.category ILIKE $1 
      ORDER BY p.created_at DESC
    `, [`%${category}%`]);
    return result.rows.map(this.mapProductRowWithTax);
  }

  // Get products by category and subcategory
  async getProductsByCategoryAndSubcategory(category: string, subcategory: string): Promise<ProductWithTax[]> {
    const result = await pool.query(`
      SELECT 
        p.*,
        t.rate as tax_rate,
        t.name as tax_name
      FROM products p
      LEFT JOIN taxes t ON p.tax_id = t.id
      WHERE p.category ILIKE $1 AND p.subcategory ILIKE $2 
      ORDER BY p.created_at DESC
    `, [`%${category}%`, `%${subcategory}%`]);
    return result.rows.map(this.mapProductRowWithTax);
  }

  // NEW: Search products by name or description
  async searchProducts(searchTerm: string): Promise<ProductWithTax[]> {
    const result = await pool.query(`
      SELECT 
        p.*,
        t.rate as tax_rate,
        t.name as tax_name
      FROM products p
      LEFT JOIN taxes t ON p.tax_id = t.id
      WHERE p.name ILIKE $1 OR p.description ILIKE $1 
      ORDER BY p.created_at DESC
    `, [`%${searchTerm}%`]);
    return result.rows.map(this.mapProductRowWithTax);
  }

  // NEW: Get all available categories
  async getProductCategories(): Promise<string[]> {
    const result = await pool.query('SELECT DISTINCT category FROM products ORDER BY category');
    return result.rows.map(row => row.category);
  }

  async getProductById(id: string): Promise<Product | null> {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows.length > 0 ? this.mapProductRow(result.rows[0]) : null;
  }

  async getProductByIdWithTax(id: string): Promise<ProductWithTax | null> {
    const result = await pool.query(`
      SELECT 
        p.*,
        t.rate as tax_rate,
        t.name as tax_name
      FROM products p
      LEFT JOIN taxes t ON p.tax_id = t.id
      WHERE p.id = $1
    `, [id]);
    return result.rows.length > 0 ? this.mapProductRowWithTax(result.rows[0]) : null;
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductWithTax> {
    const id = uuidv4();
    const now = new Date();
    const query = `
      INSERT INTO products (id, name, price, description, category, subcategory, image, stock, rating, reviews, tax_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const values = [
      id,
      product.name,
      product.price,
      product.description,
      product.category,
      product.subcategory || null,
      product.image,
      product.stock,
      product.rating,
      product.reviews,
      product.taxId || null,
      now,
      now
    ];
    
    const result = await pool.query(query, values);
    
    // Get the created product with tax information
    const createdProduct = await this.getProductByIdWithTax(id);
    return createdProduct!;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<ProductWithTax | null> {
    // Filter out computed fields that shouldn't be updated in the database
    const { taxRate, taxName, ...databaseUpdates } = updates as any;
    
    const updateFields = { ...databaseUpdates, updatedAt: new Date() };
    
    // Log what's being updated for debugging

    
    const setClause = Object.keys(updateFields)
      .map((key, index) => `${this.camelToSnake(key)} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(updateFields)];
    const query = `UPDATE products SET ${setClause} WHERE id = $1 RETURNING *`;
  
    const result = await pool.query(query, values);
    
    if (result.rows.length > 0) {
      // Get the updated product with tax information
      const updatedProduct = await this.getProductByIdWithTax(id);
      return updatedProduct;
    }
    
    return null;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // User methods (without password)
  async getAllUsers(): Promise<User[]> {
    const result = await pool.query('SELECT id, email, name, role, street, city, zip_code, country, created_at, updated_at FROM users ORDER BY created_at DESC');
    return result.rows.map(this.mapUserRow);
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await pool.query('SELECT id, email, name, role, street, city, zip_code, country, created_at, updated_at FROM users WHERE id = $1', [id]);
    return result.rows.length > 0 ? this.mapUserRow(result.rows[0]) : null;
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = uuidv4();
    const now = new Date();
    const query = `
      INSERT INTO users (id, email, name, role, street, city, zip_code, country, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, email, name, role, street, city, zip_code, country, created_at, updated_at
    `;
    const values = [
      id,
      user.email,
      user.name,
      user.role || UserRole.USER,
      user.address?.street || null,
      user.address?.city || null,
      user.address?.zipCode || null,
      user.address?.country || null,
      now,
      now
    ];
    
    const result = await pool.query(query, values);
    return this.mapUserRow(result.rows[0]);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const { address, ...userUpdates } = updates;
      
      // Build the SET clause and values array
      const updateFields: any = { ...userUpdates };
      const values: any[] = [];
      const setClauses: string[] = [];
      let paramCount = 1;

      // Add address fields if present
      if (address) {
        updateFields.street = address.street;
        updateFields.city = address.city;
        updateFields.zip_code = address.zipCode;
        updateFields.country = address.country;
      }

      // Build the SET clause
      for (const [key, value] of Object.entries(updateFields)) {
        if (value !== undefined) {
          setClauses.push(`${this.camelToSnake(key)} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      // Add updated_at
      setClauses.push(`updated_at = $${paramCount}`);
      values.push(new Date());

      // Add id as the last parameter
      values.push(id);

      const query = `
        UPDATE users 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramCount + 1}
        RETURNING id, email, name, role, street, city, zip_code, country, created_at, updated_at
      `;

      

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      const updatedUser = this.mapUserRow(result.rows[0]);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string, forceDelete: boolean = false): Promise<{ success: boolean; dependencies?: { orders?: any[]; reviews?: any[] }; userExists?: boolean }> {
    try {
      
      // First check if user exists
      const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
      if (userExists.rows.length === 0) {
        return { success: false, userExists: false };
      }
      
      // Check for dependencies
      const ordersResult = await pool.query('SELECT id FROM orders WHERE user_id = $1', [id]);
      const reviewsResult = await pool.query('SELECT id FROM reviews WHERE user_id = $1', [id]);
      
      if (!forceDelete && (ordersResult.rows.length > 0 || reviewsResult.rows.length > 0)) {
        return {
          success: false,
          dependencies: {
            orders: ordersResult.rows,
            reviews: reviewsResult.rows
          },
          userExists: true
        };
      }
      
      // If force delete is enabled or no dependencies, proceed with deletion
      if (forceDelete) {
        // For force delete, first delete dependencies
        if (ordersResult.rows.length > 0) {
          await pool.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)', [id]);
          await pool.query('DELETE FROM orders WHERE user_id = $1', [id]);
        }
        if (reviewsResult.rows.length > 0) {
          await pool.query('DELETE FROM reviews WHERE user_id = $1', [id]);
        }
      }
      
      // Delete the user
      const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
      return { success: (result.rowCount ?? 0) > 0, userExists: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, userExists: false };
    }
  }

  // Order methods
  async getAllOrders(): Promise<Order[]> {
    const result = await pool.query(`
      SELECT o.*, 
             oi.id as item_id, oi.quantity, oi.price as item_price,
             p.id as product_id, p.name as product_name, p.description as product_description,
             p.category as product_category, p.image as product_image, p.stock as product_stock,
             p.rating as product_rating, p.reviews as product_reviews
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      ORDER BY o.created_at DESC
    `);
    
    return this.groupOrdersWithItems(result.rows);
  }

  async getOrderById(id: string): Promise<Order | null> {
    const result = await pool.query(`
      SELECT o.*, 
             oi.id as item_id, oi.quantity, oi.price as item_price,
             p.id as product_id, p.name as product_name, p.description as product_description,
             p.category as product_category, p.image as product_image, p.stock as product_stock,
             p.rating as product_rating, p.reviews as product_reviews
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1
    `, [id]);
    
    if (result.rows.length === 0) return null;
    return this.groupOrdersWithItems(result.rows)[0];
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    const result = await pool.query(`
      SELECT o.*, 
             oi.id as item_id, oi.quantity, oi.price as item_price,
             p.id as product_id, p.name as product_name, p.description as product_description,
             p.category as product_category, p.image as product_image, p.stock as product_stock,
             p.rating as product_rating, p.reviews as product_reviews
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `, [userId]);
    
    return this.groupOrdersWithItems(result.rows);
  }

  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const orderId = uuidv4();
      const now = new Date();
      
      // Insert order
      const orderQuery = `
        INSERT INTO orders (id, user_id, total, status, shipping_street, shipping_city, 
                           shipping_zip_code, shipping_country, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      const orderValues = [
        orderId,
        order.userId ?? null, // Insert NULL for guest orders
        order.total,
        order.status,
        order.shippingAddress.street,
        order.shippingAddress.city,
        order.shippingAddress.zipCode,
        order.shippingAddress.country,
        now,
        now
      ];
      
      const orderResult = await client.query(orderQuery, orderValues);
      
      // Insert order items
      for (const item of order.items) {
        // Defensive: ensure price is never null
        const price = item.product?.price;
        if (price === undefined) throw new Error(`Order item price is missing for product ${item.product?.id}`);
        const itemQuery = `
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES ($1, $2, $3, $4)
        `;
        await client.query(itemQuery, [orderId, item.product.id, item.quantity, price]);
        // Decrement product stock
        const updateStockQuery = `
          UPDATE products SET stock = stock - $1 WHERE id = $2
        `;
        await client.query(updateStockQuery, [item.quantity, item.product.id]);
      }
      
      await client.query('COMMIT');
      
      // Return the created order with items
      return await this.getOrderById(orderId) as Order;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *',
      [status, new Date(), id]
    );
    
    if (result.rows.length === 0) return null;
    return await this.getOrderById(id);
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Build dynamic SET clause
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.total !== undefined) {
        setClauses.push(`total = $${paramCount++}`);
        values.push(updates.total);
      }
      if (updates.status !== undefined) {
        setClauses.push(`status = $${paramCount++}`);
        values.push(updates.status);
      }
      if (updates.shippingAddress) {
        if (updates.shippingAddress.street !== undefined) {
          setClauses.push(`shipping_street = $${paramCount++}`);
          values.push(updates.shippingAddress.street);
        }
        if (updates.shippingAddress.city !== undefined) {
          setClauses.push(`shipping_city = $${paramCount++}`);
          values.push(updates.shippingAddress.city);
        }
        if (updates.shippingAddress.zipCode !== undefined) {
          setClauses.push(`shipping_zip_code = $${paramCount++}`);
          values.push(updates.shippingAddress.zipCode);
        }
        if (updates.shippingAddress.country !== undefined) {
          setClauses.push(`shipping_country = $${paramCount++}`);
          values.push(updates.shippingAddress.country);
        }
      }
      setClauses.push(`updated_at = $${paramCount++}`);
      values.push(new Date());
      values.push(id);

      const query = `
        UPDATE orders
        SET ${setClauses.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      await client.query(query, values);

      // Optionally update order items if provided
      if (updates.items) {
        await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);
        for (const item of updates.items) {
          await client.query(
            'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
            [id, item.product.id, item.quantity, item.product.price]
          );
        }
      }
      await client.query('COMMIT');
      return await this.getOrderById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteOrder(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // Review methods
  async getReviewsByProductId(productId: string): Promise<Review[]> {
    const result = await pool.query(
      'SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC',
      [productId]
    );
    return result.rows.map(this.mapReviewRow);
  }

  async createReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<Review> {
    const id = uuidv4();
    const now = new Date();
    const query = `
      INSERT INTO reviews (id, product_id, user_id, user_name, rating, comment, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      id,
      review.productId,
      review.userId,
      review.userName,
      review.rating,
      review.comment,
      now,
      now
    ];
    
    const result = await pool.query(query, values);
    return this.mapReviewRow(result.rows[0]);
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<Review | null> {
    const updateFields = { ...updates, updatedAt: new Date() };
    const setClause = Object.keys(updateFields)
      .map((key, index) => `${this.camelToSnake(key)} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(updateFields)];
    const query = `UPDATE reviews SET ${setClause} WHERE id = $1 RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows.length > 0 ? this.mapReviewRow(result.rows[0]) : null;
  }

  async deleteReview(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getReviewById(id: string): Promise<Review | null> {
    const result = await pool.query('SELECT * FROM reviews WHERE id = $1', [id]);
    return result.rows.length > 0 ? this.mapReviewRow(result.rows[0]) : null;
  }

  async updateProductRating(productId: string): Promise<void> {
    // Calculate average rating and review count
    const result = await pool.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE product_id = $1',
      [productId]
    );
    
    const avgRating = result.rows[0].avg_rating || 0;
    const reviewCount = result.rows[0].review_count || 0;
    
    // Update product with new rating and review count
    await pool.query(
      'UPDATE products SET rating = $1, reviews = $2, updated_at = $3 WHERE id = $4',
      [avgRating, reviewCount, new Date(), productId]
    );
  }

  // Settings methods for payment method
  async getActivePaymentMethod(): Promise<string> {
    const result = await pool.query('SELECT value FROM settings WHERE key = $1', ['active_payment_method']);
    if (result.rows.length === 0) {
      // Default to 'adyen' if not set
      return 'adyen';
    }
    return result.rows[0].value;
  }

  async setActivePaymentMethod(method: string): Promise<void> {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      ['active_payment_method', method]
    );
  }

  // Settings methods for currency
  async getCurrency(): Promise<string> {
    const result = await pool.query('SELECT value FROM settings WHERE key = $1', ['currency']);
    if (result.rows.length === 0) {
      // Default to 'USD' if not set
      return 'USD';
    }
    return result.rows[0].value;
  }

  async setCurrency(currency: string): Promise<void> {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      ['currency', currency]
    );
  }

  // Multi-currency management methods
  async getCurrencies(): Promise<any[]> {
    try {
      const result = await pool.query(
        'SELECT id, name, code, symbol, is_active, exchange_rate, is_base, created_at, updated_at FROM currencies ORDER BY is_base DESC, name ASC'
      );
      return result.rows.map(this.mapCurrencyRow);
    } catch (error) {
      console.error('Error getting currencies:', error);
      return [];
    }
  }

  async getBaseCurrency(): Promise<any> {
    try {
      const result = await pool.query('SELECT * FROM currencies WHERE is_base = true LIMIT 1');
      if (result.rows.length === 0) {
        return null; // No base currency set
      }
      return this.mapCurrencyRow(result.rows[0]);
    } catch (error) {
      console.error('Error getting base currency:', error);
      throw new Error('Failed to get base currency');
    }
  }

  async addCurrency(currencyData: { name: string; code: string; symbol: string; isActive?: boolean; exchangeRate?: number; isBase?: boolean }): Promise<any> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      // If this is a base currency, ensure no other base currency exists
      if (currencyData.isBase) {
        const baseUpdateResult = await pool.query('UPDATE currencies SET is_base = false WHERE is_base = true');
      }

      // If this currency is being set as active, deactivate all others first
      if (currencyData.isActive) {
        await pool.query('UPDATE currencies SET is_active = false');
      }
      
      const result = await pool.query(
        `INSERT INTO currencies (id, name, code, symbol, is_active, exchange_rate, is_base, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING id, name, code, symbol, is_active, exchange_rate, is_base, created_at, updated_at`,
        [
          id,
          currencyData.name,
          currencyData.code.toUpperCase(),
          currencyData.symbol,
          currencyData.isActive !== undefined ? currencyData.isActive : true,
          currencyData.exchangeRate || 1,
          currencyData.isBase || false,
          now,
          now
        ]
      );
      
      return this.mapCurrencyRow(result.rows[0]);
    } catch (error) {
      console.error('Error adding currency:', error);
      throw new Error('Failed to add currency');
    }
  }

  async updateCurrency(id: string, updateData: any): Promise<any> {
    try {
      const now = new Date();
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      // If this is being set as base currency, ensure no other base currency exists
      if (updateData.isBase) {
        const baseUpdateResult = await pool.query('UPDATE currencies SET is_base = false WHERE is_base = true');
      }

      // If this currency is being set as active, deactivate all others first
      if (updateData.isActive) {
        await pool.query('UPDATE currencies SET is_active = false WHERE id != $1', [id]);
      }

      // Build dynamic update query
      if (updateData.name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        values.push(updateData.name);
      }
      if (updateData.code !== undefined) {
        fields.push(`code = $${paramCount++}`);
        values.push(updateData.code.toUpperCase());
      }
      if (updateData.symbol !== undefined) {
        fields.push(`symbol = $${paramCount++}`);
        values.push(updateData.symbol);
      }
      if (updateData.isActive !== undefined) {
        fields.push(`is_active = $${paramCount++}`);
        values.push(updateData.isActive);
      }
      if (updateData.exchangeRate !== undefined) {
        fields.push(`exchange_rate = $${paramCount++}`);
        values.push(updateData.exchangeRate);
      }
      if (updateData.isBase !== undefined) {
        fields.push(`is_base = $${paramCount++}`);
        values.push(updateData.isBase);
      }

      fields.push(`updated_at = $${paramCount++}`);
      values.push(now);
      values.push(id);

      const query = `
        UPDATE currencies 
        SET ${fields.join(', ')} 
        WHERE id = $${paramCount} 
        RETURNING id, name, code, symbol, is_active, exchange_rate, is_base, created_at, updated_at
      `;

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Currency not found');
      }
      
      return this.mapCurrencyRow(result.rows[0]);
    } catch (error) {
      console.error('Error updating currency:', error);
      throw new Error('Failed to update currency');
    }
  }

  async deleteCurrency(id: string): Promise<void> {
    try {
      const result = await pool.query('DELETE FROM currencies WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        throw new Error('Currency not found');
      }
    } catch (error) {
      console.error('Error deleting currency:', error);
      throw new Error('Failed to delete currency');
    }
  }

  async toggleCurrencyStatus(id: string): Promise<any> {
    try {
      // Start a transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // First, get the current status and base status of the currency
        const currentResult = await client.query(
          'SELECT is_active, is_base FROM currencies WHERE id = $1',
          [id]
        );
        
        if (currentResult.rows.length === 0) {
          throw new Error('Currency not found');
        }
        
        const currentStatus = currentResult.rows[0].is_active;
        const isBase = currentResult.rows[0].is_base;
        const newStatus = !currentStatus;
        
        // If we're deactivating a base currency, we need to handle it carefully
        if (isBase && !newStatus) {
          const activeCurrenciesResult = await client.query(
            'SELECT COUNT(*) FROM currencies WHERE is_active = true AND id != $1',
            [id]
          );
          
          const activeCount = parseInt(activeCurrenciesResult.rows[0].count);
          
          if (activeCount === 0) {
            // If this is the only active currency, we can't deactivate it
            throw new Error('Cannot deactivate the only active currency. Please activate another currency first or set a different currency as base.');
          }
          
          // Automatically set the first active currency as the new base currency
          const newBaseCurrencyResult = await client.query(
            'SELECT id FROM currencies WHERE is_active = true AND id != $1 ORDER BY created_at ASC LIMIT 1',
            [id]
          );
          
          if (newBaseCurrencyResult.rows.length > 0) {
            await client.query(
              'UPDATE currencies SET is_base = true, updated_at = $1 WHERE id = $2',
              [new Date(), newBaseCurrencyResult.rows[0].id]
            );
          }
        }
        
        // If we're activating a currency, deactivate all others first
        if (newStatus) {
          await client.query(
            'UPDATE currencies SET is_active = false, updated_at = $1 WHERE id != $2',
            [new Date(), id]
          );
        }
        
        // Update the specific currency
        const result = await client.query(
          'UPDATE currencies SET is_active = $1, updated_at = $2 WHERE id = $3 RETURNING *',
          [newStatus, new Date(), id]
        );
        
        if (result.rows.length === 0) {
          throw new Error('Currency not found');
        }
        
        await client.query('COMMIT');
        return this.mapCurrencyRow(result.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error toggling currency status:', error);
      throw new Error('Failed to toggle currency status');
    }
  }

  async setBaseCurrency(id: string): Promise<any> {
    try {
      // First, check if the currency exists and is active
      const currencyResult = await pool.query(
        'SELECT id, is_active FROM currencies WHERE id = $1',
        [id]
      );
      
      if (currencyResult.rows.length === 0) {
        throw new Error('Currency not found');
      }
      
      // Start a transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Set all currencies as non-base and non-active first
        await client.query('UPDATE currencies SET is_base = false, is_active = false, updated_at = $1', [new Date()]);
        
        // Set the specified currency as base AND active
        const result = await client.query(
          'UPDATE currencies SET is_base = true, is_active = true, updated_at = $1 WHERE id = $2 RETURNING *',
          [new Date(), id]
        );
        
        if (result.rows.length === 0) {
          throw new Error('Failed to update currency');
        }
        
        await client.query('COMMIT');
        return this.mapCurrencyRow(result.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error setting base currency:', error);
      throw new Error('Failed to set base currency');
    }
  }

  private mapCurrencyRow(row: any): any {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      symbol: row.symbol,
      isActive: row.is_active,
      exchangeRate: parseFloat(row.exchange_rate),
      isBase: row.is_base,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Settings methods for tax (percentage as string, e.g., '4')
  async getTax(): Promise<string> {
    const result = await pool.query('SELECT value FROM settings WHERE key = $1', ['tax']);
    if (result.rows.length === 0) {
      // Default to '4' if not set
      return '4';
    }
    return result.rows[0].value;
  }

  async setTax(tax: string): Promise<void> {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      ['tax', tax]
    );
  }

  // Tax Management - New Tax Table System
  async getTaxes(): Promise<Tax[]> {
    try {
      const result = await pool.query(
        'SELECT id, name, rate, description, is_active, created_at, updated_at FROM taxes ORDER BY name'
      );
      return result.rows.map(this.mapTaxRow);
    } catch (error) {
      console.error('Error getting taxes:', error);
      return [];
    }
  }

  async getTaxById(id: string): Promise<Tax | null> {
    try {
      const result = await pool.query(
        'SELECT id, name, rate, description, is_active, created_at, updated_at FROM taxes WHERE id = $1',
        [id]
      );
      return result.rows[0] ? this.mapTaxRow(result.rows[0]) : null;
    } catch (error) {
      console.error('Error fetching tax by ID:', error);
      return null;
    }
  }

  async getTaxByRate(rate: number): Promise<Tax | null> {
    try {
      const result = await pool.query(
        'SELECT id, name, rate, is_active, created_at, updated_at FROM taxes WHERE rate = $1',
        [rate]
      );
      return result.rows[0] ? this.mapTaxRow(result.rows[0]) : null;
    } catch (error) {
      console.error('Error fetching tax by rate:', error);
      return null;
    }
  }

  async getProductsByTaxId(taxId: string): Promise<Product[]> {
    try {
      const result = await pool.query(
        'SELECT id, name, price, description, category, subcategory, image, stock, rating, reviews, tax_id, created_at, updated_at FROM products WHERE tax_id = $1',
        [taxId]
      );
      return result.rows.map(this.mapProductRow);
    } catch (error) {
      console.error('Error fetching products by tax ID:', error);
      return [];
    }
  }

  async createTax(tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tax> {
    try {
      const result = await pool.query(
        'INSERT INTO taxes (name, rate, is_active) VALUES ($1, $2, $3) RETURNING id, name, rate, is_active, created_at, updated_at',
        [tax.name, tax.rate, tax.isActive]
      );
      return this.mapTaxRow(result.rows[0]);
    } catch (error) {
      console.error('Error creating tax:', error);
      throw error;
    }
  }

  async updateTax(id: string, tax: Partial<Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Tax | null> {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (tax.name !== undefined) {
        fields.push(`name = $${paramCount}`);
        values.push(tax.name);
        paramCount++;
      }
      if (tax.rate !== undefined) {
        fields.push(`rate = $${paramCount}`);
        values.push(tax.rate);
        paramCount++;
      }
      if (tax.isActive !== undefined) {
        fields.push(`is_active = $${paramCount}`);
        values.push(tax.isActive);
        paramCount++;
      }

      if (fields.length === 0) {
        return this.getTaxById(id);
      }

      values.push(id);
      const result = await pool.query(
        `UPDATE taxes SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING id, name, rate, is_active, created_at, updated_at`,
        values
      );

      return result.rows[0] ? this.mapTaxRow(result.rows[0]) : null;
    } catch (error) {
      console.error('Error updating tax:', error);
      throw error;
    }
  }

  async deleteTax(id: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM taxes WHERE id = $1 RETURNING id',
        [id]
      );
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting tax:', error);
      throw error;
    }
  }

  async getActiveTaxes(): Promise<Tax[]> {
    try {
      const result = await pool.query(
        'SELECT id, name, rate, is_active, created_at, updated_at FROM taxes WHERE is_active = true ORDER BY name'
      );
      return result.rows.map(this.mapTaxRow);
    } catch (error) {
      console.error('Error getting active taxes:', error);
      return [];
    }
  }

  // Payment Method Management
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const result = await pool.query(
        'SELECT id, name, code, description, is_active, config, created_at, updated_at FROM payment_methods ORDER BY name'
      );
      return result.rows.map(this.mapPaymentMethodRow);
    } catch (error) {
      console.error('Error getting payment methods:', error);
      return [];
    }
  }

  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const result = await pool.query(
        'SELECT id, name, code, description, is_active, config, created_at, updated_at FROM payment_methods WHERE is_active = true ORDER BY name'
      );
      return result.rows.map(this.mapPaymentMethodRow);
    } catch (error) {
      console.error('Error getting active payment methods:', error);
      return [];
    }
  }

  async getPaymentMethodById(id: string): Promise<PaymentMethod | null> {
    try {
      const result = await pool.query(
        'SELECT id, name, code, description, is_active, config, created_at, updated_at FROM payment_methods WHERE id = $1',
        [id]
      );
      return result.rows[0] ? this.mapPaymentMethodRow(result.rows[0]) : null;
    } catch (error) {
      console.error('Error fetching payment method by ID:', error);
      return null;
    }
  }

  async getPaymentMethodByCode(code: string): Promise<PaymentMethod | null> {
    try {
      const result = await pool.query(
        'SELECT id, name, code, description, is_active, config, created_at, updated_at FROM payment_methods WHERE code = $1',
        [code]
      );
      return result.rows[0] ? this.mapPaymentMethodRow(result.rows[0]) : null;
    } catch (error) {
      console.error('Error fetching payment method by code:', error);
      return null;
    }
  }

  async createPaymentMethod(paymentMethod: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentMethod> {
    try {

      
      const query = `
        INSERT INTO payment_methods (name, code, description, is_active, config) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING id, name, code, description, is_active, config, created_at, updated_at
      `;
      
      const values = [
        paymentMethod.name, 
        paymentMethod.code, 
        paymentMethod.description, 
        paymentMethod.isActive, 
        JSON.stringify(paymentMethod.config)
      ];
      
  
      
      const result = await pool.query(query, values);
      
      
      if (!result.rows[0]) {
        throw new Error('No rows returned after insert');
      }
      
      const createdPaymentMethod = this.mapPaymentMethodRow(result.rows[0]);
      
      return createdPaymentMethod;
    } catch (error: any) {
      console.error('=== DataService: Error Creating Payment Method ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async updatePaymentMethod(id: string, paymentMethod: Partial<Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PaymentMethod | null> {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (paymentMethod.name !== undefined) {
        fields.push(`name = $${paramCount}`);
        values.push(paymentMethod.name);
        paramCount++;
      }
      if (paymentMethod.code !== undefined) {
        fields.push(`code = $${paramCount}`);
        values.push(paymentMethod.code);
        paramCount++;
      }
      if (paymentMethod.description !== undefined) {
        fields.push(`description = $${paramCount}`);
        values.push(paymentMethod.description);
        paramCount++;
      }
      if (paymentMethod.isActive !== undefined) {
        fields.push(`is_active = $${paramCount}`);
        values.push(paymentMethod.isActive);
        paramCount++;
      }
      if (paymentMethod.config !== undefined) {
        fields.push(`config = $${paramCount}`);
        values.push(JSON.stringify(paymentMethod.config));
        paramCount++;
      }

      if (fields.length === 0) {
        return this.getPaymentMethodById(id);
      }

      values.push(id);
      const result = await pool.query(
        `UPDATE payment_methods SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING id, name, code, description, is_active, config, created_at, updated_at`,
        values
      );

      return result.rows[0] ? this.mapPaymentMethodRow(result.rows[0]) : null;
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw error;
    }
  }

  async deletePaymentMethod(id: string): Promise<boolean> {
    try {
      const result = await pool.query('DELETE FROM payment_methods WHERE id = $1 RETURNING id', [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  }

  async deactivateAllOtherPaymentMethods(excludeId: string): Promise<void> {
    try {
      
      // First, let's check what payment methods exist
      const checkResult = await pool.query(
        'SELECT id, name, is_active FROM payment_methods WHERE id != $1',
        [excludeId]
      );
      
      if (checkResult.rowCount === 0) {
        return;
      }
      
      // Now deactivate them
      const result = await pool.query(
        'UPDATE payment_methods SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id != $1',
        [excludeId]
      );
      
    } catch (error: any) {
      console.error('Error deactivating other payment methods:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      throw error;
    }
  }

  // Helper method to map tax row
  private mapTaxRow(row: any): Tax {
    return {
      id: row.id,
      name: row.name,
      rate: parseFloat(row.rate),
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Helper method to map payment method row
  private mapPaymentMethodRow(row: any): PaymentMethod {
    // Handle config field safely - it could be JSONB object, string, or null
    let config = {};
    if (row.config) {
      if (typeof row.config === 'string') {
        try {
          config = JSON.parse(row.config);
        } catch (e) {
          console.warn('Failed to parse config string, using empty object:', e);
          config = {};
        }
      } else if (typeof row.config === 'object') {
        config = row.config;
      }
    }

    return {
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      isActive: row.is_active,
      config: config,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Helper methods
  private mapProductRow(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      price: parseFloat(row.price),
      description: row.description,
      category: row.category,
      subcategory: row.subcategory,
      image: row.image,
      stock: row.stock,
      rating: parseFloat(row.rating),
      reviews: row.reviews,
      taxId: row.tax_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapProductRowWithTax(row: any): ProductWithTax {
    return {
      id: row.id,
      name: row.name,
      price: parseFloat(row.price),
      description: row.description,
      category: row.category,
      subcategory: row.subcategory,
      image: row.image,
      stock: row.stock,
      rating: parseFloat(row.rating),
      reviews: row.reviews,
      taxId: row.tax_id,
      taxRate: row.tax_rate ? parseFloat(row.tax_rate) : undefined,
      taxName: row.tax_name || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapReviewRow(row: any): Review {
    return {
      id: row.id,
      productId: row.product_id,
      userId: row.user_id,
      userName: row.user_name,
      rating: parseFloat(row.rating),
      comment: row.comment,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapUserRow(row: any): User {
    const user: User = {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    if (row.street || row.city || row.zip_code || row.country) {
      user.address = {
        street: row.street || '',
        city: row.city || '',
        zipCode: row.zip_code || '',
        country: row.country || ''
      };
    }

    return user;
  }

  private mapUserModelRow(row: any): UserModel {
    const user: UserModel = {
      id: row.id,
      email: row.email,
      name: row.name,
      password: row.password,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    if (row.street || row.city || row.zip_code || row.country) {
      user.address = {
        street: row.street || '',
        city: row.city || '',
        zipCode: row.zip_code || '',
        country: row.country || ''
      };
    }

    return user;
  }

  private groupOrdersWithItems(rows: any[]): Order[] {
    const ordersMap = new Map<string, Order>();

    for (const row of rows) {
      if (!ordersMap.has(row.id)) {
        ordersMap.set(row.id, {
          id: row.id,
          userId: row.user_id,
          items: [],
          total: parseFloat(row.total),
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          shippingAddress: {
            street: row.shipping_street,
            city: row.shipping_city,
            zipCode: row.shipping_zip_code,
            country: row.shipping_country
          }
        });
      }

      if (row.item_id) {
        const order = ordersMap.get(row.id)!;
        order.items.push({
          product: {
            id: row.product_id,
            name: row.product_name,
            price: parseFloat(row.item_price),
            description: row.product_description,
            category: row.product_category,
            image: row.product_image,
            stock: row.product_stock,
            rating: parseFloat(row.product_rating),
            reviews: row.product_reviews
          },
          quantity: row.quantity
        });
      }
    }

    return Array.from(ordersMap.values());
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Invoice Settings methods
  async getInvoiceSettings(): Promise<any> {
    try {
      // Check if invoice_settings table exists, if not return defaults
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'invoice_settings'
        );
      `);

      if (!tableExists.rows[0].exists) {
        // Create table if it doesn't exist
        await pool.query(`
          CREATE TABLE IF NOT EXISTS invoice_settings (
            id SERIAL PRIMARY KEY,
            company_name VARCHAR(255) DEFAULT 'E-Shop',
            company_tagline VARCHAR(255) DEFAULT 'Your Trusted Online Store',
            company_email VARCHAR(255) DEFAULT 'contact@e-shop.com',
            company_website VARCHAR(255) DEFAULT 'e-shop.com',
            company_address VARCHAR(255) DEFAULT '123 Business Street',
            company_city VARCHAR(255) DEFAULT 'Tunis',
            company_country VARCHAR(255) DEFAULT 'Tunisia',
            company_phone VARCHAR(255) DEFAULT '+216 71 234 567',
            company_quote TEXT DEFAULT '',
            payment_text VARCHAR(255) DEFAULT 'Payment to E-Shop',
            logo_url TEXT DEFAULT '',
            primary_color VARCHAR(7) DEFAULT '#8B5CF6',
            secondary_color VARCHAR(7) DEFAULT '#EC4899',
            accent_color VARCHAR(7) DEFAULT '#3B82F6',
            fiscal_number VARCHAR(255) DEFAULT '',
            tax_registration_number VARCHAR(255) DEFAULT '',
            siret_number VARCHAR(255) DEFAULT '',
            fiscal_information TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Insert default settings
        await pool.query(`
          INSERT INTO invoice_settings DEFAULT VALUES;
        `);
      }

      const result = await pool.query('SELECT * FROM invoice_settings ORDER BY id DESC LIMIT 1');
      
      if (result.rows.length === 0) {
        // Insert default settings if none exist
        await pool.query(`
          INSERT INTO invoice_settings DEFAULT VALUES;
        `);
        const defaultResult = await pool.query('SELECT * FROM invoice_settings ORDER BY id DESC LIMIT 1');
        return this.mapInvoiceSettingsRow(defaultResult.rows[0]);
      }

      return this.mapInvoiceSettingsRow(result.rows[0]);
    } catch (error) {
      console.error('Error getting invoice settings:', error);
      // Return default settings on error
      return {
        companyName: 'E-Shop',
        companyTagline: 'Your Trusted Online Store',
        companyEmail: 'contact@e-shop.com',
        companyWebsite: 'e-shop.com',
        companyAddress: '123 Business Street',
        companyCity: 'Tunis',
        companyCountry: 'Tunisia',
        paymentText: 'Payment to E-Shop',
        logoUrl: '',
        primaryColor: '#8B5CF6',
        secondaryColor: '#EC4899',
        accentColor: '#3B82F6',
        fiscalNumber: '',
        taxRegistrationNumber: '',
        siretNumber: '',
        fiscalField1Label: 'champ 1',
        fiscalField1Value: '',
        fiscalField2Label: 'champ 2',
        fiscalField2Value: '',
        fiscalField3Label: 'champ 3',
        fiscalField3Value: ''
      };
    }
  }

  async updateInvoiceSettings(settings: any): Promise<any> {
    try {
      // First ensure table exists and has at least one record
      const existingSettings = await this.getInvoiceSettings();
      
      const now = new Date();
      let result;
      
      // Check if we have an existing record to update
      const checkResult = await pool.query('SELECT id FROM invoice_settings ORDER BY id DESC LIMIT 1');
      
      if (checkResult.rows.length > 0) {
        // Update existing record
        result = await pool.query(`
          UPDATE invoice_settings 
          SET 
            company_name = $1,
            company_tagline = $2,
            company_email = $3,
            company_website = $4,
            company_address = $5,
            company_city = $6,
            company_country = $7,
            company_phone = $8,
            company_quote = $9,
            payment_text = $10,
            logo_url = $11,
            primary_color = $12,
            secondary_color = $13,
            accent_color = $14,
            fiscal_number = $15,
            tax_registration_number = $16,
            siret_number = $17,
            fiscal_information = $18,
            updated_at = $19
          WHERE id = $20
          RETURNING *
        `, [
          settings.companyName || 'E-Shop',
          settings.companyTagline || 'Your Trusted Online Store',
          settings.companyEmail || 'contact@e-shop.com',
          settings.companyWebsite || 'e-shop.com',
          settings.companyAddress || '123 Business Street',
          settings.companyCity || 'Tunis',
          settings.companyCountry || 'Tunisia',
          settings.companyPhone || '+216 71 234 567',
          settings.companyQuote || '',
          settings.paymentText || 'Payment to E-Shop',
          settings.logoUrl || '',
          settings.primaryColor || '#8B5CF6',
          settings.secondaryColor || '#EC4899',
          settings.accentColor || '#3B82F6',
          settings.fiscalNumber || '',
          settings.taxRegistrationNumber || '',
          settings.siretNumber || '',
          settings.fiscalInformation || '',
          now,
          checkResult.rows[0].id
        ]);
      } else {
        // Insert new record if none exists
        result = await pool.query(`
          INSERT INTO invoice_settings (
            company_name, company_tagline, company_email, company_website,
            company_address, company_city, company_country, company_phone, company_quote,
            payment_text, logo_url, primary_color, secondary_color, accent_color,
            fiscal_number, tax_registration_number, siret_number,
            fiscal_information,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          RETURNING *
        `, [
          settings.companyName || 'E-Shop',
          settings.companyTagline || 'Your Trusted Online Store',
          settings.companyEmail || 'contact@e-shop.com',
          settings.companyWebsite || 'e-shop.com',
          settings.companyAddress || '123 Business Street',
          settings.companyCity || 'Tunis',
          settings.companyCountry || 'Tunisia',
          settings.companyPhone || '+216 71 234 567',
          settings.companyQuote || '',
          settings.paymentText || 'Payment to E-Shop',
          settings.logoUrl || '',
          settings.primaryColor || '#8B5CF6',
          settings.secondaryColor || '#EC4899',
          settings.accentColor || '#3B82F6',
          settings.fiscalNumber || '',
          settings.taxRegistrationNumber || '',
          settings.siretNumber || '',
          settings.fiscalInformation || '',
          now,
          now
        ]);
      }

      return this.mapInvoiceSettingsRow(result.rows[0]);
    } catch (error) {
      console.error('Error updating invoice settings:', error);
      throw error;
    }
  }

  private mapInvoiceSettingsRow(row: any): any {
    return {
      companyName: row.company_name,
      companyTagline: row.company_tagline,
      companyEmail: row.company_email,
      companyWebsite: row.company_website,
      companyAddress: row.company_address,
      companyCity: row.company_city,
      companyCountry: row.company_country,
      companyPhone: row.company_phone || '+216 71 234 567',
      companyQuote: row.company_quote || '',
      paymentText: row.payment_text,
      logoUrl: row.logo_url,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      accentColor: row.accent_color,
      fiscalNumber: row.fiscal_number,
      taxRegistrationNumber: row.tax_registration_number,
      siretNumber: row.siret_number,
      fiscalInformation: row.fiscal_information || ''
    };
  }
}

export default new DatabaseService();