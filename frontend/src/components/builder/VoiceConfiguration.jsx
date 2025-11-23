import { Volume2, Play, Pause } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const VoiceConfiguration = ({ voiceSettings, onChange }) => {
  const [playing, setPlaying] = useState(false);

  const voices = [
    { id: 'default', name: 'Default Voice', description: 'Clear and professional' },
    { id: 'rachel', name: 'Rachel', description: 'Warm and friendly female voice' },
    { id: 'adam', name: 'Adam', description: 'Professional male voice' },
    { id: 'emily', name: 'Emily', description: 'Energetic female voice' },
    { id: 'daniel', name: 'Daniel', description: 'Deep male voice' },
    { id: 'bella', name: 'Bella', description: 'Soft female voice' },
  ];

  const updateSetting = (key, value) => {
    onChange({
      ...voiceSettings,
      [key]: value
    });
  };

  const handlePlaySample = async () => {
    setPlaying(true);

    try {
      const response = await axios.post('http://localhost:3000/api/agents/voice/test', {
        voiceId: voiceSettings.voiceId,
        stability: voiceSettings.stability,
        similarityBoost: voiceSettings.similarityBoost,
        speed: voiceSettings.speed,
        text: voiceSettings.greeting || "Hello! This is a test of your selected voice settings. How does this sound?"
      });

      if (response.data?.success && response.data?.audioUrl) {
        const audio = new Audio(response.data.audioUrl);

        audio.onloadeddata = () => {
          audio.play().catch(error => {
            console.error('Audio play error:', error);
            toast.error('Failed to play audio. Please check your browser settings.');
            setPlaying(false);
          });
        };

        audio.onended = () => setPlaying(false);
        audio.onerror = () => {
          console.error('Audio loading error');
          toast.error('Failed to load audio sample');
          setPlaying(false);
        };
      } else {
        toast.error('Failed to generate voice sample');
        setPlaying(false);
      }
    } catch (error) {
      console.error('Voice test error:', error);
      const status = error.response?.status;
      if (status === 503) {
        toast.error('Voice generation service unavailable. Check ElevenLabs configuration.');
      } else if (status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to test voice');
      }
      setPlaying(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Voice Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure how your AI agent sounds during calls
        </p>
      </div>

      <div className="space-y-6">
        {/* Voice Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Voice <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {voices.map((voice) => (
              <button
                key={voice.id}
                type="button"
                onClick={() => updateSetting('voiceId', voice.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  voiceSettings.voiceId === voice.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{voice.name}</h4>
                  {voiceSettings.voiceId === voice.id && (
                    <Volume2 className="w-5 h-5 text-primary-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {voice.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Voice Preview */}
        <div className="card bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5 text-brand-primary" />
              <span className="font-medium">Voice Preview</span>
            </div>
            <button
              onClick={handlePlaySample}
              disabled={playing}
              className="btn-secondary flex items-center space-x-2"
            >
              {playing ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Playing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Test Voice</span>
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Preview your selected voice with current settings.
          </p>
        </div>

        {/* Greeting Message */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Greeting Message
          </label>
          <textarea
            value={voiceSettings.greeting}
            onChange={(e) => updateSetting('greeting', e.target.value)}
            placeholder="Hello! How can I help you today?"
            rows={3}
            className="textarea-field"
          />
          <p className="text-xs text-gray-500 mt-1">
            The first message spoken when a call is answered
          </p>
        </div>

        {/* Advanced Voice Settings */}
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center">
            Advanced Voice Settings
          </summary>
          
          <div className="mt-4 space-y-4 pl-6 border-l-2 border-gray-200 dark:border-gray-800">
            {/* Stability */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Stability: {voiceSettings.stability.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={voiceSettings.stability}
                onChange={(e) => updateSetting('stability', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Higher values make the voice more consistent and predictable
              </p>
            </div>

            {/* Similarity Boost */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Similarity Boost: {voiceSettings.similarityBoost.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={voiceSettings.similarityBoost}
                onChange={(e) => updateSetting('similarityBoost', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enhances similarity to the original voice
              </p>
            </div>

            {/* Speed */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Speech Speed: {voiceSettings.speed.toFixed(2)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={voiceSettings.speed}
                onChange={(e) => updateSetting('speed', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Adjust how fast or slow the voice speaks
              </p>
            </div>
          </div>
        </details>

        {/* Info Box */}
        <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <Volume2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Voice Processing with ElevenLabs
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                Your agent uses ElevenLabs for high-quality text-to-speech during calls. 
                Voice settings are processed on our backend for optimal performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceConfiguration;

