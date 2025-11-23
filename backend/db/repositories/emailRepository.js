/**
 * Email Marketing Repository - Database operations for email marketing
 * 
 * Handles all database operations for campaigns, templates, contacts, and lists
 */

import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// EMAIL CAMPAIGNS
// ============================================================================

export async function createCampaign(userId, campaignData) {
  try {
    // Support both camelCase and snake_case field names
    const {
      agent_id = campaignData.agentId,
      name,
      subject,
      preview_text = campaignData.previewText,
      from_name = campaignData.fromName,
      from_email = campaignData.fromEmail,
      reply_to = campaignData.replyTo,
      template_id = campaignData.templateId,
      html_content = campaignData.htmlContent,
      plain_text_content = campaignData.plainTextContent,
      scheduled_at = campaignData.scheduledAt,
      metadata
    } = campaignData;

    const result = await query(`
      INSERT INTO email_campaigns (
        id, user_id, agent_id, name, subject, preview_text, from_name, 
        from_email, reply_to, template_id, html_content, plain_text_content,
        scheduled_at, metadata, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'draft')
      RETURNING *
    `, [
      uuidv4(), userId, agent_id || null, name, subject, preview_text || null,
      from_name || null, from_email || null, reply_to || null, template_id || null,
      html_content || null, plain_text_content || null, scheduled_at || null,
      metadata ? JSON.stringify(metadata) : null
    ]);

    return result[0];
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw new Error(`Failed to create campaign: ${error.message}`);
  }
}

export async function getCampaignsByUser(userId) {
  try {
    const campaigns = await query(`
      SELECT 
        c.*,
        COUNT(DISTINCT cr.id) as total_recipients,
        COUNT(DISTINCT CASE WHEN cr.status = 'sent' THEN cr.id END) as total_sent,
        COUNT(DISTINCT CASE WHEN cr.status = 'delivered' THEN cr.id END) as total_delivered,
        COUNT(DISTINCT CASE WHEN cr.opened_at IS NOT NULL THEN cr.id END) as total_opened,
        COUNT(DISTINCT CASE WHEN cr.clicked_at IS NOT NULL THEN cr.id END) as total_clicked
      FROM email_campaigns c
      LEFT JOIN campaign_recipients cr ON c.id = cr.campaign_id
      WHERE c.user_id = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `, [userId]);

    return campaigns;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw new Error(`Failed to fetch campaigns: ${error.message}`);
  }
}

export async function getCampaignById(campaignId, userId = null) {
  try {
    let sql = `
      SELECT c.*, t.name as template_name
      FROM email_campaigns c
      LEFT JOIN email_templates t ON c.template_id = t.id
      WHERE c.id = $1
    `;
    const params = [campaignId];

    if (userId) {
      sql += ' AND c.user_id = $2';
      params.push(userId);
    }

    const result = await query(sql, params);
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching campaign:', error);
    throw new Error(`Failed to fetch campaign: ${error.message}`);
  }
}

export async function updateCampaign(campaignId, userId, updates) {
  try {
    const allowedFields = [
      'name', 'subject', 'preview_text', 'from_name', 'from_email', 'reply_to',
      'template_id', 'html_content', 'plain_text_content', 'status', 'scheduled_at', 'metadata',
      'total_recipients', 'total_sent', 'total_delivered', 'total_opened', 'total_clicked',
      'total_bounced', 'total_unsubscribed', 'sent_at'
    ];

    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        setClause.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(campaignId, userId);
    const result = await query(`
      UPDATE email_campaigns
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `, values);

    return result[0] || null;
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw new Error(`Failed to update campaign: ${error.message}`);
  }
}

