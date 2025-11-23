import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import agentRoutes from './routes/agents.js';
import twilioRoutes from './routes/twilio.js';
import calComRoutes from './routes/calcom.js';
import chatRoutes from './routes/chat.js';
import statsRoutes from './routes/stats.js';
import authRoutes from './routes/auth.js';
import phoneNumberRoutes from './routes/phoneNumbers.js';
import conversationRoutes from './routes/conversations.js';
import emailMarketingRoutes from './routes/emailMarketing.js';
import { initializeDatabase, initializeSchema, checkConnection } from './db/database.js';
// Voice gateway - Phase C (Streaming TTS) - Production optimized
import { setupVoiceGateway } from './services/voiceGatewayStreaming.js';
// Campaign scheduler for scheduled email sending
import { startCampaignScheduler } from './services/campaignScheduler.js';

// Security middleware imports
import { securityHeaders, corsMiddleware, securityLogger, requestSizeLimiter } from './middleware/security.js';
import { generalLimiter } from './middleware/rateLimiting.js';
import { sanitizeInput } from './middleware/validation.js';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ ERROR: Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n   Please set these in your .env file');
  console.error('   See .env.example for reference\n');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware (order matters!)
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(requestSizeLimiter);
app.use(generalLimiter);
app.use(securityLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/twilio', twilioRoutes);
app.use('/api/calcom', calComRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/phone-numbers', phoneNumberRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/email', emailMarketingRoutes);
app.use('/api', chatRoutes);

// Health check
app.get('/health', async (req, res) => {
  const dbStatus = await checkConnection();
  res.json({
    status: 'ok',
    message: 'Server is running',
    database: dbStatus.connected ? 'connected' : 'disconnected',
    timestamp: dbStatus.timestamp || null
  });
});

// Database initialization endpoint (for setup)
app.post('/api/init-db', async (req, res) => {
  try {
    await initializeSchema();
    res.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: true, message: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  console.log('🚀 Starting AI Agent Platform Server...\n');

  // Initialize database connection
  const dbInitialized = initializeDatabase();

  if (dbInitialized) {
    console.log('📊 Database mode: ENABLED');
    console.log('💾 Using: Neon PostgreSQL\n');

    // Check if schema needs initialization
    try {
      const dbCheck = await checkConnection();
      if (!dbCheck.connected) {
        console.warn('⚠️  Database connection failed. Please check your DATABASE_URL');
      }
    } catch (error) {
      console.warn('⚠️  Database check failed:', error.message);
    }
  } else {
    console.log('📊 Database mode: DISABLED (in-memory mode)');
    console.log('⚠️  Set DATABASE_URL to enable persistent storage\n');
  }

  const httpServer = app.listen(PORT, () => {
    console.log('════════════════════════════════════════');
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 API Base: http://localhost:${PORT}/api`);
    console.log('════════════════════════════════════════\n');
  });

  // =========================================================================
  // VOICE GATEWAY - Production Optimized (Streaming TTS)
  // =========================================================================
  // Features:
  // - ElevenLabs Streaming TTS (20+ premium voices)
  // - Deepgram real-time STT
  // - GPT-4o-mini for fast AI responses
  // - Smart TTS selection (Twilio Say for short, ElevenLabs for long)
  // - 800-1200ms latency (excellent for voice)
  // - $0.08-0.15/min cost (balanced)
  // =========================================================================

  console.log('🎙️  Voice Gateway: Production Mode');
  console.log('⚡ Latency: ~800-1200ms');
  console.log('🎵 Quality: Very High (ElevenLabs Streaming)');
  console.log('💰 Cost: ~$0.08-0.15/min');
  console.log('✅ Status: Production Ready\n');

  setupVoiceGateway(httpServer);

  // =========================================================================
  // EMAIL CAMPAIGN SCHEDULER
  // =========================================================================
  // Features:
  // - Checks for scheduled campaigns every minute
  // - Automatically sends campaigns at scheduled time
  // - Handles campaign status updates
  // =========================================================================

  if (dbInitialized) {
    startCampaignScheduler();
  }
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

