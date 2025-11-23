/**
 * Email Marketing Routes
 * 
 * API endpoints for email campaigns, templates, contacts, and lists
 */

import express from 'express';
import { authenticateToken } from '../utils/auth.js';
import * as emailRepo from '../db/repositories/emailRepository.js';
import { sendCampaignEmail, sendTestEmail, validateEmailConfig } from '../services/emailService.js';
import { renderTemplate, renderSubject, htmlToPlainText, generateUnsubscribeLink, generatePreferencesLink } from '../services/templateService.js';
import { generateSubjectLine, generateEmailContent, generateEmailCampaign } from '../services/emailContentGenerator.js';
import { emailQueue } from '../services/emailQueue.js';

const router = express.Router();

// All routes require authentication except webhook and unsubscribe
const publicRoutes = ['/webhook', '/unsubscribe'];
router.use((req, res, next) => {
    if (publicRoutes.some(route => req.path.startsWith(route))) {
        return next();
    }
    authenticateToken(req, res, next);
});

// ============================================================================
// WEBHOOKS & PUBLIC ROUTES
// ============================================================================

// SendGrid Webhook
router.post('/webhook', async (req, res) => {
    try {
        const events = req.body;

        // SendGrid sends an array of events
        if (Array.isArray(events)) {
            for (const event of events) {
                const { email, event: eventType, timestamp, campaign_id, contact_id } = event;

                // Only process events with campaign_id (our custom arg)
                if (campaign_id && contact_id) {
                    console.log(`Processing ${eventType} event for campaign ${campaign_id}`);

                    const updates = {};
                    const eventDate = new Date(timestamp * 1000).toISOString();

                    switch (eventType) {
                        case 'delivered':
                            updates.status = 'delivered';
                            updates.delivered_at = eventDate;
                            break;
                        case 'open':
                            updates.status = 'opened';
                            updates.opened_at = eventDate;
                            // Increment opens count logic would go here
                            break;
                        case 'click':
                            updates.status = 'clicked';
                            updates.clicked_at = eventDate;
                            break;
                        case 'bounce':
                        case 'dropped':
                            updates.status = 'bounced';
                            updates.bounced_at = eventDate;
                            updates.bounce_reason = event.reason || 'Unknown bounce reason';
                            break;
                        case 'spamreport':
                        case 'unsubscribe':
                            // Also unsubscribe the contact
                            await emailRepo.unsubscribeContact(contact_id);
                            break;
                    }

                    if (Object.keys(updates).length > 0) {
                        // Find the recipient record
                        const recipient = await emailRepo.getCampaignRecipient(campaign_id, contact_id);
                        if (recipient) {
                            await emailRepo.updateCampaignRecipient(recipient.id, updates);

                            // Update campaign stats periodically or after key events
                            if (['open', 'click', 'bounce'].includes(eventType)) {
                                await emailRepo.updateCampaignStats(campaign_id);
                            }
                        }
                    }
                }
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).send('Error processing webhook');
    }
});

// Unsubscribe endpoint
router.post('/unsubscribe', async (req, res) => {
    try {
        const { contactId } = req.body;

        if (!contactId) {
            return res.status(400).json({ error: true, message: 'Contact ID is required' });
        }

        await emailRepo.unsubscribeContact(contactId);

        res.json({
            success: true,
            message: 'You have been unsubscribed successfully.'
        });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ error: true, message: 'Failed to unsubscribe' });
    }
});

// ============================================================================
// EMAIL CAMPAIGNS
// ============================================================================

