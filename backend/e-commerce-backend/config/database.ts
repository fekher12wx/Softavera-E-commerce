import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create a singleton pool instance
let pool: Pool | null = null;

const createPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433'),
      database: process.env.DB_NAME || 'ecommerce_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '0000',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      // Add SSL configuration for production
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Test the connection
    pool.on('connect', () => {
      console.log('Connected to PostgreSQL database');
    });

    pool.on('error', (err) => {
      console.error('PostgreSQL connection error:', err);
    });

    // Add graceful shutdown handling
    process.on('SIGINT', async () => {
      console.log('Shutting down gracefully...');
      if (pool) {
        await pool.end();
      }
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Shutting down gracefully...');
      if (pool) {
        await pool.end();
      }
      process.exit(0);
    });
  }
  return pool;
};

export const testConnection = async () => {
  try {
    const poolInstance = createPool();
    const client = await poolInstance.connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

export default createPool();