/**
 * Simple in-memory call store for mapping Twilio callSid to agentId and streamSid.
 * This is volatile and resets on server restart. For production, persist to DB or cache.
 */

const calls = new Map();
const audioStore = new Map();

// Internal helper to get or init a call record
function _ensureCall(callSid) {
  if (!callSid) return null;
  const existing = calls.get(callSid) || {};
  if (!existing.conversation) existing.conversation = [];
  return existing;
}

/**
 * Record mapping between a Twilio Call SID and the agentId used to initiate it.
 */
export function setCallMapping(callSid, agentId) {
  if (!callSid) return;
  const existing = _ensureCall(callSid);
  calls.set(callSid, {
    ...existing,
    agentId: agentId || existing.agentId || null,
    createdAt: existing.createdAt || Date.now(),
    status: existing.status || 'created'
  });
}

/**
 * Update streamSid when Twilio Media Stream starts.
 */
export function setStreamSid(callSid, streamSid) {
  if (!callSid) return;
  const existing = _ensureCall(callSid);
  calls.set(callSid, {
    ...existing,
    streamSid: streamSid || existing.streamSid || null
  });
}

/**
 * Update call status from Twilio status webhook.
 */
export function updateStatus(callSid, status) {
  if (!callSid) return;
  const existing = _ensureCall(callSid);
  calls.set(callSid, {
    ...existing,
    status: status || existing.status || null,
    updatedAt: Date.now()
  });
}

/**
 * Lookup agentId for a given callSid.
 */
export function getAgentIdByCallSid(callSid) {
  return (calls.get(callSid) || {}).agentId || null;
}

/**
 * Get current status (e.g., 'queued', 'initiated', 'ringing', 'in-progress', 'completed').
 */
export function getStatus(callSid) {
  return (calls.get(callSid) || {}).status || null;
}

/**
 * Helper: determine if call is currently active (in-progress).
 */
export function isCallActive(callSid) {
  const status = (calls.get(callSid) || {}).status;
  return status === 'in-progress';
}

/**
 * Append a conversation message to the call's history.
 * role: 'user' | 'assistant' | 'system'
 */
export function appendConversation(callSid, role, content) {
  if (!callSid || !role || !content) return;
  const existing = _ensureCall(callSid);
  const entry = { role, content: String(content), t: Date.now() };
  const convo = existing.conversation || [];

  convo.push(entry);
  // Keep last 20 messages to limit memory usage
  const max = 20;
  existing.conversation = convo.slice(-max);

  calls.set(callSid, existing);
}

/**
 * Get the conversation history for a callSid as [{role, content}].
 */
export function getConversation(callSid) {
  const convo = (calls.get(callSid) || {}).conversation || [];
  // Return without timestamps
  return convo.map(({ role, content }) => ({ role, content }));
}

/**
 * Store an audio blob and return an audioId for retrieval.
 */
export function storeAudio(base64, contentType = 'audio/mpeg') {
  if (!base64) return null;
  const audioId = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  audioStore.set(audioId, { base64, contentType, createdAt: Date.now() });
  // Best-effort GC: keep store under ~100 items
  if (audioStore.size > 120) {
    const keys = Array.from(audioStore.keys());
    for (let i = 0; i < audioStore.size - 100; i++) {
      audioStore.delete(keys[i]);
    }
  }
  return audioId;
}

/**
 * Retrieve an audio blob by id.
 */
export function getAudio(audioId) {
  return audioStore.get(audioId) || null;
}

/**
 * Dump current store (for debugging).
 */
export function _dumpCalls() {
  return Array.from(calls.entries()).map(([callSid, data]) => ({ callSid, ...data }));
}

export default {
  setCallMapping,
  setStreamSid,
  updateStatus,
  getAgentIdByCallSid,
  getStatus,
  isCallActive,
  appendConversation,
  getConversation,
  storeAudio,
  getAudio,
  _dumpCalls
};