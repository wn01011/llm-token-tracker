/**
 * Core Token Tracker Class
 */

import { TokenUsage, TrackerConfig, UserUsage } from './index.js';
import { OpenAIWrapper } from './providers/openai.js';
import { AnthropicWrapper } from './providers/anthropic.js';
import { calculateCost } from './pricing.js';
import { FileStorage } from './storage.js';

export class TokenTracker {
  private config: TrackerConfig;
  private usageHistory: Map<string, TokenUsage[]> = new Map();
  private activeTracking: Map<string, any> = new Map();
  private userTotals: Map<string, UserUsage> = new Map();
  private storage: FileStorage | null = null;

  constructor(config: TrackerConfig = {}) {
    this.config = {
      currency: 'USD',
      saveToDatabase: false,
      enableFileStorage: true, // Enable by default
      ...config
    };

    // Initialize file storage
    if (this.config.enableFileStorage !== false) {
      this.storage = new FileStorage();
      this.loadFromStorage();
    }
  }

  /**
   * Wrap an API client to automatically track token usage
   */
  wrap<T extends object>(client: T): T {
    const clientName = client.constructor.name.toLowerCase();
    
    if (clientName.includes('openai')) {
      return new OpenAIWrapper(client, this).getWrappedClient() as T;
    }
    
    if (clientName.includes('anthropic') || clientName.includes('claude')) {
      return new AnthropicWrapper(client, this).getWrappedClient() as T;
    }
    
    throw new Error(`Unsupported client: ${client.constructor.name}`);
  }

  /**
   * Create a tracker session for a specific user
   */
  forUser(userId: string): TokenTracker {
    const userTracker = new TokenTracker(this.config);
    userTracker.defaultUserId = userId;
    return userTracker;
  }

  private defaultUserId?: string;

  /**
   * Start manual tracking
   */
  startTracking(userId?: string, sessionId?: string): string {
    const trackingId = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.activeTracking.set(trackingId, {
      userId: userId || this.defaultUserId,
      sessionId,
      startTime: Date.now()
    });
    
    return trackingId;
  }

  /**
   * End manual tracking and record usage
   */
  endTracking(trackingId: string, usage: Partial<TokenUsage>): void {
    const tracking = this.activeTracking.get(trackingId);
    if (!tracking) {
      throw new Error(`Tracking ID ${trackingId} not found`);
    }

    const fullUsage: TokenUsage = {
      provider: usage.provider || 'openai',
      model: usage.model || 'unknown',
      totalTokens: usage.totalTokens || 
                   ((usage.inputTokens || 0) + (usage.outputTokens || 0)),
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost: usage.cost || this.calculateCost(
        usage.provider || 'openai',
        usage.model || 'unknown',
        usage.inputTokens || 0,
        usage.outputTokens || 0
      ),
      timestamp: new Date(),
      userId: tracking.userId,
      sessionId: tracking.sessionId,
      metadata: {
        ...usage.metadata,
        duration: Date.now() - tracking.startTime
      }
    };

    this.recordUsage(fullUsage);
    this.activeTracking.delete(trackingId);
  }

  /**
   * Record token usage
   */
  recordUsage(usage: TokenUsage): void {
    // Save to history
    const userId = usage.userId || 'anonymous';
    if (!this.usageHistory.has(userId)) {
      this.usageHistory.set(userId, []);
    }
    this.usageHistory.get(userId)!.push(usage);

    // Update user totals
    this.updateUserTotals(userId, usage);

    // Save to file storage
    if (this.storage) {
      this.saveToStorage();
    }

    // Send webhook if configured
    if (this.config.webhookUrl) {
      this.sendWebhook(usage);
    }

    // Save to database if configured
    if (this.config.saveToDatabase) {
      this.saveToDatabase(usage);
    }
  }

