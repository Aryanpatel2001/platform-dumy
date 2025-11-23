import jwt from 'jsonwebtoken';
import { findUserById } from '../db/repositories/userRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Validate JWT_SECRET is set
if (!JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET environment variable is required!');
  console.error('   Please set JWT_SECRET in your .env file');
  process.exit(1);
}

/**
 * Generate JWT token for user
 */
export function generateToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Authentication middleware
 */
export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: true,
        message: 'Access token required'
      });
    }

    const decoded = verifyToken(token);

    // Get fresh user data
    const user = await findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'User not found'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      error: true,
      message: 'Invalid or expired token'
    });
  }
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      const user = await findUserById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

/**
 * Extract user ID from request (for authenticated routes)
 */
export function getUserId(req) {
  return req.user?.id;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(req) {
  return !!req.user;
}