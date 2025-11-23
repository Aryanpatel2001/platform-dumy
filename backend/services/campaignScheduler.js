/**
 * Campaign Scheduler Service
 * 
 * Handles scheduled email campaign sending via cron job
 */

import cron from 'node-cron';
import * as emailRepo from '../db/repositories/emailRepository.js';
import { sendCampaignEmail } from './emailService.js';
import { renderTemplate, renderSubject, htmlToPlainText, generateUnsubscribeLink, generatePreferencesLink } from './templateService.js';

let schedulerRunning = false;

/**
 * Process and send a scheduled campaign
 */
async function processScheduledCampaign(campaign) {
  try {
    console.log(`\n📅 Processing scheduled campaign: ${campaign.name} (ID: ${campaign.id})`);

    // Update status to sending
    await emailRepo.updateCampaign(campaign.id, campaign.user_id, {
      status: 'sending'
    });

    // Get lists for this campaign
    let listIds = campaign.list_ids;
    if (!listIds || listIds.length === 0) {
      listIds = await emailRepo.getCampaignLists(campaign.id);
    }
    
    if (!listIds || listIds.length === 0) {
      console.error(`❌ Campaign ${campaign.id} has no lists assigned`);
      await emailRepo.updateCampaign(campaign.id, campaign.user_id, {
        status: 'failed'
      });
      return;
    }

    // Get all contacts from selected lists
    let allContacts = [];
    for (const listId of listIds) {
      const contacts = await emailRepo.getContactsByList(listId, campaign.user_id);
      allContacts = [...allContacts, ...contacts];
    }

    // Remove duplicates
    const uniqueContacts = Array.from(
      new Map(allContacts.map(c => [c.email, c])).values()
    );

    if (uniqueContacts.length === 0) {
      console.error(`❌ Campaign ${campaign.id} has no recipients`);
      await emailRepo.updateCampaign(campaign.id, campaign.user_id, {
        status: 'failed'
      });
      return;
    }

    // Update total recipients
    await emailRepo.updateCampaign(campaign.id, campaign.user_id, {
      total_recipients: uniqueContacts.length
    });

    // Get template HTML if needed
    let htmlContent = campaign.html_content;
    if (!htmlContent && campaign.template_id) {
      const template = await emailRepo.getTemplateById(campaign.template_id, campaign.user_id);
      if (template) {
        htmlContent = template.html_content;
      }
    }

    if (!htmlContent) {
      console.error(`❌ Campaign ${campaign.id} has no HTML content`);
      await emailRepo.updateCampaign(campaign.id, campaign.user_id, {
        status: 'failed'
      });
      return;
    }

    // Generate unsubscribe/preferences links
    const baseUrl = process.env.SERVER_URL || 'http://localhost:3000';
    let sentCount = 0;
    let failedCount = 0;

    // Send emails
    for (const contact of uniqueContacts) {
      try {
        const html = renderTemplate(
          htmlContent,
          contact,
          {
            name: campaign.name,
            unsubscribeLink: generateUnsubscribeLink(contact.id, baseUrl),
            preferencesLink: generatePreferencesLink(contact.id, baseUrl)
          }
        );
        const subject = renderSubject(campaign.subject, contact, { name: campaign.name });
        const text = htmlToPlainText(html);

        await sendCampaignEmail({
          to: contact.email,
          subject,
          html,
          text,
          from: campaign.from_email,
          fromName: campaign.from_name,
          replyTo: campaign.reply_to,
          campaignId: campaign.id,
          contactId: contact.id
        });

        await emailRepo.createCampaignRecipient(campaign.id, contact.id, 'sent');
        sentCount++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        failedCount++;
        console.error(`Error sending to ${contact.email}:`, error.message);
      }
    }

    // Update campaign status
    await emailRepo.updateCampaign(campaign.id, campaign.user_id, {
      status: 'sent',
      sent_at: new Date().toISOString(),
      total_sent: sentCount
    });

    console.log(`✅ Campaign ${campaign.id} sent: ${sentCount}/${uniqueContacts.length} successful`);
  } catch (error) {
    console.error(`❌ Error processing scheduled campaign ${campaign.id}:`, error);
    try {
      await emailRepo.updateCampaign(campaign.id, campaign.user_id, {
        status: 'failed'
      });
    } catch (updateError) {
      console.error('Failed to update campaign status:', updateError);
    }
  }
}

/**
 * Check and process scheduled campaigns
 */
async function checkScheduledCampaigns() {
  if (schedulerRunning) {
    return; // Prevent concurrent executions
  }

  schedulerRunning = true;
  try {
    const scheduledCampaigns = await emailRepo.getScheduledCampaigns();
    
    if (scheduledCampaigns.length === 0) {
      return;
    }

    console.log(`\n⏰ Found ${scheduledCampaigns.length} scheduled campaign(s) to send`);

    // Process campaigns sequentially to avoid overwhelming the system
    for (const campaign of scheduledCampaigns) {
      await processScheduledCampaign(campaign);
    }
  } catch (error) {
    console.error('Error checking scheduled campaigns:', error);
  } finally {
    schedulerRunning = false;
  }
}

/**
 * Start the campaign scheduler
 * Runs every minute to check for scheduled campaigns
 */
export function startCampaignScheduler() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    await checkScheduledCampaigns();
  });

  console.log('✅ Campaign scheduler started (checking every minute)');
}

/**
 * Stop the campaign scheduler (for testing)
 */
export function stopCampaignScheduler() {
  // Note: node-cron doesn't have a direct stop method
  // This would need to be implemented with a flag or by storing the cron job
  console.log('⚠️  Campaign scheduler stop requested (not fully implemented)');
}

export default {
  startCampaignScheduler,
  stopCampaignScheduler,
  checkScheduledCampaigns
};

