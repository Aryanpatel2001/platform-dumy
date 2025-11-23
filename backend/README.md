# Backend - AI Agent Platform

Node.js/Express backend for the AI Agent Platform.

## Structure

```
backend/
├── routes/           # API route handlers
│   ├── agents.js    # Agent CRUD operations
│   ├── chat.js      # Chat/messaging endpoints
│   ├── twilio.js    # Voice call endpoints
│   └── calcom.js    # Cal.com integration
├── services/        # Business logic
│   ├── aiService.js          # OpenAI/Claude integration
│   ├── calcomService.js      # Cal.com API v2
│   ├── twilioService.js      # Twilio voice calls
│   ├── elevenLabsService.js  # Text-to-speech
│   └── functionExecutor.js   # Function execution
├── utils/           # Utilities
│   ├── store.js     # In-memory data store
│   └── validation.js # Input validation
├── server.js        # Express app entry point
└── package.json     # Dependencies
```

## Key Services

### AI Service (`services/aiService.js`)
- Processes messages with OpenAI/Claude
- Builds system prompts with function definitions
- Detects function calls in AI responses
- Handles conversation history

### Cal.com Service (`services/calcomService.js`)
- Checks calendar availability
- Books appointments
- Uses Cal.com API v2 with proper authentication

### Twilio Service (`services/twilioService.js`)
- Initiates outbound calls
- Handles voice webhooks
- Processes speech-to-text
- Manages call lifecycle

### ElevenLabs Service (`services/elevenLabsService.js`)
- Generates speech from text
- Supports multiple voice IDs
- Configurable voice settings

### Function Executor (`services/functionExecutor.js`)
- Routes function calls to appropriate service
- Executes custom API functions
- Handles parameter substitution
- Returns structured responses

## Environment Variables

Required:
- `OPENAI_API_KEY` - OpenAI API key

Optional:
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `ANTHROPIC_API_KEY` - Claude API key
- `PORT` - Server port (default: 3000)
- `SERVER_URL` - Public URL for webhooks

## API Documentation

See main README.md for complete API documentation.

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

## Database Migration

The current implementation uses an in-memory store. For production:

1. Install database client (e.g., `pg` for PostgreSQL)
2. Create database schema
3. Replace `utils/store.js` with database queries
4. Add connection pooling
5. Implement migrations

Example PostgreSQL schema:
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  system_prompt TEXT,
  model VARCHAR(50),
  temperature FLOAT,
  max_tokens INTEGER,
  voice_settings JSONB,
  twilio_config JSONB,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agent_functions (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20),
  config JSONB,
  parameters JSONB
);
```

