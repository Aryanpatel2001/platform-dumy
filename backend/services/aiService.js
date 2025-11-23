import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Process a message with the AI model
 */
export async function processMessage(agent, message, conversationHistory = []) {
  try {
    const messages = [
      {
        role: 'system',
        content: buildSystemPrompt(agent)
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const model = agent.model || 'gpt-4';
    
    // Check if model is Claude
    if (model.includes('claude')) {
      return await processWithClaude(messages, agent);
    }

    // Use OpenAI
    // Ensure temperature and max_tokens are numbers
    const temperature = parseFloat(agent.temperature) || 0.7;
    // For voice calls, limit tokens to ensure concise responses
    const maxTokens = parseInt(agent.maxTokens || agent.max_tokens) || 2000;
    const voiceMaxTokens = Math.min(maxTokens, 150); // Limit voice responses to 150 tokens (~1-2 sentences)

    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: voiceMaxTokens, // Use limited tokens for voice calls
    });

    const responseMessage = completion.choices[0].message.content;

    // Check for function calls in response
    const functionCall = detectFunctionCall(responseMessage, agent.functions || []);

    return {
      message: responseMessage,
      functionCall: functionCall || null
    };
  } catch (error) {
    console.error('AI Service Error:', error);
    throw new Error(`Failed to process message: ${error.message}`);
  }
}

/**
 * Build system prompt with function definitions
 */
export function buildSystemPrompt(agent) {
  let prompt = agent.system_prompt || 'You are a helpful AI assistant.';
  prompt += '\n\n=== VOICE CALL INSTRUCTIONS ===\n';
  prompt += 'This is a VOICE CONVERSATION. Follow these critical rules:\n';
  prompt += '- Keep ALL responses SHORT and CONVERSATIONAL (1-3 sentences maximum)\n';
  prompt += '- Speak naturally like a human in a phone conversation\n';
  prompt += '- Avoid long explanations, lists, or marketing pitches\n';
  prompt += '- If asked to repeat, give a brief summary, not the full response\n';
  prompt += '- Ask follow-up questions to keep the conversation flowing\n';
  prompt += '- Remember: Users are listening, not reading - be concise!\n';
  prompt += '- you need to give the answer from only the prompt if user are ask something outside of the prompt then obviously you can not answer that but if user are ask the question near about the prompt then you need to give the answer that but if totaly of out the context then not give the answer that \n';
  prompt += '\n=== USER INSTRUCTIONS ===\n';
  prompt += 'Follow these rules when responding and make sure you are follow the prompt :\n';
  prompt += '- Keep responses concise and relevant to the user\'s question\n';
  prompt += '- If you need to use a function, respond EXACTLY in the format shown above\n';
  prompt += '- Do not make up function results - wait for actual execution\n';
  if (agent.functions && agent.functions.length > 0) {
    prompt += '\n\n=== AVAILABLE FUNCTIONS ===\n';
    prompt += 'You have access to the following functions. When you need to use a function, respond EXACTLY in this format:\n\n';
    prompt += 'FUNCTION_CALL: function_name\n';
    prompt += 'PARAMETERS: {"param1": "value1", "param2": "value2"}\n\n';

    agent.functions.forEach(func => {
      prompt += `\nFunction: ${func.name}\n`;
      prompt += `Description: ${func.description}\n`;
      
      if (func.parameters && func.parameters.length > 0) {
        prompt += 'Parameters:\n';
        func.parameters.forEach(param => {
          prompt += `  - ${param.name} (${param.type}${param.required ? ', required' : ', optional'}): ${param.description}\n`;
        });
      }
    });

    prompt += '\n=== IMPORTANT ===\n';
    prompt += '- Only use FUNCTION_CALL format when you actually need to execute a function\n';
    prompt += '- After the function executes, you will receive the result and should provide a natural language response to the user\n';
    prompt += '- Do not make up function results - wait for actual execution\n';
  }
  return prompt;
}

/**
 * Detect function calls in AI response
 */
function detectFunctionCall(response, functions) {
  const functionCallPattern = /FUNCTION_CALL:\s*(\w+)\s*\nPARAMETERS:\s*({[\s\S]*?})/i;
  const match = response.match(functionCallPattern);

  if (!match) {
    return null;
  }

  const functionName = match[1].trim();
  let parameters;

  try {
    parameters = JSON.parse(match[2].trim());
  } catch (error) {
    console.error('Failed to parse function parameters:', error);
    return null;
  }

  // Verify function exists (trim both names for comparison)
  const functionExists = functions.some(f => f.name?.trim() === functionName?.trim());
  if (!functionExists) {
    console.warn(`Function ${functionName} not found in agent functions`);
    return null;
  }

  return {
    name: functionName,
    parameters
  };
}

/**
 * Process with Claude (Anthropic)
 */
async function processWithClaude(messages, agent) {
  // Note: This requires @anthropic-ai/sdk package
  // For now, return a placeholder
  console.warn('Claude integration not fully implemented. Using fallback.');
  
  return {
    message: 'Claude integration is in development. Please use a GPT model.',
    functionCall: null
  };
}

/**
 * Generate a simple response for voice calls (without function detection)
 */
export async function generateResponse(messages, options = {}) {
  try {
    // Use faster model for voice responses - gpt-3.5-turbo is much faster than gpt-4
    const model = options.model || 'gpt-3.5-turbo';
    const temperature = parseFloat(options.temperature) || 0.7;
    const maxTokens = parseInt(options.maxTokens) || 100; // Reduced for faster responses

    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
      // Add performance optimizations
      stream: false, // Disable streaming for faster completion
      top_p: 0.9, // Focus on more likely responses
      frequency_penalty: 0.1, // Slight penalty to avoid repetition
      presence_penalty: 0.1 // Encourage diverse responses
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Generate Response Error:', error);
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}

/**
 * Stream a chat completion response (token-by-token)
 */
export async function streamResponse(messages, options = {}) {
  try {
    const model = options.model || 'gpt-3.5-turbo';
    const temperature = parseFloat(options.temperature) || 0.7;
    const maxTokens = parseInt(options.maxTokens) || 1000;

    const stream = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true
    });

    return stream; // Async iterable of ChatCompletionChunk
  } catch (error) {
    console.error('Stream Response Error:', error);
    throw new Error(`Failed to stream response: ${error.message}`);
  }
}
export default {
  processMessage,
  generateResponse,
  buildSystemPrompt,
  streamResponse
};