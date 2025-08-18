import { createClient } from 'redis';

// Simple fallback storage when Redis is not available
const fallbackStorage = new Map<string, { value: string; expiry?: number }>();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.log('❌ Redis connection failed after 5 retries, using fallback mode');
        return false;
      }
      return Math.min(retries * 100, 2000);
    }
  }
});

redisClient.on('error', (err) => {
  console.warn('Redis Client Error - Redis may not be running:', err.message);
  // Don't throw error, just log it
});

redisClient.on('connect', () => {
  // Redis client connected
});

redisClient.on('ready', () => {
  // Redis client ready
});

redisClient.on('end', () => {
  console.log('❌ Redis Client Disconnected');
});

// Wrap Redis operations to handle connection failures gracefully
const safeRedisOperation = async (operation: () => Promise<any>, fallback?: any) => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    return await operation();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Redis operation failed, using fallback:', errorMessage);
    return fallback;
  }
};

// Export wrapped Redis client with safe operations
export const safeRedis = {
  get: async (key: string) => {
    try {
      const result = await safeRedisOperation(async () => await redisClient.get(key), null);
      if (result === null) {
        // Try fallback storage
        const item = fallbackStorage.get(key);
        if (item && (!item.expiry || Date.now() < item.expiry)) {
          return item.value;
        }
      }
      return result;
    } catch (error) {
      // Use fallback storage
      const item = fallbackStorage.get(key);
      if (item && (!item.expiry || Date.now() < item.expiry)) {
        return item.value;
      }
      return null;
    }
  },
  set: async (key: string, value: string, options?: any) => {
    try {
      const result = await safeRedisOperation(async () => await redisClient.set(key, value, options), 'OK');
      // Also store in fallback
      const expiry = options?.EX ? Date.now() + (options.EX * 1000) : undefined;
      fallbackStorage.set(key, { value, expiry });
      return result;
    } catch (error) {
      // Use fallback storage
      const expiry = options?.EX ? Date.now() + (options.EX * 1000) : undefined;
      fallbackStorage.set(key, { value, expiry });
      return 'OK';
    }
  },
  del: async (key: string) => {
    try {
      const result = await safeRedisOperation(async () => await redisClient.del(key), 0);
      // Also remove from fallback
      fallbackStorage.delete(key);
      return result;
    } catch (error) {
      // Use fallback storage
      return fallbackStorage.delete(key) ? 1 : 0;
    }
  },
  exists: async (key: string) => {
    try {
      const result = await safeRedisOperation(async () => await redisClient.exists(key), 0);
      if (result === 0) {
        // Check fallback storage
        return fallbackStorage.has(key) ? 1 : 0;
      }
      return result;
    } catch (error) {
      // Use fallback storage
      return fallbackStorage.has(key) ? 1 : 0;
    }
  },
  expire: async (key: string, seconds: number) => {
    try {
      const result = await safeRedisOperation(async () => await redisClient.expire(key, seconds), 0);
      // Also update fallback
      const item = fallbackStorage.get(key);
      if (item) {
        item.expiry = Date.now() + (seconds * 1000);
        fallbackStorage.set(key, item);
      }
      return result;
    } catch (error) {
      // Use fallback storage
      const item = fallbackStorage.get(key);
      if (item) {
        item.expiry = Date.now() + (seconds * 1000);
        fallbackStorage.set(key, item);
        return 1;
      }
      return 0;
    }
  }
};

// Redis health check function
export const checkRedisHealth = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    await redisClient.ping();
    console.log('✅ Redis is healthy and responding');
    return true;
  } catch (error) {
    console.log('❌ Redis is not available, using fallback mode');
    return false;
  }
};

export default redisClient; 