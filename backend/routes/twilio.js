import express from 'express';
import twilio from 'twilio';
import dotenv from 'dotenv';
import { getAgentById } from '../db/repositories/agentRepository.js';
import { setCallMapping, updateStatus, getAudio, getConversation } from '../utils/callStore.js';
import { subscribe } from '../utils/transcriptBus.js';
import { generateSpeech } from '../services/elevenlabsService.js';
import { storeAudio } from '../utils/callStore.js';
import * as callRepo from '../db/repositories/callRepository.js';

dotenv.config();

const router = express.Router();

// Validate Twilio credentials
router.post('/validate', async (req, res) => {
  try {
    const { accountSid, authToken, phoneNumber } = req.body;

    if (!accountSid || !authToken || !phoneNumber) {
      return res.status(400).json({
        valid: false,
        error: 'Missing required credentials'
      });
    }

    // Validate credentials by fetching account info
    const client = twilio(accountSid, authToken);
    
    try {
      await client.api.accounts(accountSid).fetch();
      
      // Validate phone number format
      if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
        return res.json({
          valid: false,
          error: 'Invalid phone number format. Use E.164 format (+1234567890)'
        });
      }

      res.json({
        valid: true,
        message: 'Credentials validated successfully'
      });
    } catch (error) {
      res.json({
        valid: false,
        error: 'Invalid Twilio credentials'
      });
    }
  } catch (error) {
    res.status(500).json({
      valid: false,
      error: error.message
    });
  }
});

