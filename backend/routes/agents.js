import express from 'express';
import { validateAgent } from '../utils/validation.js';
import * as agentRepo from '../db/repositories/agentRepository.js';
import { authenticateToken } from '../utils/auth.js';
import { validateAgent as validateAgentMiddleware, validateAgentId } from '../middleware/validation.js';
import { agentLimiter } from '../middleware/rateLimiting.js';
import { generateSpeech } from '../services/elevenlabsService.js';

const router = express.Router();

// Get all agents (user-specific)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const agents = await agentRepo.getAllAgentsByUser(req.user.id);
    res.json(agents);
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Get stats (user-specific)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await agentRepo.getAgentStatsByUser(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Get single agent (user-specific)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const agent = await agentRepo.getAgentByIdAndUser(req.params.id, req.user.id);
    if (!agent) {
      return res.status(404).json({
        error: true,
        message: 'Agent not found or you do not have permission to access it.'
      });
    }
    res.json(agent);
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Create agent
router.post('/', authenticateToken, agentLimiter, validateAgentMiddleware, async (req, res) => {
  try {
    // Add user_id to agent data
    const agentData = {
      ...req.body,
      user_id: req.user.id
    };

    const agent = await agentRepo.createAgent(agentData);
    res.status(201).json(agent);
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Update agent (user-specific)
router.put('/:id', authenticateToken, agentLimiter, validateAgentId, validateAgentMiddleware, async (req, res) => {
  try {
    const agent = await agentRepo.getAgentByIdAndUser(req.params.id, req.user.id);
    if (!agent) {
      return res.status(404).json({
        error: true,
        message: 'Agent not found or you do not have permission to update it.'
      });
    }

    const updatedAgent = await agentRepo.updateAgent(req.params.id, req.body);
    res.json(updatedAgent);
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Delete agent (user-specific)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const agent = await agentRepo.getAgentByIdAndUser(req.params.id, req.user.id);
    if (!agent) {
      return res.status(404).json({
        error: true,
        message: 'Agent not found or you do not have permission to delete it.'
      });
    }

    await agentRepo.deleteAgent(req.params.id);
    res.json({ success: true, message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Test voice sample (for voice agent configuration)
router.post('/voice/test', authenticateToken, async (req, res) => {
  try {
    const { voiceId, stability, similarityBoost, speed, text } = req.body;

    const testText = text || "Hello! This is a test of your selected voice settings. How does this sound?";

    // Generate base64 audio (audio/mpeg) from ElevenLabs
    const audioBase64 = await generateSpeech(testText, {
      voiceId: voiceId || 'default',
      stability: typeof stability === 'number' ? stability : 0.5,
      similarityBoost: typeof similarityBoost === 'number' ? similarityBoost : 0.75,
      speed: typeof speed === 'number' ? speed : 1.0
    });

    if (!audioBase64) {
      return res.status(503).json({
        error: true,
        message: 'Voice generation service is not available. Please check ElevenLabs configuration.'
      });
    }

    // Build a proper data URL that the browser can play directly
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    res.json({
      success: true,
      audioUrl,
      audioBase64, // included for clients that prefer Blob URLs
      message: 'Voice sample generated successfully'
    });
  } catch (error) {
    console.error('Voice test error:', error);
    res.status(500).json({
      error: true,
      message: `Failed to generate voice sample: ${error.message}`
    });
  }
});



export default router;

