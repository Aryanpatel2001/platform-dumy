import { CheckCircle, MessageSquare, Phone, Calendar, Settings, Zap } from 'lucide-react';

const ReviewAndDeploy = ({ agentData, onSave, saving }) => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Review & Deploy</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Review your agent configuration before deploying
        </p>
      </div>

      <div className="space-y-6">
        {/* Agent Type */}
        <div className="card bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
          <div className="flex items-center space-x-3">
            {agentData.type === 'voice_call' ? (
              <Phone className="w-8 h-8 text-brand-primary" />
            ) : (
              <MessageSquare className="w-8 h-8 text-brand-primary" />
            )}
            <div>
              <h3 className="text-xl font-bold">{agentData.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {agentData.type === 'voice_call' ? 'Voice Call Agent' : 'Chatbot Agent'}
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Configuration */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-3">
              <Settings className="w-5 h-5 text-brand-primary" />
              <h4 className="font-semibold">Configuration</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Model:</span>
                <span className="font-medium">{agentData.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Temperature:</span>
                <span className="font-medium">{agentData.temperature}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Max Tokens:</span>
                <span className="font-medium">{agentData.maxTokens}</span>
              </div>
            </div>
          </div>

          {/* Functions */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="w-5 h-5 text-brand-primary" />
              <h4 className="font-semibold">Functions</h4>
            </div>
            <div className="space-y-2 text-sm">
              {agentData.functions.length > 0 ? (
                agentData.functions.map((func, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{func.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No functions configured</p>
              )}
            </div>
          </div>
        </div>

        {/* System Prompt */}
        <div className="card">
          <h4 className="font-semibold mb-2">System Prompt</h4>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 max-h-40 overflow-y-auto">
            <p className="text-sm font-mono whitespace-pre-wrap">
              {agentData.systemPrompt}
            </p>
          </div>
        </div>

        {/* Voice Settings (if voice call) */}
        {agentData.type === 'voice_call' && (
          <div className="card">
            <div className="flex items-center space-x-2 mb-3">
              <Phone className="w-5 h-5 text-brand-primary" />
              <h4 className="font-semibold">Voice Settings</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Voice ID:</span>
                <p className="font-medium">{agentData.voiceSettings.voiceId}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Speed:</span>
                <p className="font-medium">{agentData.voiceSettings.speed}x</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Stability:</span>
                <p className="font-medium">{agentData.voiceSettings.stability}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Similarity:</span>
                <p className="font-medium">{agentData.voiceSettings.similarityBoost}</p>
              </div>
            </div>
            {agentData.voiceSettings.greeting && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">Greeting:</span>
                <p className="text-sm mt-1">{agentData.voiceSettings.greeting}</p>
              </div>
            )}
          </div>
        )}

        {/* Twilio Configuration Status (if voice call) */}
        {agentData.type === 'voice_call' && agentData.twilioConfig.accountSid && (
          <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div className="text-sm">
                <p className="font-medium text-green-900 dark:text-green-100">
                  Twilio Configured
                </p>
                <p className="text-green-700 dark:text-green-300">
                  Your agent is ready for voice call testing
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        <div className="card bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-brand-primary dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-brand-primary dark:text-primary-100 mb-1">
                Ready to Deploy
              </p>
              <p className="text-brand-primary dark:text-primary-300">
                Your agent configuration looks good! Click "Create Agent" below to deploy it. 
                You'll be able to test and refine it after creation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewAndDeploy;

