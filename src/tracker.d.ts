/**
 * Core Token Tracker Class
 */
import { TokenUsage, TrackerConfig, UserUsage } from './index';
export declare class TokenTracker {
    private config;
    private usageHistory;
    private activeTracking;
    private userTotals;
    constructor(config?: TrackerConfig);
    /**
     * Wrap an API client to automatically track token usage
     */
    wrap<T extends object>(client: T): T;
    /**
     * Create a tracker session for a specific user
     */
    forUser(userId: string): TokenTracker;
    private defaultUserId?;
    /**
     * Start manual tracking
     */
    startTracking(userId?: string, sessionId?: string): string;
    /**
     * End manual tracking and record usage
     */
    endTracking(trackingId: string, usage: Partial<TokenUsage>): void;
    /**
     * Record token usage
     */
    recordUsage(usage: TokenUsage): void;
    /**
     * Calculate cost for token usage
     */
    private calculateCost;
    /**
     * Update user totals
     */
    private updateUserTotals;
    /**
     * Get user's total usage
     */
    getUserUsage(userId: string): UserUsage | null;
    /**
     * Get usage history for a user
     */
    getUserHistory(userId: string, limit?: number): TokenUsage[];
    /**
     * Get all users' usage summary
     */
    getAllUsersUsage(): UserUsage[];
    /**
     * Clear usage data for a user
     */
    clearUserUsage(userId: string): void;
    /**
     * Send usage data to webhook
     */
    private sendWebhook;
    /**
     * Save to database (placeholder - implement based on your DB)
     */
    private saveToDatabase;
    /**
     * Export usage data
     */
    exportUsageData(): {
        history: Map<string, TokenUsage[]>;
        totals: Map<string, UserUsage>;
    };
    /**
     * Import usage data
     */
    importUsageData(data: {
        history: Map<string, TokenUsage[]>;
        totals: Map<string, UserUsage>;
    }): void;
}
//# sourceMappingURL=tracker.d.ts.map