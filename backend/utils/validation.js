/**
 * Validate agent data
 */
export function validateAgent(agentData) {
  const errors = [];

  // Required fields
  if (!agentData.name || agentData.name.trim() === '') {
    errors.push('Agent name is required');
  }

  if (!agentData.type || !['chatbot', 'voice_call'].includes(agentData.type)) {
    errors.push('Invalid agent type. Must be "chatbot" or "voice_call"');
  }

  if (!agentData.systemPrompt || agentData.systemPrompt.trim() === '') {
    errors.push('System prompt is required');
  }

  // Validate model
  const validModels = [
    'gpt-4',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
    'claude-3-opus',
    'claude-3-sonnet'
  ];
  if (agentData.model && !validModels.includes(agentData.model)) {
    errors.push(`Invalid model. Must be one of: ${validModels.join(', ')}`);
  }

  // Validate temperature
  if (agentData.temperature !== undefined) {
    if (typeof agentData.temperature !== 'number' || 
        agentData.temperature < 0 || 
        agentData.temperature > 1) {
      errors.push('Temperature must be a number between 0 and 1');
    }
  }

  // Validate max tokens
  if (agentData.maxTokens !== undefined) {
    if (typeof agentData.maxTokens !== 'number' || 
        agentData.maxTokens < 1 || 
        agentData.maxTokens > 4000) {
      errors.push('Max tokens must be a number between 1 and 4000');
    }
  }

  // Validate functions if provided
  if (agentData.functions && Array.isArray(agentData.functions)) {
    agentData.functions.forEach((func, index) => {
      if (!func.name || func.name.trim() === '') {
        errors.push(`Function at index ${index}: name is required`);
      }

      if (!func.type || !['cal_com', 'custom'].includes(func.type)) {
        errors.push(`Function at index ${index}: invalid type`);
      }

      // Validate Cal.com functions
      if (func.type === 'cal_com') {
        if (!func.apiKey) {
          errors.push(`Function "${func.name}": Cal.com API key is required`);
        }
        if (!func.eventTypeId) {
          errors.push(`Function "${func.name}": Event Type ID is required`);
        }
      }

      // Validate custom functions
      if (func.type === 'custom') {
        if (!func.method || !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(func.method)) {
          errors.push(`Function "${func.name}": invalid HTTP method`);
        }
        if (!func.url || !isValidUrl(func.url)) {
          errors.push(`Function "${func.name}": invalid URL`);
        }
      }
    });
  }

  // Validate voice settings for voice call agents
  if (agentData.type === 'voice_call') {
    
    if (!agentData.voiceSettings || !agentData.voiceSettings.voiceId) {
      errors.push('Voice settings are required for voice call agents');
    }

    if (agentData.voiceSettings) {
      const { stability, similarityBoost, speed } = agentData.voiceSettings;

      if (stability !== undefined && (stability < 0 || stability > 1)) {
        errors.push('Voice stability must be between 0 and 1');
      }

      if (similarityBoost !== undefined && (similarityBoost < 0 || similarityBoost > 1)) {
        errors.push('Voice similarity boost must be between 0 and 1');
      }

      if (speed !== undefined && (speed < 0.5 || speed > 2)) {
        errors.push('Voice speed must be between 0.5 and 2');
      }
    }

    // Validate Twilio config if provided
    if (agentData.twilioConfig) {
      const { accountSid, authToken, phoneNumber } = agentData.twilioConfig;

      if (accountSid && !accountSid.startsWith('AC')) {
        errors.push('Invalid Twilio Account SID format');
      }

      if (phoneNumber && !phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
        errors.push('Invalid phone number format. Use E.164 format (+1234567890)');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    error: errors.length > 0 ? errors.join('; ') : null
  };
}

/**
 * Check if URL is valid
 */
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

export default {
  validateAgent
};

