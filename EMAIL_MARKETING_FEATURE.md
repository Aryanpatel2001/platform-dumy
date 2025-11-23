
# 📧 Email Marketing Feature Documentation

## Overview

The Email Marketing feature is a comprehensive email campaign management system integrated into the AI Agent Platform. It allows users to create, manage, and send personalized email campaigns to contact lists, with full template support, contact management, and campaign analytics.

**Status:** ✅ **Phase 1 & 2 Complete** (Production Ready)  
**Test Coverage:** 65/65 tests passing  
**Last Updated:** November 2025

---

## 🎯 Features

### Core Capabilities

1. **Email Campaigns**
   - Create, edit, and delete campaigns
   - 4-step campaign builder wizard
   - Template-based email creation
   - Send to multiple contact lists
   - Campaign status tracking (draft, sending, sent, failed)
   - Campaign statistics and analytics

2. **Email Templates**
   - Create and manage HTML email templates
   - Variable replacement ({{firstName}}, {{email}}, etc.)
   - Template preview with sample data
   - Template duplication
   - HTML editor with syntax highlighting

3. **Contact Management**
   - Add, edit, and delete contacts
   - Contact segmentation with tags
   - Custom fields support (JSONB)
   - Subscription status management
   - Search and filter contacts

4. **Contact Lists**
   - Create and manage contact lists
   - Add/remove contacts from lists
   - List-based campaign targeting
   - Contact count tracking
   - List descriptions

5. **Email Sending**
   - SendGrid integration
   - Personalized email rendering
   - Batch sending to contact lists
   - Duplicate contact removal
   - Rate limiting (100ms delay)
   - Detailed send logging

---

## 🏗️ Architecture

### Database Schema

**8 Tables:**
- `email_templates` - Template storage
- `contact_lists` - List management
- `email_contacts` - Contact information
- `contact_list_members` - Many-to-many relationship
- `email_campaigns` - Campaign data
- `campaign_recipients` - Individual send tracking
- `email_events` - Event tracking
- `campaign_lists` - Campaign-list associations

### Backend Structure

```
backend/
├── db/
│   ├── schema.sql (Email marketing tables)
│   └── repositories/
│       └── emailRepository.js (CRUD operations)
├── services/
│   ├── emailService.js (SendGrid integration)
│   └── templateService.js (Template rendering)
├── routes/
│   └── emailMarketing.js (API endpoints)
└── tests/
    ├── emailRepository.test.js
    ├── emailService.test.js
    ├── emailMarketing.routes.test.js
    └── integration/
        └── emailCampaign.test.js
```

### Frontend Structure

```
frontend/src/
├── pages/
│   ├── EmailDashboard.jsx (Overview)
│   ├── EmailCampaigns.jsx (Campaign list)
│   ├── CampaignBuilder.jsx (4-step wizard)
│   ├── EmailContacts.jsx (Contacts & Lists)
│   └── EmailTemplates.jsx (Template management)
└── components/
    └── StepIndicator.jsx (Wizard progress)
```

---

## 📡 API Endpoints

### Campaigns

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/email/campaigns` | Create new campaign |
| `GET` | `/api/email/campaigns` | Get all user campaigns |
| `GET` | `/api/email/campaigns/:id` | Get single campaign |
| `PUT` | `/api/email/campaigns/:id` | Update campaign |
| `DELETE` | `/api/email/campaigns/:id` | Delete campaign |
| `POST` | `/api/email/campaigns/:id/send` | Send campaign to lists |
| `POST` | `/api/email/campaigns/:id/test` | Send test email |
| `GET` | `/api/email/campaigns/:id/stats` | Get campaign statistics |

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/email/templates` | Create template |
| `GET` | `/api/email/templates` | Get all templates |
| `GET` | `/api/email/templates/:id` | Get single template |

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/email/contacts` | Create/upsert contact |
| `GET` | `/api/email/contacts` | Get all contacts |
| `GET` | `/api/email/contacts/:id` | Get single contact |
| `PUT` | `/api/email/contacts/:id` | Update contact |
| `DELETE` | `/api/email/contacts/:id` | Delete contact |
| `POST` | `/api/email/contacts/:id/subscribe` | Subscribe contact |
| `POST` | `/api/email/contacts/:id/unsubscribe` | Unsubscribe contact |

### Lists

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/email/lists` | Create list |
| `GET` | `/api/email/lists` | Get all lists |
| `GET` | `/api/email/lists/:id` | Get single list |
| `PUT` | `/api/email/lists/:id` | Update list |
| `DELETE` | `/api/email/lists/:id` | Delete list |
| `POST` | `/api/email/lists/:id/contacts` | Add contacts to list |
| `GET` | `/api/email/lists/:id/contacts` | Get contacts in list |

### Validation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/email/validate` | Validate email service config |

---

## 🔧 Configuration

### Environment Variables

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
DEFAULT_FROM_NAME=AI Agent Platform

# Server Configuration
SERVER_URL=http://localhost:3000
```

### SendGrid Setup

1. Create a SendGrid account
2. Generate an API key with "Mail Send" permissions
3. Verify your sender email/domain
4. Add API key to `.env` file

---

## 📝 Usage Examples

### Create a Campaign

```javascript
// Frontend: CampaignBuilder.jsx
const payload = {
  name: "Summer Sale 2024",
  subject: "Don't miss our summer deals!",
  template_id: "550e8400-e29b-41d4-a716-446655440000",
  status: "draft"
};

