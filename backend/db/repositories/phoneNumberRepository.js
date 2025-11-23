import { query, transaction } from '../database.js';

// Get all phone numbers for a user
export async function getPhoneNumbersByUser(userId) {
  const result = await query(
    `SELECT id, user_id, label, phone_number, twilio_config, is_primary, created_at, updated_at
     FROM phone_numbers WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result;
}

// Create a phone number for a user
export async function createPhoneNumber(userId, data) {
  const result = await query(
    `INSERT INTO phone_numbers (user_id, label, phone_number, twilio_config, is_primary)
     VALUES ($1, $2, $3, $4, COALESCE($5, FALSE))
     RETURNING id, user_id, label, phone_number, twilio_config, is_primary, created_at, updated_at`,
    [userId, data.label || null, data.phoneNumber, data.twilioConfig || null, data.isPrimary || false]
  );
  return result[0];
}

// Update a phone number (must belong to user)
export async function updatePhoneNumber(userId, id, data) {
  const fields = [];
  const values = [];
  let idx = 1;

  // Build dynamic update
  if (data.label !== undefined) { fields.push(`label = $${idx++}`); values.push(data.label); }
  if (data.phoneNumber !== undefined) { fields.push(`phone_number = $${idx++}`); values.push(data.phoneNumber); }
  if (data.twilioConfig !== undefined) { fields.push(`twilio_config = $${idx++}`); values.push(data.twilioConfig); }
  if (data.isPrimary !== undefined) { fields.push(`is_primary = $${idx++}`); values.push(!!data.isPrimary); }

  if (!fields.length) {
    const current = await query(
      `SELECT id, user_id, label, phone_number, twilio_config, is_primary, created_at, updated_at
       FROM phone_numbers WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return current[0] || null;
  }

  values.push(id); // id param
  values.push(userId); // user id param

  const result = await query(
    `UPDATE phone_numbers SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${idx++} AND user_id = $${idx}
     RETURNING id, user_id, label, phone_number, twilio_config, is_primary, created_at, updated_at`,
    values
  );
  return result[0] || null;
}

// Delete a phone number (must belong to user)
export async function deletePhoneNumber(userId, id) {
  const result = await query(
    `DELETE FROM phone_numbers WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  return !!(result && result.length);
}

// Set a phone number as primary for user (transactionally unset others)
export async function setPrimaryPhoneNumber(userId, id) {
  return await transaction(async (client) => {
    // Unset current primary numbers
    await client.query(`UPDATE phone_numbers SET is_primary = FALSE WHERE user_id = $1`, [userId]);
    // Set selected number as primary, ensuring it belongs to the user
    const res = await client.query(
      `UPDATE phone_numbers SET is_primary = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, label, phone_number, twilio_config, is_primary, created_at, updated_at`,
      [id, userId]
    );
    return res.rows[0] || null;
  });
}