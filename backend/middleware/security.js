import helmet from 'helmet';
import cors from 'cors';

/**
 * Security headers configuration using helmet
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.elevenlabs.io"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  
  // Cross Origin Embedder Policy
  crossOriginEmbedderPolicy: false,
  
  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false
  },
  
  // Frame Guard
  frameguard: {
    action: 'deny'
  },
  
  // Hide Powered By
  hidePoweredBy: true,
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // IE No Open
  ieNoOpen: true,
  
  // No Sniff
  noSniff: true,
  
  // Origin Agent Cluster
  originAgentCluster: true,
  
  // Permitted Cross Domain Policies
  permittedCrossDomainPolicies: false,
  
  // Referrer Policy
  referrerPolicy: {
    policy: "no-referrer"
  },
  
  // X-XSS-Protection
  xssFilter: true
});

/**
 * CORS configuration
 */
export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:4173',
      'https://localhost:3000',
      'https://localhost:5173',
      'https://localhost:5174',
      'https://localhost:4173'
    ];
    
    // Add production domains from environment variables
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    if (process.env.PRODUCTION_DOMAIN) {
      allowedOrigins.push(process.env.PRODUCTION_DOMAIN);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
};

/**
 * Enhanced CORS middleware
 */
export const corsMiddleware = cors(corsOptions);

/**
 * Request logging middleware for security monitoring
 */
export const securityLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const method = req.method;
  const url = req.originalUrl;
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript injection
    /vbscript:/i,  // VBScript injection
    /onload=/i,  // Event handler injection
    /onerror=/i  // Error handler injection
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || 
    pattern.test(JSON.stringify(req.body)) || 
    pattern.test(JSON.stringify(req.query))
  );
  
  if (isSuspicious) {
    console.warn(`[SECURITY WARNING] ${timestamp} - Suspicious request from ${ip}:`, {
      method,
      url,
      userAgent,
      body: req.body,
      query: req.query
    });
  }
  
  // Log all requests in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${timestamp}] ${method} ${url} - ${ip} - ${userAgent}`);
  }
  
  next();
};

/**
 * Request size limiter
 */
export const requestSizeLimiter = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    return res.status(413).json({
      error: true,
      message: 'Request entity too large'
    });
  }
  
  next();
};

/**
 * IP whitelist middleware (for admin endpoints)
 */
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Always allow localhost in development
    if (process.env.NODE_ENV === 'development') {
      const localhostIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
      if (localhostIPs.includes(clientIP)) {
        return next();
      }
    }
    
    if (allowedIPs.length === 0 || allowedIPs.includes(clientIP)) {
      next();
    } else {
      res.status(403).json({
        error: true,
        message: 'Access denied from this IP address'
      });
    }
  };
};

/**
 * API key validation middleware
 */
export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];
  
  if (validApiKeys.length === 0) {
    // No API keys configured, skip validation
    return next();
  }
  
  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      error: true,
      message: 'Invalid or missing API key'
    });
  }
  
  next();
};