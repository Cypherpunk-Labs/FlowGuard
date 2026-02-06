import { LLMProviderConfig, LLMProviderType } from './types';
import { configurationManager } from '../core/config/ConfigurationManager';
import { secureStorage } from '../core/config/SecureStorage';

export interface LLMConfiguration {
  provider: LLMProviderType;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function getLLMConfig(): Promise<LLMProviderConfig> {
  const config = configurationManager.getLLMConfig();
  const apiKey = await secureStorage.getApiKeyWithFallback(config.provider) || '';
  
  return {
    apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
  };
}

export async function storeApiKey(provider: LLMProviderType, apiKey: string): Promise<void> {
  return secureStorage.storeApiKey(provider, apiKey);
}

export async function getStoredApiKey(provider: LLMProviderType): Promise<string | undefined> {
  return secureStorage.getApiKey(provider);
}

export async function hasApiKey(provider: LLMProviderType): Promise<boolean> {
  return secureStorage.hasApiKey(provider);
}

export async function deleteApiKey(provider: LLMProviderType): Promise<void> {
  return secureStorage.deleteApiKey(provider);
}
