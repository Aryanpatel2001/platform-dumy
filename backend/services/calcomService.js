
import axios from 'axios';
import { DateTime } from 'luxon';
 
const CAL_API_BASE = 'https://api.cal.com/v2';
const CAL_API_VERSION = '2024-09-04'; // Match Cal.com API version


/**
 * Convert user-provided date/time into Cal.com-style ISO timestamps
 * @param {Object} opts
 * @param {string} opts.date - e.g. "29 Oct"
 * @param {string} opts.time - e.g. "2 pm"
 * @param {string} opts.timeZone - e.g. "Asia/Calcutta"
 * @param {number} opts.duration - event length in minutes
 */
export function convertToCalTime({ date, time, timeZone, duration }) {
  try {
    const currentYear = new Date().getFullYear();

    // Try multiple time formats to handle different input patterns
    const timeFormats = [
      'h:mm a',  // 11:30 am
      'h a',     // 11 am
      'HH:mm',   // 23:30 (24-hour)
      'H:mm'     // 9:30 (24-hour without leading zero)
    ];

    let start = null;
    
    // Try each time format until one works
    for (const timeFormat of timeFormats) {
      start = DateTime.fromFormat(`${date} ${currentYear} ${time}`, `d LLL yyyy ${timeFormat}`, { zone: timeZone });
      if (start.isValid) break;
    }

    if (!start || !start.isValid) {
      throw new Error(`Invalid date/time format: ${date} ${time}`);
    }

    // Add duration minutes for end time
    const end = start.plus({ minutes: duration });

    return {
      start: start.toISO(),
      end: end.toISO()
    };
  } catch (error) {
    console.error('❌ convertToCalTime error:', error.message);
    return null;
  }
}

 

