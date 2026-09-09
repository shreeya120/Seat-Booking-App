const IORedis = require('ioredis');

let redis = null;

try {
  const instance = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
    retryStrategy: () => null, // Don't retry — if Redis is down, skip it
  });

  instance.on('connect', () => {
    console.log('[Redis] Connected');
    redis = instance;
  });

  instance.on('error', () => {
    if (!redis) console.warn('[Redis] Not available — email queue disabled. App will still work.');
    redis = null;
    instance.disconnect();
  });
} catch {
  console.warn('[Redis] Not available — running without Redis.');
}

module.exports = { getRedis: () => redis };
