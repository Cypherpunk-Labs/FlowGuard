import { LLMProvider, LLMProviderConfig, LLMProviderType } from './types';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { LocalLLMProvider } from './providers/LocalLLMProvider';
import { OpenRouterProvider } from './providers/OpenRouterProvider';
import { OpenCodeProvider } from './providers/OpenCodeProvider';

const providerCache = new Map<string, LLMProvider>();

export function createProvider(type: LLMProviderType, config: LLMProviderConfig): LLMProvider {
  const cacheKey = `${type}-${config.apiKey}`;

  if (providerCache.has(cacheKey)) {
    return providerCache.get(cacheKey)!;
  }

  let provider: LLMProvider;

  switch (type) {
    case 'openai':
      provider = new OpenAIProvider(config);
      break;
    case 'anthropic':
      provider = new AnthropicProvider(config);
      break;
    case 'local':
      provider = new LocalLLMProvider(config);
      break;
    case 'openrouter':
      provider = new OpenRouterProvider(config);
      break;
    case 'opencode':
      provider = new OpenCodeProvider(config);
      break;
    default:
      throw new Error(`Unknown LLM provider type: ${type}`);
  }

  providerCache.set(cacheKey, provider);
  return provider;
}

export function clearProviderCache(): void {
  providerCache.clear();
}
