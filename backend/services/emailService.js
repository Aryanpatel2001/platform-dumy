/**
 * Email Service - SendGrid Integration
 * 
 * Handles sending emails via SendGrid API
 * Supports transactional and marketing emails
 */

import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const DEFAULT_FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL || 'noreply@aiagentplatform.com';
const DEFAULT_FROM_NAME = process.env.DEFAULT_FROM_NAME || 'AI Agent Platform';

// Initialize SendGrid
if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
} else {
    console.warn('⚠️  SENDGRID_API_KEY not set. Email sending will be disabled.');
}

/**
 * Send a single email
 */
export async function sendEmail({
    to,
    subject,
    html,
    text = null,
    from = null,
    fromName = null,
    replyTo = null,
    campaignId = null,
    contactId = null,
    trackingEnabled = true
}) {
    try {
        if (!SENDGRID_API_KEY) {
            throw new Error('SendGrid API key not configured');
        }

        const fromEmail = from || DEFAULT_FROM_EMAIL;
        const fromNameValue = fromName || DEFAULT_FROM_NAME;
        const fromAddress = `${fromNameValue} <${fromEmail}>`;

        const msg = {
            to,
            from: fromAddress,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
            replyTo: replyTo || fromEmail,
            trackingSettings: {
                clickTracking: {
                    enable: trackingEnabled
                },
                openTracking: {
                    enable: trackingEnabled
                }
            }
        };

        // Add custom args for tracking
        if (campaignId || contactId) {
            msg.customArgs = {};
            if (campaignId) msg.customArgs.campaign_id = campaignId;
            if (contactId) msg.customArgs.contact_id = contactId;
        }

        const response = await sgMail.send(msg);

        return {
            success: true,
            messageId: response[0]?.headers?.['x-message-id'],
            statusCode: response[0]?.statusCode
        };
    } catch (error) {
        console.error('Error sending email:', error);

        if (error.response) {
            console.error('SendGrid error details:', error.response.body);
        }

        throw new Error(`Failed to send email: ${error.message}`);
    }
}

/**
 * Send test email
 */
export async function sendTestEmail({
    to,
    subject,
    html,
    text = null
}) {
    return sendEmail({
        to,
        subject: `[TEST] ${subject}`,
        html,
        text,
        trackingEnabled: false
    });
}

/**
 * Send campaign email to multiple recipients
 */
export async function sendCampaignEmail({
    to,
    subject,
    html,
    text = null,
    from = null,
    fromName = null,
    replyTo = null,
    campaignId,
    contactId
}) {
    return sendEmail({
        to,
        subject,
        html,
        text,
        from,
        fromName,
        replyTo,
        campaignId,
        contactId,
        trackingEnabled: true
    });
}

/**
 * Validate SendGrid configuration
 */
export function validateEmailConfig() {
    // Read from process.env at runtime to allow testing
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.DEFAULT_FROM_EMAIL;
    
    if (!apiKey) {
        return {
            valid: false,
            error: 'SENDGRID_API_KEY not configured'
        };
    }

    if (!fromEmail) {
        return {
            valid: false,
            error: 'DEFAULT_FROM_EMAIL not configured'
        };
    }

    return {
        valid: true,
        message: 'Email service configured correctly'
    };
}

export default {
    sendEmail,
    sendTestEmail,
    sendCampaignEmail,
    validateEmailConfig
};

