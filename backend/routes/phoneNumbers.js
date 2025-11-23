import express from 'express';
import { authenticateToken } from '../utils/auth.js';
import {
  getPhoneNumbersByUser,
  createPhoneNumber,
  updatePhoneNumber,
  deletePhoneNumber,
  setPrimaryPhoneNumber
} from '../db/repositories/phoneNumberRepository.js';
import twilio from 'twilio';

const router = express.Router();

// Basic validation helper
function validatePhoneNumberPayload(body, forUpdate = false) {
  const errors = [];

  if (!forUpdate) {
    if (!body?.phoneNumber) errors.push('phoneNumber is required');
    if (!body?.twilioConfig) errors.push('twilioConfig is required');
  }

  if (body?.phoneNumber && !/^\+[1-9]\d{1,14}$/.test(body.phoneNumber)) {
    errors.push('phoneNumber must be in E.164 format (+1234567890)');
  }

  if (body?.twilioConfig) {
    const { accountSid, authToken, phoneNumber } = body.twilioConfig || {};
    if (!accountSid || !authToken || !phoneNumber) {
      errors.push('twilioConfig must include accountSid, authToken, and phoneNumber');
    }
  }

  return errors;
}

// List phone numbers for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await getPhoneNumbersByUser(req.user.id);
    res.json(items);
  } catch (error) {
    console.error('List phone numbers error:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Create phone number
router.post('/', authenticateToken, async (req, res) => {
  try {
    const errors = validatePhoneNumberPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ error: true, message: errors.join(', ') });
    }

    // Server-side Twilio credential verification
    const { accountSid, authToken } = req.body.twilioConfig || {};
    try {
      const client = twilio(accountSid, authToken);
      await client.api.accounts(accountSid).fetch();
    } catch (twilioErr) {
      return res.status(400).json({ error: true, message: 'Invalid Twilio credentials' });
    }

    const created = await createPhoneNumber(req.user.id, req.body);
    res.status(201).json(created);
  } catch (error) {
    console.error('Create phone number error:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Update phone number
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const errors = validatePhoneNumberPayload(req.body, true);
    if (errors.length) {
      return res.status(400).json({ error: true, message: errors.join(', ') });
    }

    // If Twilio config is being updated, verify credentials
    if (req.body?.twilioConfig?.accountSid && req.body?.twilioConfig?.authToken) {
      const { accountSid, authToken } = req.body.twilioConfig;
      try {
        const client = twilio(accountSid, authToken);
        await client.api.accounts(accountSid).fetch();
      } catch (twilioErr) {
        return res.status(400).json({ error: true, message: 'Invalid Twilio credentials' });
      }
    }

    const updated = await updatePhoneNumber(req.user.id, req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: true, message: 'Phone number not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Update phone number error:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Delete phone number
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const ok = await deletePhoneNumber(req.user.id, req.params.id);
    if (!ok) {
      return res.status(404).json({ error: true, message: 'Phone number not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete phone number error:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Make primary
router.post('/:id/make-primary', authenticateToken, async (req, res) => {
  try {
    const updated = await setPrimaryPhoneNumber(req.user.id, req.params.id);
    if (!updated) {
      return res.status(404).json({ error: true, message: 'Phone number not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Set primary phone number error:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

export default router;