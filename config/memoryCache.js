const logger = require('./logger');

// Simple in-memory cache
const cache = new Map();
const expiryTimes = new Map();

// Clean up expired items periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of expiryTimes.entries()) {
    if (now > expiry) {
      cache.delete(key);
      expiryTimes.delete(key);
    }
  }
}, 60000); // Check every minute

module.exports = {
  getCache: async (key) => {
    try {
      if (cache.has(key)) {
        logger.info(`Cache hit for key: ${key}`);
        return cache.get(key);
      }
      logger.info(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Memory cache get error: ${error.message}`);
      return null;
    }
  },
  
  setCache: async (key, data, expiry = 300) => { // Default 5 minutes
    try {
      cache.set(key, data);
      expiryTimes.set(key, Date.now() + (expiry * 1000));
      logger.info(`Cached data for key: ${key} (expires in ${expiry}s)`);
      return true;
    } catch (error) {
      logger.error(`Memory cache set error: ${error.message}`);
      return false;
    }
  },
  
  invalidateCache: async (key) => {
    try {
      if (key.includes('*')) {
        // If key contains wildcard, use regex to match keys
        const regex = new RegExp(key.replace(/\*/g, '.*'));
        for (const cacheKey of cache.keys()) {
          if (regex.test(cacheKey)) {
            cache.delete(cacheKey);
            expiryTimes.delete(cacheKey);
          }
        }
      } else {
        cache.delete(key);
        expiryTimes.delete(key);
      }
      logger.info(`Invalidated cache for key: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Memory cache invalidate error: ${error.message}`);
      return false;
    }
  },
  
  clearAllCache: async () => {
    try {
      cache.clear();
      expiryTimes.clear();
      logger.info('Cleared all cache');
      return true;
    } catch (error) {
      logger.error(`Memory cache clear error: ${error.message}`);
      return false;
    }
  }
};