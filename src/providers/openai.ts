/**
 * OpenAI API Wrapper for token tracking
 */

import { TokenTracker } from '../tracker.js';
import { TokenUsage } from '../index.js';

export class OpenAIWrapper {
  private client: any;
  private tracker: TokenTracker;

  constructor(client: any, tracker: TokenTracker) {
    this.client = client;
    this.tracker = tracker;
  }

  getWrappedClient(): any {
    const wrappedClient = Object.create(this.client);
    
    // Wrap chat completions
    if (this.client.chat?.completions?.create) {
      wrappedClient.chat = {
        ...this.client.chat,
        completions: {
          ...this.client.chat.completions,
          create: this.wrapChatCompletion.bind(this)
        }
      };
    }

    // Wrap embeddings
    if (this.client.embeddings?.create) {
      wrappedClient.embeddings = {
        ...this.client.embeddings,
        create: this.wrapEmbeddings.bind(this)
      };
    }

    // Wrap images (DALL-E)
    if (this.client.images?.generate) {
      wrappedClient.images = {
        ...this.client.images,
        generate: this.wrapImageGeneration.bind(this)
      };
    }

    // Wrap audio (Whisper)
    if (this.client.audio?.transcriptions?.create) {
      wrappedClient.audio = {
        ...this.client.audio,
        transcriptions: {
          ...this.client.audio.transcriptions,
          create: this.wrapAudioTranscription.bind(this)
        }
      };
    }

    return wrappedClient;
  }

  private async wrapChatCompletion(...args: any[]): Promise<any> {
    const trackingId = this.tracker.startTracking();
    
    try {
      const response = await this.client.chat.completions.create(...args);
      
      // Extract token usage from response
      let usage: Partial<TokenUsage> = {
        provider: 'openai',
        model: args[0]?.model || 'gpt-3.5-turbo'
      };

      // Check if streaming
      if (args[0]?.stream) {
        // For streaming, we need to wrap the stream
        return this.wrapStream(response, trackingId, usage);
      }

      // Non-streaming response
      if (response.usage) {
        usage.inputTokens = response.usage.prompt_tokens;
        usage.outputTokens = response.usage.completion_tokens;
        usage.totalTokens = response.usage.total_tokens;
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
        provider: 'openai',
        model: args[0]?.model || 'unknown',
        totalTokens: 0,
        metadata: { error: true }
      });
      throw error;
    }
  }

  private async *wrapStream(stream: any, trackingId: string, usage: Partial<TokenUsage>): AsyncGenerator {
    let accumulatedTokens = 0;
    let content = '';

    try {
      for await (const chunk of stream) {
        // Accumulate content to estimate tokens
        if (chunk.choices?.[0]?.delta?.content) {
          content += chunk.choices[0].delta.content;
        }

        // Estimate tokens (rough approximation)
        // In production, use tiktoken for accurate counting
        accumulatedTokens = Math.ceil(content.length / 4);

        // Add accumulated token info to chunk
        chunk._tokenUsage = {
          accumulated: accumulatedTokens,
          model: usage.model
        };

        yield chunk;
      }

      // End tracking with final token count
      usage.outputTokens = accumulatedTokens;
      usage.totalTokens = (usage.inputTokens || 0) + accumulatedTokens;
      this.tracker.endTracking(trackingId, usage);
    } catch (error) {
      this.tracker.endTracking(trackingId, {
        ...usage,
        totalTokens: accumulatedTokens,
        metadata: { error: true }
      });
      throw error;
    }
  }

  private async wrapEmbeddings(...args: any[]): Promise<any> {
    const trackingId = this.tracker.startTracking();
    
    try {
      const response = await this.client.embeddings.create(...args);
      
      const usage: Partial<TokenUsage> = {
        provider: 'openai',
        model: args[0]?.model || 'text-embedding-ada-002',
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: 0,
        totalTokens: response.usage?.total_tokens || 0
      };

      this.tracker.endTracking(trackingId, usage);

      // Add token usage to response
      response._tokenUsage = {
        tokens: usage.totalTokens,
        cost: this.tracker.getUserUsage('anonymous')?.totalCost || 0,
        model: usage.model,
        timestamp: new Date().toISOString()
      };

      return response;
    } catch (error) {
      this.tracker.endTracking(trackingId, {
        provider: 'openai',
        model: args[0]?.model || 'unknown',
        totalTokens: 0,
        metadata: { error: true }
      });
      throw error;
    }
  }

  private async wrapImageGeneration(...args: any[]): Promise<any> {
    const trackingId = this.tracker.startTracking();
    
    try {
      const response = await this.client.images.generate(...args);
      
      const usage: Partial<TokenUsage> = {
        provider: 'openai',
        model: args[0]?.model || 'dall-e-3',
        inputTokens: args[0]?.n || 1, // Number of images as "tokens" for cost calculation
        outputTokens: 0,
        totalTokens: args[0]?.n || 1
      };

      this.tracker.endTracking(trackingId, usage);

      // Add usage info to response
      response._tokenUsage = {
        images: usage.totalTokens,
        cost: this.tracker.getUserUsage('anonymous')?.totalCost || 0,
        model: usage.model,
        timestamp: new Date().toISOString()
      };

      return response;
    } catch (error) {
      this.tracker.endTracking(trackingId, {
        provider: 'openai',
        model: 'dall-e-3',
        totalTokens: 0,
        metadata: { error: true }
      });
      throw error;
    }
  }

  private async wrapAudioTranscription(...args: any[]): Promise<any> {
    const trackingId = this.tracker.startTracking();
    
    try {
      const response = await this.client.audio.transcriptions.create(...args);
      
      // For Whisper, we need to estimate audio duration
      // This is a simplified version - in production, you'd need to analyze the audio file
      const estimatedSeconds = 60; // Default estimate
      
      const usage: Partial<TokenUsage> = {
        provider: 'openai',
        model: 'whisper-1',
        inputTokens: estimatedSeconds, // Seconds as "tokens" for cost calculation
        outputTokens: 0,
        totalTokens: estimatedSeconds
      };

      this.tracker.endTracking(trackingId, usage);

      // Add usage info to response
      response._tokenUsage = {
        seconds: usage.totalTokens,
        cost: this.tracker.getUserUsage('anonymous')?.totalCost || 0,
        model: usage.model,
        timestamp: new Date().toISOString()
      };

      return response;
    } catch (error) {
      this.tracker.endTracking(trackingId, {
        provider: 'openai',
        model: 'whisper-1',
        totalTokens: 0,
        metadata: { error: true }
      });
      throw error;
    }
  }
}