export async function getUserProfile(apiKey) {
  try {
    console.log('🌐 Calling Cal.com /me API...');
    const response = await axios.get(`https://api.cal.com/v1/me?apiKey=${apiKey}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Cal.com API returns different structures, handle both
    const userData = response.data.user || response.data;

    console.log('Raw Cal.com response:', userData);
    
    console.log('✅ Cal.com user profile:', {
      username: userData.username,
      timeZone: userData.timeZone,
      email: userData.email
    });
    return { success: true, user: userData };
  } catch (error) {
    console.error('❌ Cal.com user profile error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

/**
 * Get event type details from Cal.com
 */
export async function getEventType(apiKey, eventTypeId) {
  try {
    console.log('🌐 Calling Cal.com event-types API...');
    const response = await axios.get(`https://api.cal.com/v1/event-types/${eventTypeId}?apiKey=${apiKey}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const eventTypeData = response.data.event_type || response.data;

    console.log('✅ Cal.com event type:', {
      id: eventTypeData.id,
      title: eventTypeData.title,
      length: eventTypeData.length,
      slug: eventTypeData.slug,
      link: eventTypeData.link
    });
    
    return { success: true, eventType: eventTypeData };
  } catch (error) {
    console.error('❌ Cal.com event type error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

/**
 * Check calendar availability from Cal.com
 */
export async function checkAvailability(config) {
  try {
    const { apiKey, eventTypeId, startDate, endDate, timezone } = config;
    console.log('🔍🔍🔍🔍🔍🔍🔍check this ', startDate , endDate);
 
    const start = startDate
    const end = endDate ;
 
    const response = await axios.get(`${CAL_API_BASE}/slots`, {
      params: {
        eventTypeId,
        start,
        end,
        timeZone: timezone || 'UTC',
        format: 'range'
      },
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'cal-api-version': CAL_API_VERSION,
        'Content-Type': 'application/json'
      }
    });
 
    const { data } = response;
    if (!data || data.status !== 'success' || !data.data) {
      return { success: false, error: data?.error || 'Invalid response from Cal.com API', availableSlots: [] };
    }
 
    const availableSlots = Object.entries(data.data).flatMap(
      ([dateStr, slots]) =>
        Array.isArray(slots)
          ? slots.map(slot => ({
              date: dateStr,
              start: slot.start,
              end: slot.end,
              timeFormatted: DateTime.fromISO(slot.start).toLocaleString(DateTime.TIME_SIMPLE),
              dateFormatted: DateTime.fromISO(slot.start).toLocaleString(DateTime.DATE_MED)
            }))
          : []
    );
 
    return { success: true, availableSlots, count: availableSlots.length, timezone: timezone || 'UTC' };
 
  } catch (error) {
    const errData = error.response?.data || {};
    console.error('❌ Cal.com availability error:', errData);
    throw new Error(`Failed to check availability: ${errData.error?.message || errData.message || error.message || 'Unknown error'}`);
  }
}
 
/**
 * Book an appointment via Cal.com API
 */
export async function bookAppointment(config) {
  try {
    const { apiKey, eventTypeId, startTime, attendeeName, attendeeEmail, attendeeTimezone } = config;
 
    console.log('📅 Booking request:', { apiKey, eventTypeId, startTime, attendeeName, attendeeEmail, attendeeTimezone });
 
    const response = await axios.post(
      'https://api.cal.com/v2/bookings', // must be exact
      {
        eventTypeId: parseInt(eventTypeId), // number
        start: startTime,
        attendee: {
          name: attendeeName,
          email: attendeeEmail,
          timeZone: attendeeTimezone
        },
        metadata: { source: 'ai-agent-platform' }
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'cal-api-version': '2024-08-13',
          'Content-Type': 'application/json'
        }
      }
    );
 
    const booking = response.data.data;
    return { success: true, booking };
 
  } catch (error) {
    console.error('Cal.com booking error:', error.response?.data || error.message);
    throw new Error(`Failed to book appointment: ${error.response?.data?.error?.message || error.message}`);
  }
}
 
 
/**
 * Convert human-readable date + time into ISO 8601 string in given timezone
 */
export function parseDateTimeToISO(dateStr, timeStr, tz = 'UTC') {
  // Clean the date string (remove "th", "st", "nd", "rd")
  const cleanedDate = dateStr.replace(/(\d+)(st|nd|rd|th)/, '$1');
 
  // Try multiple date formats
  const formats = [
    'd LLL yyyy hh:mm a', // 29 Oct 2025 04:00 PM
    'd LLL hh:mm a',      // 29 Oct 04:00 PM
    'd LLL yyyy h:mm a',  // 29 Oct 2025 4:00 PM
    'd LLL h:mm a',       // 29 Oct 4:00 PM
    'd LLL yyyy h a',     // 29 Oct 2025 4 PM
    'd LLL h a'           // 29 Oct 4 PM
  ];
 
  let dt = null;
 
  for (const fmt of formats) {
    dt = DateTime.fromFormat(`${cleanedDate} ${timeStr}`, fmt, { zone: tz });
    if (dt.isValid) break;
  }
 
  if (!dt || !dt.isValid) {
    throw new Error(`Invalid date/time: ${dateStr} ${timeStr} in timezone ${tz}`);
  }
 
  return dt.toUTC().toISO(); // Convert to UTC ISO string
}
 
/**
 * Execute Cal.com function based on type
 */
export async function executeCalComFunction(functionConfig, parameters) {
  const { sub_type, api_key: apiKey, event_type_id, timezone } = functionConfig;

  const userTimezone = await getUserProfile(apiKey);
  const userTimeZone = userTimezone?.user?.timeZone || timezone || 'UTC';
  const eventId = await getEventType(apiKey, event_type_id);

  const timeResult = convertToCalTime({
    date: parameters.date,
    time: parameters.time,
    timeZone: userTimeZone,
    duration: eventId?.length || 30
  });

  if (!timeResult) {
    throw new Error(`Failed to parse date/time: ${parameters.date} ${parameters.time}`);
  }

  const { start, end } = timeResult;

  console.log('[Cal.com] Converted time:', { start, end });
 
  if (sub_type === 'check_availability') {
    return await checkAvailability({
      apiKey,
      eventTypeId: event_type_id,
      startDate: start,
      endDate: end,
      timezone: userTimeZone
    });
  } else if (sub_type === 'book_appointment') {
    let startTime = start;
 
    if (!startTime && parameters.date && parameters.time) {
      startTime = parseDateTimeToISO(parameters.date, parameters.time, userTimeZone);
    }
 
    if (!startTime) throw new Error('⚠️ Missing startTime or date+time parameters');
 
    return await bookAppointment({
      apiKey,
      eventTypeId: event_type_id,
      startTime,
      attendeeName: userTimezone?.user?.username || parameters.attendee_name || 'Guest User',
      attendeeEmail: userTimezone?.user?.email || parameters.attendee_email || 'guest@example.com',
      attendeeTimezone: userTimeZone,
    });
  }
 
  throw new Error(`Unknown Cal.com function type: ${sub_type}`);
}
 
export default {
  checkAvailability,
  bookAppointment,
  executeCalComFunction
};