import emailQueue from './emailQueue.js';
import { sendCampaignEmail } from './emailService.js';
import { renderTemplate, renderSubject, htmlToPlainText, generateUnsubscribeLink, generatePreferencesLink } from './templateService.js';
import * as emailRepo from '../db/repositories/emailRepository.js';

// Process email jobs
export function startEmailWorker() {
  console.log('👷 Email worker started');

  emailQueue.process('send-email', 10, async (job) => {
    const { campaignId, contactId, contact, campaign, htmlContent, baseUrl } = job.data;
    
    try {
      // Render personalized email
      const html = renderTemplate(
        htmlContent,
        contact,
        {
          name: campaign.name,
          unsubscribeLink: generateUnsubscribeLink(contactId, baseUrl),
          preferencesLink: generatePreferencesLink(contactId, baseUrl)
        }
      );
      
      const subject = renderSubject(campaign.subject, contact, { name: campaign.name });
      const text = htmlToPlainText(html);

      // Send email via SendGrid
      const result = await sendCampaignEmail({
        to: contact.email,
        subject,
        html,
        text,
        from: campaign.from_email,
        fromName: campaign.from_name,
        replyTo: campaign.reply_to,
        campaignId,
        contactId,
      });

      // Update recipient record
      await emailRepo.createCampaignRecipient(campaignId, contactId, 'sent');
      
      // Update campaign stats periodically (every 10th email or so) could go here
      // but we'll rely on the main stats updater for now

      // Update job progress
      job.progress(100);
      
      console.log(`[Job ${job.id}] ✅ Sent to ${contact.email}`);

      return { 
        success: true, 
        email: contact.email, 
        messageId: result.messageId 
      };
    } catch (error) {
      console.error(`[Job ${job.id}] ❌ Failed to send to ${contact.email}:`, error.message);
      throw error; // Will trigger retry
    }
  });
}

export default startEmailWorker;

