# 📞 Calling Feature Documentation

## Overview

The Calling Feature provides AI-powered voice call capabilities through Twilio integration. It enables real-time voice conversations with AI agents, featuring ultra-low latency (800-1200ms), high-quality voice synthesis, and seamless integration with the platform's agent system.

**Status:** ✅ **Production Ready**  
**Latency:** 800-1200ms (excellent for voice)  
**Last Updated:** November 2025

---

## 🎯 Features

### Core Capabilities

1. **Real-Time Voice Calls**
   - WebSocket-based media streaming
   - Twilio Media Streams integration
   - Real-time speech-to-text (100-200ms)
   - Streaming text-to-speech (200-300ms TTFB)
   - Ultra-low latency (800-1200ms total)

2. **AI Voice Agents**
   - GPT-4o-mini for fast responses (400-700ms)
   - Voice-optimized prompts
   - Short, conversational responses (1-2 sentences)
   - Function calling support
   - Conversation persistence

3. **Speech Processing**
   - **Deepgram STT** - Real-time transcription
   - **ElevenLabs Streaming TTS** - High-quality voice synthesis
   - **Smart TTS Selection** - Twilio Say for short, ElevenLabs for long
   - 20+ premium voices available

4. **Call Management**
   - Outbound call initiation
   - Call status tracking
   - Live transcript streaming
   - Call recording support
   - Call analytics

5. **Integration**
   - Twilio phone number management
   - Agent-based call routing
   - Custom greetings
   - Function execution during calls

---

## 🏗️ Architecture

### System Components

```
┌─────────────┐
│   Twilio    │
│  Phone Call │
└──────┬──────┘
       │ Media Streams (WebSocket)
       ▼
┌─────────────────────┐
│  Voice Gateway      │
│  (WebSocket Server) │
└──────┬──────────────┘
       │
       ├──► Deepgram STT (Speech-to-Text)
       │
       ├──► GPT-4o-mini (AI Processing)
       │
       └──► ElevenLabs TTS (Text-to-Speech)
            │
            └──► Audio chunks back to Twilio
```

### Backend Structure

```
backend/
├── services/
│   ├── voiceGatewayStreaming.js (Main gateway)
│   ├── aiServiceOptimized.js (Fast AI processing)
│   ├── deepgramService.js (Speech-to-text)
│   ├── elevenlabsStreamingService.js (Streaming TTS)
│   └── twilioService.js (Twilio utilities)
├── routes/
│   └── twilio.js (Twilio webhooks & call endpoints)
├── utils/
│   ├── callStore.js (Call state management)
│   └── transcriptBus.js (Transcript publishing)
└── db/
    └── repositories/
        └── callRepository.js (Call data storage)
```

---

## 📡 API Endpoints

### Call Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/twilio/validate` | Validate Twilio credentials |
| `POST` | `/api/twilio/call` | Initiate outbound call |
| `POST` | `/api/twilio/voice/stream` | Get TwiML for media stream |
| `POST` | `/api/twilio/status` | Call status webhook |
| `POST` | `/api/twilio/transcript/:callSid` | Get call transcript |

### WebSocket Endpoint

| Protocol | Endpoint | Description |
|----------|----------|-------------|
| `WebSocket` | `/voice-stream` | Media stream connection |

---

## 🔧 Configuration

### Environment Variables

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token

# Voice Gateway
VOICE_GATEWAY_WS_URL=ws://your-domain.com/voice-stream
SERVER_URL=http://your-domain.com

# AI & Voice Services
OPENAI_API_KEY=sk-your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
DEEPGRAM_API_KEY=your_deepgram_key

# Optional
ENABLE_STREAMING_TTS=true
```

### Agent Configuration

Agents require voice settings:

```javascript
{
  id: "uuid",
  name: "Voice Agent",
  system_prompt: "You are a helpful voice assistant...",
  voiceSettings: {
    voice: "Rachel", // ElevenLabs voice name
    stability: 0.5,
    similarity_boost: 0.75,
    speed: 1.0
  },
  twilioConfig: {
    accountSid: "AC...",
    authToken: "your_token",
    phoneNumber: "+1234567890"
  }
}
```

---

## 📝 Usage Examples

### Initiate Outbound Call

```javascript
// Frontend: TestAgent.jsx
const response = await axios.post('/api/twilio/call', {
  agentId: 'agent-uuid',
  phoneNumber: '+1234567890' // E.164 format
});

