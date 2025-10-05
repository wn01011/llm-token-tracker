# LLM Token Tracker 🧮

Token usage tracker for OpenAI and Claude APIs with **MCP (Model Context Protocol) support**. Pass accurate API costs to your users.

[![npm version](https://badge.fury.io/js/llm-token-tracker.svg)](https://www.npmjs.com/package/llm-token-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **Simple Integration** - One line to wrap your API client
- 📊 **Automatic Tracking** - No manual token counting
- 💰 **Accurate Pricing** - Up-to-date pricing for all models
- 🔄 **Multiple Providers** - OpenAI and Claude support
- 📈 **User Management** - Track usage per user/session
- 🌐 **Currency Support** - USD and KRW
- 🤖 **MCP Server** - Use directly in Claude Desktop!

## 📦 Installation

```bash
npm install llm-token-tracker
```

## 🚀 Quick Start

### Option 1: Use as Library

```javascript
const { TokenTracker } = require('llm-token-tracker');
// or import { TokenTracker } from 'llm-token-tracker';

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
const { TokenTracker } = require('llm-token-tracker');

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

### Option 2: Use as MCP Server

Add to Claude Desktop settings (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "token-tracker": {
      "command": "npx",
      "args": ["llm-token-tracker"]
    }
  }
}
```

Then in Claude:
- "Track my API usage"
- "Compare costs between GPT-4 and Claude"
- "Show my total spending today"

## 📊 Supported Models & Pricing (Updated 2025)

### OpenAI (2025)
| Model | Input (per 1K tokens) | Output (per 1K tokens) | Notes |
|-------|----------------------|------------------------|-------|
| **GPT-5 Series** | | | |
| GPT-5 | $0.00125 | $0.010 | Latest flagship model |
| GPT-5 Mini | $0.00025 | $0.0010 | Compact version |
| **GPT-4.1 Series** | | | |
| GPT-4.1 | $0.0020 | $0.008 | Advanced reasoning |
| GPT-4.1 Mini | $0.00015 | $0.0006 | Cost-effective |
| **GPT-4o Series** | | | |
| GPT-4o | $0.0025 | $0.010 | Multimodal |
| GPT-4o Mini | $0.00015 | $0.0006 | Fast & cheap |
| **o1 Reasoning Series** | | | |
| o1 | $0.015 | $0.060 | Advanced reasoning |
| o1 Mini | $0.0011 | $0.0044 | Efficient reasoning |
| o1 Pro | $0.015 | $0.060 | Pro reasoning |
| **Legacy Models** | | | |
| GPT-4 Turbo | $0.01 | $0.03 | |
| GPT-4 | $0.03 | $0.06 | |
| GPT-3.5 Turbo | $0.0005 | $0.0015 | Most affordable |
| **Media Models** | | | |
| DALL-E 3 | $0.040 per image | - | Image generation |
| Whisper | $0.006 per minute | - | Speech-to-text |

### Anthropic (2025)
| Model | Input (per 1K tokens) | Output (per 1K tokens) | Notes |
|-------|----------------------|------------------------|-------|
| **Claude 4 Series** | | | |
| Claude Opus 4.1 | $0.015 | $0.075 | Most powerful |
| Claude Opus 4 | $0.015 | $0.075 | Flagship model |
| Claude Sonnet 4.5 | $0.003 | $0.015 | Best for coding |
| Claude Sonnet 4 | $0.003 | $0.015 | Balanced |
| **Claude 3 Series** | | | |
| Claude 3.5 Sonnet | $0.003 | $0.015 | |
| Claude 3.5 Haiku | $0.00025 | $0.00125 | Fastest |
| Claude 3 Opus | $0.015 | $0.075 | |
| Claude 3 Sonnet | $0.003 | $0.015 | |
| Claude 3 Haiku | $0.00025 | $0.00125 | Most affordable |

**Note:** Prices shown are per 1,000 tokens. Batch API offers 50% discount. Prompt caching can reduce costs by up to 90%.

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

For bugs and feature requests, please [create an issue](https://github.com/yourusername/llm-token-tracker/issues).

---

Built with ❤️ for developers who need transparent AI API billing.
