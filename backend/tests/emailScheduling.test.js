/**
 * Email Scheduling Tests
 * 
 * Tests for campaign scheduling functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as emailRepo from '../db/repositories/emailRepository.js';
import { initializeDatabase } from '../db/database.js';
import { query } from '../db/database.js';

describe('Email Campaign Scheduling', () => {
  let testUserId;
  let testTemplateId;
  let testCampaignId;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test user
    const users = await query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      const result = await query(`
        INSERT INTO users (id, email, name, password_hash)
        VALUES (gen_random_uuid(), 'schedule-test@example.com', 'Schedule Test User', 'hash')
        RETURNING id
      `);
      testUserId = result[0].id;
    } else {
      testUserId = users[0].id;
    }

    // Create test template
    const templateResult = await query(`
      INSERT INTO email_templates (id, user_id, name, html_content)
      VALUES (gen_random_uuid(), $1, 'Schedule Test Template', '<html>Test</html>')
      RETURNING id
    `, [testUserId]);
    testTemplateId = templateResult[0].id;
  });

  afterAll(async () => {
    // Cleanup
    if (testCampaignId) {
      await query('DELETE FROM campaign_lists WHERE campaign_id = $1', [testCampaignId]);
      await query('DELETE FROM email_campaigns WHERE id = $1', [testCampaignId]);
    }
    if (testTemplateId) {
      await query('DELETE FROM email_templates WHERE id = $1', [testTemplateId]);
    }
  });

  it('should create campaign with scheduled_at', async () => {
    const scheduledDate = new Date();
    scheduledDate.setHours(scheduledDate.getHours() + 1);

    const campaignData = {
      name: 'Scheduled Campaign Test',
      subject: 'Scheduled Test',
      template_id: testTemplateId,
      scheduled_at: scheduledDate.toISOString()
    };

    const campaign = await emailRepo.createCampaign(testUserId, campaignData);
    expect(campaign).toBeDefined();
    expect(campaign.name).toBe(campaignData.name);
    expect(campaign.status).toBe('draft');
    testCampaignId = campaign.id;
  });

  it('should update campaign to scheduled status', async () => {
    const scheduledDate = new Date();
    scheduledDate.setHours(scheduledDate.getHours() + 1);

    const updatedCampaign = await emailRepo.updateCampaign(testCampaignId, testUserId, {
      scheduled_at: scheduledDate.toISOString(),
      status: 'scheduled'
    });

    expect(updatedCampaign).toBeDefined();
    expect(updatedCampaign.status).toBe('scheduled');
    expect(updatedCampaign.scheduled_at).toBeDefined();
  });

  it('should get scheduled campaigns', async () => {
    const scheduledCampaigns = await emailRepo.getScheduledCampaigns();
    expect(Array.isArray(scheduledCampaigns)).toBe(true);
  });

  it('should cancel scheduled campaign', async () => {
    const updatedCampaign = await emailRepo.updateCampaign(testCampaignId, testUserId, {
      scheduled_at: null,
      status: 'draft'
    });

    expect(updatedCampaign).toBeDefined();
    expect(updatedCampaign.status).toBe('draft');
    expect(updatedCampaign.scheduled_at).toBeNull();
  });
});

