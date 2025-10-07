/**
 * Pricing calculations for different AI models
 */

/**
 * Normalize model name to ensure consistency
 */
function normalizeModelName(model: string): string {
  return model.replace(/(\d+)\.(\d+)/g, '$1-$2');
}

// Pricing in USD per 1000 tokens (2025 updated)
export const PRICING = {
  openai: {
    // GPT-5 Series (2025)
    'gpt-5': { input: 0.00125, output: 0.010 },
    'gpt-5-mini': { input: 0.00025, output: 0.0010 },
    // GPT-4.1 Series (2025)
    'gpt-4.1': { input: 0.0020, output: 0.008 },
    'gpt-4.1-mini': { input: 0.00015, output: 0.0006 },
    // GPT-4o Series
    'gpt-4o': { input: 0.0025, output: 0.010 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    // o1 Series (Reasoning models)
    'o1': { input: 0.015, output: 0.060 },
    'o1-mini': { input: 0.0011, output: 0.0044 },
    'o1-pro': { input: 0.015, output: 0.060 },
    'o3-mini': { input: 0.0011, output: 0.0044 },
    'o4-mini': { input: 0.0011, output: 0.0044 },
    // Legacy GPT-4
    'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-32k': { input: 0.06, output: 0.12 },
    // GPT-3.5
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'gpt-3.5-turbo-16k': { input: 0.001, output: 0.002 },
    // Embeddings
    'text-embedding-ada-002': { input: 0.0001, output: 0 },
    'text-embedding-3-small': { input: 0.00002, output: 0 },
    'text-embedding-3-large': { input: 0.00013, output: 0 },
    // Image generation
    'dall-e-3': { 
      standard: { '1024x1024': 0.040, '1024x1792': 0.080, '1792x1024': 0.080 },
      hd: { '1024x1024': 0.080, '1024x1792': 0.120, '1792x1024': 0.120 }
    },
    'dall-e-2': { 
      '1024x1024': 0.020,
      '512x512': 0.018,
      '256x256': 0.016
    },
    // Audio
    'whisper-1': { perMinute: 0.006 },
    'tts-1': { perChar: 0.000015 },
    'tts-1-hd': { perChar: 0.000030 }
  },
  anthropic: {
    // Claude 4 Series (2025)
    'claude-opus-4.1-20250805': { input: 0.015, output: 0.075 },
    'claude-opus-4-20250522': { input: 0.015, output: 0.075 },
    'claude-opus-4-20250514': { input: 0.015, output: 0.075 },
    'claude-sonnet-4.5-20250929': { input: 0.003, output: 0.015 },
    'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
    // Claude 3 Series
    'claude-3.5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'claude-3.5-haiku-20241022': { input: 0.00025, output: 0.00125 },
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
    // Claude 2 Series
    'claude-2.1': { input: 0.008, output: 0.024 },
    'claude-2.0': { input: 0.008, output: 0.024 },
    'claude-instant-1.2': { input: 0.0008, output: 0.0024 }
  },
  gemini: {
    // Gemini 2.0 Series (2025)
    'gemini-2.0-flash-exp': { input: 0, output: 0 }, // Free during preview
    'gemini-2.0-flash-thinking-exp-1219': { input: 0, output: 0 }, // Free during preview
    // Gemini 1.5 Series
    'gemini-1.5-pro': { input: 0.00125, output: 0.005 }, // $1.25/$5 per 1M tokens
    'gemini-1.5-pro-001': { input: 0.00125, output: 0.005 },
    'gemini-1.5-pro-002': { input: 0.00125, output: 0.005 },
    'gemini-1.5-flash': { input: 0.000075, output: 0.0003 }, // $0.075/$0.30 per 1M tokens
    'gemini-1.5-flash-001': { input: 0.000075, output: 0.0003 },
    'gemini-1.5-flash-002': { input: 0.000075, output: 0.0003 },
    'gemini-1.5-flash-8b': { input: 0.0000375, output: 0.00015 }, // $0.0375/$0.15 per 1M tokens
    // Gemini 1.0 Series (Legacy)
    'gemini-1.0-pro': { input: 0.0005, output: 0.0015 },
    'gemini-1.0-pro-001': { input: 0.0005, output: 0.0015 },
    'gemini-1.0-pro-vision': { input: 0.00025, output: 0.0005 },
    // Gemini Ultra (Theoretical pricing)
    'gemini-ultra': { input: 0.002, output: 0.006 }
  }
} as const;

/**
 * Calculate cost based on provider, model and token usage
 */
export function calculateCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Normalize model name for consistent matching
  const normalizedModel = normalizeModelName(model);
  
  // Type-safe provider pricing access
  if (provider === 'openai') {
    const openaiPricing = PRICING.openai;
    
    // Special handling for DALL-E (image generation)
    if (normalizedModel.startsWith('dall-e')) {
      // For DALL-E, inputTokens represents the number of images
      if ('dall-e-3' in openaiPricing) {
        const dalleModel = openaiPricing['dall-e-3'];
        if (typeof dalleModel === 'object' && 'standard' in dalleModel) {
          return inputTokens * dalleModel.standard['1024x1024'];
        }
      }
      return inputTokens * 0.040; // Default DALL-E pricing
    }
    
    // Special handling for Whisper (audio)
    if (normalizedModel === 'whisper-1') {
      // For Whisper, inputTokens represents seconds of audio
      if ('whisper-1' in openaiPricing) {
        const whisperPricing = openaiPricing['whisper-1'];
        if (typeof whisperPricing === 'object' && 'perMinute' in whisperPricing) {
          return (inputTokens / 60) * whisperPricing.perMinute;
        }
      }
    }
    
    // Special handling for TTS
    if (normalizedModel.startsWith('tts-')) {
      const ttsKey = normalizedModel as 'tts-1' | 'tts-1-hd';
      if (ttsKey in openaiPricing) {
        const ttsModel = openaiPricing[ttsKey];
        if (typeof ttsModel === 'object' && 'perChar' in ttsModel) {
          return inputTokens * ttsModel.perChar;
        }
      }
    }
    
    // Standard token-based pricing for GPT models
    const gptModels = [
      // GPT-5 and 4.1 series (with normalized names)
      'gpt-5', 'gpt-5-mini', 'gpt-4-1', 'gpt-4-1-mini',
      // GPT-4o series
      'gpt-4o', 'gpt-4o-mini',
      // o1 reasoning series
      'o1', 'o1-mini', 'o1-pro', 'o3-mini', 'o4-mini',
      // Legacy GPT-4
      'gpt-4-turbo-preview', 'gpt-4-turbo', 'gpt-4', 'gpt-4-32k',
      // GPT-3.5
      'gpt-3-5-turbo', 'gpt-3-5-turbo-16k'
    ] as const;
    
    for (const gptModel of gptModels) {
      if (normalizedModel.includes(gptModel)) {
        // Map normalized names back to pricing keys
        let pricingKey: keyof typeof openaiPricing = gptModel as any;
        if (gptModel === 'gpt-4-1') pricingKey = 'gpt-4.1';
        if (gptModel === 'gpt-4-1-mini') pricingKey = 'gpt-4.1-mini';
        if (gptModel === 'gpt-3-5-turbo') pricingKey = 'gpt-3.5-turbo';
        if (gptModel === 'gpt-3-5-turbo-16k') pricingKey = 'gpt-3.5-turbo-16k';
        
        const modelPricing = openaiPricing[pricingKey];
        if (modelPricing && typeof modelPricing === 'object' && 'input' in modelPricing) {
          const inputCost = (inputTokens / 1000) * modelPricing.input;
          const outputCost = (outputTokens / 1000) * modelPricing.output;
          return inputCost + outputCost;
        }
      }
    }
    
    // Default GPT pricing if model not found
    const defaultPricing = openaiPricing['gpt-3.5-turbo'];
    if (typeof defaultPricing === 'object' && 'input' in defaultPricing) {
      const inputCost = (inputTokens / 1000) * defaultPricing.input;
      const outputCost = (outputTokens / 1000) * defaultPricing.output;
      return inputCost + outputCost;
    }
  }
  
  // Handle Anthropic models
  if (provider === 'anthropic') {
    const anthropicPricing = PRICING.anthropic;
    const claudeModels = [
      // Claude 4 series (normalized names)
      'claude-opus-4-1-20250805', 'claude-opus-4-20250522', 'claude-opus-4-20250514',
      'claude-sonnet-4-5-20250929', 'claude-sonnet-4-20250514',
      // Claude 3 series
      'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307',
      // Claude 2 series
      'claude-2-1', 'claude-2-0', 'claude-instant-1-2'
    ] as const;
    
    for (const claudeModel of claudeModels) {
      if (normalizedModel.includes(claudeModel)) {
        // Map normalized names back to pricing keys
        let pricingKey: keyof typeof anthropicPricing = claudeModel as any;
        if (claudeModel === 'claude-opus-4-1-20250805') pricingKey = 'claude-opus-4.1-20250805';
        if (claudeModel === 'claude-sonnet-4-5-20250929') pricingKey = 'claude-sonnet-4.5-20250929';
        if (claudeModel === 'claude-3-5-sonnet-20241022') pricingKey = 'claude-3.5-sonnet-20241022';
        if (claudeModel === 'claude-3-5-haiku-20241022') pricingKey = 'claude-3.5-haiku-20241022';
        if (claudeModel === 'claude-2-1') pricingKey = 'claude-2.1';
        if (claudeModel === 'claude-2-0') pricingKey = 'claude-2.0';
        if (claudeModel === 'claude-instant-1-2') pricingKey = 'claude-instant-1.2';
        
        const modelPricing = anthropicPricing[pricingKey];
        if (modelPricing) {
          const inputCost = (inputTokens / 1000) * modelPricing.input;
          const outputCost = (outputTokens / 1000) * modelPricing.output;
          return inputCost + outputCost;
        }
      }
    }
    
    // Default Claude pricing if model not found (use Claude 3 Sonnet as baseline)
    const defaultPricing = anthropicPricing['claude-3-sonnet-20240229'];
    const inputCost = (inputTokens / 1000) * defaultPricing.input;
    const outputCost = (outputTokens / 1000) * defaultPricing.output;
    return inputCost + outputCost;
  }

  // Handle Gemini models
  if (provider === 'gemini') {
    const geminiPricing = PRICING.gemini;
    const geminiModels = [
      // Gemini 2.0 series
      'gemini-2-0-flash-exp', 'gemini-2-0-flash-thinking-exp-1219',
      // Gemini 1.5 series
      'gemini-1-5-pro', 'gemini-1-5-pro-001', 'gemini-1-5-pro-002',
      'gemini-1-5-flash', 'gemini-1-5-flash-001', 'gemini-1-5-flash-002',
      'gemini-1-5-flash-8b',
      // Gemini 1.0 series
      'gemini-1-0-pro', 'gemini-1-0-pro-001', 'gemini-1-0-pro-vision',
      'gemini-ultra'
    ] as const;
    
    for (const geminiModel of geminiModels) {
      if (normalizedModel.includes(geminiModel)) {
        // Map normalized names back to pricing keys
        let pricingKey: keyof typeof geminiPricing = geminiModel as any;
        if (geminiModel === 'gemini-2-0-flash-exp') pricingKey = 'gemini-2.0-flash-exp';
        if (geminiModel === 'gemini-2-0-flash-thinking-exp-1219') pricingKey = 'gemini-2.0-flash-thinking-exp-1219';
        if (geminiModel === 'gemini-1-5-pro') pricingKey = 'gemini-1.5-pro';
        if (geminiModel === 'gemini-1-5-pro-001') pricingKey = 'gemini-1.5-pro-001';
        if (geminiModel === 'gemini-1-5-pro-002') pricingKey = 'gemini-1.5-pro-002';
        if (geminiModel === 'gemini-1-5-flash') pricingKey = 'gemini-1.5-flash';
        if (geminiModel === 'gemini-1-5-flash-001') pricingKey = 'gemini-1.5-flash-001';
        if (geminiModel === 'gemini-1-5-flash-002') pricingKey = 'gemini-1.5-flash-002';
        if (geminiModel === 'gemini-1-5-flash-8b') pricingKey = 'gemini-1.5-flash-8b';
        if (geminiModel === 'gemini-1-0-pro') pricingKey = 'gemini-1.0-pro';
        if (geminiModel === 'gemini-1-0-pro-001') pricingKey = 'gemini-1.0-pro-001';
        if (geminiModel === 'gemini-1-0-pro-vision') pricingKey = 'gemini-1.0-pro-vision';
        
        const modelPricing = geminiPricing[pricingKey];
        if (modelPricing) {
          const inputCost = (inputTokens / 1000) * modelPricing.input;
          const outputCost = (outputTokens / 1000) * modelPricing.output;
          return inputCost + outputCost;
        }
      }
    }
    
    // Default Gemini pricing if model not found (use Gemini 1.5 Flash as baseline)
    const defaultPricing = geminiPricing['gemini-1.5-flash'];
    const inputCost = (inputTokens / 1000) * defaultPricing.input;
    const outputCost = (outputTokens / 1000) * defaultPricing.output;
    return inputCost + outputCost;
  }

  // Fallback for unknown providers
  console.warn(`Unknown provider: ${provider}, using default pricing`);
  return (inputTokens + outputTokens) * 0.001;
}

