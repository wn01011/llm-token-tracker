/**
 * Google Gemini API Wrapper
 * Automatically tracks token usage for Gemini API calls
 */

import { TokenTracker } from '../tracker.js';

export class GeminiWrapper {
  private client: any;
  private tracker: TokenTracker;

  constructor(client: any, tracker: TokenTracker) {
    this.client = client;
    this.tracker = tracker;
  }

  /**
   * Get wrapped client with automatic tracking
   */
  getWrappedClient(): any {
    return new Proxy(this.client, {
      get: (target, prop) => {
        // Intercept generateContent and related methods
        if (prop === 'generateContent' || prop === 'generateContentStream') {
          return this.wrapGenerateContent(target[prop].bind(target), prop as string);
        }

        return target[prop];
      }
    });
  }

  /**
   * Wrap generateContent methods
   */
  private wrapGenerateContent(originalMethod: Function, methodName: string) {
    return async (...args: any[]) => {
      const trackingId = this.tracker.startTracking();

      try {
        const result = await originalMethod(...args);

        // Extract token usage from response
        const usage = this.extractUsage(result, methodName);
        
        // End tracking with usage data
        this.tracker.endTracking(trackingId, {
          provider: 'gemini',
          model: this.extractModel(args),
          ...usage
        });

        return result;
      } catch (error) {
        // Still record the tracking even on error
        this.tracker.endTracking(trackingId, {
          provider: 'gemini',
          model: this.extractModel(args),
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          metadata: { error: true }
        });

        throw error;
      }
    };
  }

  /**
   * Extract model from arguments
   */
  private extractModel(args: any[]): string {
    // Try to extract model from various argument formats
    if (args[0]?.model) {
      return args[0].model;
    }
    
    if (typeof args[0] === 'string') {
      return args[0];
    }

    return 'gemini-1.5-pro'; // Default model
  }

  /**
   * Extract usage information from Gemini response
   */
  private extractUsage(result: any, methodName: string): {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  } {
    // For streaming responses
    if (methodName === 'generateContentStream') {
      // Gemini streaming might not provide token counts immediately
      // We'll need to accumulate them
      return {
        inputTokens: result.usageMetadata?.promptTokenCount || 0,
        outputTokens: result.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.usageMetadata?.totalTokenCount || 0
      };
    }

    // For regular responses
    const usageMetadata = result.response?.usageMetadata || result.usageMetadata;
    
    return {
      inputTokens: usageMetadata?.promptTokenCount || 0,
      outputTokens: usageMetadata?.candidatesTokenCount || 0,
      totalTokens: usageMetadata?.totalTokenCount || 0
    };
  }
}