// Create campaign
router.post('/campaigns', async (req, res) => {
    try {
        const campaign = await emailRepo.createCampaign(req.user.id, req.body);
        res.status(201).json(campaign);
    } catch (error) {
        console.error('Create campaign error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get all campaigns
router.get('/campaigns', async (req, res) => {
    try {
        const campaigns = await emailRepo.getCampaignsByUser(req.user.id);
        res.json(campaigns);
    } catch (error) {
        console.error('Get campaigns error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get single campaign
router.get('/campaigns/:id', async (req, res) => {
    try {
        const campaign = await emailRepo.getCampaignById(req.params.id, req.user.id);
        if (!campaign) {
            return res.status(404).json({ error: true, message: 'Campaign not found' });
        }
        res.json(campaign);
    } catch (error) {
        console.error('Get campaign error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Update campaign
router.put('/campaigns/:id', async (req, res) => {
    try {
        const campaign = await emailRepo.updateCampaign(req.params.id, req.user.id, req.body);
        if (!campaign) {
            return res.status(404).json({ error: true, message: 'Campaign not found' });
        }
        res.json(campaign);
    } catch (error) {
        console.error('Update campaign error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Delete campaign
router.delete('/campaigns/:id', async (req, res) => {
    try {
        await emailRepo.deleteCampaign(req.params.id, req.user.id);
        res.json({ success: true, message: 'Campaign deleted' });
    } catch (error) {
        console.error('Delete campaign error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Send test email
router.post('/campaigns/:id/test', async (req, res) => {
    try {
        const { testEmail } = req.body;
        if (!testEmail) {
            return res.status(400).json({ error: true, message: 'testEmail is required' });
        }

        const campaign = await emailRepo.getCampaignById(req.params.id, req.user.id);
        if (!campaign) {
            return res.status(404).json({ error: true, message: 'Campaign not found' });
        }

        // Create dummy contact for test
        const testContact = {
            email: testEmail,
            first_name: 'Test',
            last_name: 'User',
            company: 'Test Company',
            custom_fields: {}
        };

        // Render template
        const html = renderTemplate(
            campaign.html_content,
            testContact,
            { name: campaign.name }
        );
        const subject = renderSubject(campaign.subject, testContact, { name: campaign.name });
        const text = htmlToPlainText(html);

        // Send test email
        await sendTestEmail({
            to: testEmail,
            subject,
            html,
            text
        });

        res.json({ success: true, message: 'Test email sent' });
    } catch (error) {
        console.error('Send test email error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Send campaign
router.post('/campaigns/:id/send', async (req, res) => {
    try {
        const { listIds } = req.body; // Array of list IDs to send to

        const campaign = await emailRepo.getCampaignById(req.params.id, req.user.id);
        if (!campaign) {
            return res.status(404).json({ error: true, message: 'Campaign not found' });
        }

        if (campaign.status !== 'draft') {
            return res.status(400).json({ error: true, message: 'Campaign must be in draft status' });
        }

        // Save lists to campaign if not already saved
        if (listIds && listIds.length > 0) {
            await emailRepo.addListsToCampaign(req.params.id, listIds);
        }

        // Get all contacts from selected lists
        let allContacts = [];
        if (listIds && listIds.length > 0) {
            for (const listId of listIds) {
                const contacts = await emailRepo.getContactsByList(listId, req.user.id);
                allContacts = [...allContacts, ...contacts];
            }
        } else {
            // If no lists specified, get all subscribed contacts
            allContacts = await emailRepo.getContactsByUser(req.user.id, { isSubscribed: true });
        }

        // Remove duplicates
        const uniqueContacts = Array.from(
            new Map(allContacts.map(c => [c.email, c])).values()
        );

        if (uniqueContacts.length === 0) {
            return res.status(400).json({ error: true, message: 'No recipients found' });
        }

        // Update campaign status
        await emailRepo.updateCampaign(req.params.id, req.user.id, {
            status: 'sending',
            total_recipients: uniqueContacts.length
        });

        // Generate unsubscribe/preferences links
        const baseUrl = process.env.SERVER_URL || 'http://localhost:3000';

        // Get template HTML if campaign doesn't have it
        let htmlContent = campaign.html_content;
        if (!htmlContent && campaign.template_id) {
            const template = await emailRepo.getTemplateById(campaign.template_id, req.user.id);
            if (template) {
                htmlContent = template.html_content;
            } else {
                return res.status(400).json({ error: true, message: 'Template not found' });
            }
        }

        if (!htmlContent) {
            return res.status(400).json({ error: true, message: 'Campaign has no HTML content. Please select a template or add HTML content.' });
        }

        // Check if this is an A/B test
        // Parse metadata if it's a string
        let campaignMetadata = campaign.metadata;
        if (typeof campaignMetadata === 'string') {
            try {
                campaignMetadata = JSON.parse(campaignMetadata);
            } catch (e) {
                campaignMetadata = null;
            }
        }

        const isABTest = campaignMetadata && campaignMetadata.is_ab_test;
        const splitPercentage = isABTest ? (campaignMetadata.split_percentage || 50) : 100;

        // Add jobs to queue
        console.log(`\n📧 Queuing campaign "${campaign.name}" for ${uniqueContacts.length} contacts...`);

        const jobs = [];
        for (let i = 0; i < uniqueContacts.length; i++) {
            const contact = uniqueContacts[i];

            // Determine variation for A/B test (pre-calculate for worker)
            let subjectToUse = campaign.subject;
            let htmlToUse = htmlContent;

            if (isABTest) {
                const splitPoint = Math.floor((uniqueContacts.length * splitPercentage) / 100);
                const variation = i < splitPoint ? 'A' : 'B';

                if (variation === 'B') {
                    subjectToUse = campaignMetadata.variation_b.subject;
                    htmlToUse = campaignMetadata.variation_b.html_content;
                } else {
                    subjectToUse = campaignMetadata.variation_a.subject;
                    htmlToUse = campaignMetadata.variation_a.html_content;
                }
            }

            // Create job data - passing campaign object and specific content
            // We create a modified campaign object for the worker to use the correct subject
            const jobCampaign = {
                ...campaign,
                subject: subjectToUse,
                from_email: campaign.from_email,
                from_name: campaign.from_name,
                reply_to: campaign.reply_to
            };

            const job = await emailQueue.add('send-email', {
                campaignId: campaign.id,
                contactId: contact.id,
                contact,
                campaign: jobCampaign,
                htmlContent: htmlToUse,
                baseUrl
            }, {
                priority: 1,
                removeOnComplete: true,
                attempts: 3
            });

            jobs.push(job.id);
        }

        res.json({
            success: true,
            message: `Campaign queued successfully. ${jobs.length} emails will be sent in the background.`,
            campaignId: campaign.id,
            jobCount: jobs.length
        });

    } catch (error) {
        console.error('Send campaign error:', error);
        // If updating status failed, try to revert
        try {
            await emailRepo.updateCampaign(req.params.id, req.user.id, { status: 'failed' });
        } catch (e) { }
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get campaign stats
router.get('/campaigns/:id/stats', async (req, res) => {
    try {
        const stats = await emailRepo.getCampaignStats(req.params.id, req.user.id);
        res.json(stats);
    } catch (error) {
        console.error('Get campaign stats error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get campaign time-series analytics
router.get('/campaigns/:id/analytics', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const timeSeries = await emailRepo.getCampaignTimeSeries(req.params.id, req.user.id, days);
        res.json(timeSeries);
    } catch (error) {
        console.error('Get campaign analytics error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get user email analytics
router.get('/analytics', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const analytics = await emailRepo.getUserEmailAnalytics(req.user.id, days);
        res.json(analytics);
    } catch (error) {
        console.error('Get user analytics error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Schedule campaign
router.post('/campaigns/:id/schedule', async (req, res) => {
    try {
        const { scheduled_at, listIds } = req.body;

        if (!scheduled_at) {
            return res.status(400).json({ error: true, message: 'scheduled_at is required' });
        }

        const scheduledDate = new Date(scheduled_at);
        if (isNaN(scheduledDate.getTime())) {
            return res.status(400).json({ error: true, message: 'Invalid scheduled_at date format' });
        }

        if (scheduledDate <= new Date()) {
            return res.status(400).json({ error: true, message: 'scheduled_at must be in the future' });
        }

        const campaign = await emailRepo.getCampaignById(req.params.id, req.user.id);
        if (!campaign) {
            return res.status(404).json({ error: true, message: 'Campaign not found' });
        }

        if (campaign.status !== 'draft') {
            return res.status(400).json({ error: true, message: 'Campaign must be in draft status to schedule' });
        }

        // Update campaign with scheduled time
        const updatedCampaign = await emailRepo.updateCampaign(req.params.id, req.user.id, {
            scheduled_at: scheduledDate.toISOString(),
            status: 'scheduled'
        });

        // Add lists to campaign if provided
        if (listIds && Array.isArray(listIds) && listIds.length > 0) {
            await emailRepo.addListsToCampaign(req.params.id, listIds);
        }

        res.json({
            success: true,
            message: `Campaign scheduled for ${scheduledDate.toISOString()}`,
            campaign: updatedCampaign
        });
    } catch (error) {
        console.error('Schedule campaign error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Cancel scheduled campaign
router.post('/campaigns/:id/cancel-schedule', async (req, res) => {
    try {
        const campaign = await emailRepo.getCampaignById(req.params.id, req.user.id);
        if (!campaign) {
            return res.status(404).json({ error: true, message: 'Campaign not found' });
        }

        if (campaign.status !== 'scheduled') {
            return res.status(400).json({ error: true, message: 'Campaign is not scheduled' });
        }

        const updatedCampaign = await emailRepo.updateCampaign(req.params.id, req.user.id, {
            scheduled_at: null,
            status: 'draft'
        });

        res.json({
            success: true,
            message: 'Campaign schedule cancelled',
            campaign: updatedCampaign
        });
    } catch (error) {
        console.error('Cancel schedule error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

// Create template
router.post('/templates', async (req, res) => {
    try {
        const { name, description, subject_template, html_content } = req.body;

        // Validate required fields
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Template name is required' });
        }

        if (!html_content || html_content.trim() === '') {
            return res.status(400).json({ error: 'HTML content is required. Please add your email template content.' });
        }

        const templateData = {
            name: name.trim(),
            description: description?.trim() || null,
            subject_template: subject_template?.trim() || null,
            html_content: html_content.trim()
        };

        const template = await emailRepo.createTemplate(req.user.id, templateData);
        res.status(201).json(template);
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get all templates
router.get('/templates', async (req, res) => {
    try {
        const templates = await emailRepo.getTemplatesByUser(req.user.id);
        res.json(templates);
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get single template
router.get('/templates/:id', async (req, res) => {
    try {
        const template = await emailRepo.getTemplateById(req.params.id, req.user.id);
        if (!template) {
            return res.status(404).json({ error: true, message: 'Template not found' });
        }
        res.json(template);
    } catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// ============================================================================
// CONTACTS
// ============================================================================

// Create contact
router.post('/contacts', async (req, res) => {
    try {
        const contact = await emailRepo.createContact(req.user.id, req.body);
        res.status(201).json(contact);
    } catch (error) {
        console.error('Create contact error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get all contacts
router.get('/contacts', async (req, res) => {
    try {
        const contacts = await emailRepo.getContactsByUser(req.user.id, req.query);
        res.json(contacts);
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Import contacts from CSV (must be before /contacts/:id)
router.post('/contacts/import', async (req, res) => {
    try {
        const { csvData } = req.body;

        if (!csvData || typeof csvData !== 'string') {
            return res.status(400).json({ error: true, message: 'CSV data is required' });
        }

        const Papa = (await import('papaparse')).default;

        const parseResult = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => {
                // Normalize header names
                const normalized = header.trim().toLowerCase()
                    .replace(/\s+/g, '_')
                    .replace(/[^a-z0-9_]/g, '');

                // Map common variations
                const mapping = {
                    'email': 'email',
                    'e_mail': 'email',
                    'email_address': 'email',
                    'first_name': 'first_name',
                    'firstname': 'first_name',
                    'fname': 'first_name',
                    'last_name': 'last_name',
                    'lastname': 'last_name',
                    'lname': 'last_name',
                    'company': 'company',
                    'company_name': 'company',
                    'phone': 'phone',
                    'phone_number': 'phone',
                    'tags': 'tags',
                    'tag': 'tags'
                };

                return mapping[normalized] || normalized;
            }
        });

        if (parseResult.errors && parseResult.errors.length > 0) {
            return res.status(400).json({
                error: true,
                message: 'CSV parsing errors',
                errors: parseResult.errors
            });
        }

        const rows = parseResult.data;
        if (rows.length === 0) {
            return res.status(400).json({ error: true, message: 'No data found in CSV' });
        }

        // Validate required fields
        const requiredFields = ['email'];
        const missingFields = requiredFields.filter(field =>
            !rows[0].hasOwnProperty(field)
        );

        if (missingFields.length > 0) {
            return res.status(400).json({
                error: true,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Import contacts
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                // Validate email
                if (!row.email || !row.email.trim()) {
                    results.failed++;
                    results.errors.push({ row: i + 1, error: 'Email is required' });
                    continue;
                }

                // Parse tags if present
                let tags = [];
                if (row.tags) {
                    tags = row.tags.split(',').map(t => t.trim()).filter(t => t);
                }

                // Create contact
                await emailRepo.createContact(req.user.id, {
                    email: row.email.trim(),
                    first_name: row.first_name?.trim() || null,
                    last_name: row.last_name?.trim() || null,
                    company: row.company?.trim() || null,
                    phone: row.phone?.trim() || null,
                    tags: tags.length > 0 ? tags : null,
                    source: 'import'
                });

                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({ row: i + 1, error: error.message });
            }
        }

        res.json({
            success: true,
            message: `Imported ${results.success} contacts, ${results.failed} failed`,
            results
        });
    } catch (error) {
        console.error('Import contacts error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Export contacts to CSV (must be before /contacts/:id)
router.get('/contacts/export', async (req, res) => {
    try {
        const contacts = await emailRepo.getContactsByUser(req.user.id, req.query);

        if (contacts.length === 0) {
            return res.status(404).json({ error: true, message: 'No contacts to export' });
        }

        const Papa = (await import('papaparse')).default;

        // Prepare data for CSV
        const csvData = contacts.map(contact => ({
            email: contact.email || '',
            first_name: contact.first_name || '',
            last_name: contact.last_name || '',
            company: contact.company || '',
            phone: contact.phone || '',
            tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : '',
            is_subscribed: contact.is_subscribed ? 'Yes' : 'No',
            created_at: contact.created_at || ''
        }));

        const csv = Papa.unparse(csvData, {
            header: true
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="contacts_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Export contacts error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get single contact (must be after specific routes like /export and /import)
router.get('/contacts/:id', async (req, res) => {
    try {
        const contact = await emailRepo.getContactById(req.params.id, req.user.id);
        if (!contact) {
            return res.status(404).json({ error: true, message: 'Contact not found' });
        }
        res.json(contact);
    } catch (error) {
        console.error('Get contact error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Update contact
router.put('/contacts/:id', async (req, res) => {
    try {
        const contact = await emailRepo.updateContact(req.params.id, req.user.id, req.body);
        if (!contact) {
            return res.status(404).json({ error: true, message: 'Contact not found' });
        }
        res.json(contact);
    } catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Delete contact
router.delete('/contacts/:id', async (req, res) => {
    try {
        const contact = await emailRepo.deleteContact(req.params.id, req.user.id);
        if (!contact) {
            return res.status(404).json({ error: true, message: 'Contact not found' });
        }
        res.json({ success: true, message: 'Contact deleted' });
    } catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// ============================================================================
// CONTACT LISTS
// ============================================================================

// Create list
router.post('/lists', async (req, res) => {
    try {
        const list = await emailRepo.createList(req.user.id, req.body);
        res.status(201).json(list);
    } catch (error) {
        console.error('Create list error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get all lists
router.get('/lists', async (req, res) => {
    try {
        const lists = await emailRepo.getListsByUser(req.user.id);
        res.json(lists);
    } catch (error) {
        console.error('Get lists error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get single list
router.get('/lists/:id', async (req, res) => {
    try {
        const list = await emailRepo.getListById(req.params.id, req.user.id);
        if (!list) {
            return res.status(404).json({ error: true, message: 'List not found' });
        }
        res.json(list);
    } catch (error) {
        console.error('Get list error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Update list
router.put('/lists/:id', async (req, res) => {
    try {
        const list = await emailRepo.updateList(req.params.id, req.user.id, req.body);
        if (!list) {
            return res.status(404).json({ error: true, message: 'List not found' });
        }
        res.json(list);
    } catch (error) {
        console.error('Update list error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Delete list
router.delete('/lists/:id', async (req, res) => {
    try {
        const list = await emailRepo.deleteList(req.params.id, req.user.id);
        if (!list) {
            return res.status(404).json({ error: true, message: 'List not found' });
        }
        res.json({ success: true, message: 'List deleted' });
    } catch (error) {
        console.error('Delete list error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Add contacts to list
router.post('/lists/:id/contacts', async (req, res) => {
    try {
        const { contactIds } = req.body;
        if (!contactIds || !Array.isArray(contactIds)) {
            return res.status(400).json({ error: true, message: 'contactIds array is required' });
        }

        await emailRepo.addContactsToList(req.params.id, contactIds);
        res.json({ success: true, message: 'Contacts added to list' });
    } catch (error) {
        console.error('Add contacts to list error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get contacts in list
router.get('/lists/:id/contacts', async (req, res) => {
    try {
        const contacts = await emailRepo.getContactsByList(req.params.id, req.user.id);
        res.json(contacts);
    } catch (error) {
        console.error('Get list contacts error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// ============================================================================
// AI CONTENT GENERATION
// ============================================================================

// Generate email subject line
router.post('/ai/generate-subject', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({ error: true, message: 'Prompt is required' });
        }

        const subject = await generateSubjectLine(prompt);
        res.json({ success: true, subject });
    } catch (error) {
        console.error('Generate subject error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Generate email HTML content
router.post('/ai/generate-content', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({ error: true, message: 'Prompt is required' });
        }

        const html = await generateEmailContent(prompt);
        res.json({ success: true, html });
    } catch (error) {
        console.error('Generate content error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Generate complete email campaign (subject + content)
router.post('/ai/generate-campaign', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({ error: true, message: 'Prompt is required' });
        }

        const campaign = await generateEmailCampaign(prompt);
        res.json({ success: true, ...campaign });
    } catch (error) {
        console.error('Generate campaign error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// ============================================================================
// A/B TESTING
// ============================================================================

// Create A/B test campaign
router.post('/campaigns/ab-test', async (req, res) => {
    try {
        const { name, subject_a, subject_b, html_content_a, html_content_b, split_percentage } = req.body;

        if (!name || !subject_a || !subject_b || !html_content_a || !html_content_b) {
            return res.status(400).json({
                error: true,
                message: 'Name, subject_a, subject_b, html_content_a, and html_content_b are required'
            });
        }

        const abTest = await emailRepo.createABTest(req.user.id, {
            name,
            subject_a,
            subject_b,
            html_content_a,
            html_content_b,
            split_percentage: split_percentage || 50
        });

        res.status(201).json(abTest);
    } catch (error) {
        console.error('Create A/B test error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get A/B test results
router.get('/campaigns/:id/ab-test-results', async (req, res) => {
    try {
        const results = await emailRepo.getABTestResults(req.params.id, req.user.id);
        if (!results) {
            return res.status(404).json({ error: true, message: 'A/B test not found' });
        }
        res.json(results);
    } catch (error) {
        console.error('Get A/B test results error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// ============================================================================
// EMAIL SERVICE VALIDATION
// ============================================================================

// Validate email service configuration
router.get('/validate', (req, res) => {
    const validation = validateEmailConfig();
    res.json(validation);
});

export default router;

