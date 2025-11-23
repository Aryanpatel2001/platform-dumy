import express from 'express';
import { 
  createUser, 
  findUserByEmail, 
  emailExists, 
  verifyPassword, 
  updateLastLogin,
  updateUser,
  getUserStats
} from '../db/repositories/userRepository.js';
import { generateToken, authenticateToken } from '../utils/auth.js';
import { validateRegister, validateLogin, validateProfileUpdate } from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimiting.js';

const router = express.Router();

/**
 * Register new user
 */
router.post('/register', authLimiter, validateRegister, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if email already exists
    if (await emailExists(email)) {
      return res.status(400).json({
        error: true,
        message: 'Email already registered'
      });
    }

    // Create user
    const user = await createUser({ email, password, name });
    
    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.is_verified,
        createdAt: user.created_at
      },
      token
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to register user'
    });
  }
});

/**
 * Login user
 */
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: true,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    const updatedUser = await updateLastLogin(user.id);

    // Generate token
    const token = generateToken(updatedUser);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isVerified: updatedUser.is_verified,
        lastLogin: updatedUser.last_login,
        createdAt: updatedUser.created_at
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to login'
    });
  }
});

/**
 * Get current user profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const stats = await getUserStats(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.is_verified,
        lastLogin: user.last_login,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      stats
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get profile'
    });
  }
});

/**
 * Update user profile
 */
router.put('/profile', authenticateToken, validateProfileUpdate, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    // Check if new email already exists (if email is being changed)
    if (email && email !== req.user.email) {
      if (await emailExists(email)) {
        return res.status(400).json({
          error: true,
          message: 'Email already in use'
        });
      }
    }

    const updatedUser = await updateUser(userId, { name, email });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isVerified: updatedUser.is_verified,
        lastLogin: updatedUser.last_login,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update profile'
    });
  }
});

/**
 * Logout (client-side token removal, but we can track it)
 */
router.post('/logout', authenticateToken, (req, res) => {
  // In a more sophisticated setup, you might want to blacklist the token
  // For now, we just return success and let the client remove the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * Verify token endpoint
 */
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      isVerified: req.user.is_verified
    }
  });
});

export default router;