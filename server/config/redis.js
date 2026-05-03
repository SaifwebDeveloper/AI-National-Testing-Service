// server/config/redis.js
let redis = null;
let redisClient = null;
let isRedisAvailable = false;

// Only try to load redis if USE_REDIS is true
if (process.env.USE_REDIS === 'true') {
  try {
    redis = require('redis');
  } catch (error) {
    console.log('⚠️ Redis module not installed, running without Redis');
  }
}

// Rest of your redis.js code with proper null checks...