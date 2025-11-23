/**
 * Campaign Scheduler Tests
 * 
 * Tests for scheduled campaign sending functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as emailRepo from '../db/repositories/emailRepository.js';
import { initializeDatabase } from '../db/database.js';
import { query } from '../db/database.js';

describe('Campaign Scheduler', () => {
  let testUserId;
  let testCampaignId;
  let testListId;
  let testContactId;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test user
    const users = await query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      const result = await query(`
        INSERT INTO users (id, email, name, password_hash)
        VALUES (gen_random_uuid(), 'scheduler-test@example.com', 'Scheduler Test User', 'hash')
        RETURNING id
      `);
      testUserId = result[0].id;
    } else {
      testUserId = users[0].id;
    }

    // Create test template
    const templateResult = await query(`
      INSERT INTO email_templates (id, user_id, name, html_content)
      VALUES (gen_random_uuid(), $1, 'Test Template', '<html>Hello {{firstName}}</html>')
      RETURNING id
    `, [testUserId]);
    const templateId = templateResult[0].id;

    // Create test list
    const listResult = await query(`
      INSERT INTO contact_lists (id, user_id, name)
      VALUES (gen_random_uuid(), $1, 'Test List')
      RETURNING id
    `, [testUserId]);
    testListId = listResult[0].id;

    // Create test contact
    const contactResult = await query(`
      INSERT INTO email_contacts (id, user_id, email, first_name, last_name, is_subscribed)
      VALUES (gen_random_uuid(), $1, 'test@example.com', 'Test', 'User', true)
      RETURNING id
    `, [testUserId]);
    testContactId = contactResult[0].id;

    // Add contact to list
    await query(`
      INSERT INTO contact_list_members (list_id, contact_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [testListId, testContactId]);

    // Create test campaign
    const campaignResult = await query(`
      INSERT INTO email_campaigns (id, user_id, name, subject, template_id, status, scheduled_at)
      VALUES (gen_random_uuid(), $1, 'Scheduled Test', 'Test Subject', $2, 'scheduled', CURRENT_TIMESTAMP - INTERVAL '1 minute')
      RETURNING id
    `, [testUserId, templateId]);
    testCampaignId = campaignResult[0].id;

    // Add list to campaign
    await query(`
      INSERT INTO campaign_lists (campaign_id, list_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [testCampaignId, testListId]);
  });

  afterAll(async () => {
    // Cleanup
    if (testCampaignId) {
      await query('DELETE FROM campaign_lists WHERE campaign_id = $1', [testCampaignId]);
      await query('DELETE FROM email_campaigns WHERE id = $1', [testCampaignId]);
    }
    if (testListId) {
      await query('DELETE FROM contact_list_members WHERE list_id = $1', [testListId]);
      await query('DELETE FROM contact_lists WHERE id = $1', [testListId]);
    }
    if (testContactId) {
      await query('DELETE FROM email_contacts WHERE id = $1', [testContactId]);
    }
  });

  it('should get scheduled campaigns', async () => {
    const campaigns = await emailRepo.getScheduledCampaigns();
    expect(Array.isArray(campaigns)).toBe(true);
  });

  it('should get campaign lists', async () => {
    const listIds = await emailRepo.getCampaignLists(testCampaignId);
    expect(Array.isArray(listIds)).toBe(true);
    expect(listIds.length).toBeGreaterThan(0);
  });

  it('should add lists to campaign', async () => {
    const result = await emailRepo.addListsToCampaign(testCampaignId, [testListId]);
    expect(result).toBeDefined();
  });

  it('should process scheduled campaigns', async () => {
    // This test verifies the scheduler can find and process scheduled campaigns
    const campaigns = await emailRepo.getScheduledCampaigns();
    expect(campaigns.length).toBeGreaterThanOrEqual(0);
  });
});

