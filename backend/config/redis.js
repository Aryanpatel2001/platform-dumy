import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Support both connection string (cloud) and individual config (local)
let redisConfig;

if (process.env.REDIS_URL) {
    // Cloud Redis - parse connection string
    // Format: redis://username:password@host:port
    const redisUrl = new URL(process.env.REDIS_URL);
    redisConfig = {
        host: redisUrl.hostname,
        port: parseInt(redisUrl.port || '6379'),
        username: redisUrl.username || process.env.REDIS_USERNAME || 'default',
        password: redisUrl.password || process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        // Enable TLS for cloud Redis (Redis Cloud requires this)
        // For Redis Cloud, TLS is usually required
        tls: process.env.REDIS_TLS !== 'false' ? {
            rejectUnauthorized: false // Allow self-signed certificates if needed
        } : undefined,
    };
    console.log(`🔗 Connecting to Redis Cloud at ${redisConfig.host}:${redisConfig.port}`);
} else {
    // Individual config (supports both local and cloud)
    redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        username: process.env.REDIS_USERNAME || 'default',
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        // Enable TLS if specified (Redis Cloud usually requires this)
        tls: process.env.REDIS_TLS !== 'false' ? {
            rejectUnauthorized: false // Allow self-signed certificates if needed
        } : undefined,
    };

    if (process.env.REDIS_HOST && process.env.REDIS_HOST !== 'localhost') {
        console.log(`🔗 Connecting to Redis Cloud at ${redisConfig.host}:${redisConfig.port}`);
    } else {
        console.log(`🔗 Connecting to local Redis at ${redisConfig.host}:${redisConfig.port}`);
    }
}

export const redis = new Redis(redisConfig);

redis.on('error', (err) => {
    // Only log if it's not a connection refused error during development
    if (err.code !== 'ECONNREFUSED') {
        console.error('❌ Redis connection error:', err.message);
    }
});

redis.on('connect', () => {
    console.log('✅ Connected to Redis successfully');
});

redis.on('ready', () => {
    console.log('✅ Redis is ready to accept commands');
});

export default redis;

