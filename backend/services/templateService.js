/**
 * Template Service - Email Template Processing
 * 
 * Handles template rendering with variable replacement
 * Uses Handlebars for template processing
 */

import Handlebars from 'handlebars';
import { htmlToText } from 'html-to-text';

// Register Handlebars helpers
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('formatDate', function(date, format) {
  if (!date) return '';
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString();
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
});

Handlebars.registerHelper('uppercase', function(str) {
  return str ? str.toUpperCase() : '';
});

Handlebars.registerHelper('lowercase', function(str) {
  return str ? str.toLowerCase() : '';
});

/**
 * Prepare contact data for template rendering
 */
export function prepareContactData(contact) {
  // Handle null or undefined contact
  if (!contact) {
    return {
      firstName: '',
      lastName: '',
      fullName: '',
      email: '',
      phone: '',
      company: '',
      tags: [],
      customFields: {}
    };
  }

  return {
    firstName: contact.first_name || contact.firstName || '',
    lastName: contact.last_name || contact.lastName || '',
    fullName: `${contact.first_name || contact.firstName || ''} ${contact.last_name || contact.lastName || ''}`.trim() || (contact.email || ''),
    email: contact.email || '',
    phone: contact.phone || '',
    company: contact.company || '',
    tags: contact.tags || [],
    customFields: contact.custom_fields || contact.customFields || {},
    // Flatten custom fields for easier access
    ...(contact.custom_fields || contact.customFields || {})
  };
}

/**
 * Render email template with contact data
 */
export function renderTemplate(templateHtml, contactData, campaignData = {}) {
  try {
    // Prepare contact data
    const data = {
      ...prepareContactData(contactData),
      campaignName: campaignData.name || '',
      unsubscribeLink: campaignData.unsubscribeLink || '#',
      preferencesLink: campaignData.preferencesLink || '#',
      ...campaignData
    };

    // Compile and render template
    const template = Handlebars.compile(templateHtml);
    const renderedHtml = template(data);

    return renderedHtml;
  } catch (error) {
    console.error('Error rendering template:', error);
    throw new Error(`Failed to render template: ${error.message}`);
  }
}

/**
 * Render subject line with variables
 */
export function renderSubject(subjectTemplate, contactData, campaignData = {}) {
  // If contactData is null/undefined, return original template
  if (!contactData) {
    return subjectTemplate;
  }

  try {
    const data = {
      ...prepareContactData(contactData),
      ...campaignData
    };

    const template = Handlebars.compile(subjectTemplate);
    return template(data);
  } catch (error) {
    console.error('Error rendering subject:', error);
    return subjectTemplate; // Return original if rendering fails
  }
}

/**
 * Convert HTML to plain text
 */
export function htmlToPlainText(html) {
  try {
    return htmlToText(html, {
      wordwrap: 80,
      preserveNewlines: true
    });
  } catch (error) {
    console.error('Error converting HTML to text:', error);
    // Fallback: simple HTML tag removal
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

/**
 * Generate unsubscribe link
 */
export function generateUnsubscribeLink(contactId, baseUrl) {
  return `${baseUrl}/unsubscribe/${contactId}`;
}

/**
 * Generate preferences link
 */
export function generatePreferencesLink(contactId, baseUrl) {
  return `${baseUrl}/preferences/${contactId}`;
}

/**
 * Extract variables from template
 */
export function extractVariables(templateHtml) {
  const variables = new Set();
  const regex = /\{\{([^}]+)\}\}/g;
  let match;

  while ((match = regex.exec(templateHtml)) !== null) {
    const varName = match[1].trim();
    // Remove helpers and conditions
    if (!varName.startsWith('#') && !varName.startsWith('/') && !varName.startsWith('else')) {
      variables.add(varName.split(' ')[0]); // Get first part before spaces
    }
  }

  return Array.from(variables);
}

export default {
  renderTemplate,
  renderSubject,
  htmlToPlainText,
  prepareContactData,
  generateUnsubscribeLink,
  generatePreferencesLink,
  extractVariables
};