  /**
   * Calculate cost for token usage
   */
  private calculateCost(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): { amount: number; currency: 'USD' | 'KRW' } {
    const costUSD = calculateCost(provider, model, inputTokens, outputTokens);
    
    if (this.config.currency === 'KRW') {
      return {
        amount: costUSD * 1300, // Approximate exchange rate
        currency: 'KRW'
      };
    }
    
    return {
      amount: costUSD,
      currency: 'USD'
    };
  }

  /**
   * Update user totals
   */
  private updateUserTotals(userId: string, usage: TokenUsage): void {
    if (!this.userTotals.has(userId)) {
      this.userTotals.set(userId, {
        userId,
        totalTokens: 0,
        totalCost: 0,
        currency: this.config.currency || 'USD',
        usageByModel: {},
        lastUsed: new Date()
      });
    }

    const userTotal = this.userTotals.get(userId)!;
    userTotal.totalTokens += usage.totalTokens;
    userTotal.totalCost += usage.cost.amount;
    userTotal.lastUsed = usage.timestamp;

    const modelKey = `${usage.provider}/${usage.model}`;
    if (!userTotal.usageByModel[modelKey]) {
      userTotal.usageByModel[modelKey] = { tokens: 0, cost: 0 };
    }
    userTotal.usageByModel[modelKey].tokens += usage.totalTokens;
    userTotal.usageByModel[modelKey].cost += usage.cost.amount;
  }

  /**
   * Get user's total usage
   */
  getUserUsage(userId: string): UserUsage | null {
    return this.userTotals.get(userId) || null;
  }

  /**
   * Get usage history for a user
   */
  getUserHistory(userId: string, limit: number = 100): TokenUsage[] {
    const history = this.usageHistory.get(userId) || [];
    return history.slice(-limit);
  }

  /**
   * Get all users' usage summary
   */
  getAllUsersUsage(): UserUsage[] {
    return Array.from(this.userTotals.values());
  }

  /**
   * Clear usage data for a user
   */
  clearUserUsage(userId: string): void {
    this.usageHistory.delete(userId);
    this.userTotals.delete(userId);
    
    // Save to file storage after clearing
    if (this.storage) {
      this.saveToStorage();
    }
  }

  /**
   * Load data from file storage
   */
  private loadFromStorage(): void {
    if (!this.storage) return;

    const data = this.storage.load();
    if (!data) return;

    // Convert Record to Map
    this.usageHistory = new Map(Object.entries(data.history));
    this.userTotals = new Map(Object.entries(data.totals));
  }

  /**
   * Save data to file storage
   */
  private saveToStorage(): void {
    if (!this.storage) return;
    this.storage.save(this.usageHistory, this.userTotals);
  }

  /**
   * Get storage file path
   */
  getStoragePath(): string | null {
    return this.storage?.getPath() || null;
  }

  /**
   * Clear all stored data
   */
  clearAllStorage(): boolean {
    if (!this.storage) return false;
    
    this.usageHistory.clear();
    this.userTotals.clear();
    
    return this.storage.clear();
  }

  /**
   * Send usage data to webhook
   */
  private async sendWebhook(usage: TokenUsage): Promise<void> {
    if (!this.config.webhookUrl) return;

    try {
      await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(usage)
      });
    } catch (error) {
      console.error('Failed to send webhook:', error);
    }
  }

  /**
   * Save to database (placeholder - implement based on your DB)
   */
  private async saveToDatabase(usage: TokenUsage): Promise<void> {
    // Implement your database saving logic here
    console.log('Saving to database:', usage);
  }

  /**
   * Export usage data
   */
  exportUsageData(): {
    history: Map<string, TokenUsage[]>;
    totals: Map<string, UserUsage>;
  } {
    return {
      history: this.usageHistory,
      totals: this.userTotals
    };
  }

  /**
   * Import usage data
   */
  importUsageData(data: {
    history: Map<string, TokenUsage[]>;
    totals: Map<string, UserUsage>;
  }): void {
    this.usageHistory = data.history;
    this.userTotals = data.totals;
  }
}