const { callSid } = response.data;
// Use callSid to track call status
```

### Validate Twilio Credentials

```javascript
const response = await axios.post('/api/twilio/validate', {
  accountSid: 'AC...',
  authToken: 'your_token',
  phoneNumber: '+1234567890'
});

if (response.data.valid) {
  console.log('Credentials valid!');
}
```

### Get Call Transcript

```javascript
const transcript = await axios.get(
  `/api/twilio/transcript/${callSid}`
);
```

---

## 🔄 Call Flow

1. **User initiates call** → Frontend sends POST `/api/twilio/call`
2. **Backend creates Twilio call** → Uses agent's Twilio credentials
3. **Twilio calls phone** → Connects to `/api/twilio/voice/stream`
4. **TwiML response** → Instructs Twilio to connect WebSocket
5. **WebSocket connection** → `/voice-stream` endpoint
6. **Stream starts** → Voice gateway receives connection
7. **User speaks** → Twilio sends audio via WebSocket
8. **Deepgram transcribes** → Real-time speech-to-text
9. **AI processes** → GPT-4o-mini generates response
10. **ElevenLabs synthesizes** → Text-to-speech streaming
11. **Audio sent back** → Via WebSocket to Twilio
12. **User hears response** → Conversation continues
13. **Call ends** → Transcript saved, call record updated

---

## 🎙️ Speech Processing

### Speech-to-Text (Deepgram)

**Features:**
- Real-time transcription via WebSocket
- Interim transcripts (real-time feedback)
- Final transcripts (when user stops speaking)
- Low latency (~100-200ms)
- High accuracy

**Configuration:**
```javascript
// Automatic in voiceGatewayStreaming.js
// Uses DEEPGRAM_API_KEY from environment
```

### Text-to-Speech (ElevenLabs)

**Features:**
- Streaming TTS for low latency
- 20+ premium voices
- High-quality audio
- 200-300ms time-to-first-byte
- Chunk-by-chunk delivery

**Voice Selection:**
- Configured in agent `voiceSettings`
- Options: Rachel, Adam, Emily, etc.
- Customizable stability, similarity, speed

**Smart TTS Selection:**
- Short responses (<15 words) → Twilio Say (faster)
- Long responses (≥15 words) → ElevenLabs (better quality)

---

## 🤖 AI Processing

### Optimized AI Service

**Model:** GPT-4o-mini (fast, cost-effective)

**Optimizations:**
- Reduced token limits (50-60 tokens for voice)
- Cached system prompts (5min TTL)
- Voice-optimized instructions
- Streaming support

**Response Guidelines:**
- Keep responses EXTREMELY SHORT (1-2 sentences)
- Speak naturally and conversationally
- NO lists, bullet points, or long explanations
- Ask follow-up questions
- Stay within context

### Function Calling

Voice agents support function calling:

```javascript
// User: "Check my availability for tomorrow"
// AI detects function → executes check_availability_cal
// AI receives result → responds naturally
```

---

## 📊 Performance Metrics

### Latency Breakdown

- **Deepgram STT:** 100-200ms
- **GPT-4o-mini AI:** 400-700ms
- **ElevenLabs TTS:** 200-300ms (TTFB)
- **Network overhead:** ~100ms
- **Total:** 800-1200ms (excellent for voice)

### Cost per Minute

- **Deepgram STT:** ~$0.0043/min
- **GPT-4o-mini:** ~$0.06/min
- **ElevenLabs TTS:** ~$0.02/min
- **Twilio:** ~$0.013/min
- **Total:** ~$0.08-0.15/min

---

## 🎨 Frontend Features

### Call Interface

- **Call Controls**
  - Start call button
  - End call button
  - Phone number input
  - Call status display

- **Live Transcript**
  - Real-time transcription display
  - User and AI messages
  - Timestamp tracking
  - Auto-scroll to latest

- **Call Status**
  - Connecting
  - Ringing
  - In Progress
  - Completed
  - Failed

### Transcript Streaming

```javascript
// Real-time transcript updates
subscribe(callSid, (transcript) => {
  if (transcript.type === 'user') {
    // Display user message
  } else if (transcript.type === 'assistant') {
    // Display AI response
  }
});
```

---

## 🔒 Security & Best Practices

### Security

- ✅ Twilio webhook validation
- ✅ Agent-based call routing
- ✅ User authentication required
- ✅ Secure credential storage
- ✅ Call recording compliance

### Best Practices

1. **Voice Settings**
   - Use appropriate voice for use case
   - Test stability and similarity settings
   - Adjust speed for clarity

2. **System Prompts**
   - Keep prompts concise
   - Include voice-specific instructions
   - Test with real calls

3. **Error Handling**
   - Implement fallbacks for TTS failures
   - Handle network disconnections
   - Graceful degradation

4. **Monitoring**
   - Track call success rates
   - Monitor latency
   - Review transcripts for quality

---

## 🧪 Testing

### Test Call Flow

1. **Configure Agent**
   - Set voice settings
   - Add Twilio credentials
   - Validate credentials

2. **Initiate Test Call**
   - Enter test phone number
   - Click "Start Call"
   - Answer phone call

3. **Monitor Call**
   - View live transcript
   - Check call status
   - Test function calling

4. **Review Results**
   - Check transcript accuracy
   - Review call duration
   - Analyze response quality

### API Testing

```bash
# Validate credentials
curl -X POST http://localhost:3000/api/twilio/validate \
  -H "Content-Type: application/json" \
  -d '{
    "accountSid": "AC...",
    "authToken": "token",
    "phoneNumber": "+1234567890"
  }'