// Provide TwiML to start Twilio Media Stream to our WebSocket voice gateway
router.post('/voice/stream', async (req, res) => {
  try {
    const { VOICE_GATEWAY_WS_URL, SERVER_URL } = process.env;
    // Prefer explicit gateway URL, else derive from SERVER_URL
    const wsUrl = VOICE_GATEWAY_WS_URL || (SERVER_URL ? SERVER_URL.replace('http', 'ws') + '/voice-stream' : 'ws://localhost:3000/voice-stream');

    const twiml = new twilio.twiml.VoiceResponse();
    const connect = twiml.connect();
    connect.stream({ url: `${wsUrl}?source=twilio` });

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Initiate an outbound call to a test phone number using agent's Twilio credentials
router.post('/call', async (req, res) => {
  try {
    const { agentId, phoneNumber } = req.body || {};

    if (!agentId || !phoneNumber) {
      return res.status(400).json({ error: true, message: 'agentId and phoneNumber are required' });
    }

    // Validate E.164 phone format
    if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      return res.status(400).json({ error: true, message: 'Invalid phone number format. Use E.164 format (+1234567890)' });
    }

    // Load agent and Twilio config
    const agent = await getAgentById(agentId);
    if (!agent) {
      return res.status(404).json({ error: true, message: 'Agent not found' });
    }

    const cfg = agent.twilioConfig || agent.twilio_config;
    if (!cfg || !cfg.accountSid || !cfg.authToken || !cfg.phoneNumber) {
      return res.status(400).json({ error: true, message: 'Agent Twilio configuration is incomplete' });
    }

    // Build TwiML that connects the call to our WebSocket voice gateway
    const { VOICE_GATEWAY_WS_URL, SERVER_URL } = process.env;
    const wsUrl = VOICE_GATEWAY_WS_URL || (SERVER_URL ? SERVER_URL.replace('http', 'ws') + '/voice-stream' : 'ws://localhost:3000/voice-stream');
    const twimlResponse = new twilio.twiml.VoiceResponse();

    // Optional greeting from agent config before starting the stream
    let greetingText = '';
    try {
      const vs = agent.voiceSettings || agent.voice_settings;
      const configuredGreeting = vs?.greeting;
      if (configuredGreeting && typeof configuredGreeting === 'string') {
        greetingText = configuredGreeting.trim();
      } else if (agent.system_prompt && typeof agent.system_prompt === 'string') {
        // Use the first sentence from system prompt to avoid overly long TTS
        const firstSentence = agent.system_prompt.split(/\.|\n/)[0] || '';
        greetingText = firstSentence.trim().slice(0, 240);
      }
    } catch {}

    if (greetingText) {
      try {
        const { SERVER_URL } = process.env;
        if (SERVER_URL) {
          const vs = agent.voiceSettings || agent.voice_settings || {};
          const audioBase64 = await generateSpeech(greetingText, {
            voiceId: vs.voiceId || 'default',
            stability: vs.stability,
            similarityBoost: vs.similarityBoost,
            speed: vs.speed
          });
          if (audioBase64 && audioBase64.length > 0) {
            const audioId = storeAudio(audioBase64, 'audio/mpeg');
            const audioUrl = `${SERVER_URL}/api/twilio/audio/${audioId}`;
            twimlResponse.play(audioUrl);
          } else {
            twimlResponse.say({ voice: 'alice', language: 'en-US' }, greetingText);
          }
        } else {
          // Fallback when SERVER_URL is not configured
          twimlResponse.say({ voice: 'alice', language: 'en-US' }, greetingText);
        }
      } catch (err) {
        console.warn('[Twilio] Greeting TTS failed, falling back to <Say>:', err?.message || err);
        twimlResponse.say({ voice: 'alice', language: 'en-US' }, greetingText);
      }
    }

    const connect = twimlResponse.connect();
    // Attach agentId so voice gateway can personalize and push replies mid-call
    connect.stream({ url: `${wsUrl}?source=twilio&agentId=${encodeURIComponent(agentId)}` });
    const twiml = twimlResponse.toString();
    console.log('[Twilio] Outbound TwiML length:', twiml.length);
    // Optional: uncomment to print TwiML for debugging
    // console.log('[Twilio] Outbound TwiML:', twiml);

    // Create the call
    const client = twilio(cfg.accountSid, cfg.authToken);
    console.log('[Twilio] Outbound call request:', { to: phoneNumber, from: cfg.phoneNumber, wsUrl });

    const statusCallbackUrl = process.env.SERVER_URL ? `${process.env.SERVER_URL}/api/twilio/status` : null;
    if (!statusCallbackUrl) {
      console.warn('[Twilio] SERVER_URL not set — status callbacks will be disabled. Set SERVER_URL to your public https domain.');
    }

    const call = await client.calls.create({
      to: phoneNumber,
      from: cfg.phoneNumber,
      twiml,
      ...(statusCallbackUrl ? {
        statusCallback: statusCallbackUrl,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST'
      } : {})
    });

    console.log('[Twilio] Call created:', { sid: call.sid, status: call.status });
    
    // Save call to database
    try {
      await callRepo.createCallConversation(
        agentId,
        call.sid,
        'outbound',
        cfg.phoneNumber,
        phoneNumber
      );
      console.log('[Twilio] Call saved to database');
    } catch (dbError) {
      console.error('[Twilio] Error saving call to database:', dbError);
      // Continue even if DB save fails
    }
    
    // Map callSid to agentId so the voice gateway can retrieve context mid-call
    try { setCallMapping(call.sid, agentId); } catch {}

    return res.json({
      success: true,
      sid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from
    });
  } catch (error) {
    console.error('Twilio outbound call error:', error?.message || error);
    return res.status(500).json({ error: true, message: error.message || 'Failed to initiate call' });
  }
});

// Fetch call status by SID (requires agentId to look up credentials)
router.get('/call/:sid', async (req, res) => {
  try {
    const { sid } = req.params;
    const { agentId } = req.query;

    if (!sid || !agentId) {
      return res.status(400).json({ error: true, message: 'sid and agentId are required' });
    }

    const agent = await getAgentById(agentId);
    if (!agent) {
      return res.status(404).json({ error: true, message: 'Agent not found' });
    }

    const cfg = agent.twilioConfig || agent.twilio_config;
    if (!cfg || !cfg.accountSid || !cfg.authToken) {
      return res.status(400).json({ error: true, message: 'Agent Twilio configuration is incomplete' });
    }

    const client = twilio(cfg.accountSid, cfg.authToken);
    const call = await client.calls(sid).fetch();

    return res.json({
      success: true,
      sid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from,
      duration: call.duration,
      direction: call.direction,
      startTime: call.startTime,
      endTime: call.endTime
    });
  } catch (error) {
    console.error('Twilio call status error:', error?.message || error);
    return res.status(500).json({ error: true, message: error.message || 'Failed to fetch call status' });
  }
});

// Twilio status webhook: logs server-side call lifecycle events
router.post('/status', async (req, res) => {
  try {
    const {
      CallSid,
      CallStatus,
      CallDuration,
      From,
      To,
      Timestamp,
      SequenceNumber,
      EventType,
      AnsweredBy
    } = req.body || {};

    console.log('[Twilio] Status callback:', {
      CallSid, EventType, CallStatus, CallDuration, From, To, Timestamp, SequenceNumber
    });

    // Update call status in database
    if (CallSid) {
      try {
        const metadata = {};
        
        if (CallStatus === 'in-progress' && AnsweredBy) {
          metadata.answeredAt = new Date().toISOString();
        }
        
        if (['completed', 'failed', 'busy', 'no-answer'].includes(CallStatus)) {
          metadata.endedAt = new Date().toISOString();
          if (CallDuration) {
            metadata.duration = parseInt(CallDuration) || 0;
          }
        }
        
        await callRepo.updateCallStatus(CallSid, CallStatus || EventType, metadata);
        console.log('[Twilio] Call status updated in database');
      } catch (dbError) {
        console.error('[Twilio] Error updating call status in database:', dbError);
      }
    }

    // Update call status in in-memory store for debugging/lookup (keep for backward compatibility)
    try { if (CallSid) updateStatus(CallSid, CallStatus || EventType); } catch {}

    res.type('text/plain').send('ok');
  } catch (err) {
    console.error('[Twilio] Status callback error:', err?.message || err);
    res.status(500).send('error');
  }
});

// Fetch conversation (transcripts and agent replies) for a given call SID
router.get('/conversation/:sid', async (req, res) => {
  try {
    const { sid } = req.params;
    if (!sid) {
      return res.status(400).json({ error: true, message: 'sid is required' });
    }

    const history = getConversation(sid) || [];

    return res.json({
      success: true,
      sid,
      messages: history
    });
  } catch (error) {
    console.error('Twilio conversation fetch error:', error?.message || error);
    return res.status(500).json({ error: true, message: error.message || 'Failed to fetch conversation' });
  }
});

// Stream live transcripts via Server-Sent Events (SSE)
router.get('/transcripts/:sid/stream', async (req, res) => {
  try {
    const { sid } = req.params;
    if (!sid) {
      return res.status(400).json({ error: true, message: 'sid is required' });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Send an initial ping/meta
    res.write(`data: ${JSON.stringify({ type: 'meta', sid })}\n\n`);

    // Subscribe to transcript bus
    const unsubscribe = subscribe(
      sid,
      (payload) => {
        try { res.write(`data: ${JSON.stringify(payload)}\n\n`); } catch {}
      },
      () => {
        try { res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`); } catch {}
        try { res.end(); } catch {}
      }
    );

    // Cleanup on client disconnect
    req.on('close', () => {
      try { unsubscribe(); } catch {}
      try { res.end(); } catch {}
    });
  } catch (error) {
    console.error('Twilio transcript stream error:', error?.message || error);
    res.status(500).json({ error: true, message: error.message || 'Failed to stream transcripts' });
  }
});

// Serve generated TTS audio by id for TwiML <Play>
router.get('/audio/:audioId', async (req, res) => {
  try {
    const { audioId } = req.params;
    const blob = getAudio(audioId);
    if (!blob) {
      return res.status(404).json({ error: true, message: 'Audio not found' });
    }
    const buf = Buffer.from(blob.base64, 'base64');
    res.set('Content-Type', blob.contentType || 'audio/mpeg');
    res.set('Cache-Control', 'no-store');
    return res.send(buf);
  } catch (error) {
    console.error('Twilio audio serve error:', error?.message || error);
    return res.status(500).json({ error: true, message: error.message || 'Failed to serve audio' });
  }
});

export default router;