export async function deleteCampaign(campaignId, userId) {
  try {
    await query(`
      DELETE FROM email_campaigns
      WHERE id = $1 AND user_id = $2
    `, [campaignId, userId]);
    return true;
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw new Error(`Failed to delete campaign: ${error.message}`);
  }
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export async function createTemplate(userId, templateData) {
  try {
    const {
      name,
      description,
      category,
      thumbnailUrl,
      thumbnail_url,
      htmlContent,
      html_content,
      subject_template,
      subjectTemplate,
      designJson,
      design_json
    } = templateData;

    // Support both camelCase and snake_case
    const htmlContentValue = htmlContent || html_content;
    const thumbnailUrlValue = thumbnailUrl || thumbnail_url;
    const subjectTemplateValue = subjectTemplate || subject_template;
    const designJsonValue = designJson || design_json;

    if (!htmlContentValue) {
      throw new Error('HTML content is required');
    }

    const result = await query(`
      INSERT INTO email_templates (
        id, user_id, name, description, category, thumbnail_url,
        html_content, design_json
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      uuidv4(), userId, name, description || null, category || null,
      thumbnailUrlValue || null, htmlContentValue,
      designJsonValue ? JSON.stringify(designJsonValue) : null
    ]);

    return result[0];
  } catch (error) {
    console.error('Error creating template:', error);
    throw new Error(`Failed to create template: ${error.message}`);
  }
}

export async function getTemplatesByUser(userId) {
  try {
    const templates = await query(`
      SELECT *
      FROM email_templates
      WHERE user_id = $1 OR is_public = true
      ORDER BY is_favorite DESC, created_at DESC
    `, [userId]);

    return templates;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw new Error(`Failed to fetch templates: ${error.message}`);
  }
}

export async function getTemplateById(templateId, userId = null) {
  try {
    let sql = 'SELECT * FROM email_templates WHERE id = $1';
    const params = [templateId];

    if (userId) {
      sql += ' AND (user_id = $2 OR is_public = true)';
      params.push(userId);
    }

    const result = await query(sql, params);
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching template:', error);
    throw new Error(`Failed to fetch template: ${error.message}`);
  }
}

// ============================================================================
// CONTACTS
// ============================================================================

export async function createContact(userId, contactData) {
  try {
    // Support both camelCase and snake_case field names
    const {
      email,
      first_name = contactData.firstName,
      last_name = contactData.lastName,
      phone,
      company_name = contactData.company,
      tags,
      custom_fields = contactData.customFields,
      source
    } = contactData;

    const result = await query(`
      INSERT INTO email_contacts (
        id, user_id, email, first_name, last_name, phone, company,
        tags, custom_fields, source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id, email) 
      DO UPDATE SET
        first_name = COALESCE(EXCLUDED.first_name, email_contacts.first_name),
        last_name = COALESCE(EXCLUDED.last_name, email_contacts.last_name),
        phone = COALESCE(EXCLUDED.phone, email_contacts.phone),
        company = COALESCE(EXCLUDED.company, email_contacts.company),
        tags = COALESCE(EXCLUDED.tags, email_contacts.tags),
        custom_fields = COALESCE(EXCLUDED.custom_fields, email_contacts.custom_fields),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      uuidv4(), userId, email, first_name || null, last_name || null,
      phone || null, company_name || null, tags || [],
      custom_fields ? JSON.stringify(custom_fields) : null, source || 'manual'
    ]);

    return result[0];
  } catch (error) {
    console.error('Error creating contact:', error);
    throw new Error(`Failed to create contact: ${error.message}`);
  }
}

