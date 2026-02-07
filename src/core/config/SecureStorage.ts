import * as vscode from 'vscode';
import { LLMProviderType } from './types';

class SecureStorage {
  private static instance: SecureStorage | null = null;
  private secrets: vscode.SecretStorage | null = null;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  initialize(context: vscode.ExtensionContext): void {
    this.secrets = context.secrets;
    this.initialized = true;
  }

  private getKey(provider: LLMProviderType): string {
    return `flowguard.apiKey.${provider}`;
  }

  async storeApiKey(provider: LLMProviderType, apiKey: string): Promise<void> {
    if (!this.initialized || !this.secrets) {
      throw new Error('SecureStorage not initialized. Call initialize() first.');
    }

    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Invalid API key provided');
    }

    try {
      await this.secrets.store(this.getKey(provider), apiKey);
    } catch (error) {
      throw new Error(`Failed to store API key for ${provider}: ${error}`);
    }
  }

  async getApiKey(provider: LLMProviderType): Promise<string | undefined> {
    if (!this.initialized || !this.secrets) {
      throw new Error('SecureStorage not initialized. Call initialize() first.');
    }

    try {
      return await this.secrets.get(this.getKey(provider));
    } catch (error) {
      console.error(`Failed to retrieve API key for ${provider}:`, error);
      return undefined;
    }
  }

  async deleteApiKey(provider: LLMProviderType): Promise<void> {
    if (!this.initialized || !this.secrets) {
      throw new Error('SecureStorage not initialized. Call initialize() first.');
    }

    try {
      await this.secrets.delete(this.getKey(provider));
    } catch (error) {
      throw new Error(`Failed to delete API key for ${provider}: ${error}`);
    }
  }

  async hasApiKey(provider: LLMProviderType): Promise<boolean> {
    const key = await this.getApiKey(provider);
    return key !== undefined && key.length > 0;
  }

  async getAllApiKeys(): Promise<Map<LLMProviderType, string>> {
    const providers: LLMProviderType[] = ['openai', 'anthropic', 'local'];
    const keys = new Map<LLMProviderType, string>();

    for (const provider of providers) {
      const key = await this.getApiKey(provider);
      if (key) {
        keys.set(provider, key);
      }
    }

    return keys;
  }

  async clearAllApiKeys(): Promise<void> {
    const providers: LLMProviderType[] = ['openai', 'anthropic', 'local'];

    for (const provider of providers) {
      await this.deleteApiKey(provider);
    }
  }

  async migrateFromLegacyKey(apiKey: string): Promise<void> {
    if (!apiKey || typeof apiKey !== 'string') {
      return;
    }

    const provider = this.detectProviderFromApiKey(apiKey);
    if (provider) {
      await this.storeApiKey(provider, apiKey);
    }
  }

  private detectProviderFromApiKey(apiKey: string): LLMProviderType | null {
    if (apiKey.startsWith('sk-ant-api03-')) {
      return 'anthropic';
    }
    if (apiKey.startsWith('sk-') && apiKey.length > 20) {
      return 'openai';
    }
    return null;
  }

  async getApiKeyWithFallback(provider: LLMProviderType): Promise<string | undefined> {
    let apiKey = await this.getApiKey(provider);

    if (!apiKey) {
      switch (provider) {
        case 'anthropic':
          apiKey = process.env.ANTHROPIC_API_KEY;
          break;
        case 'openai':
          apiKey = process.env.OPENAI_API_KEY;
          break;
      }
    }

    return apiKey;
  }

  async validateApiKey(provider: LLMProviderType, apiKey: string): Promise<boolean> {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.length === 0) {
      return false;
    }

    const detectedProvider = this.detectProviderFromApiKey(apiKey);
    if (detectedProvider && detectedProvider !== provider) {
      return false;
    }

    return true;
  }
}

export const secureStorage = SecureStorage.getInstance();
