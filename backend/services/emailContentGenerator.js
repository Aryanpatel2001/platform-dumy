/**
 * Email Content Generator Service
 * 
 * Uses AI to generate email subject lines and HTML content for campaigns
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate email subject line using AI
 */
export async function generateSubjectLine(prompt, options = {}) {
  try {
    const systemPrompt = `You are an expert email marketing copywriter. Your job is to create compelling, attention-grabbing email subject lines that:
- Are between 30-60 characters (optimal for email clients)
- Create urgency or curiosity
- Are clear and relevant to the content
- Avoid spam trigger words
- Can include emojis when appropriate

Return ONLY the subject line, nothing else.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Create an email subject line for: ${prompt}` }
    ];

    const completion = await openai.chat.completions.create({
      model: options.model || 'gpt-4o-mini',
      messages: messages,
      temperature: options.temperature || 0.8,
      max_tokens: 100
    });

    const subject = completion.choices[0].message.content.trim();
    
    // Remove quotes if AI wrapped it
    return subject.replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Error generating subject line:', error);
    throw new Error(`Failed to generate subject line: ${error.message}`);
  }
}

/**
 * Generate email HTML content using AI
 */
export async function generateEmailContent(prompt, options = {}) {
  try {
    const systemPrompt = `You are an expert email marketing copywriter. Create professional, engaging email content in HTML format.

Requirements:
- Use clean, modern HTML structure
- Include proper email-safe CSS (inline styles)
- Make it mobile-responsive
- Include a clear call-to-action button
- Use professional color scheme (primary: #34569D, secondary: #4A90E2)
- Keep content concise but engaging
- Include personalization placeholders like {{firstName}}, {{lastName}}, {{email}}
- Add an unsubscribe link placeholder: {{unsubscribeLink}}
- Structure: Header, Body, CTA Button, Footer

Return ONLY valid HTML, no markdown, no explanations.`;

    const userPrompt = `Create an email campaign with the following details:
${prompt}

Make it professional, engaging, and include a clear call-to-action.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const completion = await openai.chat.completions.create({
      model: options.model || 'gpt-4o-mini',
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: 2000
    });

    let html = completion.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '');
    
    // Ensure unsubscribe link is present
    if (!html.includes('{{unsubscribeLink}}')) {
      html = html.replace('</body>', '<p style="text-align: center; font-size: 12px; color: #666; margin-top: 20px;"><a href="{{unsubscribeLink}}" style="color: #666;">Unsubscribe</a></p></body>');
    }

    return html;
  } catch (error) {
    console.error('Error generating email content:', error);
    throw new Error(`Failed to generate email content: ${error.message}`);
  }
}

/**
 * Generate both subject and content in one call
 */
export async function generateEmailCampaign(prompt, options = {}) {
  try {
    const [subject, html] = await Promise.all([
      generateSubjectLine(prompt, options),
      generateEmailContent(prompt, options)
    ]);

    return {
      subject,
      html
    };
  } catch (error) {
    console.error('Error generating email campaign:', error);
    throw new Error(`Failed to generate email campaign: ${error.message}`);
  }
}

export default {
  generateSubjectLine,
  generateEmailContent,
  generateEmailCampaign
};