export async function getContactsByUser(userId, filters = {}) {
  try {
    let sql = 'SELECT * FROM email_contacts WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (filters.isSubscribed !== undefined) {
      sql += ` AND is_subscribed = $${paramIndex}`;
      params.push(filters.isSubscribed);
      paramIndex++;
    }

    if (filters.search) {
      sql += ` AND (
        email ILIKE $${paramIndex} OR 
        first_name ILIKE $${paramIndex} OR 
        last_name ILIKE $${paramIndex} OR
        company ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    sql += ' ORDER BY created_at DESC LIMIT $' + paramIndex;
    params.push(filters.limit || 100);

    const contacts = await query(sql, params);
    return contacts;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw new Error(`Failed to fetch contacts: ${error.message}`);
  }
}

export async function getContactById(contactId, userId) {
  try {
    const result = await query(`
      SELECT * FROM email_contacts
      WHERE id = $1 AND user_id = $2
    `, [contactId, userId]);

    return result[0] || null;
  } catch (error) {
    console.error('Error fetching contact:', error);
    throw new Error(`Failed to fetch contact: ${error.message}`);
  }
}

export async function updateContact(contactId, userId, contactData) {
  try {
    // Support both camelCase and snake_case field names
    const {
      first_name = contactData.firstName,
      last_name = contactData.lastName,
      phone,
      company_name = contactData.company,
      tags,
      custom_fields = contactData.customFields,
      is_subscribed
    } = contactData;

    const setClause = [];
    const values = [];
    let paramIndex = 1;

    if (first_name !== undefined) {
      setClause.push(`first_name = $${paramIndex}`);
      values.push(first_name || null);
      paramIndex++;
    }
    if (last_name !== undefined) {
      setClause.push(`last_name = $${paramIndex}`);
      values.push(last_name || null);
      paramIndex++;
    }
    if (company_name !== undefined) {
      setClause.push(`company = $${paramIndex}`);
      values.push(company_name || null);
      paramIndex++;
    }
    if (phone !== undefined) {
      setClause.push(`phone = $${paramIndex}`);
      values.push(phone || null);
      paramIndex++;
    }
    if (tags !== undefined) {
      setClause.push(`tags = $${paramIndex}`);
      values.push(Array.isArray(tags) ? tags : []);
      paramIndex++;
    }
    if (custom_fields !== undefined) {
      setClause.push(`custom_fields = $${paramIndex}`);
      values.push(custom_fields ? JSON.stringify(custom_fields) : null);
      paramIndex++;
    }
    if (is_subscribed !== undefined) {
      setClause.push(`is_subscribed = $${paramIndex}`);
      values.push(is_subscribed);
      paramIndex++;
    }

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(contactId, userId);
    const result = await query(`
      UPDATE email_contacts
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `, values);

    return result[0] || null;
  } catch (error) {
    console.error('Error updating contact:', error);
    throw new Error(`Failed to update contact: ${error.message}`);
  }
}

export async function deleteContact(contactId, userId) {
  try {
    const result = await query(`
      DELETE FROM email_contacts
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [contactId, userId]);

    return result[0] || null;
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw new Error(`Failed to delete contact: ${error.message}`);
  }
}

// ============================================================================
// CONTACT LISTS
// ============================================================================

