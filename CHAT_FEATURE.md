# 💬 Chat Feature Documentation

## Overview

The Chat Feature provides real-time text-based conversational AI capabilities for the AI Agent Platform. It enables users to interact with AI agents through a streaming chat interface, with support for custom functions, conversation history, and persistent conversations.

**Status:** ✅ **Production Ready**  
**Last Updated:** November 2025

---

## 🎯 Features

### Core Capabilities

1. **Real-Time Chat**
   - Streaming responses for instant feedback
   - Server-Sent Events (SSE) for real-time updates
   - Message history persistence
   - Conversation management

2. **AI Agent Integration**
   - Custom system prompts
   - Configurable AI models (GPT-4, GPT-3.5, Claude)
   - Temperature and token limits
   - Function calling support

3. **Custom Functions**
   - Dynamic function execution
   - API integration support
   - Cal.com calendar functions
   - Function result formatting

4. **Conversation Management**
   - Persistent conversation history
   - Conversation ID tracking
   - Message storage in database
   - Function execution logging

5. **User Experience**
   - Clean chat interface
   - Message streaming animation
   - Error handling
   - Loading states

---

## 🏗️ Architecture

### Backend Structure

```
backend/
├── routes/
│   └── chat.js (Chat API endpoints)
├── services/
│   ├── aiService.js (AI processing)
│   └── functionExecutor.js (Function execution)
├── db/
│   └── repositories/
│       ├── agentRepository.js (Agent data)
│       └── conversationRepository.js (Conversation storage)
└── middleware/
    ├── validation.js (Input validation)
    └── rateLimiting.js (Rate limiting)
```

### Frontend Structure

```
frontend/src/
├── pages/
│   └── TestAgent.jsx (Chat interface)
├── utils/
│   └── streamChat.js (SSE streaming utility)
└── components/
    └── (Chat UI components)
```

---

## 📡 API Endpoints

### Chat Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/agents/:id/chat` | Send message to agent |

### Request Body

```json
{
  "message": "Hello, how can you help me?",
  "conversationId": "uuid-optional",
  "stream": true
}
```

### Response (Streaming)

```
data: {"type":"meta","conversationId":"uuid"}

data: {"type":"delta","text":"Hello"}

data: {"type":"delta","text":"! "}

data: {"type":"delta","text":"How"}

...

data: {"type":"done","message":"Full response","conversationId":"uuid","functionCalls":[]}
```

### Response (Non-Streaming)

```json
{
  "message": "Full response text",
  "conversationId": "uuid",
  "functionCalls": []
}
```

---

## 🔧 Configuration

### Agent Configuration

Agents require the following configuration:

```javascript
{
  id: "uuid",
  name: "Customer Support Agent",
  system_prompt: "You are a helpful customer support agent...",
  model: "gpt-4", // or "gpt-3.5-turbo", "claude-3-opus"
  temperature: 0.7,
  max_tokens: 2000,
  functions: [
    {
      name: "check_availability_cal",
      description: "Check calendar availability",
      parameters: { ... }
    }
  ]
}
```

### Environment Variables

```env
OPENAI_API_KEY=sk-your_openai_api_key_here
```

---

## 📝 Usage Examples

### Basic Chat Request

```javascript
// Frontend: TestAgent.jsx
const response = await axios.post(
  `/api/agents/${agentId}/chat`,
  {
    message: "What are your business hours?",
    stream: true
  }
);
```

### Streaming Chat (SSE)

```javascript
// Frontend: streamChat.js
import { streamChat } from '../utils/streamChat';

await streamChat({
  baseUrl: 'http://localhost:3000',
  agentId: 'agent-uuid',
  message: 'Hello!',
  conversationId: 'conversation-uuid', // optional
  onMeta: ({ conversationId }) => {
    console.log('Conversation ID:', conversationId);
  },
  onDelta: (text) => {
    // Append text to message
    setMessage(prev => prev + text);
  },
  onDone: ({ message, conversationId, functionCalls }) => {
    console.log('Complete message:', message);
    console.log('Functions called:', functionCalls);
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});
```

### Function Calling

When an agent has functions configured, the AI can automatically call them:

```javascript
// User: "Check my availability for tomorrow"
// AI detects function call → executes check_availability_cal
// AI receives result → responds naturally to user
```

---

## 🔄 Chat Flow

1. **User sends message** → Frontend sends POST request
2. **Backend validates** → Checks agent exists, validates message
3. **Load conversation** → Creates or retrieves conversation from DB
4. **Load history** → Fetches conversation messages from database
5. **Process with AI** → Calls OpenAI/Claude API
6. **Check for functions** → Detects if function should be called
7. **Execute function** → If needed, executes function and logs result
8. **Generate response** → AI generates final response
9. **Stream response** → Sends chunks via SSE (if streaming)
10. **Save messages** → Stores user message and AI response in DB
11. **Return result** → Returns complete response with conversation ID

---

## 🎨 Frontend Features

### Chat Interface

- **Message Display**
  - User messages (right-aligned)
  - AI messages (left-aligned)
  - Streaming animation
  - Timestamp display

- **Input Area**
  - Text input field
  - Send button
  - Enter key support
  - Loading state during send

- **Conversation Management**
  - New conversation button
  - Conversation ID display
  - Message history persistence

