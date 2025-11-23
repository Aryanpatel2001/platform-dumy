import { EventEmitter } from 'events';

// Map of callSid -> EventEmitter for transcript events
const buses = new Map();

function ensureBus(callSid) {
  if (!callSid) return null;
  let bus = buses.get(callSid);
  if (!bus) {
    bus = new EventEmitter();
    // Avoid memory leak warnings for many listeners during active calls
    bus.setMaxListeners(50);
    buses.set(callSid, bus);
  }
  return bus;
}

export function publishTranscript(callSid, payload) {
  const bus = ensureBus(callSid);
  if (!bus) return;
  bus.emit('transcript', payload);
}

export function publishClose(callSid) {
  const bus = ensureBus(callSid);
  if (!bus) return;
  bus.emit('close');
  // Cleanup bus shortly after close
  setTimeout(() => {
    try { buses.delete(callSid); } catch {}
  }, 5000);
}

export function subscribe(callSid, onData, onClose) {
  const bus = ensureBus(callSid);
  if (!bus) return () => {};
  const handler = (payload) => onData && onData(payload);
  const closeHandler = () => onClose && onClose();
  bus.on('transcript', handler);
  bus.once('close', closeHandler);
  return () => {
    try { bus.off('transcript', handler); } catch {}
  };
}

export default { publishTranscript, publishClose, subscribe };