export async function createList(userId, listData) {
  try {
    const { name, description } = listData;

    const result = await query(`
      INSERT INTO contact_lists (id, user_id, name, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [uuidv4(), userId, name, description || null]);

    return result[0];
  } catch (error) {
    console.error('Error creating list:', error);
    throw new Error(`Failed to create list: ${error.message}`);
  }
}

export async function getListsByUser(userId) {
  try {
    // Get lists with accurate contact counts
    const lists = await query(`
      SELECT 
        l.*,
        COALESCE(COUNT(DISTINCT clm.contact_id), 0)::INTEGER as contact_count
      FROM contact_lists l
      LEFT JOIN contact_list_members clm ON l.id = clm.list_id
      WHERE l.user_id = $1
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `, [userId]);

    // Update total_contacts column in batch for all lists
    if (lists.length > 0) {
      const listIds = lists.map(l => l.id);
      await query(`
        UPDATE contact_lists
        SET total_contacts = subquery.contact_count,
            updated_at = CURRENT_TIMESTAMP
        FROM (
          SELECT 
            l.id,
            COALESCE(COUNT(DISTINCT clm.contact_id), 0)::INTEGER as contact_count
          FROM contact_lists l
          LEFT JOIN contact_list_members clm ON l.id = clm.list_id
          WHERE l.id = ANY($1)
          GROUP BY l.id
        ) AS subquery
        WHERE contact_lists.id = subquery.id
      `, [listIds]);
    }

    return lists;
  } catch (error) {
    console.error('Error fetching lists:', error);
    throw new Error(`Failed to fetch lists: ${error.message}`);
  }
}

export async function getListById(listId, userId) {
  try {
    const result = await query(`
      SELECT * FROM contact_lists
      WHERE id = $1 AND user_id = $2
    `, [listId, userId]);

    return result[0] || null;
  } catch (error) {
    console.error('Error fetching list:', error);
    throw new Error(`Failed to fetch list: ${error.message}`);
  }
}

export async function updateList(listId, userId, updates) {
  try {
    const { name, description } = updates;

    const setClause = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      setClause.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }
    if (description !== undefined) {
      setClause.push(`description = $${paramIndex}`);
      values.push(description || null);
      paramIndex++;
    }

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(listId, userId);
    const result = await query(`
      UPDATE contact_lists
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `, values);

    return result[0] || null;
  } catch (error) {
    console.error('Error updating list:', error);
    throw new Error(`Failed to update list: ${error.message}`);
  }
}

export async function deleteList(listId, userId) {
  try {
    // Delete list members first (cascade should handle this, but being explicit)
    await query(`
      DELETE FROM contact_list_members
      WHERE list_id = $1
    `, [listId]);

    // Delete the list
    const result = await query(`
      DELETE FROM contact_lists
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [listId, userId]);

    return result[0] || null;
  } catch (error) {
    console.error('Error deleting list:', error);
    throw new Error(`Failed to delete list: ${error.message}`);
  }
}

export async function addContactsToList(listId, contactIds) {
  try {
    if (!contactIds || contactIds.length === 0) {
      return true;
    }

    const values = contactIds.map((contactId, index) => {
      const baseIndex = index * 3;
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`;
    }).join(', ');

    const params = contactIds.flatMap(id => [uuidv4(), listId, id]);

    await query(`
      INSERT INTO contact_list_members (id, list_id, contact_id)
      VALUES ${values}
      ON CONFLICT (list_id, contact_id) DO NOTHING
    `, params);

    // Update list total_contacts column with actual count
    await query(`
      UPDATE contact_lists
      SET total_contacts = (
        SELECT COUNT(DISTINCT contact_id)::INTEGER 
        FROM contact_list_members 
        WHERE list_id = $1
      ),
      updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [listId]);

    return true;
  } catch (error) {
    console.error('Error adding contacts to list:', error);
    throw new Error(`Failed to add contacts to list: ${error.message}`);
  }
}

export async function getContactsByList(listId, userId) {
  try {
    const contacts = await query(`
      SELECT ec.*
      FROM email_contacts ec
      INNER JOIN contact_list_members clm ON ec.id = clm.contact_id
      WHERE clm.list_id = $1 AND ec.user_id = $2 AND ec.is_subscribed = true
      ORDER BY ec.created_at DESC
    `, [listId, userId]);

    return contacts;
  } catch (error) {
    console.error('Error fetching list contacts:', error);
    throw new Error(`Failed to fetch list contacts: ${error.message}`);
  }
}

// ============================================================================
// CAMPAIGN RECIPIENTS
// ============================================================================

export async function createCampaignRecipient(campaignId, contactId, status = 'sent') {
  try {
    const result = await query(`
      INSERT INTO campaign_recipients (
        id, campaign_id, contact_id, status, sent_at
      )
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *
    `, [uuidv4(), campaignId, contactId, status]);

    return result[0];
  } catch (error) {
    console.error('Error creating campaign recipient:', error);
    throw new Error(`Failed to create campaign recipient: ${error.message}`);
  }
}

export async function updateCampaignRecipient(recipientId, updates) {
  try {
    const allowedFields = ['status', 'delivered_at', 'opened_at', 'clicked_at', 'bounced_at', 'bounce_reason', 'opens_count', 'clicks_count'];
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      return null;
    }

    values.push(recipientId);
    const result = await query(`
      UPDATE campaign_recipients
      SET ${setClause.join(', ')}, last_activity_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    return result[0] || null;
  } catch (error) {
    console.error('Error updating campaign recipient:', error);
    throw new Error(`Failed to update campaign recipient: ${error.message}`);
  }
}

export async function getCampaignRecipient(campaignId, contactId) {
  try {
    const result = await query(`
      SELECT * FROM campaign_recipients
      WHERE campaign_id = $1 AND contact_id = $2
      LIMIT 1
    `, [campaignId, contactId]);
    return result[0];
  } catch (error) {
    console.error('Error fetching campaign recipient:', error);
    throw new Error(`Failed to fetch campaign recipient: ${error.message}`);
  }
}

export async function unsubscribeContact(contactId) {
  try {
    const result = await query(`
      UPDATE email_contacts
      SET is_subscribed = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [contactId]);
    return result[0];
  } catch (error) {
    console.error('Error unsubscribing contact:', error);
    throw new Error(`Failed to unsubscribe contact: ${error.message}`);
  }
}

