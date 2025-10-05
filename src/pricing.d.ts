/**
 * Pricing calculations for different AI models
 */
export declare const PRICING: {
    readonly openai: {
        readonly 'gpt-4-turbo-preview': {
            readonly input: 0.01;
            readonly output: 0.03;
        };
        readonly 'gpt-4-turbo': {
            readonly input: 0.01;
            readonly output: 0.03;
        };
        readonly 'gpt-4': {
            readonly input: 0.03;
            readonly output: 0.06;
        };
        readonly 'gpt-4-32k': {
            readonly input: 0.06;
            readonly output: 0.12;
        };
        readonly 'gpt-3.5-turbo': {
            readonly input: 0.0005;
            readonly output: 0.0015;
        };
        readonly 'gpt-3.5-turbo-16k': {
            readonly input: 0.001;
            readonly output: 0.002;
        };
        readonly 'text-embedding-ada-002': {
            readonly input: 0.0001;
            readonly output: 0;
        };
        readonly 'text-embedding-3-small': {
            readonly input: 0.00002;
            readonly output: 0;
        };
        readonly 'text-embedding-3-large': {
            readonly input: 0.00013;
            readonly output: 0;
        };
        readonly 'dall-e-3': {
            readonly standard: {
                readonly '1024x1024': 0.04;
                readonly '1024x1792': 0.08;
                readonly '1792x1024': 0.08;
            };
            readonly hd: {
                readonly '1024x1024': 0.08;
                readonly '1024x1792': 0.12;
                readonly '1792x1024': 0.12;
            };
        };
        readonly 'dall-e-2': {
            readonly '1024x1024': 0.02;
            readonly '512x512': 0.018;
            readonly '256x256': 0.016;
        };
        readonly 'whisper-1': {
            readonly perMinute: 0.006;
        };
        readonly 'tts-1': {
            readonly perChar: 0.000015;
        };
        readonly 'tts-1-hd': {
            readonly perChar: 0.00003;
        };
    };
    readonly anthropic: {
        readonly 'claude-3-opus-20240229': {
            readonly input: 0.015;
            readonly output: 0.075;
        };
        readonly 'claude-3-sonnet-20240229': {
            readonly input: 0.003;
            readonly output: 0.015;
        };
        readonly 'claude-3-haiku-20240307': {
            readonly input: 0.00025;
            readonly output: 0.00125;
        };
        readonly 'claude-2.1': {
            readonly input: 0.008;
            readonly output: 0.024;
        };
        readonly 'claude-2.0': {
            readonly input: 0.008;
            readonly output: 0.024;
        };
        readonly 'claude-instant-1.2': {
            readonly input: 0.0008;
            readonly output: 0.0024;
        };
    };
};
/**
 * Calculate cost based on provider, model and token usage
 */
export declare function calculateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number;
/**
 * Estimate tokens from text (rough approximation)
 * More accurate counting should use tiktoken or similar
 */
export declare function estimateTokens(text: string, model?: string): number;
/**
 * Format cost for display
 */
export declare function formatCost(amount: number, currency?: string): string;
/**
 * Get model display name
 */
export declare function getModelDisplayName(provider: string, model: string): string;
//# sourceMappingURL=pricing.d.ts.map