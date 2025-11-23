import Bull from 'bull';
import dotenv from 'dotenv';

dotenv.config();

// Support both connection string and individual config for cloud Redis
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
        // Enable TLS for cloud Redis (Redis Cloud requires this)
        tls: process.env.REDIS_TLS !== 'false' ? {
            rejectUnauthorized: false // Allow self-signed certificates if needed
        } : undefined,
    };
    console.log(`📧 Email Queue: Connecting to Redis Cloud at ${redisConfig.host}:${redisConfig.port}`);
} else {
    // Individual config (supports both local and cloud)
    redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        username: process.env.REDIS_USERNAME || 'default',
        password: process.env.REDIS_PASSWORD || undefined,
        // Enable TLS if specified (Redis Cloud usually requires this)
        tls: process.env.REDIS_TLS !== 'false' ? {
            rejectUnauthorized: false // Allow self-signed certificates if needed
        } : undefined,
    };
    
    if (process.env.REDIS_HOST && process.env.REDIS_HOST !== 'localhost') {
        console.log(`📧 Email Queue: Connecting to Redis Cloud at ${redisConfig.host}:${redisConfig.port}`);
    }
}

// Create email queue
export const emailQueue = new Bull('email-sending', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,           // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,        // Start with 2s delay, exponential backoff
    },
    removeOnComplete: {
      age: 24 * 3600,     // Keep completed jobs for 24 hours
      count: 1000,        // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Queue event listeners
emailQueue.on('completed', (job) => {
  // console.log(`✅ Email job ${job.id} completed`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`❌ Email job ${job.id} failed:`, err.message);
});

emailQueue.on('stalled', (job) => {
  console.warn(`⚠️ Email job ${job.id} stalled`);
});

emailQueue.on('error', (error) => {
  if (error.code === 'ECONNREFUSED') {
    // Suppress connection errors if Redis is not running (dev mode)
    return;
  }
  console.error('Email queue error:', error);
});

export default emailQueue;

