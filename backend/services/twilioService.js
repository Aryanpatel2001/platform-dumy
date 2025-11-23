import twilio from 'twilio';
import dotenv from 'dotenv';
import { getAgentById } from '../db/repositories/agentRepository.js';

dotenv.config();

/**
 * Get a Twilio REST client for a given agentId
 */
async function getClientForAgent(agentId) {
  const agent = await getAgentById(agentId);
  if (!agent) throw new Error('Agent not found');
  const cfg = agent.twilioConfig || agent.twilio_config;
  if (!cfg || !cfg.accountSid || !cfg.authToken) {
    throw new Error('Agent Twilio configuration is incomplete');
  }
  const client = twilio(cfg.accountSid, cfg.authToken);
  return { client, agent, cfg };
}

/**
 * Update a live call with new TwiML instructions
 */
export async function updateCallTwiml(agentId, callSid, twiml) {
  const { client } = await getClientForAgent(agentId);
  console.log('[TwilioService] Updating call TwiML:', { callSid });
  return client.calls(callSid).update({ twiml });
}

/**
 * Speak a reply to the caller using <Say>, then resume streaming to the voice gateway
 */
export async function speakReply(agentId, callSid, text, streamUrl) {
  if (!text || !text.trim()) return;
  const { agent } = await getClientForAgent(agentId);

  // Choose language/voice from agent settings if available
  let language = 'en-US';
  let voice = 'alice';
  try {
    const vs = agent.voiceSettings || agent.voice_settings;
    if (vs?.language && typeof vs.language === 'string') language = vs.language;
    if (vs?.voice && typeof vs.voice === 'string') voice = vs.voice;
  } catch {}

  const vr = new twilio.twiml.VoiceResponse();
  vr.say({ voice, language }, text.trim().slice(0, 500));
  const connect = vr.connect();
  connect.stream({ url: streamUrl });
  const twiml = vr.toString();

  console.log('[TwilioService] speakReply TwiML prepared; updating call:', { callSid });
  await updateCallTwiml(agentId, callSid, twiml);
}

/**
 * Speak an audio URL using <Play>, then resume streaming to the voice gateway.
 */
export async function speakAudioReply(agentId, callSid, audioUrl, streamUrl) {
  if (!audioUrl) return;
  // Validate streamUrl
  if (!streamUrl) throw new Error('streamUrl is required to resume media stream');

  const vr = new twilio.twiml.VoiceResponse();
  vr.play(audioUrl);
  const connect = vr.connect();
  connect.stream({ url: streamUrl });
  const twiml = vr.toString();

  console.log('[TwilioService] speakAudioReply TwiML prepared; updating call:', { callSid });
  await updateCallTwiml(agentId, callSid, twiml);
}

export default { updateCallTwiml, speakReply, speakAudioReply };