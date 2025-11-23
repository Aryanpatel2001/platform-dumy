/**
 * Conversation Repository - Database operations for conversations and messages
 */

import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create new conversation
 */
export async function createConversation(agentId, type = 'chat') {
  try {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO conversations (id, agent_id, type, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING *`,
      [id, agentId, type]
    );
    return result[0];
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

/**
 * Add message to conversation
 */
export async function addMessage(conversationId, role, content, functionCall = null, functionResult = null) {
  try {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO messages (id, conversation_id, role, content, function_call, function_result)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, conversationId, role, content, functionCall, JSON.stringify(functionResult)]
    );
    return result[0];
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
}

/**
 * Get conversation messages
 */
export async function getConversationMessages(conversationId) {
  try {
    const messages = await query(
      `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId]
    );
    return messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

/**
 * Log function execution
 */
export async function logFunctionExecution(data) {
  try {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO function_executions (
        id, conversation_id, message_id, function_id, function_name,
        parameters, response, status, error_message, execution_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        id,
        data.conversationId,
        data.messageId || null,
        data.functionId || null,
        data.functionName,
        JSON.stringify(data.parameters),
        JSON.stringify(data.response),
        data.status,
        data.errorMessage || null,
        data.executionTime || null
      ]
    );
    return result[0];
  } catch (error) {
    console.error('Error logging function execution:', error);
    throw error;
  }
}

/**
 * End conversation
 */
export async function endConversation(conversationId, duration = null) {
  try {
    await query(
      `UPDATE conversations SET status = 'completed', ended_at = NOW(), duration = $2
       WHERE id = $1`,
      [conversationId, duration]
    );
    return true;
  } catch (error) {
    console.error('Error ending conversation:', error);
    throw error;
  }
}

/**
 * Get conversation by ID
 */
export async function getConversationById(conversationId) {
  try {
    const conversations = await query(
      `SELECT * FROM conversations WHERE id = $1`,
      [conversationId]
    );
    return conversations[0] || null;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
}

export default {
  createConversation,
  addMessage,
  getConversationMessages,
  logFunctionExecution,
  endConversation,
  getConversationById
};

