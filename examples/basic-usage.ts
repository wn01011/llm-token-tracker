/**
 * Basic usage example for AI Token Tracker
 */

import { TokenTracker } from '../src/index';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

async function basicExample() {
  // Initialize the tracker
  const tracker = new TokenTracker({
    currency: 'USD',
    webhookUrl: 'https://your-app.com/usage-webhook' // Optional
  });

  // Example 1: OpenAI
  console.log('--- OpenAI Example ---');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  // Wrap the OpenAI client
  const trackedOpenAI = tracker.wrap(openai);
  
  // Use as normal
  const openaiResponse = await trackedOpenAI.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is the capital of France?' }
    ]
  });
  
  console.log('Response:', openaiResponse.choices[0].message.content);
  console.log('Token Usage:', (openaiResponse as any)._tokenUsage);

  // Example 2: Anthropic Claude
  console.log('\n--- Anthropic Claude Example ---');
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  
  // Wrap the Anthropic client
  const trackedAnthropic = tracker.wrap(anthropic);
  
  // Use as normal
  const claudeResponse = await trackedAnthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 100,
    messages: [
      { role: 'user', content: 'What is the capital of France?' }
    ]
  });
  
  console.log('Response:', claudeResponse.content[0].text);
  console.log('Token Usage:', (claudeResponse as any)._tokenUsage);

  // Example 3: Get usage summary
  console.log('\n--- Usage Summary ---');
  const usage = tracker.getUserUsage('anonymous');
  if (usage) {
    console.log('Total Tokens Used:', usage.totalTokens);
    console.log('Total Cost:', `$${usage.totalCost.toFixed(4)}`);
    console.log('Usage by Model:', usage.usageByModel);
  }
}

async function userTrackingExample() {
  console.log('\n--- User-based Tracking Example ---');
  
  const tracker = new TokenTracker({ currency: 'USD' });
  
  // Create a tracker for a specific user
  const userTracker = tracker.forUser('user-123');
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  const trackedOpenAI = userTracker.wrap(openai);
  
  // Make multiple requests
  for (let i = 0; i < 3; i++) {
    const response = await trackedOpenAI.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: `Tell me a fact #${i + 1}` }
      ],
      max_tokens: 50
    });
    
    console.log(`Request ${i + 1}:`, response.choices[0].message.content);
  }
  
  // Get user's usage
  const userUsage = tracker.getUserUsage('user-123');
  console.log('\nUser 123 Usage:', userUsage);
}

async function streamingExample() {
  console.log('\n--- Streaming Example ---');
  
  const tracker = new TokenTracker();
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  const trackedOpenAI = tracker.wrap(openai);
  
  const stream = await trackedOpenAI.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'user', content: 'Write a short story about a robot.' }
    ],
    stream: true
  });
  
  let fullContent = '';
  let lastTokenCount = 0;
  
  for await (const chunk of stream) {
    if (chunk.choices[0]?.delta?.content) {
      process.stdout.write(chunk.choices[0].delta.content);
      fullContent += chunk.choices[0].delta.content;
    }
    
    // Track accumulated tokens
    if ((chunk as any)._tokenUsage?.accumulated) {
      lastTokenCount = (chunk as any)._tokenUsage.accumulated;
    }
  }
  
  console.log('\n\nFinal token count:', lastTokenCount);
  const usage = tracker.getUserUsage('anonymous');
  console.log('Total cost:', `$${usage?.totalCost.toFixed(4)}`);
}

// Run examples
async function main() {
  try {
    await basicExample();
    await userTrackingExample();
    await streamingExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Check if API keys are set
if (!process.env.OPENAI_API_KEY || !process.env.ANTHROPIC_API_KEY) {
  console.error('Please set OPENAI_API_KEY and ANTHROPIC_API_KEY environment variables');
  process.exit(1);
}

main();