### Streaming Implementation

```javascript
// Real-time text streaming
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Parse SSE events
  // Update UI with delta text
}
```

---

## 🤖 AI Models Supported

### OpenAI Models

- **GPT-4** - Best quality, slower, more expensive
- **GPT-4 Turbo** - Faster GPT-4 variant
- **GPT-3.5 Turbo** - Fast, cost-effective
- **GPT-4o** - Latest optimized model

### Anthropic Models

- **Claude 3 Opus** - Highest quality
- **Claude 3 Sonnet** - Balanced
- **Claude 3 Haiku** - Fastest

### Model Selection

Configure in agent settings:
```javascript
{
  model: "gpt-4", // or "claude-3-opus-20240229"
  temperature: 0.7, // 0.0-2.0, controls randomness
  max_tokens: 2000 // Maximum response length
}
```

---

## 🔧 Function System

### Built-in Functions

#### Cal.com Functions

**Check Availability:**
```javascript
{
  name: "check_availability_cal",
  description: "Check calendar availability for a date range",
  parameters: {
    type: "object",
    properties: {
      dateFrom: { type: "string", format: "date" },
      dateTo: { type: "string", format: "date" }
    }
  }
}
```

**Book Appointment:**
```javascript
{
  name: "book_appointment_cal",
  description: "Book a calendar appointment",
  parameters: {
    type: "object",
    properties: {
      eventTypeId: { type: "number" },
      startTime: { type: "string", format: "date-time" },
      attendeeEmail: { type: "string", format: "email" }
    },
    required: ["eventTypeId", "startTime", "attendeeEmail"]
  }
}
```

### Custom Functions

Define custom functions in agent configuration:

```javascript
{
  name: "get_weather",
  description: "Get current weather for a location",
  parameters: {
    type: "object",
    properties: {
      location: { type: "string" },
      units: { type: "string", enum: ["celsius", "fahrenheit"] }
    },
    required: ["location"]
  },
  request: {
    method: "GET",
    url: "https://api.weather.com/v1/current",
    headers: {
      "Authorization": "Bearer {{API_KEY}}"
    },
    params: {
      location: "{{location}}",
      units: "{{units}}"
    }
  }
}
```

### Function Execution

1. **AI detects function need** → Based on user message
2. **Extracts parameters** → From conversation context
3. **Calls functionExecutor** → Executes API request
4. **Formats result** → Returns structured data
5. **AI processes result** → Generates natural response

---

## 📊 Conversation Management

### Database Schema

**Conversations Table:**
- `id` - UUID primary key
- `agent_id` - Foreign key to agents
- `type` - 'chat' or 'voice'
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Messages Table:**
- `id` - UUID primary key
- `conversation_id` - Foreign key
- `role` - 'user' or 'assistant'
- `content` - Message text
- `created_at` - Timestamp

**Function Executions Table:**
- `id` - UUID primary key
- `conversation_id` - Foreign key
- `function_name` - Function identifier
- `parameters` - JSONB parameters
- `response` - JSONB result
- `status` - 'success' or 'error'
- `execution_time` - Milliseconds
- `created_at` - Timestamp

---

## 🔒 Security & Rate Limiting

### Authentication

All chat endpoints require authentication:
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Rate Limiting

Chat requests are rate-limited to prevent abuse:
- **Default:** 100 requests per 15 minutes per user
- **Configurable** via middleware

### Input Validation

- Message length validation
- Agent ID validation
- Conversation ID validation
- XSS protection

---

## 🧪 Testing

### Test Chat Interface

1. Navigate to agent detail page
2. Click "Test Agent" button
3. Start chatting with the agent
4. View conversation history
5. Test function calling

### API Testing

```bash
curl -X POST http://localhost:3000/api/agents/{agentId}/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "message": "Hello!",
    "stream": false
  }'
```

---

## 🐛 Troubleshooting

### Common Issues

**Streaming not working:**
- Check SSE headers are set correctly
- Verify frontend can handle text/event-stream
- Check network connection

**Function not executing:**
- Verify function is defined in agent
- Check function parameters match schema
- Review function execution logs

**Conversation history missing:**
- Check database connection
- Verify conversation ID is being passed
- Review conversation repository logs

**Slow responses:**
- Check AI model selection (GPT-4 is slower)
- Review token limits
- Check network latency

---

## 🚀 Performance Optimization

### Best Practices

1. **Use streaming** for better UX
2. **Limit conversation history** to recent messages
3. **Cache system prompts** for repeated requests
4. **Use GPT-3.5** for faster responses when quality allows
5. **Implement message pagination** for long conversations

### Token Management

- **System prompt:** ~500-1000 tokens
- **History:** ~100-500 tokens per message
- **Response:** Limited by max_tokens setting
- **Total limit:** Model-dependent (GPT-4: 8k-128k tokens)

---

## 📚 Related Documentation

- [Backend Services README](./backend/services/_README.md)
- [Agent Builder Documentation](./README.md#agent-builder)
- [Function System Guide](./README.md#function-system)

---

## 🔄 Future Enhancements

### Planned Features

- Multi-turn conversation optimization
- Context window management
- Message search and filtering
- Export conversation history
- Conversation analytics
- Custom function marketplace
- Voice-to-text integration

---

**Last Updated:** November 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready


