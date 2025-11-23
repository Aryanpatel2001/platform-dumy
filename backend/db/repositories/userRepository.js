import { query } from '../database.js';
import bcrypt from 'bcryptjs';

/**
 * Create a new user
 */
export async function createUser(userData) {
  const { email, password, name } = userData;
  
  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  const sql = `
    INSERT INTO users (email, password, name)
    VALUES ($1, $2, $3)
    RETURNING id, email, name, is_verified, created_at, updated_at
  `;
  
  const result = await query(sql, [email, hashedPassword, name]);
  return result[0];
}

/**
 * Find user by email
 */
export async function findUserByEmail(email) {
  const sql = `
    SELECT id, email, password, name, is_verified, last_login, created_at, updated_at
    FROM users 
    WHERE email = $1
  `;
  
  const result = await query(sql, [email]);
  return result[0] || null;
}

/**
 * Find user by ID
 */
export async function findUserById(id) {
  const sql = `
    SELECT id, email, name, is_verified, last_login, created_at, updated_at
    FROM users 
    WHERE id = $1
  `;
  
  const result = await query(sql, [id]);
  return result[0] || null;
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId) {
  const sql = `
    UPDATE users 
    SET last_login = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, email, name, is_verified, last_login, created_at, updated_at
  `;
  
  const result = await query(sql, [userId]);
  return result[0];
}

/**
 * Verify password
 */
export async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Update user profile
 */
export async function updateUser(userId, updates) {
  const { name, email } = updates;
  
  const sql = `
    UPDATE users 
    SET name = COALESCE($2, name), 
        email = COALESCE($3, email),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, email, name, is_verified, last_login, created_at, updated_at
  `;
  
  const result = await query(sql, [userId, name, email]);
  return result[0];
}

/**
 * Check if email exists
 */
export async function emailExists(email) {
  const sql = `SELECT id FROM users WHERE email = $1`;
  const result = await query(sql, [email]);
  return result.length > 0;
}

/**
 * Get user stats
 */
export async function getUserStats(userId) {
  const sql = `
    SELECT 
      COUNT(a.id) as total_agents,
      COUNT(CASE WHEN a.status = 'active' THEN 1 END) as active_agents,
      COUNT(c.id) as total_conversations,
      AVG(a.success_rate) as avg_success_rate
    FROM users u
    LEFT JOIN agents a ON u.id = a.user_id
    LEFT JOIN conversations c ON a.id = c.agent_id
    WHERE u.id = $1
    GROUP BY u.id
  `;
  
  const result = await query(sql, [userId]);
  return result[0] || {
    total_agents: 0,
    active_agents: 0,
    total_conversations: 0,
    avg_success_rate: 0
  };
}