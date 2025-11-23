import { useState } from 'react';
import { Code, Copy, Check, Book, Webhook, Key, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const APIDocumentation = () => {
  const [copiedCode, setCopiedCode] = useState({});
  const [activeSection, setActiveSection] = useState('overview');

  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode({ ...copiedCode, [id]: true });
    toast.success('Copied to clipboard!');
    setTimeout(() => {
      setCopiedCode({ ...copiedCode, [id]: false });
    }, 2000);
  };

  const CodeBlock = ({ code, language = 'bash', id }) => (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition"
      >
        {copiedCode[id] ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );

  const EndpointCard = ({ method, path, description, example, params = [] }) => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <span className={`px-2 py-1 rounded text-sm font-mono ${
              method === 'GET' ? 'bg-blue-100 text-blue-800' :
              method === 'POST' ? 'bg-green-100 text-green-800' :
              method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
              method === 'DELETE' ? 'bg-red-100 text-red-800' : 'bg-gray-100'
            }`}>
              {method}
            </span>
            <span className="ml-3 font-mono text-sm">{path}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{description}</p>
      </CardHeader>
      <CardContent>
        {params.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Parameters:</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              {params.map((param, i) => (
                <li key={i}>
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{param.name}</code>
                  {param.required && <span className="text-red-500 ml-1">*</span>}
                  {' - '}
                  {param.description}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h4 className="text-sm font-semibold mb-2">Example:</h4>
          <CodeBlock code={example} id={`${method}-${path}`} />
        </div>
      </CardContent>
    </Card>
  );

  const sections = [
    { id: 'overview', label: 'Overview', icon: Book },
    { id: 'authentication', label: 'Authentication', icon: Key },
    { id: 'agents', label: 'Agents', icon: Code },
    { id: 'conversations', label: 'Conversations', icon: FileText },
    { id: 'calls', label: 'Calls', icon: Code },
    { id: 'chat', label: 'Chat', icon: Code },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">API Documentation</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete API reference for integrating AI Agent Platform into your business
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition ${
                        activeSection === section.id
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Overview */}
          {activeSection === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">API Overview</h2>
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Base URL</h3>
                  <CodeBlock code={baseUrl} id="base-url" />
                  
                  <h3 className="text-lg font-semibold mb-3 mt-6">Rate Limits</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>General API: 100 requests per 15 minutes</li>
                    <li>Chat endpoints: 30 requests per minute</li>
                    <li>Call endpoints: 10 requests per 5 minutes</li>
                    <li>Authentication: 5 requests per 15 minutes</li>
                  </ul>

                  <h3 className="text-lg font-semibold mb-3 mt-6">Response Format</h3>
                  <p className="text-sm mb-2">All responses are in JSON format:</p>
                  <CodeBlock
                    code={`{
  "success": true,
  "data": { ... },
  "error": false
}`}
                    id="response-format"
                  />

                  <h3 className="text-lg font-semibold mb-3 mt-6">Error Handling</h3>
                  <CodeBlock
                    code={`{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE"
}`}
                    id="error-format"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Authentication */}
          {activeSection === 'authentication' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Authentication</h2>
              <Card className="mb-6">
                <CardContent className="p-6">
                  <p className="mb-4">
                    All API requests require authentication. You can use either JWT tokens or API keys.
                  </p>
                  
                  <h3 className="text-lg font-semibold mb-3">JWT Token (User Authentication)</h3>
                  <CodeBlock
                    code={`curl -X GET "${baseUrl}/api/agents" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}
                    id="jwt-auth"
                  />

                  <h3 className="text-lg font-semibold mb-3 mt-6">API Key (Application Authentication)</h3>
                  <CodeBlock
                    code={`curl -X GET "${baseUrl}/api/agents" \\
  -H "X-API-Key: YOUR_API_KEY"`}
                    id="api-key-auth"
                  />

                  <h3 className="text-lg font-semibold mb-3 mt-6">Getting Your API Key</h3>
                  <p className="text-sm mb-2">
                    1. Log in to your account<br />
                    2. Navigate to Settings → API Keys<br />
                    3. Generate a new API key<br />
                    4. Copy and store it securely
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Agents */}
          {activeSection === 'agents' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Agents API</h2>
              
              <EndpointCard
                method="GET"
                path="/api/agents"
                description="List all agents"
                example={`curl -X GET "${baseUrl}/api/agents" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
              />

              <EndpointCard
                method="GET"
                path="/api/agents/:id"
                description="Get agent details"
                example={`curl -X GET "${baseUrl}/api/agents/AGENT_ID" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
                params={[
                  { name: 'id', required: true, description: 'Agent UUID' }
                ]}
              />

              <EndpointCard
                method="POST"
                path="/api/agents"
                description="Create a new agent"
                example={`curl -X POST "${baseUrl}/api/agents" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Customer Support Bot",
    "type": "chatbot",
    "systemPrompt": "You are a helpful customer support agent...",
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 1000
  }'`}
                params={[
                  { name: 'name', required: true, description: 'Agent name' },
                  { name: 'type', required: true, description: 'Agent type (chatbot or voice_call)' },
                  { name: 'systemPrompt', required: true, description: 'System prompt for the agent' },
                  { name: 'model', required: false, description: 'AI model to use (default: gpt-4)' }
                ]}
              />

              <EndpointCard
                method="PUT"
                path="/api/agents/:id"
                description="Update an agent"
                example={`curl -X PUT "${baseUrl}/api/agents/AGENT_ID" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Updated Name",
    "systemPrompt": "Updated prompt..."
  }'`}
              />

              <EndpointCard
                method="DELETE"
                path="/api/agents/:id"
                description="Delete an agent"
                example={`curl -X DELETE "${baseUrl}/api/agents/AGENT_ID" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
              />
            </div>
          )}

          {/* Conversations */}
          {activeSection === 'conversations' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Conversations API</h2>
              
              <EndpointCard
                method="GET"
                path="/api/agents/:id/conversations"
                description="List all conversations for an agent"
                example={`curl -X GET "${baseUrl}/api/agents/AGENT_ID/conversations?page=1&limit=20&type=chat" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
                params={[
                  { name: 'page', required: false, description: 'Page number (default: 1)' },
                  { name: 'limit', required: false, description: 'Items per page (default: 20)' },
                  { name: 'type', required: false, description: 'Filter by type (chat or call)' },
                  { name: 'status', required: false, description: 'Filter by status (active, completed, failed)' },
                  { name: 'search', required: false, description: 'Search in messages' }
                ]}
              />

              <EndpointCard
                method="GET"
                path="/api/conversations/:id"
                description="Get conversation with all messages"
                example={`curl -X GET "${baseUrl}/api/conversations/CONVERSATION_ID" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
              />

              <EndpointCard
                method="GET"
                path="/api/conversations/:id/export"
                description="Export conversation (JSON or CSV)"
                example={`curl -X GET "${baseUrl}/api/conversations/CONVERSATION_ID/export?format=json" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
                params={[
                  { name: 'format', required: false, description: 'Export format: json or csv (default: json)' }
                ]}
              />

              <EndpointCard
                method="DELETE"
                path="/api/conversations/:id"
                description="Delete a conversation"
                example={`curl -X DELETE "${baseUrl}/api/conversations/CONVERSATION_ID" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
              />
            </div>
          )}

          {/* Calls */}
          {activeSection === 'calls' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Calls API</h2>
              
              <EndpointCard
                method="POST"
                path="/api/twilio/call"
                description="Initiate an outbound call"
                example={`curl -X POST "${baseUrl}/api/twilio/call" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "AGENT_ID",
    "phoneNumber": "+1234567890"
  }'`}
                params={[
                  { name: 'agentId', required: true, description: 'Agent UUID' },
                  { name: 'phoneNumber', required: true, description: 'Phone number in E.164 format (+1234567890)' }
                ]}
              />

              <EndpointCard
                method="GET"
                path="/api/twilio/call/:sid"
                description="Get call status"
                example={`curl -X GET "${baseUrl}/api/twilio/call/CALL_SID?agentId=AGENT_ID" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
              />

              <EndpointCard
                method="GET"
                path="/api/twilio/transcripts/:sid/stream"
                description="Stream live call transcripts (SSE)"
                example={`curl -X GET "${baseUrl}/api/twilio/transcripts/CALL_SID/stream" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
              />
            </div>
          )}

          {/* Chat */}
          {activeSection === 'chat' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Chat API</h2>
              
              <EndpointCard
                method="POST"
                path="/api/agents/:id/chat"
                description="Send a message to chatbot agent"
                example={`curl -X POST "${baseUrl}/api/agents/AGENT_ID/chat" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello, how can you help me?",
    "conversationId": "CONVERSATION_ID",
    "stream": false
  }'`}
                params={[
                  { name: 'message', required: true, description: 'Message text' },
                  { name: 'conversationId', required: false, description: 'Continue existing conversation' },
                  { name: 'stream', required: false, description: 'Enable streaming response (default: false)' }
                ]}
              />
            </div>
          )}

          {/* Webhooks */}
          {activeSection === 'webhooks' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Webhooks</h2>
              <Card className="mb-6">
                <CardContent className="p-6">
                  <p className="mb-4">
                    Webhooks allow you to receive real-time notifications about events in your account.
                  </p>
                  
                  <h3 className="text-lg font-semibold mb-3">Available Events</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><code>call.started</code> - When a call begins</li>
                    <li><code>call.ended</code> - When a call ends</li>
                    <li><code>call.recording.ready</code> - When recording is available</li>
                    <li><code>conversation.created</code> - New conversation started</li>
                    <li><code>conversation.message.received</code> - New message in conversation</li>
                    <li><code>function.executed</code> - When a function is called</li>
                  </ul>

                  <h3 className="text-lg font-semibold mb-3 mt-6">Webhook Payload Example</h3>
                  <CodeBlock
                    code={`{
  "event": "call.ended",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "callSid": "CA1234567890",
    "duration": 120,
    "status": "completed"
  }
}`}
                    id="webhook-payload"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default APIDocumentation;

