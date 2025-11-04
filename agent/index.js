import 'dotenv/config';
import { WorkerOptions, cli, defineAgent, llm, voice } from '@livekit/agents';
import * as silero from '@livekit/agents-plugin-silero';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { KnowledgeBase } from './utils/knowledge-base.js';
import { EscalationHandler } from './utils/escalation.js';
import { SYSTEM_PROMPT } from './utils/receptionist-prompt.js';

const knowledgeBase = new KnowledgeBase(process.env.BACKEND_URL || 'http://localhost:5000');
const escalationHandler = new EscalationHandler(process.env.BACKEND_URL || 'http://localhost:5000');

export default defineAgent({
  prewarm: async (proc) => {
    console.log('Loading VAD...');
    proc.userData.vad = await silero.VAD.load();
    console.log('✅Ready');
  },

  entry: async (ctx) => {
    console.log('Agent starting:', ctx.room.name);
    
    // Conversation tracking
    let conversationHistory = [];
    let callerPhone = null;
    let escalationCount = 0;
    
    // TOOL 1: Check Knowledge Base
    const checkKnowledgeBase = llm.tool({
      description: 'Search our database for information about services, policies, or details.',
      parameters: z.object({
        question: z.string().describe('What to search for'),
      }),
      execute: async ({ question }) => {
        console.log(`KB search: "${question}"`);
        
        try {
          const answer = await knowledgeBase.search(question);
          
          if (answer) {
            console.log(`✅Found`);
            return JSON.stringify({
              found: true,
              answer: answer,
              instruction: 'Answer naturally using this information. Don\'t mention the knowledge base.'
            });
          }
          
          console.log(`❌Not found`);
          return JSON.stringify({
            found: false,
            instruction: 'Not in database. Use escalateToSupervisor tool now.'
          });
        } catch (error) {
          console.error('KB error:', error);
          return JSON.stringify({
            found: false,
            instruction: 'Error. Use escalateToSupervisor.'
          });
        }
      },
    });

    // TOOL 2: Escalate to Supervisor
    const escalateToSupervisor = llm.tool({
      description: 'Send question to human supervisor for answer via text message.',
      parameters: z.object({
        question: z.string().describe('The question to escalate'),
        callerPhone: z.string().optional().describe('Phone number ONLY if customer just said it'),
      }),
      execute: async ({ question, callerPhone: providedPhone }) => {
        escalationCount++;
        console.log(`🚨ESCALATION #${escalationCount}: "${question}"`);
        
        // Update phone if provided
        if (providedPhone) {
          callerPhone = providedPhone;
          console.log(`Phone captured: ${callerPhone}`);
        }
        
        try {
          const result = await escalationHandler.createHelpRequest({
            callerPhone: callerPhone || ctx.room.name,
            question,
            conversationContext: conversationHistory.slice(-8).join('\n'),
            callSessionId: `${ctx.room.name}-${Date.now()}-${escalationCount}`, // UNIQUE per request!
          });
          
          if (result.success) {
            console.log(`✅Created: ${result.requestId}`);
            
            // First escalation - need phone
            if (!callerPhone && escalationCount === 1) {
              return JSON.stringify({
                success: true,
                needsPhone: true,
                instruction: 'Say naturally: "I\'ll check on that and text you the answer. What\'s a good number to reach you?"'
              });
            } else if (!callerPhone) {  // Fallback if missed
              return JSON.stringify({
                success: false,
                instruction: 'Say: "I need a phone number to text you the answer. What is it?"'
              });
            }
            
            // Subsequent escalations - already have phone
            if (escalationCount > 1) {
              return JSON.stringify({
                success: true,
                instruction: 'Say briefly: "I\'ll add that question for my supervisor too. They\'ll include it in the text. What else can I help with?"'
              });
            }
            
            // First escalation with phone
            return JSON.stringify({
              success: true,
              instruction: 'Say: "Perfect! My supervisor will text you at that number shortly. Anything else I can help with?"'
            });
          }
          
          console.error(`❌Escalation failed`);
          return JSON.stringify({
            success: false,
            instruction: 'Say: "I\'m having a system issue. Can you call back in a few minutes? Sorry about that!"'
          });
          
        } catch (error) {
          console.error('Escalation error:', error);
          return JSON.stringify({
            success: false,
            instruction: 'System error. Ask to call back.'
          });
        }
      },
    });

    // Create agent
    const agent = new voice.Agent({
      instructions: SYSTEM_PROMPT,
      tools: {
        checkKnowledgeBase,
        escalateToSupervisor,
      },
    });

    // Create session
    const session = new voice.AgentSession({
      vad: ctx.proc.userData.vad,
      stt: 'deepgram/nova-3:en',
      llm: 'google/gemini-2.5-flash-lite',
      tts: 'cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc',
    });

    await ctx.connect();
    console.log('✅Connected');

    const participant = await ctx.waitForParticipant();
    console.log('Participant:', participant.identity);

    // Event handlers
    session.on('user_speech_committed', (msg) => {
      const text = msg.text;
      console.log(`👤: ${text}`);
      conversationHistory.push(`Customer: ${text}`);
      
      // Auto-capture phone from speech
      if (!callerPhone) {
        const phoneMatch = text.match(/\b\d{10}\b|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/);
        if (phoneMatch) {
          callerPhone = phoneMatch[0].replace(/[-.\s]/g, '');
          console.log(`Auto-captured: ${callerPhone}`);
        }
      }
    });

    session.on('agent_speech_committed', (msg) => {
      console.log(`🤖: ${msg.text}`);
      conversationHistory.push(`AI: ${msg.text}`);
    });

    session.on('function_calls_collected', (calls) => {
      calls.forEach(call => console.log(`${call.tool.name}`));
    });

    session.on('error', (event) => {
      if (event.error && !event.error.recoverable) {
        console.error('Critical error:', event.error);
      }
    });

    // Start session
    await session.start({ agent, room: ctx.room });
    
    await session.generateReply({
      instructions: 'Greet warmly: "Hi! Thanks for calling Bella\'s Hair Salon. How can I help you?"'
    });
    
    console.log('Live!\n');

    // Cleanup
    session.on('close', (event) => {
      console.log(`Call ended (${escalationCount} escalations)`);
      conversationHistory = [];
      callerPhone = null;
      escalationCount = 0;
    });
  },
});

console.log('LiveKit Agent Starting...');
cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));