export async function updateCampaignStats(campaignId) {
  try {
    // Recalculate stats from recipients table
    const stats = await query(`
      SELECT
        COUNT(*) as total_sent,
        COUNT(CASE WHEN delivered_at IS NOT NULL THEN 1 END) as total_delivered,
        COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as total_opened,
        COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as total_clicked,
        COUNT(CASE WHEN bounced_at IS NOT NULL THEN 1 END) as total_bounced
      FROM campaign_recipients
      WHERE campaign_id = $1
    `, [campaignId]);

    if (stats[0]) {
      await query(`
        UPDATE email_campaigns
        SET 
          total_sent = $1,
          total_delivered = $2,
          total_opened = $3,
          total_clicked = $4,
          total_bounced = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `, [
        stats[0].total_sent,
        stats[0].total_delivered,
        stats[0].total_opened,
        stats[0].total_clicked,
        stats[0].total_bounced,
        campaignId
      ]);
    }
  } catch (error) {
    console.error('Error updating campaign stats:', error);
    // Don't throw, just log - this is a background task
  }
}

export async function getCampaignStats(campaignId, userId) {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_recipients,
        COUNT(CASE WHEN cr.status = 'sent' THEN 1 END) as total_sent,
        COUNT(CASE WHEN cr.status = 'delivered' THEN 1 END) as total_delivered,
        COUNT(CASE WHEN cr.opened_at IS NOT NULL THEN 1 END) as total_opened,
        COUNT(CASE WHEN cr.clicked_at IS NOT NULL THEN 1 END) as total_clicked,
        COUNT(CASE WHEN cr.bounced_at IS NOT NULL THEN 1 END) as total_bounced
      FROM campaign_recipients cr
      INNER JOIN email_campaigns c ON cr.campaign_id = c.id
      WHERE cr.campaign_id = $1 AND c.user_id = $2
    `, [campaignId, userId]);

    return stats[0] || {};
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    throw new Error(`Failed to fetch campaign stats: ${error.message}`);
  }
}

/**
 * Get time-series analytics for a campaign
 */
export async function getCampaignTimeSeries(campaignId, userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await query(`
      SELECT 
        DATE(cr.sent_at) as date,
        COUNT(*) as sent,
        COUNT(CASE WHEN cr.delivered_at IS NOT NULL THEN 1 END) as delivered,
        COUNT(CASE WHEN cr.opened_at IS NOT NULL THEN 1 END) as opened,
        COUNT(CASE WHEN cr.clicked_at IS NOT NULL THEN 1 END) as clicked,
        COUNT(CASE WHEN cr.bounced_at IS NOT NULL THEN 1 END) as bounced
      FROM campaign_recipients cr
      INNER JOIN email_campaigns c ON cr.campaign_id = c.id
      WHERE cr.campaign_id = $1 
        AND c.user_id = $2
        AND cr.sent_at >= $3
      GROUP BY DATE(cr.sent_at)
      ORDER BY date ASC
    `, [campaignId, userId, startDate.toISOString()]);

    return stats;
  } catch (error) {
    console.error('Error fetching campaign time series:', error);
    throw new Error(`Failed to fetch campaign time series: ${error.message}`);
  }
}

/**
 * Get overall email marketing analytics for a user
 */
export async function getUserEmailAnalytics(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_campaigns,
        COUNT(DISTINCT cr.id) as total_emails_sent,
        COUNT(DISTINCT CASE WHEN cr.opened_at IS NOT NULL THEN cr.id END) as total_opens,
        COUNT(DISTINCT CASE WHEN cr.clicked_at IS NOT NULL THEN cr.id END) as total_clicks,
        COUNT(DISTINCT CASE WHEN cr.bounced_at IS NOT NULL THEN cr.id END) as total_bounces,
        ROUND(
          COUNT(DISTINCT CASE WHEN cr.opened_at IS NOT NULL THEN cr.id END)::NUMERIC / 
          NULLIF(COUNT(DISTINCT cr.id), 0) * 100, 
          2
        ) as open_rate,
        ROUND(
          COUNT(DISTINCT CASE WHEN cr.clicked_at IS NOT NULL THEN cr.id END)::NUMERIC / 
          NULLIF(COUNT(DISTINCT cr.id), 0) * 100, 
          2
        ) as click_rate
      FROM email_campaigns c
      LEFT JOIN campaign_recipients cr ON c.id = cr.campaign_id
      WHERE c.user_id = $1
        AND (cr.sent_at >= $2 OR cr.sent_at IS NULL)
    `, [userId, startDate.toISOString()]);

    return stats[0] || {};
  } catch (error) {
    console.error('Error fetching user email analytics:', error);
    throw new Error(`Failed to fetch user email analytics: ${error.message}`);
  }
}