/**
 * Estimate tokens from text (rough approximation)
 * More accurate counting should use tiktoken or similar
 */
export function estimateTokens(text: string, model: string = 'gpt-3.5-turbo'): number {
  // Rough estimation: 1 token ≈ 4 characters for English
  // This is a simplified version - for production, use tiktoken
  if (model.includes('gpt-4') || model.includes('gpt-3')) {
    return Math.ceil(text.length / 4);
  }
  
  if (model.includes('claude')) {
    // Claude uses a similar tokenization
    return Math.ceil(text.length / 4);
  }
  
  // Default estimation
  return Math.ceil(text.length / 4);
}

/**
 * Format cost for display
 */
export function formatCost(amount: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 4,
    maximumFractionDigits: 6
  });
  
  return formatter.format(amount);
}

/**
 * Get model display name
 */
export function getModelDisplayName(provider: string, model: string): string {
  const displayNames: Record<string, Record<string, string>> = {
    openai: {
      // GPT-5 series
      'gpt-5': 'GPT-5',
      'gpt-5-mini': 'GPT-5 Mini',
      // GPT-4.1 series
      'gpt-4.1': 'GPT-4.1',
      'gpt-4.1-mini': 'GPT-4.1 Mini',
      // GPT-4o series
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      // o1 series
      'o1': 'o1',
      'o1-mini': 'o1 Mini',
      'o1-pro': 'o1 Pro',
      'o3-mini': 'o3 Mini',
      'o4-mini': 'o4 Mini',
      // Legacy
      'gpt-4-turbo-preview': 'GPT-4 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'dall-e-3': 'DALL-E 3',
      'whisper-1': 'Whisper'
    },
    anthropic: {
      // Claude 4 series
      'claude-opus-4.1-20250805': 'Claude Opus 4.1',
      'claude-opus-4-20250522': 'Claude Opus 4',
      'claude-opus-4-20250514': 'Claude Opus 4',
      'claude-sonnet-4.5-20250929': 'Claude Sonnet 4.5',
      'claude-sonnet-4-20250514': 'Claude Sonnet 4',
      // Claude 3 series
      'claude-3.5-sonnet-20241022': 'Claude 3.5 Sonnet',
      'claude-3.5-haiku-20241022': 'Claude 3.5 Haiku',
      'claude-3-opus-20240229': 'Claude 3 Opus',
      'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
      'claude-3-haiku-20240307': 'Claude 3 Haiku'
    },
    gemini: {
      // Gemini 2.0 series
      'gemini-2.0-flash-exp': 'Gemini 2.0 Flash (Experimental)',
      'gemini-2.0-flash-thinking-exp-1219': 'Gemini 2.0 Flash Thinking',
      // Gemini 1.5 series
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'gemini-1.5-pro-001': 'Gemini 1.5 Pro',
      'gemini-1.5-pro-002': 'Gemini 1.5 Pro',
      'gemini-1.5-flash': 'Gemini 1.5 Flash',
      'gemini-1.5-flash-001': 'Gemini 1.5 Flash',
      'gemini-1.5-flash-002': 'Gemini 1.5 Flash',
      'gemini-1.5-flash-8b': 'Gemini 1.5 Flash-8B',
      // Gemini 1.0 series
      'gemini-1.0-pro': 'Gemini 1.0 Pro',
      'gemini-1.0-pro-001': 'Gemini 1.0 Pro',
      'gemini-1.0-pro-vision': 'Gemini 1.0 Pro Vision',
      'gemini-ultra': 'Gemini Ultra'
    }
  };
  
  return displayNames[provider]?.[model] || model;
}
