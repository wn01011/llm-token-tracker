/**
 * Pricing calculations for different AI models
 */

// Pricing in USD per 1000 tokens
export const PRICING = {
  openai: {
    'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-32k': { input: 0.06, output: 0.12 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'gpt-3.5-turbo-16k': { input: 0.001, output: 0.002 },
    'text-embedding-ada-002': { input: 0.0001, output: 0 },
    'text-embedding-3-small': { input: 0.00002, output: 0 },
    'text-embedding-3-large': { input: 0.00013, output: 0 },
    'dall-e-3': { 
      standard: { '1024x1024': 0.040, '1024x1792': 0.080, '1792x1024': 0.080 },
      hd: { '1024x1024': 0.080, '1024x1792': 0.120, '1792x1024': 0.120 }
    },
    'dall-e-2': { 
      '1024x1024': 0.020,
      '512x512': 0.018,
      '256x256': 0.016
    },
    'whisper-1': { perMinute: 0.006 },
    'tts-1': { perChar: 0.000015 },
    'tts-1-hd': { perChar: 0.000030 }
  },
  anthropic: {
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
    'claude-2.1': { input: 0.008, output: 0.024 },
    'claude-2.0': { input: 0.008, output: 0.024 },
    'claude-instant-1.2': { input: 0.0008, output: 0.0024 }
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
  // Type-safe provider pricing access
  if (provider === 'openai') {
    const openaiPricing = PRICING.openai;
    
    // Special handling for DALL-E (image generation)
    if (model.startsWith('dall-e')) {
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
    if (model === 'whisper-1') {
      // For Whisper, inputTokens represents seconds of audio
      if ('whisper-1' in openaiPricing) {
        const whisperPricing = openaiPricing['whisper-1'];
        if (typeof whisperPricing === 'object' && 'perMinute' in whisperPricing) {
          return (inputTokens / 60) * whisperPricing.perMinute;
        }
      }
    }
    
    // Special handling for TTS
    if (model.startsWith('tts-')) {
      const ttsKey = model as 'tts-1' | 'tts-1-hd';
      if (ttsKey in openaiPricing) {
        const ttsModel = openaiPricing[ttsKey];
        if (typeof ttsModel === 'object' && 'perChar' in ttsModel) {
          return inputTokens * ttsModel.perChar;
        }
      }
    }
    
    // Standard token-based pricing for GPT models
    const gptModels = [
      'gpt-4-turbo-preview', 'gpt-4-turbo', 'gpt-4', 'gpt-4-32k',
      'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'
    ] as const;
    
    for (const gptModel of gptModels) {
      if (model.includes(gptModel)) {
        const modelPricing = openaiPricing[gptModel];
        if (typeof modelPricing === 'object' && 'input' in modelPricing) {
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
      'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307',
      'claude-2.1', 'claude-2.0', 'claude-instant-1.2'
    ] as const;
    
    for (const claudeModel of claudeModels) {
      if (model.includes(claudeModel)) {
        const modelPricing = anthropicPricing[claudeModel];
        const inputCost = (inputTokens / 1000) * modelPricing.input;
        const outputCost = (outputTokens / 1000) * modelPricing.output;
        return inputCost + outputCost;
      }
    }
    
    // Default Claude pricing if model not found
    const defaultPricing = anthropicPricing['claude-3-sonnet-20240229'];
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
      'gpt-4-turbo-preview': 'GPT-4 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'dall-e-3': 'DALL-E 3',
      'whisper-1': 'Whisper'
    },
    anthropic: {
      'claude-3-opus-20240229': 'Claude 3 Opus',
      'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
      'claude-3-haiku-20240307': 'Claude 3 Haiku'
    }
  };
  
  return displayNames[provider]?.[model] || model;
}
