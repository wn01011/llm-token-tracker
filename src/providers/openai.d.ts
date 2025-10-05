/**
 * OpenAI API Wrapper for token tracking
 */
import { TokenTracker } from '../tracker';
export declare class OpenAIWrapper {
    private client;
    private tracker;
    constructor(client: any, tracker: TokenTracker);
    getWrappedClient(): any;
    private wrapChatCompletion;
    private wrapStream;
    private wrapEmbeddings;
    private wrapImageGeneration;
    private wrapAudioTranscription;
}
//# sourceMappingURL=openai.d.ts.map