#!/usr/bin/env node

/**
 * MCP Server entry point
 * Run with: npx llm-token-tracker
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TokenTracker } from './tracker.js';
import { formatCost } from './pricing.js';

class TokenTrackerMCPServer {
  private server: Server;
  private tracker: TokenTracker;

  constructor() {
    this.tracker = new TokenTracker({ currency: 'USD' });
    
    this.server = new Server(
      {
        name: 'llm-token-tracker',
        version: '2.3.0',
      },
      {
        capabilities: {
          tools: {}
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'track_usage',
          description: 'Track token usage for an AI API call',
          inputSchema: {
            type: 'object',
            properties: {
              provider: {
                type: 'string',
                enum: ['openai', 'anthropic'],
                description: 'AI provider'
              },
              model: {
                type: 'string',
                description: 'Model name'
              },
              input_tokens: {
                type: 'number',
                description: 'Input tokens used'
              },
              output_tokens: {
                type: 'number',
                description: 'Output tokens used'
              },
              user_id: {
                type: 'string',
                description: 'Optional user ID'
              }
            },
            required: ['provider', 'model', 'input_tokens', 'output_tokens']
          }
        },
        {
          name: 'get_current_session',
          description: 'Get current session usage with intuitive format (remaining, used, input/output tokens, cost)',
          inputSchema: {
            type: 'object',
            properties: {
              user_id: {
                type: 'string',
                description: 'User ID (defaults to current-session)',
                default: 'current-session'
              },
              total_budget: {
                type: 'number',
                description: 'Total token budget (optional)',
                default: 190000
              }
            }
          }
        },
        {
          name: 'get_usage',
          description: 'Get usage summary',
          inputSchema: {
            type: 'object',
            properties: {
              user_id: {
                type: 'string',
                description: 'User ID (optional)'
              }
            }
          }
        },
        {
          name: 'compare_costs',
          description: 'Compare costs between models',
          inputSchema: {
            type: 'object',
            properties: {
              tokens: {
                type: 'number',
                description: 'Number of tokens to compare'
              }
            },
            required: ['tokens']
          }
        },
        {
          name: 'clear_usage',
          description: 'Clear usage data',
          inputSchema: {
            type: 'object',
            properties: {
              user_id: {
                type: 'string',
                description: 'User ID to clear'
              }
            },
            required: ['user_id']
          }
        },
        {
          name: 'get_exchange_rate',
          description: 'Get current USD to KRW exchange rate with cache info',
          inputSchema: {
            type: 'object',
            properties: {
              force_refresh: {
                type: 'boolean',
                description: 'Force refresh from API (default: false)',
                default: false
              }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'track_usage':
          return this.trackUsage(request.params.arguments);
        case 'get_current_session':
          return this.getCurrentSession(request.params.arguments);
        case 'get_usage':
          return this.getUsage(request.params.arguments);
        case 'compare_costs':
          return this.compareCosts(request.params.arguments);
        case 'clear_usage':
          return this.clearUsage(request.params.arguments);
        case 'get_exchange_rate':
          return this.getExchangeRate(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  private trackUsage(args: any) {
    const { provider, model, input_tokens, output_tokens, user_id = 'current-session' } = args;
    
    const trackingId = this.tracker.startTracking(user_id);
    this.tracker.endTracking(trackingId, {
      provider: provider as 'openai' | 'anthropic',
      model,
      inputTokens: input_tokens,
      outputTokens: output_tokens,
      totalTokens: input_tokens + output_tokens
    });

    const usage = this.tracker.getUserUsage(user_id);
    const totalTokens = input_tokens + output_tokens;
    const cost = usage?.totalCost || 0;
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ Tracked ${totalTokens.toLocaleString()} tokens for ${model}\n` +
                `💰 Session Cost: ${formatCost(cost)}\n` +
                `📊 Total: ${usage?.totalTokens.toLocaleString() || 0} tokens`
        }
      ]
    };
  }

  private getCurrentSession(args: any) {
    const { user_id = 'current-session', total_budget = 190000 } = args;
    
    const usage = this.tracker.getUserUsage(user_id);
    
    if (!usage) {
      return {
        content: [{
          type: 'text',
          text: `💰 Current Session\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `📊 Used: 0 tokens\n` +
                `✨ Remaining: ${total_budget.toLocaleString()} tokens\n` +
                `📥 Input: 0 tokens\n` +
                `📤 Output: 0 tokens\n` +
                `💵 Cost: $0.0000\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `No usage recorded yet.`
        }]
      };
    }

    // Calculate input/output from model breakdown
    let totalInput = 0;
    let totalOutput = 0;
    
    const history = this.tracker.getUserHistory(user_id);
    history.forEach(record => {
      totalInput += record.inputTokens || 0;
      totalOutput += record.outputTokens || 0;
    });

    const usedTokens = usage.totalTokens;
    const remaining = Math.max(0, total_budget - usedTokens);
    const percentUsed = ((usedTokens / total_budget) * 100).toFixed(1);
    
    // Progress bar
    const barLength = 20;
    const filledLength = Math.round((usedTokens / total_budget) * barLength);
    const progressBar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    
    let result = `💰 Current Session\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    result += `📊 Used: ${usedTokens.toLocaleString()} tokens (${percentUsed}%)\n`;
    result += `✨ Remaining: ${remaining.toLocaleString()} tokens\n`;
    result += `[${progressBar}]\n\n`;
    result += `📥 Input: ${totalInput.toLocaleString()} tokens\n`;
    result += `📤 Output: ${totalOutput.toLocaleString()} tokens\n`;
    result += `💵 Cost: ${formatCost(usage.totalCost)}\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    // Model breakdown
    if (Object.keys(usage.usageByModel).length > 0) {
      result += `\n📋 Model Breakdown:\n`;
      Object.entries(usage.usageByModel).forEach(([model, data]) => {
        result += `  • ${model}: ${data.tokens.toLocaleString()} tokens (${formatCost(data.cost)})\n`;
      });
    }
    
    return {
      content: [{ type: 'text', text: result }]
    };
  }

  private getUsage(args: any) {
    const { user_id } = args;
    
    if (user_id) {
      const usage = this.tracker.getUserUsage(user_id);
      if (!usage) {
        return {
          content: [{ type: 'text', text: `No usage data for ${user_id}` }]
        };
      }
      
      let summary = `📊 Usage Summary for ${user_id}\n`;
      summary += `Total: ${usage.totalTokens} tokens (${formatCost(usage.totalCost)})\n\n`;
      Object.entries(usage.usageByModel).forEach(([model, data]) => {
        summary += `${model}: ${data.tokens} tokens (${formatCost(data.cost)})\n`;
      });
      
      return {
        content: [{ type: 'text', text: summary }]
      };
    } else {
      const allUsage = this.tracker.getAllUsersUsage();
      let summary = '📊 All Users:\n';
      allUsage.forEach(user => {
        summary += `${user.userId}: ${user.totalTokens} tokens (${formatCost(user.totalCost)})\n`;
      });
      
      return {
        content: [{ type: 'text', text: summary || 'No usage data' }]
      };
    }
  }

  private compareCosts(args: any) {
    const { tokens } = args;
    
    const models = [
      { provider: 'openai' as const, model: 'gpt-3.5-turbo', name: 'GPT-3.5' },
      { provider: 'openai' as const, model: 'gpt-4', name: 'GPT-4' },
      { provider: 'anthropic' as const, model: 'claude-3-haiku-20240307', name: 'Claude Haiku' },
      { provider: 'anthropic' as const, model: 'claude-3-sonnet-20240229', name: 'Claude Sonnet' },
      { provider: 'anthropic' as const, model: 'claude-3-opus-20240229', name: 'Claude Opus' }
    ];
    
    const comparison = models.map(({ provider, model, name }) => {
      const trackingId = this.tracker.startTracking('_compare');
      this.tracker.endTracking(trackingId, {
        provider,
        model,
        inputTokens: Math.floor(tokens / 2),
        outputTokens: Math.ceil(tokens / 2),
        totalTokens: tokens
      });
      const usage = this.tracker.getUserUsage('_compare');
      const cost = usage?.usageByModel[`${provider}/${model}`]?.cost || 0;
      this.tracker.clearUserUsage('_compare');
      
      return { name, cost };
    }).sort((a, b) => a.cost - b.cost);
    
    let result = `💰 Cost comparison for ${tokens} tokens:\n\n`;
    comparison.forEach((item, i) => {
      const emoji = i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
      result += `${emoji} ${item.name}: ${formatCost(item.cost)}\n`;
    });
    
    return {
      content: [{ type: 'text', text: result }]
    };
  }

  private clearUsage(args: any) {
    const { user_id } = args;
    this.tracker.clearUserUsage(user_id);
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ Cleared usage data for ${user_id}`
        }
      ]
    };
  }

  private async getExchangeRate(args: any) {
    const { force_refresh = false } = args;
    
    try {
      let rate: number;
      let info: any;
      
      if (force_refresh) {
        rate = await this.tracker.refreshExchangeRate();
        info = await this.tracker.getExchangeRateInfo();
      } else {
        info = await this.tracker.getExchangeRateInfo();
        rate = info.rate;
      }
      
      const lastUpdated = info.lastUpdated 
        ? new Date(info.lastUpdated).toLocaleString()
        : 'Never';
      
      const timeSinceUpdate = info.lastUpdated
        ? Math.round((Date.now() - new Date(info.lastUpdated).getTime()) / (1000 * 60 * 60))
        : null;
      
      let result = `💱 Exchange Rate (USD to KRW)\n`;
      result += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      result += `💵 Current Rate: ₩${rate.toFixed(2)}\n`;
      result += `📅 Last Updated: ${lastUpdated}\n`;
      
      if (timeSinceUpdate !== null) {
        result += `⏰ ${timeSinceUpdate} hours ago\n`;
      }
      
      result += `🔄 Source: ${info.source || 'fallback'}\n`;
      result += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      result += `💡 Rate updates automatically every 24 hours\n`;
      result += `   Cache location: ~/.llm-token-tracker/exchange-rate.json`;
      
      return {
        content: [{ type: 'text', text: result }]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to get exchange rate: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('LLM Token Tracker MCP Server running');
  }
}

// Run server
const server = new TokenTrackerMCPServer();
server.run().catch(console.error);
