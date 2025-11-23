import express from 'express';
import { checkAvailability, bookAppointment  } from '../services/calcomService.js';
import { validateCalcomBooking } from '../middleware/validation.js';
import { generalLimiter } from '../middleware/rateLimiting.js';

const router = express.Router();

// Check availability
router.post('/availability', async (req, res) => {
  try {
    const { apiKey, eventTypeId, startDate, endDate, timezone } = req.body;

    if (!apiKey || !eventTypeId) {
      return res.status(400).json({
        error: true,
        message: 'API key and event type ID are required'
      });
    }

    const availability = await checkAvailability({
      apiKey,
      eventTypeId,
      startDate,
      endDate,
      timezone
    });

    res.json(availability);
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Book appointment
router.post('/book', generalLimiter, validateCalcomBooking, async (req, res) => {
  try {
    const {
      apiKey,
      eventTypeId,
      startTime,
      attendeeName,
      attendeeEmail,
      attendeeTimezone,
      timezone
    } = req.body;

    console.log("📅 Booking request:", req.body);

    const booking = await bookAppointment({
      apiKey,
      eventTypeId,
      startTime,
      attendeeName,
      attendeeEmail,
      attendeeTimezone: attendeeTimezone || timezone,
      timezone
    });

    res.json(booking);
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

export default router;

