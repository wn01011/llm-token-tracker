"use strict";
/**
 * Core Token Tracker Class
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenTracker = void 0;
const openai_1 = require("./providers/openai");
const anthropic_1 = require("./providers/anthropic");
const pricing_1 = require("./pricing");
class TokenTracker {
    constructor(config = {}) {
        this.usageHistory = new Map();
        this.activeTracking = new Map();
        this.userTotals = new Map();
        this.config = {
            currency: 'USD',
            saveToDatabase: false,
            ...config
        };
    }
    /**
     * Wrap an API client to automatically track token usage
     */
    wrap(client) {
        const clientName = client.constructor.name.toLowerCase();
        if (clientName.includes('openai')) {
            return new openai_1.OpenAIWrapper(client, this).getWrappedClient();
        }
        if (clientName.includes('anthropic') || clientName.includes('claude')) {
            return new anthropic_1.AnthropicWrapper(client, this).getWrappedClient();
        }
        throw new Error(`Unsupported client: ${client.constructor.name}`);
    }
    /**
     * Create a tracker session for a specific user
     */
    forUser(userId) {
        const userTracker = new TokenTracker(this.config);
        userTracker.defaultUserId = userId;
        return userTracker;
    }
    /**
     * Start manual tracking
     */
    startTracking(userId, sessionId) {
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
    endTracking(trackingId, usage) {
        const tracking = this.activeTracking.get(trackingId);
        if (!tracking) {
            throw new Error(`Tracking ID ${trackingId} not found`);
        }
        const fullUsage = {
            provider: usage.provider || 'openai',
            model: usage.model || 'unknown',
            totalTokens: usage.totalTokens ||
                ((usage.inputTokens || 0) + (usage.outputTokens || 0)),
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            cost: usage.cost || this.calculateCost(usage.provider || 'openai', usage.model || 'unknown', usage.inputTokens || 0, usage.outputTokens || 0),
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
    recordUsage(usage) {
        // Save to history
        const userId = usage.userId || 'anonymous';
        if (!this.usageHistory.has(userId)) {
            this.usageHistory.set(userId, []);
        }
        this.usageHistory.get(userId).push(usage);
        // Update user totals
        this.updateUserTotals(userId, usage);
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
    calculateCost(provider, model, inputTokens, outputTokens) {
        const costUSD = (0, pricing_1.calculateCost)(provider, model, inputTokens, outputTokens);
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
    updateUserTotals(userId, usage) {
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
        const userTotal = this.userTotals.get(userId);
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
    getUserUsage(userId) {
        return this.userTotals.get(userId) || null;
    }
    /**
     * Get usage history for a user
     */
    getUserHistory(userId, limit = 100) {
        const history = this.usageHistory.get(userId) || [];
        return history.slice(-limit);
    }
    /**
     * Get all users' usage summary
     */
    getAllUsersUsage() {
        return Array.from(this.userTotals.values());
    }
    /**
     * Clear usage data for a user
     */
    clearUserUsage(userId) {
        this.usageHistory.delete(userId);
        this.userTotals.delete(userId);
    }
    /**
     * Send usage data to webhook
     */
    async sendWebhook(usage) {
        if (!this.config.webhookUrl)
            return;
        try {
            await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(usage)
            });
        }
        catch (error) {
            console.error('Failed to send webhook:', error);
        }
    }
    /**
     * Save to database (placeholder - implement based on your DB)
     */
    async saveToDatabase(usage) {
        // Implement your database saving logic here
        console.log('Saving to database:', usage);
    }
    /**
     * Export usage data
     */
    exportUsageData() {
        return {
            history: this.usageHistory,
            totals: this.userTotals
        };
    }
    /**
     * Import usage data
     */
    importUsageData(data) {
        this.usageHistory = data.history;
        this.userTotals = data.totals;
    }
}
exports.TokenTracker = TokenTracker;
//# sourceMappingURL=tracker.js.map