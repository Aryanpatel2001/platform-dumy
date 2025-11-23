import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

const VOICE_IDS = {
    'default': 'EXAVITQu4vr4xnSDxMaL',
    'rachel': 'EXAVITQu4vr4xnSDxMaL',
    'adam': 'pNInz6obpgDQGcFmaJgB',
    'emily': 'LcfcDJNUP1GQjkzn1xUU',
    'daniel': 'onwK4e9ZLuTAKqWW03F9',
    'bella': 'EXAVITQu4vr4xnSDxMaL'
};

export async function generateSpeech(text, options = {}) {
    try {
        if (!ELEVENLABS_API_KEY) {
            console.warn('[ElevenLabs] API key not configured');
            return '';
        }

        if (!text || text.trim().length === 0) {
            return '';
        }

        let requested = options.voiceId || 'default';
        const voiceId = VOICE_IDS[requested] || requested || VOICE_IDS['default'];

        const payload = {
            text,
            voice_settings: {
                stability: typeof options.stability === 'number' ? options.stability : 0.5,
                similarity_boost: typeof options.similarityBoost === 'number' ? options.similarityBoost : 0.75,
                style: 0,
                use_speaker_boost: true
            }
        };

        const apiUrl = ELEVENLABS_API_BASE + '/text-to-speech/' + voiceId;

        const response = await axios({
            method: 'POST',
            url: apiUrl,
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            data: payload,
            responseType: 'arraybuffer'
        });

        const audioBuffer = Buffer.from(response.data);
        const base64Audio = audioBuffer.toString('base64');

        return base64Audio;
    } catch (error) {
        console.error('[ElevenLabs] Error generating speech:', error.message);
        if (error.response) {
            console.error('[ElevenLabs] Response status:', error.response.status);
            console.error('[ElevenLabs] Response data:', error.response.data);
        }
        return '';
    }
}

export default { generateSpeech };
