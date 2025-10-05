/**
 * LLM Token Tracker - Main Entry Point
 * Track token usage and costs for OpenAI and Claude APIs
 */

export interface TokenUsage {
  provider: 'openai' | 'anthropic';
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens: number;
  cost: {
    amount: number;
    currency: 'USD' | 'KRW';
  };
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface TrackerConfig {
  currency?: 'USD' | 'KRW';
  webhookUrl?: string;
  saveToDatabase?: boolean;
  customPricing?: Record<string, any>;
}

export interface UserUsage {
  userId: string;
  totalTokens: number;
  totalCost: number;
  currency: string;
  usageByModel: Record<string, {
    tokens: number;
    cost: number;
  }>;
  lastUsed: Date;
}

// Main exports
export { TokenTracker } from './tracker.js';
export { OpenAIWrapper } from './providers/openai.js';
export { AnthropicWrapper } from './providers/anthropic.js';
export { calculateCost, formatCost, PRICING } from './pricing.js';