# Initiate call
curl -X POST http://localhost:3000/api/twilio/call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "agentId": "uuid",
    "phoneNumber": "+1234567890"
  }'
```

---

## 🐛 Troubleshooting

### Common Issues

**Call not connecting:**
- Verify Twilio credentials
- Check phone number format (E.164)
- Review Twilio account status
- Check network connectivity

**No audio:**
- Verify WebSocket connection
- Check ElevenLabs API key
- Review voice gateway logs
- Test TTS service directly

**High latency:**
- Check AI model selection
- Review network conditions
- Optimize system prompts
- Consider using GPT-3.5 for faster responses

**Transcript not updating:**
- Verify Deepgram API key
- Check WebSocket connection
- Review transcript bus logs
- Test STT service directly

---

## 🚀 Performance Optimization

### Latency Optimization

1. **Use GPT-4o-mini** - Fastest model
2. **Limit response length** - 50-60 tokens max
3. **Cache system prompts** - Reduces processing time
4. **Stream TTS** - Start playing before full response
5. **Optimize network** - Use CDN for audio delivery

### Cost Optimization

1. **Use GPT-4o-mini** - Most cost-effective
2. **Short responses** - Reduce token usage
3. **Smart TTS selection** - Use Twilio Say for short responses
4. **Monitor usage** - Track costs per call
5. **Optimize prompts** - Reduce token count

---

## 📚 Related Documentation

- [Backend Services README](./backend/services/_README.md)
- [Voice Gateway Code](./backend/services/voiceGatewayStreaming.js)
- [Twilio Integration](./backend/routes/twilio.js)
- [AI Service Optimized](./backend/services/aiServiceOptimized.js)

---

## 🔄 Future Enhancements

### Planned Features

- Call recording and playback
- Advanced analytics dashboard
- Multi-language support
- Voice cloning
- Real-time sentiment analysis
- Call quality metrics
- Automated call routing
- Voicemail handling

---

## 📞 Support

### Resources

- **Twilio Docs:** https://www.twilio.com/docs
- **Deepgram Docs:** https://developers.deepgram.com
- **ElevenLabs Docs:** https://elevenlabs.io/docs
- **OpenAI Docs:** https://platform.openai.com/docs

### Getting Help

1. Check console logs for errors
2. Verify all API keys are set
3. Review call status in Twilio dashboard
4. Test individual services (STT, TTS, AI)
5. Check network connectivity

---

**Last Updated:** November 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Latency:** 800-1200ms (Excellent)


