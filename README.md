# AI Token Tracker 🧮

Token usage tracker for OpenAI and Claude APIs. Pass accurate API costs to your users.

## ✨ Features

- 🎯 **Simple Integration** - One line to wrap your API client
- 📊 **Automatic Tracking** - No manual token counting
- 💰 **Accurate Pricing** - Up-to-date pricing for all models
- 🔄 **Multiple Providers** - OpenAI and Claude support
- 📈 **User Management** - Track usage per user/session
- 🌐 **Currency Support** - USD and KRW

## 📦 Installation

```bash
npm install ai-token-tracker
```

## 🚀 Quick Start

```javascript
const { TokenTracker } = require('ai-token-tracker');
// or import { TokenTracker } from 'ai-token-tracker';

// Initialize tracker
const tracker = new TokenTracker({
  currency: 'USD' // or 'KRW'
});

// Example: Manual tracking
const trackingId = tracker.startTracking('user-123');

// ... your API call here ...

tracker.endTracking(trackingId, {
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  inputTokens: 100,
  outputTokens: 50,
  totalTokens: 150
});

// Get user's usage
const usage = tracker.getUserUsage('user-123');
console.log(`Total cost: $${usage.totalCost}`);
```

## 🔧 With Real APIs

To use with actual OpenAI/Anthropic APIs:

```javascript
const OpenAI = require('openai');
const { TokenTracker } = require('ai-token-tracker');

const tracker = new TokenTracker();
const openai = tracker.wrap(new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}));

// Use normally - tracking happens automatically
const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: "Hello!" }]
});

console.log(response._tokenUsage);
// { tokens: 125, cost: 0.0002, model: "gpt-3.5-turbo" }
```

## 📊 Supported Models & Pricing

### OpenAI
| Model | Input (per 1K tokens) | Output (per 1K tokens) |
|-------|----------------------|------------------------|
| GPT-4 Turbo | $0.01 | $0.03 |
| GPT-4 | $0.03 | $0.06 |
| GPT-3.5 Turbo | $0.0005 | $0.0015 |
| DALL-E 3 | $0.040 per image | - |
| Whisper | $0.006 per minute | - |

### Anthropic
| Model | Input (per 1K tokens) | Output (per 1K tokens) |
|-------|----------------------|------------------------|
| Claude 3 Opus | $0.015 | $0.075 |
| Claude 3 Sonnet | $0.003 | $0.015 |
| Claude 3 Haiku | $0.00025 | $0.00125 |

## 🎯 Examples

Run the example:
```bash
npm run example
```

Check `examples/basic-usage.js` for detailed usage patterns.

## 📝 API Reference

### `new TokenTracker(config)`
- `config.currency`: 'USD' or 'KRW' (default: 'USD')
- `config.webhookUrl`: Optional webhook for usage notifications

### `tracker.wrap(client)`
Wrap an OpenAI or Anthropic client for automatic tracking.

### `tracker.forUser(userId)`
Create a user-specific tracker instance.

### `tracker.startTracking(userId?, sessionId?)`
Start manual tracking session. Returns tracking ID.

### `tracker.endTracking(trackingId, usage)`
End tracking and record usage.

### `tracker.getUserUsage(userId)`
Get total usage for a user.

### `tracker.getAllUsersUsage()`
Get usage summary for all users.

## 🛠 Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode
npm run dev

# Run examples
npm run example
```

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Issues

For bugs and feature requests, please [create an issue](https://github.com/yourusername/ai-token-tracker/issues).

---

Built with ❤️ for developers who need transparent AI API billing.