/**
 * Create A/B test campaign (parent campaign)
 */
export async function createABTest(userId, testData) {
  try {
    const { name, subject_a, subject_b, html_content_a, html_content_b, split_percentage = 50 } = testData;

    const metadata = {
      is_ab_test: true,
      split_percentage: split_percentage,
      variation_a: {
        subject: subject_a,
        html_content: html_content_a
      },
      variation_b: {
        subject: subject_b,
        html_content: html_content_b
      }
    };

    // Create parent campaign
    const parentCampaign = await createCampaign(userId, {
      name: `${name} (A/B Test)`,
      subject: subject_a, // Default to A
      html_content: html_content_a,
      status: 'draft',
      metadata: metadata
    });

    return parentCampaign;
  } catch (error) {
    console.error('Error creating A/B test:', error);
    throw new Error(`Failed to create A/B test: ${error.message}`);
  }
}

/**
 * Get A/B test results
 */
export async function getABTestResults(campaignId, userId) {
  try {
    const campaign = await getCampaignById(campaignId, userId);
    if (!campaign) {
      return null;
    }

    // Parse metadata if it's a string
    let campaignMetadata = campaign.metadata;
    if (typeof campaignMetadata === 'string') {
      try {
        campaignMetadata = JSON.parse(campaignMetadata);
      } catch (e) {
        campaignMetadata = null;
      }
    }

    if (!campaignMetadata || !campaignMetadata.is_ab_test) {
      return null;
    }

    const stats = await getCampaignStats(campaignId, userId);
    
    // Get recipient-level data for A/B split analysis
    const recipients = await query(`
      SELECT 
        cr.*,
        CASE 
          WHEN cr.contact_id % 2 = 0 THEN 'A'
          ELSE 'B'
        END as variation
      FROM campaign_recipients cr
      INNER JOIN email_campaigns c ON cr.campaign_id = c.id
      WHERE cr.campaign_id = $1 AND c.user_id = $2
    `, [campaignId, userId]);

    // Calculate stats per variation
    const variationA = recipients.filter(r => r.variation === 'A');
    const variationB = recipients.filter(r => r.variation === 'B');

    const statsA = {
      sent: variationA.length,
      opened: variationA.filter(r => r.opened_at).length,
      clicked: variationA.filter(r => r.clicked_at).length,
      open_rate: variationA.length > 0 ? (variationA.filter(r => r.opened_at).length / variationA.length * 100).toFixed(2) : 0,
      click_rate: variationA.length > 0 ? (variationA.filter(r => r.clicked_at).length / variationA.length * 100).toFixed(2) : 0
    };

    const statsB = {
      sent: variationB.length,
      opened: variationB.filter(r => r.opened_at).length,
      clicked: variationB.filter(r => r.clicked_at).length,
      open_rate: variationB.length > 0 ? (variationB.filter(r => r.opened_at).length / variationB.length * 100).toFixed(2) : 0,
      click_rate: variationB.length > 0 ? (variationB.filter(r => r.clicked_at).length / variationB.length * 100).toFixed(2) : 0
    };

    return {
      campaign: {
        ...campaign,
        metadata: campaignMetadata
      },
      variation_a: statsA,
      variation_b: statsB,
      winner: parseFloat(statsA.open_rate) > parseFloat(statsB.open_rate) ? 'A' : 'B'
    };
  } catch (error) {
    console.error('Error fetching A/B test results:', error);
    throw new Error(`Failed to fetch A/B test results: ${error.message}`);
  }
}

