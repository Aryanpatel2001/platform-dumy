# 🤖 AI Agent Platform

A comprehensive platform for building and managing AI chatbot and voice call agents with custom function capabilities, similar to Retell AI.

## ✨ Features

### 🎯 Core Capabilities
- **Chatbot Agents**: Text-based conversational AI with custom functions
- **Voice Call Agents**: AI-powered phone agents with ultra-low latency (<500ms)
- **OpenAI Realtime API**: Enterprise-grade voice with 300-500ms latency
- **Optimized Pipeline**: Budget-friendly 1-1.8s latency option
- **Custom Functions**: Connect any API endpoint to your agents
- **Cal.com Integration**: Built-in calendar scheduling functions
- **Twilio Testing**: Test voice agents with real phone calls
- **Modern UI**: Clean, responsive interface with dark mode support

### 🔧 Agent Builder
- Multi-step wizard for easy agent creation
- Visual function configuration
- Real-time testing interface
- Live call transcripts
- Function execution monitoring

## 🏗️ Tech Stack

### Frontend
- **React 19** with Vite
- **Tailwind CSS v3** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Axios** for API calls
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **OpenAI API** (GPT-4, GPT-3.5)
- **ElevenLabs** for text-to-speech
- **Twilio** for phone calls
- **Cal.com API v2** for scheduling

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key
- (Optional) ElevenLabs API key
- (Optional) Twilio account for voice testing

### 1. Clone the repository
```bash
git clone <repository-url>
cd platform
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Install Backend Dependencies
```bash
cd ../backend
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
SERVER_URL=http://localhost:3000

# Database Configuration (Required for persistent storage)
DATABASE_URL=postgresql://user:password@host:port/database

# OpenAI Configuration (Required)
OPENAI_API_KEY=your_openai_api_key

# JWT Configuration (Required for authentication)
JWT_SECRET=your_32_character_or_longer_secret_key_here
JWT_EXPIRES_IN=7d

# ElevenLabs Configuration (Optional - for voice agents)
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Deepgram Configuration (Optional - for speech-to-text)
DEEPGRAM_API_KEY=your_deepgram_api_key


# Phase C: High-quality streaming TTS with ElevenLabs
USE_STREAMING_TTS=false

# Encryption Key (Optional - for encrypting stored API keys)
ENCRYPTION_KEY=your_32_character_encryption_key
```

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
```bash
cd backend
npm start
```

## 📖 Usage Guide

### Creating a Chatbot Agent

1. **Navigate to Dashboard**
   - Click "Create Agent"

2. **Choose Agent Type**
   - Select "Chatbot Agent"

3. **Basic Configuration**
   - Enter agent name and description
   - Write system prompt defining behavior
   - Select AI model (GPT-4, GPT-3.5, etc.)
   - Adjust temperature and max tokens

4. **Add Functions (Optional)**
   - **Cal.com Integration**:
     - Select "Check Availability" or "Book Appointment"
     - Enter Cal.com API key
     - Enter Event Type ID
     - Set timezone
   
   - **Custom Functions**:
     - Enter function name
     - Set HTTP method and URL
     - Add headers (e.g., Authorization)
     - Define request body template
     - Specify parameters

5. **Review & Deploy**
   - Review configuration
   - Click "Create Agent"

6. **Test Your Agent**
   - Navigate to agent detail page
   - Click "Test Agent"
   - Start chatting!

### Creating a Voice Call Agent

Follow the same steps as chatbot, plus:

4. **Voice Configuration**
   - Select voice (Rachel, Adam, Emily, etc.)
   - Set greeting message
   - Adjust stability, similarity boost, and speed

5. **Testing Configuration**
   - Enter Twilio Account SID
   - Enter Twilio Auth Token
   - Enter Twilio phone number
   - Click "Validate Credentials"
   - Optionally set test phone number

6. **Test Voice Agent**
   - Enter phone number to call
   - Click "Start Call"
   - View live transcript
   - Click "End Call" when done

## 🔧 Function System

### How Functions Work

1. **Function Detection**: The AI detects when a function should be called based on conversation context
2. **Parameter Extraction**: AI extracts required parameters from the conversation
3. **Execution**: Backend executes the function (API call)
4. **Response**: AI receives function result and responds naturally to the user

### Cal.com Functions

**Check Availability:**
```javascript
// Mention in prompt: "check my availability" or "what slots are available"
// AI will call: check_availability_cal
// Returns: List of available time slots
```

**Book Appointment:**
```javascript
// Mention in prompt: "book an appointment for tomorrow at 2pm"
// AI extracts: date, time, attendee info
// AI calls: book_appointment_cal
// Returns: Booking confirmation
```

### Custom Function Example

**Send Email Function:**
```javascript
{
  name: "send_email",
  description: "Send an email to a recipient",
  method: "POST",
  url: "https://api.example.com/send-email",
  headers: [
    { key: "Authorization", value: "Bearer ${API_KEY}" },
    { key: "Content-Type", value: "application/json" }
  ],
  bodyTemplate: {
    to: "${email}",
    subject: "${subject}",
    body: "${message}"
  },
  parameters: [
    { name: "email", type: "string", required: true },
    { name: "subject", type: "string", required: true },
    { name: "message", type: "string", required: true }
  ]
}
```

## 🎨 UI/UX Features

- **Modern Design**: Inspired by Cluely, Braintrust, Xona Space, and Flieber
- **Smooth Animations**: Framer Motion powered transitions
- **Dark Mode**: Full dark theme support
- **Responsive**: Works on all screen sizes
- **Gradient Backgrounds**: Beautiful mesh gradients
- **Glass Morphism**: Modern glassmorphism effects

## 📡 API Endpoints

### Agents
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents` - Create agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent

### Chat
- `POST /api/agents/:id/chat` - Send message to chatbot

### Voice Calls
- `POST /api/twilio/validate` - Validate Twilio credentials
- `POST /api/agents/:id/call` - Initiate voice call
- `POST /api/agents/:id/call/end` - End voice call

### Cal.com
- `POST /api/calcom/availability` - Check availability
- `POST /api/calcom/book` - Book appointment

## 🔐 Security

- API keys encrypted before storage
- Input validation on all endpoints
- Rate limiting (recommended for production)
- CORS configuration
- Webhook signature verification

## 🚧 Production Deployment

### Recommended Setup

1. **Database**: Replace in-memory store with PostgreSQL/MongoDB
2. **File Storage**: Use S3 for audio files
3. **Environment Variables**: Use proper secret management
4. **SSL/TLS**: Enable HTTPS
5. **Monitoring**: Add Sentry or similar
6. **Rate Limiting**: Implement rate limiting
7. **Load Balancing**: Use multiple backend instances

### Deployment Platforms

**Frontend:**
- Vercel (recommended)
- Netlify
- AWS S3 + CloudFront

**Backend:**
- Railway (recommended)
- Render
- AWS EC2/ECS
- DigitalOcean

## 🐛 Troubleshooting

### Common Issues

**OpenAI API Error:**
- Check API key is valid
- Ensure you have credits
- Verify model access (GPT-4 requires separate access)

**Twilio Call Fails:**
- Verify credentials are correct
- Check phone number format (+1234567890)
- Ensure Twilio account is active

**Cal.com Integration Issues:**
- Verify API key is valid
- Check Event Type ID is correct
- Ensure Cal.com account has API access

**ElevenLabs Voice Not Working:**
- Check API key is configured
- Verify voice ID is valid
- ElevenLabs is optional - calls will use Twilio's voice if not configured

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

---

Built with ❤️ using React, Node.js, OpenAI, ElevenLabs, and Twilio

