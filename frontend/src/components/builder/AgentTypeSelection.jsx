import { motion } from 'framer-motion';
import { MessageSquare, Phone, Check } from 'lucide-react';

const AgentTypeSelection = ({ selectedType, onSelect }) => {
  const types = [
    {
      id: 'chatbot',
      name: 'Chatbot Agent',
      description: 'Text-based conversational AI with custom functions',
      icon: MessageSquare,
      color: 'from-brand-primary to-brand-sky',
      features: [
        'Text-based conversations',
        'Custom function calling',
        'Cal.com integration',
        'Real-time responses'
      ]
    },
    {
      id: 'voice_call',
      name: 'Voice Call Agent',
      description: 'AI voice agent with phone integration and testing',
      icon: Phone,
      color: 'from-brand-secondary to-brand-accent',
      features: [
        'Voice conversations',
        'Phone call integration',
        'ElevenLabs TTS',
        'Twilio testing',
        'All chatbot features'
      ]
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Choose Your Agent Type</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select the type of AI agent you want to create
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {types.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;

          return (
            <motion.button
              key={type.id}
              onClick={() => onSelect(type.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 ${
                isSelected
                  ? 'bg-gradient-to-br ' + type.color + ' text-white shadow-2xl'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 hover:border-brand-primary dark:hover:border-brand-primary'
              }`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 bg-white/20 rounded-full p-1"
                >
                  <Check className="w-6 h-6" />
                </motion.div>
              )}

              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl mb-4 ${
                isSelected ? 'bg-white/20' : 'bg-white dark:bg-gray-900'
              }`}>
                <Icon className={`w-8 h-8 ${
                  isSelected ? 'text-white' : 'text-brand-primary'
                }`} />
              </div>

              {/* Content */}
              <h3 className={`text-xl font-bold mb-2 ${
                isSelected ? 'text-white' : 'text-gray-900 dark:text-white'
              }`}>
                {type.name}
              </h3>
              
              <p className={`text-sm mb-4 ${
                isSelected ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {type.description}
              </p>

              {/* Features */}
              <ul className="space-y-2">
                {type.features.map((feature, index) => (
                  <li
                    key={index}
                    className={`flex items-center text-sm ${
                      isSelected ? 'text-white/90' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                      isSelected ? 'bg-white' : 'bg-brand-primary'
                    }`} />
                  {feature}
                </li>
              ))}
              </ul>

              {/* Decorative gradient */}
              {isSelected && (
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default AgentTypeSelection;

