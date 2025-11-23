import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, MessageSquare, Send, Phone, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const TestAgent = () => {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [calling, setCalling] = useState(false);
  const [callSid, setCallSid] = useState(null);
  const [callStatus, setCallStatus] = useState(null);
  const statusPollerRef = useRef(null);
  const transcriptStreamRef = useRef(null);
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/agents/${id}`);
        setAgent(res.data);
      } catch (error) {
        console.error('Error fetching agent:', error);
        toast.error('Failed to load agent');
      } finally {
        setLoading(false);
      }
    };
    fetchAgent();
    return () => {
      // Cleanup any status polling on unmount
      if (statusPollerRef.current) {
        clearInterval(statusPollerRef.current);
        statusPollerRef.current = null;
      }
    };
  }, [id]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setSending(true);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    try {
      const res = await axios.post(`http://localhost:3000/api/agents/${id}/chat`, {
        message: text,
        conversationId: conversationId || undefined,
        stream: false
      });
      if (res.data?.conversationId && !conversationId) {
        setConversationId(res.data.conversationId);
      }
      const reply = res.data?.message || 'No response';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('Chat send error:', error);
      const msg = error.response?.data?.message || 'Failed to send message';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  // Auto-scroll to the latest message
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Agent Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The agent you're looking for doesn't exist
        </p>
        <Link to="/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Trigger Twilio outbound call and start status polling
  const startOutboundCall = async () => {
    try {
      const phone = phoneNumber.trim();
      if (!phone) {
        toast.error('Enter a phone number in E.164 format');
        return;
      }
      // Basic E.164 validation client-side
      if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
        toast.error('Invalid phone format. Use +15551234567');
        return;
      }

      setCalling(true);
      setCallStatus('initiated');
      setCallSid(null);

      const res = await axios.post('http://localhost:3000/api/twilio/call', {
        agentId: id,
        phoneNumber: phone
      });

      const sid = res.data?.sid;
      if (!sid) {
        throw new Error('No call SID returned');
      }

      setCallSid(sid);
      setCallStatus(res.data?.status || 'queued');
      toast.success('Call initiated');

      // Start live transcript subscription (SSE)
      try {
        if (transcriptStreamRef.current) {
          transcriptStreamRef.current.close();
          transcriptStreamRef.current = null;
        }
        const url = `http://localhost:3000/api/twilio/transcripts/${sid}/stream`;
        const es = new EventSource(url);
        es.onmessage = (evt) => {
          try {
            const payload = JSON.parse(evt.data);
            if (payload?.type === 'meta') return; // ignore meta
            if (payload?.type === 'done') {
              es.close();
              transcriptStreamRef.current = null;
              return;
            }
            // Normalize to message list
            if (payload?.type === 'user') {
              // Only append final user transcripts; skip interim to avoid duplicates
              if (!payload.final) return;
              setTranscripts(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'user' && last.content === payload.text) return prev; // dedupe
                return [...prev, { role: 'user', content: payload.text }];
              });
            } else if (payload?.type === 'assistant') {
              setTranscripts(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'assistant' && last.content === payload.text) return prev; // dedupe
                return [...prev, { role: 'assistant', content: payload.text }];
              });
            } else if (payload?.type === 'status' && payload.status) {
              setTranscripts(prev => [...prev, { role: 'system', content: `Stream ${payload.status}` }]);
            }
          } catch {}
        };
        es.onerror = () => {
          // Auto-close on error
          try { es.close(); } catch {}
          transcriptStreamRef.current = null;
        };
        transcriptStreamRef.current = es;
      } catch {}

      // Begin status polling every 2 seconds
      if (statusPollerRef.current) clearInterval(statusPollerRef.current);
      statusPollerRef.current = setInterval(async () => {
        try {
          const st = await axios.get(`http://localhost:3000/api/twilio/call/${sid}?agentId=${id}`);
          const status = st.data?.status || null;
          if (status) setCallStatus(status);
          // Stop polling on terminal states
          if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(status)) {
            clearInterval(statusPollerRef.current);
            statusPollerRef.current = null;
            setCalling(false);
            toast.success(`Call ${status}`);
            // Close transcript stream on terminal status
            try { transcriptStreamRef.current?.close(); } catch {}
            transcriptStreamRef.current = null;
          }
        } catch (pollErr) {
          // On polling error, stop polling
          clearInterval(statusPollerRef.current);
          statusPollerRef.current = null;
          setCalling(false);
          try { transcriptStreamRef.current?.close(); } catch {}
          transcriptStreamRef.current = null;
        }
      }, 2000);
    } catch (error) {
      console.error('Outbound call error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to initiate call');
      setCalling(false);
      setCallSid(null);
      setCallStatus(null);
      try { transcriptStreamRef.current?.close(); } catch {}
      transcriptStreamRef.current = null;
    }
  };

  // If voice agent, render voice test UI
  if (agent.type === 'voice_call') {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to={`/dashboard/agent/${id}`} className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Agent</span>
          </Link>
          <div className="flex items-center space-x-2 text-gray-700">
            <Phone className="w-5 h-5 text-purple-600" />
            <span className="font-medium">Testing Voice Call Agent</span>
          </div>
        </div>

        {/* Two-column: Agent Prompt (left) and Test Phone (right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Agent Prompt</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 max-h-96 overflow-y-auto">
              <p className="text-sm font-mono whitespace-pre-wrap">{agent.system_prompt || 'No prompt configured.'}</p>
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Test Phone Call</h3>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone (E.164, e.g., +15551234567)"
              className="input-field"
            />
            <div className="mt-3 flex items-center gap-2">
              <button onClick={startOutboundCall} disabled={calling} className="btn-primary flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{calling ? 'Calling...' : 'Call Now'}</span>
              </button>
              {callSid && (
                <span className="text-xs text-gray-600">SID: {callSid}</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">This triggers an outbound Twilio call and streams audio via the voice gateway.</p>
            {callStatus && (
              <p className="text-sm mt-2"><span className="font-medium">Status:</span> {callStatus}</p>
            )}
          </div>
        </div>

        {/* Live Transcript */}
        {callSid && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-2">Live Transcript</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 max-h-96 overflow-y-auto">
              {transcripts.length === 0 && (
                <p className="text-sm text-gray-500">Waiting for transcript…</p>
              )}
              {transcripts.map((m, i) => (
                <div key={i} className="mb-2">
                  <span className={`text-xs font-semibold mr-2 ${m.role === 'user' ? 'text-blue-600' : m.role === 'assistant' ? 'text-purple-600' : 'text-gray-600'}`}>
                    {m.role === 'user' ? 'User' : m.role === 'assistant' ? 'Agent' : 'System'}
                  </span>
                  <span className="text-sm">{m.content}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voice gateway controls and live events */}
        <div className="card">
          {/* Transcript and audio events */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <h3 className="font-semibold mb-2">Transcripts</h3>
              <div className="h-64 overflow-y-auto space-y-2 text-sm">
                {transcripts.length === 0 ? (
                  <p className="text-gray-500">No transcripts yet. Speak after starting the mic.</p>
                ) : (
                  transcripts.map((t, i) => (
                    <div key={i} className={`px-2 py-1 rounded ${t.final ? 'bg-green-50 text-green-700' : 'bg-gray-100'}`}>{t.text}</div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <h3 className="font-semibold mb-2">Playback</h3>
              <p className="text-sm text-gray-600">Incoming audio is auto‑played when received.</p>
              <ul className="text-sm mt-2 list-disc ml-4 text-gray-600">
                <li>Connect gateway to open WebSocket.</li>
                <li>Start mic to stream PCM16 audio to server.</li>
                <li>Server transcribes (Deepgram), replies (OpenAI), and sends TTS audio (ElevenLabs).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to={`/dashboard/agent/${id}`} className="flex items-center space-x-2 text-brand-muted hover:text-brand-dark">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Agent</span>
        </Link>
        <div className="flex items-center space-x-2 text-brand-dark">
          <MessageSquare className="w-5 h-5 text-brand-primary" />
          <span className="font-medium">Testing Chatbot Agent</span>
        </div>
      </div>

      {/* Chat panel */}
      <Card className="">
        <CardContent className="pt-6">
          <div className="h-[420px] overflow-y-auto space-y-4 p-2 rounded-md">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div className="space-y-2 text-brand-muted">
                  <MessageSquare className="w-6 h-6 mx-auto text-brand-sky" />
                  <p className="text-sm">Start the conversation to test your agent’s replies.</p>
                </div>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div key={idx} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role !== 'user' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-secondary text-brand-white">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-brand-primary text-brand-white rounded-br-none' : 'bg-brand-surface text-brand-dark rounded-bl-none'}
                  `}>
                    {m.content}
                  </div>
                  {m.role === 'user' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-brand-white">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={endOfMessagesRef} />
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="focus-visible:ring-brand-sky"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !sending) {
                sendMessage();
              }
            }}
          />
          <Button onClick={sendMessage} disabled={sending} className="bg-brand-primary hover:bg-brand-secondary text-brand-white min-w-[96px]">
            <Send className="w-4 h-4" />
            <span>{sending ? 'Sending...' : 'Send'}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TestAgent;