import { LLMProviderConfig, LLMProviderType } from './types';

export interface LLMConfiguration {
  provider: LLMProviderType;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export function getLLMConfig(): LLMProviderConfig {
  const provider = getProviderFromSettings() || getProviderFromEnv();
  
  return {
    apiKey: getApiKey(provider),
    baseUrl: getBaseUrlFromSettings(),
    model: getModelFromSettings() || getDefaultModel(provider),
    temperature: getTemperatureFromSettings(),
    maxTokens: getMaxTokensFromSettings(),
  };
}

function getProviderFromSettings(): LLMProviderType | undefined {
  try {
    const vscode = require('vscode');
    const config = vscode.workspace.getConfiguration('flowguard.llm');
    const provider: string | undefined = config.get('provider');
    return provider as LLMProviderType;
  } catch {
    return undefined;
  }
}

function getProviderFromEnv(): LLMProviderType | undefined {
  const envProvider = process.env.FLOWGUARD_LLM_PROVIDER;
  if (envProvider && ['openai', 'anthropic', 'local'].includes(envProvider)) {
    return envProvider as LLMProviderType;
  }
  if (process.env.OPENAI_API_KEY) {
    return 'openai';
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return 'anthropic';
  }
  return undefined;
}

function getApiKey(provider: LLMProviderType | undefined): string {
  if (provider === 'anthropic') {
    const envKey = process.env.ANTHROPIC_API_KEY;
    if (envKey) return envKey;
  }
  
  if (provider === 'openai' || !provider) {
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey) return envKey;
  }
  
  try {
    const vscode = require('vscode');
    const config = vscode.workspace.getConfiguration('flowguard.llm');
    const apiKey: string | undefined = config.get('apiKey');
    return apiKey || '';
  } catch {
    return '';
  }
}

function getBaseUrlFromSettings(): string | undefined {
  try {
    const vscode = require('vscode');
    const config = vscode.workspace.getConfiguration('flowguard.llm');
    const baseUrl: string | undefined = config.get('baseUrl');
    return baseUrl;
  } catch {
    return undefined;
  }
}

function getModelFromSettings(): string | undefined {
  try {
    const vscode = require('vscode');
    const config = vscode.workspace.getConfiguration('flowguard.llm');
    const model: string | undefined = config.get('model');
    return model;
  } catch {
    return undefined;
  }
}

function getDefaultModel(provider: LLMProviderType | undefined): string {
  switch (provider) {
    case 'anthropic':
      return 'claude-3-5-sonnet-20241022';
    case 'local':
      return 'llama-3';
    case 'openai':
    default:
      return 'gpt-4-turbo-preview';
  }
}

function getTemperatureFromSettings(): number | undefined {
  try {
    const vscode = require('vscode');
    const config = vscode.workspace.getConfiguration('flowguard.llm');
    const temperature: number | undefined = config.get('temperature');
    return temperature;
  } catch {
    return undefined;
  }
}

function getMaxTokensFromSettings(): number | undefined {
  try {
    const vscode = require('vscode');
    const config = vscode.workspace.getConfiguration('flowguard.llm');
    const maxTokens: number | undefined = config.get('maxTokens');
    return maxTokens;
  } catch {
    return undefined;
  }
}

export function storeApiKey(apiKey: string): void {
  try {
    const vscode = require('vscode');
    const secrets = vscode.env.secrets;
    secrets.store('flowguard.apiKey', apiKey);
  } catch {
    console.warn('Could not store API key in secret storage');
  }
}

export function getStoredApiKey(): string | undefined {
  try {
    const vscode = require('vscode');
    const secrets = vscode.env.secrets;
    return secrets.get('flowguard.apiKey');
  } catch {
    return undefined;
  }
}
