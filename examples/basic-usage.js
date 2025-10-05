/**
 * Basic usage example for AI Token Tracker
 * 
 * Run with: node examples/basic-usage.js
 */

require('dotenv').config();
const { TokenTracker } = require('../dist/index');

async function basicExample() {
  // Initialize the tracker
  const tracker = new TokenTracker({
    currency: 'USD',
    webhookUrl: null // Optional webhook URL
  });

  console.log('AI Token Tracker initialized');
  console.log('========================\n');

  // Example 1: Manual tracking simulation
  console.log('Example 1: Manual Tracking');
  console.log('--------------------------');
  
  const trackingId = tracker.startTracking('user-123');
  
  // Simulate API usage
  const simulatedUsage = {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    inputTokens: 150,
    outputTokens: 200,
    totalTokens: 350
  };
  
  tracker.endTracking(trackingId, simulatedUsage);
  
  const userUsage = tracker.getUserUsage('user-123');
  console.log('User 123 Usage:', {
    totalTokens: userUsage?.totalTokens,
    totalCost: userUsage?.totalCost ? `$${userUsage.totalCost.toFixed(4)}` : 'N/A',
    currency: userUsage?.currency
  });

  console.log('\nExample 2: Multiple Users');
  console.log('--------------------------');
  
  // Simulate multiple users
  const users = ['user-001', 'user-002', 'user-003'];
  
  for (const userId of users) {
    const userTracker = tracker.forUser(userId);
    const id = userTracker.startTracking();
    
    // Simulate different usage
    const tokens = Math.floor(Math.random() * 1000) + 100;
    userTracker.endTracking(id, {
      provider: 'openai',
      model: 'gpt-4',
      inputTokens: Math.floor(tokens * 0.4),
      outputTokens: Math.floor(tokens * 0.6),
      totalTokens: tokens
    });
  }
  
  console.log('All Users Summary:');
  const allUsers = tracker.getAllUsersUsage();
  allUsers.forEach(user => {
    console.log(`  ${user.userId}: ${user.totalTokens} tokens, $${user.totalCost.toFixed(4)}`);
  });

  console.log('\nExample 3: Different Models Pricing');
  console.log('------------------------------------');
  
  const models = [
    { provider: 'openai', model: 'gpt-3.5-turbo', input: 100, output: 100 },
    { provider: 'openai', model: 'gpt-4', input: 100, output: 100 },
    { provider: 'anthropic', model: 'claude-3-sonnet-20240229', input: 100, output: 100 },
    { provider: 'anthropic', model: 'claude-3-opus-20240229', input: 100, output: 100 }
  ];
  
  models.forEach(({ provider, model, input, output }) => {
    const trackId = tracker.startTracking('demo-user');
    tracker.endTracking(trackId, {
      provider,
      model,
      inputTokens: input,
      outputTokens: output,
      totalTokens: input + output
    });
  });
  
  const demoUsage = tracker.getUserUsage('demo-user');
  console.log('Model Comparison (200 tokens each):');
  if (demoUsage?.usageByModel) {
    Object.entries(demoUsage.usageByModel).forEach(([model, data]) => {
      console.log(`  ${model}: $${data.cost.toFixed(4)}`);
    });
  }

  console.log('\n========================');
  console.log('Examples completed successfully!');
  
  // Note about real API usage
  console.log('\nNote: To track real OpenAI/Anthropic API calls:');
  console.log('1. Install the API clients: npm install openai @anthropic-ai/sdk');
  console.log('2. Set your API keys in .env file');
  console.log('3. Wrap the clients with tracker.wrap()');
  console.log('\nExample:');
  console.log('  const openai = tracker.wrap(new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));');
}

// Run the examples
basicExample().catch(console.error);