const response = await axios.post('/api/email/campaigns', payload);
```

### Send Campaign to Lists

```javascript
// Frontend: CampaignBuilder.jsx
const response = await axios.post(
  `/api/email/campaigns/${campaignId}/send`,
  { listIds: ["list-uuid-1", "list-uuid-2"] }
);
```

### Create Template with Variables

```javascript
const template = {
  name: "Welcome Email",
  html_content: `
    <h1>Hello {{firstName}}!</h1>
    <p>Welcome to {{companyName}}.</p>
    <p>Your email: {{email}}</p>
  `,
  subject_template: "Welcome {{firstName}}!"
};
```

### Add Contact to List

```javascript
await axios.post(
  `/api/email/lists/${listId}/contacts`,
  { contactIds: ["contact-uuid-1", "contact-uuid-2"] }
);
```

---

## 🎨 Template Variables

Supported variables in templates:

- `{{firstName}}` - Contact's first name
- `{{lastName}}` - Contact's last name
- `{{fullName}}` - Full name (firstName + lastName)
- `{{email}}` - Contact's email address
- `{{companyName}}` - Company name
- `{{phone}}` - Phone number
- `{{customFields.fieldName}}` - Custom field access
- `{{unsubscribeLink}}` - Auto-generated unsubscribe link
- `{{preferencesLink}}` - Auto-generated preferences link

---

## 🔄 Email Sending Flow

1. **User creates campaign** → Status: `draft`
2. **User selects template** → Template ID stored
3. **User selects contact lists** → List IDs stored
4. **User clicks "Send Campaign"** → Frontend sends:
   ```json
   POST /api/email/campaigns/:id/send
   { "listIds": ["uuid-1", "uuid-2"] }
   ```
5. **Backend processes:**
   - Validates campaign is in `draft` status
   - Fetches all contacts from selected lists
   - Removes duplicate contacts (by email)
   - Fetches template HTML if not in campaign
   - Updates campaign status to `sending`
   - For each contact:
     - Renders personalized email
     - Sends via SendGrid
     - Creates recipient record
     - Logs success/failure
   - Updates campaign status to `sent`
   - Returns summary

---

## 📊 Campaign Statistics

Campaign statistics include:

- `total_recipients` - Total contacts in selected lists
- `total_sent` - Successfully sent emails
- `total_delivered` - Delivered emails (from SendGrid webhooks)
- `total_opened` - Opened emails
- `total_clicked` - Clicked emails
- `total_bounced` - Bounced emails
- `total_unsubscribed` - Unsubscribed contacts

---

## 🎯 Frontend Features

### Email Dashboard
- Campaign overview with statistics
- Recent campaigns list
- Quick action cards
- Real-time data fetching

### Campaign Builder (4-Step Wizard)
1. **Details** - Campaign name and subject
2. **Template** - Select email template
3. **Recipients** - Select contact lists
4. **Review** - Preview and send

### Contacts & Lists Management
- Tabbed interface (Contacts / Lists)
- Search and filter functionality
- Add/edit/delete operations
- Tag management
- List membership management

### Template Editor
- HTML editor with syntax highlighting
- Variable insertion buttons
- Live preview with sample data
- Template duplication
- Sample template generator

---

## 🧪 Testing

### Test Suite

**65 tests passing:**
- Repository tests (18 tests)
- Service tests (15 tests)
- Route tests (20 tests)
- Integration tests (12 tests)

### Run Tests

```bash
cd backend
npm test -- emailMarketing
```

---

## 🔒 Security & Compliance

### Features
- ✅ Authentication required for all endpoints
- ✅ User isolation (users can only access their own data)
- ✅ Email validation
- ✅ Unsubscribe link in every email
- ✅ GDPR-ready (unsubscribe, data export)

### Best Practices
- Rate limiting (100ms delay between sends)
- Duplicate contact removal
- Error handling and logging
- Input validation

---

## 🚀 Future Enhancements (Phase 3 & 4)

### Planned Features
- Email automation workflows
- A/B testing
- Advanced analytics dashboard
- CSV import/export
- Email scheduling
- Webhook support for events
- AI-powered content generation
- Click tracking and heat maps

---

## 📚 Related Documentation

- [Email Marketing Implementation Plan](./EMAIL_MARKETING_IMPLEMENTATION_PLAN.md)
- [Email Marketing Frontend Complete](./EMAIL_MARKETING_FRONTEND_COMPLETE.md)
- [Backend Services README](./backend/services/_README.md)

---

## 🐛 Troubleshooting

### Common Issues

**Campaign template_id is null:**
- Ensure template is selected in step 2
- Check that template_id is sent as UUID string (not integer)

**Email sending fails:**
- Verify SendGrid API key is set
- Check DEFAULT_FROM_EMAIL is configured
- Ensure contacts are subscribed (is_subscribed = true)

**Template variables not replacing:**
- Use correct variable syntax: `{{variableName}}`
- Ensure contact has the required fields

---

## 📞 Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify environment variables are set correctly
3. Review test suite for expected behavior
4. Check SendGrid dashboard for delivery status

---

**Last Updated:** November 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready


