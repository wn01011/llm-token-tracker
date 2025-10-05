/**
 * Anthropic Claude API Wrapper for token tracking
 */

import { TokenTracker } from '../tracker';
import { TokenUsage } from '../index';

export class AnthropicWrapper {
  private client: any;
  private tracker: TokenTracker;

  constructor(client: any, tracker: TokenTracker) {
    this.client = client;
    this.tracker = tracker;
  }

  getWrappedClient(): any {
    const wrappedClient = Object.create(this.client);
    
    // Wrap messages.create (main Claude API)
    if (this.client.messages?.create) {
      wrappedClient.messages = {
        ...this.client.messages,
        create: this.wrapMessageCreate.bind(this)
      };
    }

    // Wrap completions if available (older API)
    if (this.client.completions?.create) {
      wrappedClient.completions = {
        ...this.client.completions,
        create: this.wrapCompletionCreate.bind(this)
      };
    }

    return wrappedClient;
  }

  private async wrapMessageCreate(...args: any[]): Promise<any> {
    const trackingId = this.tracker.startTracking();
    
    try {
      const response = await this.client.messages.create(...args);
      
      // Extract token usage from response
      let usage: Partial<TokenUsage> = {
        provider: 'anthropic',
        model: args[0]?.model || 'claude-3-sonnet-20240229'
      };

      // Check if streaming
      if (args[0]?.stream) {
        // For streaming, we need to wrap the stream
        return this.wrapStream(response, trackingId, usage);
      }

      // Non-streaming response
      if (response.usage) {
        usage.inputTokens = response.usage.input_tokens;
        usage.outputTokens = response.usage.output_tokens;
        usage.totalTokens = (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0);
      }

      this.tracker.endTracking(trackingId, usage);

      // Add token usage to response
      response._tokenUsage = {
        tokens: usage.totalTokens,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cost: this.tracker.getUserUsage('anonymous')?.totalCost || 0,
        model: usage.model,
        timestamp: new Date().toISOString()
      };

      return response;
    } catch (error) {
      // End tracking even on error
      this.tracker.endTracking(trackingId, {
        provider: 'anthropic',
        model: args[0]?.model || 'unknown',
        totalTokens: 0,
        metadata: { error: true }
      });
      throw error;
    }
  }

  private async *wrapStream(stream: any, trackingId: string, usage: Partial<TokenUsage>): AsyncGenerator {
    let accumulatedContent = '';
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      for await (const chunk of stream) {
        // Handle different event types in Claude's stream
        if (chunk.type === 'message_start') {
          // Initial message with usage info
          if (chunk.message?.usage) {
            inputTokens = chunk.message.usage.input_tokens || 0;
          }
        } else if (chunk.type === 'content_block_delta') {
          // Content chunks
          if (chunk.delta?.text) {
            accumulatedContent += chunk.delta.text;
            // Estimate output tokens
            outputTokens = Math.ceil(accumulatedContent.length / 4);
          }
        } else if (chunk.type === 'message_delta') {
          // Usage updates
          if (chunk.usage) {
            outputTokens = chunk.usage.output_tokens || outputTokens;
          }
        } else if (chunk.type === 'message_stop') {
          // Final message
          if (chunk.usage) {
            inputTokens = chunk.usage.input_tokens || inputTokens;
            outputTokens = chunk.usage.output_tokens || outputTokens;
          }
        }

        // Add accumulated token info to chunk
        chunk._tokenUsage = {
          accumulated: inputTokens + outputTokens,
          inputTokens,
          outputTokens,
          model: usage.model
        };

        yield chunk;
      }

      // End tracking with final token count
      usage.inputTokens = inputTokens;
      usage.outputTokens = outputTokens;
      usage.totalTokens = inputTokens + outputTokens;
      this.tracker.endTracking(trackingId, usage);
    } catch (error) {
      this.tracker.endTracking(trackingId, {
        ...usage,
        totalTokens: inputTokens + outputTokens,
        metadata: { error: true }
      });
      throw error;
    }
  }

  private async wrapCompletionCreate(...args: any[]): Promise<any> {
    const trackingId = this.tracker.startTracking();
    
    try {
      const response = await this.client.completions.create(...args);
      
      const usage: Partial<TokenUsage> = {
        provider: 'anthropic',
        model: args[0]?.model || 'claude-2',
        totalTokens: 0
      };

      // Estimate tokens from prompt and completion
      if (args[0]?.prompt && response.completion) {
        const promptTokens = Math.ceil(args[0].prompt.length / 4);
        const completionTokens = Math.ceil(response.completion.length / 4);
        
        usage.inputTokens = promptTokens;
        usage.outputTokens = completionTokens;
        usage.totalTokens = promptTokens + completionTokens;
      }

      this.tracker.endTracking(trackingId, usage);

      // Add token usage to response
      response._tokenUsage = {
        tokens: usage.totalTokens,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cost: this.tracker.getUserUsage('anonymous')?.totalCost || 0,
        model: usage.model,
        timestamp: new Date().toISOString()
      };

      return response;
    } catch (error) {
      this.tracker.endTracking(trackingId, {
        provider: 'anthropic',
        model: args[0]?.model || 'unknown',
        totalTokens: 0,
        metadata: { error: true }
      });
      throw error;
    }
  }

  /**
   * Helper method to count tokens in Claude messages format
   */
  private countMessageTokens(messages: any[]): number {
    if (!messages || !Array.isArray(messages)) return 0;
    
    let totalChars = 0;
    for (const message of messages) {
      if (typeof message.content === 'string') {
        totalChars += message.content.length;
      } else if (Array.isArray(message.content)) {
        // Handle multi-part content
        for (const part of message.content) {
          if (part.type === 'text' && part.text) {
            totalChars += part.text.length;
          }
        }
      }
    }
    
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(totalChars / 4);
  }
}
