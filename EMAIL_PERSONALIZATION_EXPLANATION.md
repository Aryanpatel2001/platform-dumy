# 📧 Email Personalization & Dynamic Values - Detailed Explanation

## 🎯 Your Question

**"If I have 5 different users with their email details, when running a campaign, how do I insert dynamic values (like name, company) into the email template for each recipient?"**

---

## ✅ Answer: Yes! Dynamic Personalization Works Like This

### Example Scenario

You have **5 contacts** in your database:

| Contact | Email | First Name | Last Name | Company | Custom Field |
|---------|-------|------------|-----------|---------|--------------|
| John | john@example.com | John | Smith | Tech Corp | Favorite Color: Blue |
| Sarah | sarah@example.com | Sarah | Johnson | Design Inc | Favorite Color: Red |
| Mike | mike@example.com | Mike | Brown | Sales Co | Favorite Color: Green |
| Emma | emma@example.com | Emma | Davis | Marketing Pro | Favorite Color: Purple |
| David | david@example.com | David | Wilson | Startup XYZ | Favorite Color: Yellow |

---

## 📝 How It Works

### Step 1: Create Email Template with Variables

When you create an email template, you use **placeholders** (variables) that will be replaced with actual data:

**Email Template Example:**

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background: #34569D; color: white; padding: 20px; }
    .content { padding: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Hello {{firstName}}!</h1>
  </div>
  
  <div class="content">
    <p>Dear {{firstName}} {{lastName}},</p>
    
    <p>We noticed you work at <strong>{{company}}</strong> and wanted to reach out...</p>
    
    <p>Since your favorite color is {{customFields.favoriteColor}}, we thought you'd love our new product!</p>
    
    <p>Best regards,<br>
    AI Agent Platform Team</p>
  </div>
</body>
</html>
```

**Subject Line:**
```
Welcome {{firstName}}! Special offer for {{company}}
```

---

### Step 2: System Automatically Replaces Variables

When you send the campaign, the system **automatically replaces** each variable with the actual contact data:

#### Email 1 - Sent to John:
```html
Hello John!

Dear John Smith,

We noticed you work at Tech Corp and wanted to reach out...

Since your favorite color is Blue, we thought you'd love our new product!
```

**Subject:** `Welcome John! Special offer for Tech Corp`

---

#### Email 2 - Sent to Sarah:
```html
Hello Sarah!

Dear Sarah Johnson,

We noticed you work at Design Inc and wanted to reach out...

Since your favorite color is Red, we thought you'd love our new product!
```

**Subject:** `Welcome Sarah! Special offer for Design Inc`

---

#### Email 3 - Sent to Mike:
```html
Hello Mike!

Dear Mike Brown,

We noticed you work at Sales Co and wanted to reach out...

Since your favorite color is Green, we thought you'd love our new product!
```

**Subject:** `Welcome Mike! Special offer for Sales Co`

---

## 🔧 Technical Implementation

### How Variables Work (Handlebars Template Engine)

We'll use **Handlebars** (or similar) to process templates:

```javascript
// backend/services/templateService.js

import Handlebars from 'handlebars';

export function renderTemplate(templateHtml, contactData) {
  // Compile the template
  const template = Handlebars.compile(templateHtml);
  
  // Replace variables with actual data
  const renderedHtml = template(contactData);
  
  return renderedHtml;
}

// Example usage:
const template = `
  <h1>Hello {{firstName}}!</h1>
  <p>Your company: {{company}}</p>
`;

const contactData = {
  firstName: 'John',
  company: 'Tech Corp',
  customFields: {
    favoriteColor: 'Blue'
  }
};

const result = renderTemplate(template, contactData);
// Output: <h1>Hello John!</h1><p>Your company: Tech Corp</p>
```

---

### Available Dynamic Variables

**Standard Fields:**
- `{{firstName}}` - Contact's first name
- `{{lastName}}` - Contact's last name
- `{{email}}` - Contact's email
- `{{phone}}` - Contact's phone
- `{{company}}` - Contact's company
- `{{fullName}}` - First + Last name

**Custom Fields:**
- `{{customFields.favoriteColor}}` - Any custom field
- `{{customFields.jobTitle}}` - Custom field example
- `{{customFields.industry}}` - Custom field example

**Campaign Variables:**
- `{{campaignName}}` - Name of the campaign
- `{{unsubscribeLink}}` - Auto-generated unsubscribe link
- `{{preferencesLink}}` - Link to update preferences

**Conditional Logic:**
```handlebars
{{#if company}}
  <p>We see you work at {{company}}!</p>
{{else}}
  <p>Welcome to our platform!</p>
{{/if}}

{{#if customFields.favoriteColor}}
  <p>Your favorite color is {{customFields.favoriteColor}}</p>
{{/if}}
```

---

## 🎨 Visual Example in UI

### Template Editor Preview

When you're editing the template, you'll see:

```
┌─────────────────────────────────────────┐
│ Email Template Editor                    │
├─────────────────────────────────────────┤
│                                         │
│  Subject: Welcome {{firstName}}!       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Hello {{firstName}}!             │   │
│  │                                  │   │
│  │ Dear {{firstName}} {{lastName}},│   │
│  │                                  │   │
│  │ We noticed you work at          │   │
│  │ {{company}}...                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Preview] [Send Test] [Save]          │
└─────────────────────────────────────────┘
```

### Preview Mode

When you click "Preview", you can select a contact to see how it looks:

```
┌─────────────────────────────────────────┐
│ Preview Email                           │
├─────────────────────────────────────────┤
│ Preview as: [John Smith ▼]             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Hello John!                      │   │
│  │                                  │   │
│  │ Dear John Smith,                 │   │
│  │                                  │   │
│  │ We noticed you work at          │   │
│  │ Tech Corp...                     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Change Contact] [Send Test Email]    │
└─────────────────────────────────────────┘
```

---

## 📊 Campaign Sending Process

### When You Click "Send Campaign"

**Step-by-Step Process:**

1. **Select Recipients**
   ```
   You choose: "All Contacts" or "Specific List"
   System finds: 5 contacts
   ```

2. **For Each Contact:**
   ```
   Contact 1: John Smith
   ├── Load contact data: {firstName: "John", lastName: "Smith", company: "Tech Corp", ...}
   ├── Replace variables in template
   ├── Generate personalized HTML
   ├── Replace variables in subject line
   └── Send email to john@example.com
   
   Contact 2: Sarah Johnson
   ├── Load contact data: {firstName: "Sarah", lastName: "Johnson", company: "Design Inc", ...}
   ├── Replace variables in template
   ├── Generate personalized HTML
   ├── Replace variables in subject line
   └── Send email to sarah@example.com
   
   ... (repeat for all 5 contacts)
   ```

3. **Result:**
   - Each contact receives a **unique, personalized email**
   - All emails sent from the same campaign
   - All tracking is linked to the campaign

---

## 💻 Code Implementation Example

### Backend: Sending Personalized Campaign

```javascript
// backend/services/emailCampaignService.js

import { renderTemplate } from './templateService.js';
import { sendEmail } from './emailService.js';
import { getContactsByList } from '../db/repositories/contactRepository.js';

export async function sendCampaign(campaignId) {
  // 1. Get campaign details
  const campaign = await getCampaignById(campaignId);
  
  // 2. Get all recipients
  const contacts = await getContactsByList(campaign.listId);
  
  // 3. Process each contact
  for (const contact of contacts) {
    // 4. Prepare contact data for template
    const contactData = {
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email,
      company: contact.company,
      phone: contact.phone,
      customFields: contact.custom_fields || {},
      unsubscribeLink: `${process.env.APP_URL}/unsubscribe/${contact.id}`,
      campaignName: campaign.name
    };
    
    // 5. Render template with contact data
    const personalizedHtml = renderTemplate(campaign.html_content, contactData);
    const personalizedSubject = renderTemplate(campaign.subject, contactData);
    
    // 6. Send personalized email
    await sendEmail({
      to: contact.email,
      subject: personalizedSubject,
      html: personalizedHtml,
      campaignId: campaign.id,
      contactId: contact.id
    });
    
    // 7. Track in database
    await createCampaignRecipient({
      campaign_id: campaign.id,
      contact_id: contact.id,
      status: 'sent'
    });
  }
}
```

---

## 🎯 Real-World Example

### Scenario: Welcome Email Campaign

**Template:**
```html
Subject: Welcome {{firstName}}! Get started with {{company}}

Hi {{firstName}},

Thanks for joining AI Agent Platform! 

We're excited to help {{company}} automate customer communications.

Your account email: {{email}}

Get started: [Click here]

{{#if phone}}
  Need help? Call us at {{phone}}
{{/if}}

Best,
The Team
```

**Result for 5 Contacts:**

1. **John** receives:
   - Subject: "Welcome John! Get started with Tech Corp"
   - Email mentions "Tech Corp" and includes his phone

2. **Sarah** receives:
   - Subject: "Welcome Sarah! Get started with Design Inc"
   - Email mentions "Design Inc" and includes her phone

3. **Mike** receives:
   - Subject: "Welcome Mike! Get started with Sales Co"
   - Email mentions "Sales Co" and includes his phone

... and so on for all 5 contacts!

---

## ✨ Advanced Features

### 1. Conditional Content

Show different content based on contact data:

```handlebars
{{#if customFields.isPremium}}
  <p>🎉 As a premium member, you get 50% off!</p>
{{else}}
  <p>Upgrade to premium for exclusive benefits!</p>
{{/if}}
```

### 2. Loops (for arrays)

```handlebars
{{#each customFields.interests}}
  <li>{{this}}</li>
{{/each}}
```

### 3. Date Formatting

```handlebars
<p>Your account was created on {{formatDate createdAt "MMM DD, YYYY"}}</p>
```

### 4. Calculations

```handlebars
<p>You have {{totalContacts}} contacts in your account</p>
```

---

## 📋 Summary

### ✅ What Happens:

1. **You create ONE template** with variables like `{{firstName}}`, `{{company}}`
2. **You select recipients** (your 5 contacts)
3. **System automatically:**
   - Takes each contact's data
   - Replaces variables in template
   - Generates unique email for each person
   - Sends personalized email to each contact

### ✅ Result:

- **5 different emails** sent
- **Each email is unique** and personalized
- **All from one campaign**
- **All tracked separately**

### ✅ Benefits:

- ✅ **Saves time** - Write once, personalize for all
- ✅ **Better engagement** - Personalized emails get 26% higher open rates
- ✅ **Professional** - Looks like you wrote each email individually
- ✅ **Scalable** - Works for 5 contacts or 50,000 contacts

---

## 🚀 Implementation in Your Project

When we implement this, you'll be able to:

1. **Create templates** with drag-and-drop editor
2. **Insert variables** by clicking buttons (no coding needed)
3. **Preview** how email looks for each contact
4. **Send** to all contacts with one click
5. **Track** individual opens/clicks per contact

**Ready to implement? This will be part of Phase 1!** 🎯

