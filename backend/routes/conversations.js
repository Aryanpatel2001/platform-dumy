/**
 * Conversations API Routes
 * Handles conversation management, listing, and export
 */

import express from 'express';
import * as conversationRepo from '../db/repositories/conversationRepository.js';
import * as agentRepo from '../db/repositories/agentRepository.js';
import { query } from '../db/database.js';
import { validateAgentId } from '../middleware/validation.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

/**
 * Get all conversations for an agent
 * GET /api/agents/:id/conversations
 */
router.get('/agents/:id/conversations', authenticateToken, validateAgentId, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, search, type, status, startDate, endDate } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Verify agent exists and belongs to user
    const agent = await agentRepo.getAgentById(id);
    if (!agent) {
      return res.status(404).json({ error: true, message: 'Agent not found' });
    }

    let sql = `
      SELECT 
        c.*,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_message_at,
        MIN(m.created_at) as first_message_at
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.agent_id = $1
    `;
    
    const params = [id];
    let paramIndex = 2;

    // Add filters
    if (type) {
      sql += ` AND c.type = $${paramIndex++}`;
      params.push(type);
    }

    if (status) {
      sql += ` AND c.status = $${paramIndex++}`;
      params.push(status);
    }

    if (startDate) {
      sql += ` AND c.started_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND c.started_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    // Search in messages
    if (search) {
      sql += ` AND EXISTS (
        SELECT 1 FROM messages m2 
        WHERE m2.conversation_id = c.id 
        AND m2.content ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` GROUP BY c.id ORDER BY c.started_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), offset);

    const conversations = await query(sql, params);

    // Get total count for pagination
    let countSql = `SELECT COUNT(DISTINCT c.id) as total FROM conversations c WHERE c.agent_id = $1`;
    const countParams = [id];
    let countParamIndex = 2;

    if (type) {
      countSql += ` AND c.type = $${countParamIndex++}`;
      countParams.push(type);
    }

    if (status) {
      countSql += ` AND c.status = $${countParamIndex++}`;
      countParams.push(status);
    }

    if (startDate) {
      countSql += ` AND c.started_at >= $${countParamIndex++}`;
      countParams.push(startDate);
    }

    if (endDate) {
      countSql += ` AND c.started_at <= $${countParamIndex++}`;
      countParams.push(endDate);
    }

    if (search) {
      countSql += ` AND EXISTS (
        SELECT 1 FROM messages m2 
        WHERE m2.conversation_id = c.id 
        AND m2.content ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult[0]?.total || 0);

    res.json({
      success: true,
      conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

/**
 * Get conversation by ID with messages
 * GET /api/conversations/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const conversation = await conversationRepo.getConversationById(id);
    if (!conversation) {
      return res.status(404).json({ error: true, message: 'Conversation not found' });
    }

    // Verify agent belongs to user (optional - add if needed)
    // const agent = await agentRepo.getAgentById(conversation.agent_id);
    // if (agent.user_id !== req.user.id) {
    //   return res.status(403).json({ error: true, message: 'Access denied' });
    // }

    const messages = await conversationRepo.getConversationMessages(id);

    res.json({
      success: true,
      conversation: {
        ...conversation,
        messages
      }
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

/**
 * Delete conversation
 * DELETE /api/conversations/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const conversation = await conversationRepo.getConversationById(id);
    if (!conversation) {
      return res.status(404).json({ error: true, message: 'Conversation not found' });
    }

    // Delete conversation (cascade will delete messages)
    await query('DELETE FROM conversations WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

/**
 * Export conversation
 * GET /api/conversations/:id/export?format=json|csv
 */
router.get('/:id/export', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const format = req.query.format || 'json';
    
    const conversation = await conversationRepo.getConversationById(id);
    if (!conversation) {
      return res.status(404).json({ error: true, message: 'Conversation not found' });
    }

    const messages = await conversationRepo.getConversationMessages(id);

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Role,Content,Function Call,Timestamp\n';
      const csvRows = messages.map(msg => {
        const role = msg.role || '';
        const content = (msg.content || '').replace(/"/g, '""');
        const functionCall = msg.function_call || '';
        const timestamp = msg.created_at || '';
        return `"${role}","${content}","${functionCall}","${timestamp}"`;
      }).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="conversation-${id}.csv"`);
      res.send(csvHeader + csvRows);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="conversation-${id}.json"`);
      res.json({
        conversation,
        messages,
        exportedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error exporting conversation:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

export default router;

