#!/usr/bin/env node

/**
 * MCP Server for LLM Token Tracker
 * Run with: npx llm-token-tracker
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { TokenTracker } = require('./index.js');
const { formatCost } = require('./pricing.js');

class TokenTrackerMCPServer {
  constructor() {
    this.tracker = new TokenTracker({ currency: 'USD' });
    
    this.server = new Server(
      {
        name: 'llm-token-tracker',
        version: '1.0.0',
        description: 'Track and analyze AI API token usage and costs'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'track_tokens',
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
                description: 'Model name (e.g., gpt-4, claude-3-opus-20240229)'
              },
              input_tokens: { 
                type: 'number',
                description: 'Number of input tokens'
              },
              output_tokens: { 
                type: 'number',
                description: 'Number of output tokens'
              },
              user_id: {
                type: 'string',
                description: 'Optional user ID for tracking'
              }
            },
            required: ['provider', 'model', 'input_tokens', 'output_tokens']
          }
        },
        {
          name: 'get_usage',
          description: 'Get usage summary for a user',
          inputSchema: {
            type: 'object',
            properties: {
              user_id: {
                type: 'string',
                description: 'User ID (optional, returns all if not provided)'
              }
            }
          }
        },
        {
          name: 'compare_costs',
          description: 'Compare costs between different models',
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
          description: 'Clear usage data for a user',
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
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'track_tokens': {
            const { provider, model, input_tokens, output_tokens, user_id = 'default' } = args;
            
            const trackingId = this.tracker.startTracking(user_id);
            this.tracker.endTracking(trackingId, {
              provider,
              model,
              inputTokens: input_tokens,
              outputTokens: output_tokens,
              totalTokens: input_tokens + output_tokens
            });

            const usage = this.tracker.getUserUsage(user_id);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `✅ Tracked ${input_tokens + output_tokens} tokens for ${model}\n` +
                        `💰 Session cost: ${formatCost(usage?.usageByModel[`${provider}/${model}`]?.cost || 0)}\n` +
                        `📊 Total usage: ${usage?.totalTokens || 0} tokens (${formatCost(usage?.totalCost || 0)})`
                }
              ]
            };
          }

          case 'get_usage': {
            const { user_id } = args;
            
            if (user_id) {
              const usage = this.tracker.getUserUsage(user_id);
              if (!usage) {
                return {
                  content: [{ type: 'text', text: `No usage data found for user: ${user_id}` }]
                };
              }
              
              let summary = `📊 Usage Summary for ${user_id}\n`;
              summary += `━━━━━━━━━━━━━━━━━━━━━━\n`;
              summary += `Total Tokens: ${usage.totalTokens}\n`;
              summary += `Total Cost: ${formatCost(usage.totalCost)}\n\n`;
              summary += `By Model:\n`;
              
              Object.entries(usage.usageByModel).forEach(([model, data]) => {
                summary += `  • ${model}: ${data.tokens} tokens (${formatCost(data.cost)})\n`;
              });
              
              return {
                content: [{ type: 'text', text: summary }]
              };
            } else {
              const allUsage = this.tracker.getAllUsersUsage();
              
              if (allUsage.length === 0) {
                return {
                  content: [{ type: 'text', text: 'No usage data recorded yet.' }]
                };
              }
              
              let summary = `📊 All Users Summary\n`;
              summary += `━━━━━━━━━━━━━━━━━━━━━━\n`;
              allUsage.forEach(user => {
                summary += `👤 ${user.userId}: ${user.totalTokens} tokens (${formatCost(user.totalCost)})\n`;
              });
              
              return {
                content: [{ type: 'text', text: summary }]
              };
            }
          }

          case 'compare_costs': {
            const { tokens } = args;
            
            const models = [
              { provider: 'openai', model: 'gpt-3.5-turbo', display: 'GPT-3.5 Turbo' },
              { provider: 'openai', model: 'gpt-4', display: 'GPT-4' },
              { provider: 'anthropic', model: 'claude-3-haiku-20240307', display: 'Claude 3 Haiku' },
              { provider: 'anthropic', model: 'claude-3-sonnet-20240229', display: 'Claude 3 Sonnet' },
              { provider: 'anthropic', model: 'claude-3-opus-20240229', display: 'Claude 3 Opus' }
            ];
            
            const comparison = models.map(({ provider, model, display }) => {
              const trackingId = this.tracker.startTracking('_comparison');
              this.tracker.endTracking(trackingId, {
                provider,
                model,
                inputTokens: Math.floor(tokens / 2),
                outputTokens: Math.ceil(tokens / 2),
                totalTokens: tokens
              });
              const usage = this.tracker.getUserUsage('_comparison');
              const cost = usage?.usageByModel[`${provider}/${model}`]?.cost || 0;
              this.tracker.clearUserUsage('_comparison');
              
              return { display, cost, costPer1k: (cost / tokens) * 1000 };
            });
            
            comparison.sort((a, b) => a.cost - b.cost);
            
            let result = `💰 Cost Comparison for ${tokens} tokens\n`;
            result += `━━━━━━━━━━━━━━━━━━━━━━\n`;
            comparison.forEach(({ display, cost }, index) => {
              const emoji = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
              result += `${emoji} ${display}: ${formatCost(cost)}\n`;
            });
            
            return {
              content: [{ type: 'text', text: result }]
            };
          }

          case 'clear_usage': {
            const { user_id } = args;
            this.tracker.clearUserUsage(user_id);
            return {
              content: [{ type: 'text', text: `✅ Cleared usage data for user: ${user_id}` }]
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Error: ${error.message}`
            }
          ]
        };
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('LLM Token Tracker MCP Server started successfully');
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new TokenTrackerMCPServer();
  server.start().catch(console.error);
}

module.exports = { TokenTrackerMCPServer };
