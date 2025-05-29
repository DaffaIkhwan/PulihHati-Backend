const { createClient } = require('redis');
const logger = require('./logger');
const memoryCache = require('./memoryCache');

// Flag to track if Redis is available
let redisAvailable = false;
let client;

try {
  // Create Redis client
  client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => {
        // Stop trying to reconnect after 3 attempts
        if (retries > 3) {
          logger.warn('Redis connection failed after 3 attempts, using memory cache instead');
          return false; // stop reconnecting
        }
        return Math.min(retries * 100, 3000); // reconnect after increasing delay
      }
    }
  });

  // Connect to Redis
  (async () => {
    try {
      await client.connect();
      redisAvailable = true;
      logger.info('Connected to Redis server');
    } catch (err) {
      redisAvailable = false;
      logger.error(`Redis connection error: ${err.message}`);
      logger.info('Falling back to in-memory cache');
    }
  })();

  client.on('error', (err) => {
    if (redisAvailable) {
      logger.error(`Redis Error: ${err.message}`);
      redisAvailable = false;
    }
  });

  client.on('connect', () => {
    redisAvailable = true;
  });

  client.on('reconnecting', () => {
    logger.info('Attempting to reconnect to Redis...');
  });
} catch (error) {
  logger.error(`Redis initialization error: ${error.message}`);
  logger.info('Using in-memory cache instead');
  redisAvailable = false;
}

module.exports = {
  getCache: async (key) => {
    try {
      if (!redisAvailable) {
        return memoryCache.getCache(key);
      }
      
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis getCache error: ${error.message}`);
      return memoryCache.getCache(key);
    }
  },
  
  setCache: async (key, data, expiry = 300) => { // Default 5 minutes
    try {
      if (!redisAvailable) {
        return memoryCache.setCache(key, data, expiry);
      }
      
      await client.set(key, JSON.stringify(data), { EX: expiry });
      return true;
    } catch (error) {
      logger.error(`Redis setCache error: ${error.message}`);
      return memoryCache.setCache(key, data, expiry);
    }
  },
  
  invalidateCache: async (key) => {
    try {
      if (!redisAvailable) {
        return memoryCache.invalidateCache(key);
      }
      
      if (key.includes('*')) {
        // If key contains wildcard, use scan and delete
        let cursor = 0;
        do {
          const { cursor: newCursor, keys } = await client.scan(cursor, {
            MATCH: key,
            COUNT: 100
          });
          cursor = newCursor;
          
          if (keys.length) {
            await client.del(keys);
          }
        } while (cursor !== 0);
      } else {
        await client.del(key);
      }
      return true;
    } catch (error) {
      logger.error(`Redis invalidateCache error: ${error.message}`);
      return memoryCache.invalidateCache(key);
    }
  },
  
  clearAllCache: async () => {
    try {
      if (!redisAvailable) {
        return memoryCache.clearAllCache();
      }
      
      await client.flushAll();
      return true;
    } catch (error) {
      logger.error(`Redis clearAllCache error: ${error.message}`);
      return memoryCache.clearAllCache();
    }
  },
  
  isRedisAvailable: () => {
    return redisAvailable;
  }
};

