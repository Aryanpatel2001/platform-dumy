/**
 * Call Repository - Database operations for voice calls
 * Migrates from in-memory callStore.js to persistent database storage
 */

import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import * as conversationRepo from './conversationRepository.js';

/**
 * Create or get conversation for a call
 */
export async function createCallConversation(agentId, callSid, direction = 'outbound', fromNumber = null, toNumber = null) {
  try {
    // Check if conversation already exists for this call_sid
    const existing = await query(
      `SELECT * FROM conversations WHERE call_sid = $1`,
      [callSid]
    );

    if (existing.length > 0) {
      return existing[0];
    }

    // Create new conversation for call
    const conversation = await conversationRepo.createConversation(agentId, 'call');
    
    // Update with call_sid
    await query(
      `UPDATE conversations 
       SET call_sid = $1 
       WHERE id = $2`,
      [callSid, conversation.id]
    );

    // Create call history record
    await query(
      `INSERT INTO call_history (
        id, agent_id, conversation_id, call_sid, 
        from_number, to_number, direction, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'initiated')
      ON CONFLICT (call_sid) DO UPDATE SET
        agent_id = EXCLUDED.agent_id,
        conversation_id = EXCLUDED.conversation_id,
        from_number = EXCLUDED.from_number,
        to_number = EXCLUDED.to_number,
        direction = EXCLUDED.direction,
        updated_at = NOW()
      RETURNING *`,
      [uuidv4(), agentId, conversation.id, callSid, fromNumber, toNumber, direction]
    );

    return conversation;
  } catch (error) {
    console.error('Error creating call conversation:', error);
    throw error;
  }
}

/**
 * Update call status
 */
export async function updateCallStatus(callSid, status, metadata = {}) {
  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    updates.push(`status = $${paramIndex++}`);
    values.push(status);

    if (metadata.answeredAt) {
      updates.push(`answered_at = $${paramIndex++}`);
      values.push(metadata.answeredAt);
    }

    if (metadata.endedAt) {
      updates.push(`ended_at = $${paramIndex++}`);
      values.push(metadata.endedAt);
    }

    if (metadata.duration !== undefined) {
      updates.push(`duration = $${paramIndex++}`);
      values.push(metadata.duration);
    }

    if (metadata.recordingUrl) {
      updates.push(`recording_url = $${paramIndex++}`);
      values.push(metadata.recordingUrl);
    }

    if (metadata.cost !== undefined) {
      updates.push(`cost = $${paramIndex++}`);
      values.push(metadata.cost);
    }

    updates.push(`updated_at = NOW()`);
    values.push(callSid);

    await query(
      `UPDATE call_history 
       SET ${updates.join(', ')}
       WHERE call_sid = $${paramIndex}`,
      values
    );

    // Also update conversation status if call ended
    if (['completed', 'failed', 'busy', 'no-answer'].includes(status)) {
      const conversation = await query(
        `SELECT id FROM conversations WHERE call_sid = $1`,
        [callSid]
      );
      
      if (conversation.length > 0) {
        await conversationRepo.endConversation(
          conversation[0].id,
          metadata.duration || null
        );
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating call status:', error);
    throw error;
  }
}

/**
 * Get call by SID
 */
export async function getCallBySid(callSid) {
  try {
    const calls = await query(
      `SELECT ch.*, c.id as conversation_id, c.status as conversation_status
       FROM call_history ch
       LEFT JOIN conversations c ON ch.conversation_id = c.id
       WHERE ch.call_sid = $1`,
      [callSid]
    );
    return calls[0] || null;
  } catch (error) {
    console.error('Error fetching call:', error);
    throw error;
  }
}

/**
 * Get calls for an agent
 */
export async function getAgentCalls(agentId, filters = {}) {
  try {
    let sql = `
      SELECT ch.*, c.id as conversation_id, c.status as conversation_status
      FROM call_history ch
      LEFT JOIN conversations c ON ch.conversation_id = c.id
      WHERE ch.agent_id = $1
    `;
    
    const params = [agentId];
    let paramIndex = 2;

    if (filters.status) {
      sql += ` AND ch.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.direction) {
      sql += ` AND ch.direction = $${paramIndex++}`;
      params.push(filters.direction);
    }

    if (filters.startDate) {
      sql += ` AND ch.started_at >= $${paramIndex++}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ` AND ch.started_at <= $${paramIndex++}`;
      params.push(filters.endDate);
    }

    sql += ` ORDER BY ch.started_at DESC`;

    if (filters.limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    return await query(sql, params);
  } catch (error) {
    console.error('Error fetching agent calls:', error);
    throw error;
  }
}

/**
 * Get all calls with pagination
 */
export async function getAllCalls(filters = {}) {
  try {
    let sql = `
      SELECT ch.*, c.id as conversation_id, c.status as conversation_status,
             a.name as agent_name
      FROM call_history ch
      LEFT JOIN conversations c ON ch.conversation_id = c.id
      LEFT JOIN agents a ON ch.agent_id = a.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (filters.agentId) {
      sql += ` AND ch.agent_id = $${paramIndex++}`;
      params.push(filters.agentId);
    }

    if (filters.status) {
      sql += ` AND ch.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.direction) {
      sql += ` AND ch.direction = $${paramIndex++}`;
      params.push(filters.direction);
    }

    if (filters.startDate) {
      sql += ` AND ch.started_at >= $${paramIndex++}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ` AND ch.started_at <= $${paramIndex++}`;
      params.push(filters.endDate);
    }

    sql += ` ORDER BY ch.started_at DESC`;

    if (filters.limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    return await query(sql, params);
  } catch (error) {
    console.error('Error fetching all calls:', error);
    throw error;
  }
}

/**
 * Save call transcript
 */
export async function saveCallTranscript(callSid, transcript) {
  try {
    await query(
      `UPDATE call_history 
       SET transcript = $1, updated_at = NOW()
       WHERE call_sid = $2`,
      [transcript, callSid]
    );
    return true;
  } catch (error) {
    console.error('Error saving call transcript:', error);
    throw error;
  }
}

/**
 * Get call analytics
 */
export async function getCallAnalytics(agentId = null, startDate = null, endDate = null) {
  try {
    let sql = `
      SELECT 
        COUNT(*) as total_calls,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_calls,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_calls,
        COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as inbound_calls,
        COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as outbound_calls,
        AVG(duration) as avg_duration,
        SUM(duration) as total_duration,
        SUM(cost) as total_cost,
        AVG(cost) as avg_cost
      FROM call_history
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (agentId) {
      sql += ` AND agent_id = $${paramIndex++}`;
      params.push(agentId);
    }

    if (startDate) {
      sql += ` AND started_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND started_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    const result = await query(sql, params);
    return result[0] || {};
  } catch (error) {
    console.error('Error fetching call analytics:', error);
    throw error;
  }
}

export default {
  createCallConversation,
  updateCallStatus,
  getCallBySid,
  getAgentCalls,
  getAllCalls,
  saveCallTranscript,
  getCallAnalytics
};

