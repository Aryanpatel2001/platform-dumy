import express from 'express';
import { processMessage, streamResponse, buildSystemPrompt } from '../services/aiService.js';
import { executeFunction } from '../services/functionExecutor.js';
import * as agentRepo from '../db/repositories/agentRepository.js';
import * as conversationRepo from '../db/repositories/conversationRepository.js';
import { validateChatMessage, validateAgentId } from '../middleware/validation.js';
import { chatLimiter } from '../middleware/rateLimiting.js';

const router = express.Router();

// Chat with agent
router.post('/agents/:id/chat', chatLimiter, validateAgentId, validateChatMessage, async (req, res) => {
  try {
    // Get agent with functions from database
    const agent = await agentRepo.getAgentById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: true, message: 'Agent not found' });
    }

    const { message, conversationId, stream } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: true, message: 'Message is required' });
    }

    // Reuse conversation if provided; otherwise create new
    let conversation;
    let isNewConversation = false;
    try {
      if (conversationId) {
        conversation = await conversationRepo.getConversationById(conversationId);
        if (!conversation) {
          conversation = await conversationRepo.createConversation(agent.id, 'chat');
          isNewConversation = true;
        }
      } else {
        conversation = await conversationRepo.createConversation(agent.id, 'chat');
        isNewConversation = true;
      }
    } catch (error) {
      console.error('Conversation retrieval/creation error:', error);
    }

    // Load conversation history from DB (do not trust frontend)
    const dbHistory = conversation
      ? await conversationRepo.getConversationMessages(conversation.id)
      : [];
    const formattedHistory = (dbHistory || []).map(m => ({ role: m.role, content: m.content }));

    // If streaming requested, handle streamed response path
    if (stream === true) {
      // Prepare SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      // Send meta event with conversationId
      res.write(`data: ${JSON.stringify({ type: 'meta', conversationId: conversation?.id || null })}\n\n`);

      // First pass (non-stream) to detect function usage
      const aiPreResponse = await processMessage(agent, message, formattedHistory);

      const maxTokens = parseInt(agent.maxTokens || agent.max_tokens) || 2000;
      const temperature = parseFloat(agent.temperature) || 0.7;
      let aggregated = '';
      const functionCalls = [];

      if (aiPreResponse.functionCall) {
        try {
          const startTime = Date.now();
          const functionResult = await executeFunction(
            agent,
            aiPreResponse.functionCall.name,
            aiPreResponse.functionCall.parameters
          );
          const executionTime = Date.now() - startTime;
          functionCalls.push(aiPreResponse.functionCall.name);

          // Log function execution
          if (conversation) {
            await conversationRepo.logFunctionExecution({
              conversationId: conversation.id,
              functionName: aiPreResponse.functionCall.name,
              parameters: aiPreResponse.functionCall.parameters,
              response: functionResult,
              status: 'success',
              executionTime
            });
          }

          // Build messages for final streamed response
          const structuredAssistantMsg = { success: true, error: null, data: functionResult };
          const messages = [
            { role: 'system', content: buildSystemPrompt(agent) },
            ...formattedHistory,
            { role: 'user', content: message },
            { role: 'assistant', content: JSON.stringify(structuredAssistantMsg) },
            { role: 'user', content: 'Provide a natural helpful response based on the previous function result.' }
          ];

          const streamObj = await streamResponse(messages, { model: agent.model || 'gpt-4', temperature, maxTokens });
          for await (const part of streamObj) {
            const token = part?.choices?.[0]?.delta?.content || '';
            if (token) {
              aggregated += token;
              res.write(`data: ${JSON.stringify({ type: 'delta', text: token })}\n\n`);
            }
          }

          // Persist messages
          if (conversation) {
            await conversationRepo.addMessage(conversation.id, 'user', message);
            await conversationRepo.addMessage(conversation.id, 'assistant', aggregated, aiPreResponse.functionCall.name, functionResult);
          }

          // Update agent stats
          if (isNewConversation) {
            await agentRepo.updateAgent(req.params.id, {
              conversations: (agent.conversations_count || 0) + 1,
              lastActive: new Date().toISOString()
            });
          } else {
            await agentRepo.updateAgent(req.params.id, { lastActive: new Date().toISOString() });
          }

          // Final event
          res.write(`data: ${JSON.stringify({ type: 'done', message: aggregated, functionCalls, conversationId: conversation?.id || null })}\n\n`);
          return res.end();
        } catch (error) {
          console.error('❌ Function execution error (stream):', error);
          // Log failed execution
          if (conversation) {
            await conversationRepo.logFunctionExecution({
              conversationId: conversation.id,
              functionName: aiPreResponse.functionCall.name,
              parameters: aiPreResponse.functionCall.parameters,
              response: null,
              status: 'failed',
              errorMessage: error.message
            });
          }

          // Stream an assistant explanation based on structured failure
          const structuredAssistantMsg = { success: false, error: error.message, data: null };
          const messages = [
            { role: 'system', content: buildSystemPrompt(agent) },
            ...formattedHistory,
            { role: 'user', content: message },
            { role: 'assistant', content: JSON.stringify(structuredAssistantMsg) },
            { role: 'user', content: 'Inform the user succinctly about the failure and offer alternatives.' }
          ];

          const streamObj = await streamResponse(messages, { model: agent.model || 'gpt-4', temperature, maxTokens });
          for await (const part of streamObj) {
            const token = part?.choices?.[0]?.delta?.content || '';
            if (token) {
              aggregated += token;
              res.write(`data: ${JSON.stringify({ type: 'delta', text: token })}\n\n`);
            }
          }

          if (conversation) {
            await conversationRepo.addMessage(conversation.id, 'user', message);
            await conversationRepo.addMessage(conversation.id, 'assistant', aggregated, aiPreResponse.functionCall.name, { error: error.message });
          }

          // Update stats
          if (isNewConversation) {
            await agentRepo.updateAgent(req.params.id, {
              conversations: (agent.conversations_count || 0) + 1,
              lastActive: new Date().toISOString()
            });
          } else {
            await agentRepo.updateAgent(req.params.id, { lastActive: new Date().toISOString() });
          }

          res.write(`data: ${JSON.stringify({ type: 'done', message: aggregated, error: error.message, conversationId: conversation?.id || null })}\n\n`);
          return res.end();
        }
      }

      // No function call: stream the direct response
      const messages = [
        { role: 'system', content: buildSystemPrompt(agent) },
        ...formattedHistory,
        { role: 'user', content: message }
      ];
      const streamObj = await streamResponse(messages, { model: agent.model || 'gpt-4', temperature, maxTokens });
      for await (const part of streamObj) {
        const token = part?.choices?.[0]?.delta?.content || '';
        if (token) {
          aggregated += token;
          res.write(`data: ${JSON.stringify({ type: 'delta', text: token })}\n\n`);
        }
      }

      // Persist messages
      if (conversation) {
        await conversationRepo.addMessage(conversation.id, 'user', message);
        await conversationRepo.addMessage(conversation.id, 'assistant', aggregated);
      }

      // Update agent stats
      if (isNewConversation) {
        await agentRepo.updateAgent(req.params.id, {
          conversations: (agent.conversations_count || 0) + 1,
          lastActive: new Date().toISOString()
        });
      } else {
        await agentRepo.updateAgent(req.params.id, { lastActive: new Date().toISOString() });
      }

      res.write(`data: ${JSON.stringify({ type: 'done', message: aggregated, conversationId: conversation?.id || null })}\n\n`);
      return res.end();
    }

    // Process message with AI (non-stream)
    const aiResponse = await processMessage(agent, message, formattedHistory);

    // Check for function calls
    const functionCalls = [];
    let finalMessage = aiResponse.message;

    if (aiResponse.functionCall) {
      try {
        console.log('🔧 Executing function:', aiResponse.functionCall.name);
        console.log('📝 Function call:', aiResponse);
        console.log('📝📝📝 Parameters:', aiResponse.functionCall.parameters);
        
        const startTime = Date.now();
        const functionResult = await executeFunction(
          agent,
          aiResponse.functionCall.name,
          aiResponse.functionCall.parameters
        );
        const executionTime = Date.now() - startTime;

        functionCalls.push(aiResponse.functionCall.name);

        // Log function execution
        if (conversation) {
          await conversationRepo.logFunctionExecution({
            conversationId: conversation.id,
            functionName: aiResponse.functionCall.name,
            parameters: aiResponse.functionCall.parameters,
            response: functionResult,
            status: 'success',
            executionTime
          });
        }

        console.log('✅ Function executed successfully');
        console.log('📊 Result:', functionResult);
        // Send structured assistant message containing function result, then get final AI reply
        const structuredAssistantMsg = { success: true, error: null, data: functionResult };
        const finalResponse = await processMessage(
          agent,
          'Provide a natural helpful response based on the previous function result.',
          [
            ...formattedHistory,
            { role: 'user', content: message },
            { role: 'assistant', content: JSON.stringify(structuredAssistantMsg) }
          ]
        );

        finalMessage = finalResponse.message;

        // Log messages
        if (conversation) {
          await conversationRepo.addMessage(conversation.id, 'user', message);
          await conversationRepo.addMessage(
            conversation.id, 
            'assistant', 
            finalMessage,
            aiResponse.functionCall.name,
            functionResult
          );
        }

        return res.json({
          message: finalMessage,
          functionCalls,
          functionResults: [functionResult],
          conversationId: conversation?.id || null
        });
      } catch (error) {
        console.error('❌ Function execution error:', error);
        
        // Log failed execution
        if (conversation) {
          await conversationRepo.logFunctionExecution({
            conversationId: conversation.id,
            functionName: aiResponse.functionCall.name,
            parameters: aiResponse.functionCall.parameters,
            response: null,
            status: 'failed',
            errorMessage: error.message
          });
        }
        // Provide detailed failure to AI as assistant message, then obtain user-facing reply
        const structuredAssistantMsg = { success: false, error: error.message, data: null };
        const finalResponse = await processMessage(
          agent,
          'Inform the user succinctly about the failure and offer alternatives.',
          [
            ...formattedHistory,
            { role: 'user', content: message },
            { role: 'assistant', content: JSON.stringify(structuredAssistantMsg) }
          ]
        );

        finalMessage = finalResponse.message;

        // Log messages
        if (conversation) {
          await conversationRepo.addMessage(conversation.id, 'user', message);
          await conversationRepo.addMessage(conversation.id, 'assistant', finalMessage, aiResponse.functionCall.name, { error: error.message });
        }

        return res.json({
          message: finalMessage,
          functionCalls,
          error: error.message,
          conversationId: conversation?.id || null
        });
      }
    }

    // Log messages (no function call)
    if (conversation) {
      await conversationRepo.addMessage(conversation.id, 'user', message);
      await conversationRepo.addMessage(conversation.id, 'assistant', finalMessage);
    }

    // Update agent stats: only increase conversations_count on new conversation
    if (isNewConversation) {
      await agentRepo.updateAgent(req.params.id, {
        conversations: (agent.conversations_count || 0) + 1,
        lastActive: new Date().toISOString()
      });
    } else {
      await agentRepo.updateAgent(req.params.id, {
        lastActive: new Date().toISOString()
      });
    }

    res.json({
      message: finalMessage,
      functionCalls,
      conversationId: conversation?.id || null
    });
  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

export default router;

