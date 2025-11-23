// Streaming chat utility: consume text/event-stream from backend
export async function streamChat({
  baseUrl,
  agentId,
  message,
  conversationId,
  onMeta,
  onDelta,
  onDone,
  onError,
  signal
}) {
  try {
    const payload = { message, stream: true };
    if (conversationId) {
      payload.conversationId = conversationId;
    }

    const resp = await fetch(`${baseUrl}/api/agents/${agentId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });

    if (!resp.ok || !resp.body) {
      const text = await resp.text().catch(() => '');
      throw new Error(text || `HTTP ${resp.status}`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffered = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffered += decoder.decode(value, { stream: true });

      const events = buffered.split('\n\n');
      buffered = events.pop() || '';

      for (const evt of events) {
        const line = evt.trim();
        if (!line.startsWith('data:')) continue;

        const jsonStr = line.replace(/^data:\s*/, '');
        let payload;
        try {
          payload = JSON.parse(jsonStr);
        } catch {
          continue;
        }

        if (payload.type === 'meta') {
          onMeta?.({ conversationId: payload.conversationId });
        } else if (payload.type === 'delta') {
          onDelta?.(payload.text || '');
        } else if (payload.type === 'done') {
          onDone?.({
            message: payload.message || '',
            conversationId: payload.conversationId || null,
            functionCalls: payload.functionCalls || [],
            error: payload.error || null
          });
        }
      }
    }
  } catch (err) {
    onError?.(err);
  }
}