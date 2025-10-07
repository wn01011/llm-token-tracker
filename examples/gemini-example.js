/**
 * Gemini API Usage Example
 * 
 * This example shows how to use llm-token-tracker with Google Gemini API
 * 
 * Install dependencies:
 *   npm install @google/generative-ai
 * 
 * Set environment variable:
 *   export GOOGLE_API_KEY=your_api_key_here
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { TokenTracker } = require('llm-token-tracker');

async function main() {
  // Initialize tracker
  const tracker = new TokenTracker({ currency: 'USD' });

  // Initialize Gemini client
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  
  // Get model (you can choose different models)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  console.log('🚀 Testing Gemini API with Token Tracking...\n');

  // Example 1: Simple text generation
  console.log('📝 Example 1: Simple generation');
  const trackingId1 = tracker.startTracking('user-gemini-test');
  
  const result1 = await model.generateContent("Write a haiku about coding");
  const response1 = await result1.response;
  
  console.log('Response:', response1.text());
  
  // Track usage
  const usage1 = response1.usageMetadata;
  tracker.endTracking(trackingId1, {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    inputTokens: usage1.promptTokenCount,
    outputTokens: usage1.candidatesTokenCount,
    totalTokens: usage1.totalTokenCount
  });

  // Example 2: Chat conversation
  console.log('\n💬 Example 2: Chat conversation');
  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "Hello! I'm learning about AI." }],
      },
      {
        role: "model",
        parts: [{ text: "Great! I'd be happy to help you learn about AI. What would you like to know?" }],
      },
    ],
  });

  const trackingId2 = tracker.startTracking('user-gemini-test');
  
  const result2 = await chat.sendMessage("What are the main types of machine learning?");
  const response2 = await result2.response;
  
  console.log('Response:', response2.text());
  
  const usage2 = response2.usageMetadata;
  tracker.endTracking(trackingId2, {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    inputTokens: usage2.promptTokenCount,
    outputTokens: usage2.candidatesTokenCount,
    totalTokens: usage2.totalTokenCount
  });

  // Get usage summary
  console.log('\n📊 Usage Summary:');
  const userUsage = tracker.getUserUsage('user-gemini-test');
  console.log(`Total Tokens: ${userUsage.totalTokens}`);
  console.log(`Total Cost: $${userUsage.totalCost.toFixed(6)}`);
  console.log('\nBreakdown by model:');
  Object.entries(userUsage.usageByModel).forEach(([model, data]) => {
    console.log(`  ${model}: ${data.tokens} tokens ($${data.cost.toFixed(6)})`);
  });

  // Example 3: Compare with other models
  console.log('\n💰 Cost Comparison (for 1000 tokens):');
  const testTokens = 1000;
  
  const models = [
    { provider: 'gemini', model: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { provider: 'gemini', model: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { provider: 'openai', model: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { provider: 'openai', model: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { provider: 'anthropic', model: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
  ];

  models.forEach(({ provider, model, name }) => {
    const tid = tracker.startTracking('_compare');
    tracker.endTracking(tid, {
      provider,
      model,
      inputTokens: testTokens / 2,
      outputTokens: testTokens / 2,
      totalTokens: testTokens
    });
    const usage = tracker.getUserUsage('_compare');
    const cost = usage?.totalCost || 0;
    console.log(`  ${name}: $${cost.toFixed(6)}`);
    tracker.clearUserUsage('_compare');
  });
}

main().catch(console.error);
