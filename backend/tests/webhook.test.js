/**
 * Webhook & Unsubscribe Tests
 * 
 * Tests for SendGrid webhook processing and unsubscribe functionality
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import * as emailRepo from '../db/repositories/emailRepository.js';
import { initializeDatabase } from '../db/database.js';
import { query } from '../db/database.js';

describe('Webhooks & Unsubscribe', () => {
  let testUserId;
  let testContactId;
  let testCampaignId;
  let testRecipientId;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test user
    const users = await query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      const result = await query(`
        INSERT INTO users (id, email, name, password_hash)
        VALUES (gen_random_uuid(), 'webhook-test@example.com', 'Webhook Test User', 'hash')
        RETURNING id
      `);
      testUserId = result[0].id;
    } else {
      testUserId = users[0].id;
    }

    // Create test contact
    const contactResult = await query(`
      INSERT INTO email_contacts (id, user_id, email, first_name, last_name, is_subscribed)
      VALUES (gen_random_uuid(), $1, 'webhook@example.com', 'Webhook', 'User', true)
      RETURNING id
    `, [testUserId]);
    testContactId = contactResult[0].id;

    // Create test campaign
    const campaignResult = await query(`
      INSERT INTO email_campaigns (id, user_id, name, subject, status)
      VALUES (gen_random_uuid(), $1, 'Webhook Test', 'Subject', 'sent')
      RETURNING id
    `, [testUserId]);
    testCampaignId = campaignResult[0].id;

    // Create test recipient
    const recipientResult = await query(`
      INSERT INTO campaign_recipients (id, campaign_id, contact_id, status, sent_at)
      VALUES (gen_random_uuid(), $1, $2, 'sent', CURRENT_TIMESTAMP)
      RETURNING id
    `, [testCampaignId, testContactId]);
    testRecipientId = recipientResult[0].id;
  });

  afterAll(async () => {
    // Cleanup
    if (testRecipientId) {
      await query('DELETE FROM campaign_recipients WHERE id = $1', [testRecipientId]);
    }
    if (testCampaignId) {
      await query('DELETE FROM email_campaigns WHERE id = $1', [testCampaignId]);
    }
    if (testContactId) {
      await query('DELETE FROM email_contacts WHERE id = $1', [testContactId]);
    }
  });

  it('should unsubscribe a contact', async () => {
    // Call unsubscribe
    const result = await emailRepo.unsubscribeContact(testContactId);
    expect(result).toBeDefined();
    expect(result.is_subscribed).toBe(false);

    // Verify in DB
    const contact = await emailRepo.getContactById(testContactId, testUserId);
    expect(contact.is_subscribed).toBe(false);
  });

  it('should update campaign stats', async () => {
    // Create a fake open event
    await emailRepo.updateCampaignRecipient(testRecipientId, {
      status: 'opened',
      opened_at: new Date().toISOString()
    });

    // Update stats
    await emailRepo.updateCampaignStats(testCampaignId);

    // Check campaign stats
    const stats = await emailRepo.getCampaignStats(testCampaignId, testUserId);
    expect(parseInt(stats.total_opened)).toBeGreaterThan(0);
  });
});

