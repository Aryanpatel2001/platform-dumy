import { Sparkles, MessageSquare, Settings2 } from 'lucide-react';

const BasicConfiguration = ({ data, onChange }) => {
  const models = [
    { id: 'gpt-4', name: 'GPT-4', description: 'Most capable, best for complex tasks' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Faster, great for most use cases' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Powerful reasoning' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced performance' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Basic Configuration</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Set up your agent's core settings and behavior
        </p>
      </div>

      <div className="space-y-6">
        {/* Agent Name */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Agent Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="e.g., Customer Support Bot"
            className="input-field"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Description (Optional)
          </label>
          <input
            type="text"
            value={data.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Brief description of what this agent does"
            className="input-field"
          />
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-primary-500" />
            System Prompt <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            value={data.systemPrompt}
            onChange={(e) => onChange('systemPrompt', e.target.value)}
            placeholder="You are a helpful AI assistant that helps users with..."
            rows={8}
            className="textarea-field font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            This defines your agent's personality, behavior, and instructions. Be specific and clear.
          </p>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center">
            <Settings2 className="w-4 h-4 mr-2 text-brand-primary" />
            AI Model
          </label>
          <select
            value={data.model}
            onChange={(e) => onChange('model', e.target.value)}
            className="input-field"
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.description}
              </option>
            ))}
          </select>
        </div>

        {/* Advanced Settings */}
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-brand-primary hover:text-brand-secondary flex items-center">
            <Settings2 className="w-4 h-4 mr-2" />
            Advanced Settings
          </summary>
          
          <div className="mt-4 space-y-4 pl-6 border-l-2 border-gray-200 dark:border-gray-800">
            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Temperature: {data.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={data.temperature}
                onChange={(e) => onChange('temperature', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Higher values make output more random, lower values more focused
              </p>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                min="100"
                max="4000"
                step="100"
                value={data.maxTokens}
                onChange={(e) => onChange('maxTokens', parseInt(e.target.value))}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum length of the agent's response
              </p>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default BasicConfiguration;