/**
 * Get campaigns scheduled to be sent (for cron job)
 */
export async function getScheduledCampaigns() {
  try {
    const campaigns = await query(`
      SELECT c.*, 
        ARRAY_AGG(DISTINCT cl.list_id) FILTER (WHERE cl.list_id IS NOT NULL) as list_ids
      FROM email_campaigns c
      LEFT JOIN campaign_lists cl ON c.id = cl.campaign_id
      WHERE c.status = 'scheduled'
        AND c.scheduled_at IS NOT NULL
        AND c.scheduled_at <= CURRENT_TIMESTAMP
      GROUP BY c.id
      ORDER BY c.scheduled_at ASC
    `);

    return campaigns;
  } catch (error) {
    console.error('Error fetching scheduled campaigns:', error);
    throw new Error(`Failed to fetch scheduled campaigns: ${error.message}`);
  }
}

/**
 * Get campaign lists for a campaign
 */
export async function getCampaignLists(campaignId) {
  try {
    const lists = await query(`
      SELECT cl.list_id, cl.id
      FROM campaign_lists cl
      WHERE cl.campaign_id = $1
    `, [campaignId]);

    return lists.map(l => l.list_id);
  } catch (error) {
    console.error('Error fetching campaign lists:', error);
    throw new Error(`Failed to fetch campaign lists: ${error.message}`);
  }
}

/**
 * Add lists to campaign
 */
export async function addListsToCampaign(campaignId, listIds) {
  try {
    if (!listIds || listIds.length === 0) {
      return [];
    }

    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    for (const listId of listIds) {
      placeholders.push(`($${paramIndex}, $${paramIndex + 1})`);
      values.push(campaignId, listId);
      paramIndex += 2;
    }

    const result = await query(`
      INSERT INTO campaign_lists (campaign_id, list_id)
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (campaign_id, list_id) DO NOTHING
      RETURNING *
    `, values);

    return result;
  } catch (error) {
    console.error('Error adding lists to campaign:', error);
    throw new Error(`Failed to add lists to campaign: ${error.message}`);
  }
}

