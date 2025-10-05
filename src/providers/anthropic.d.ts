/**
 * Anthropic Claude API Wrapper for token tracking
 */
import { TokenTracker } from '../tracker';
export declare class AnthropicWrapper {
    private client;
    private tracker;
    constructor(client: any, tracker: TokenTracker);
    getWrappedClient(): any;
    private wrapMessageCreate;
    private wrapStream;
    private wrapCompletionCreate;
    /**
     * Helper method to count tokens in Claude messages format
     */
    private countMessageTokens;
}
//# sourceMappingURL=anthropic.d.ts.map