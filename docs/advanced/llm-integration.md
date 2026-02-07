# LLM Integration Guide

This guide explains how to integrate custom LLM providers with FlowGuard.

## Overview

FlowGuard supports multiple LLM providers through an abstraction layer that allows for easy integration of new providers.

## Provider Interface

All LLM providers must implement the `LLMProvider` interface:

```typescript
export interface LLMProvider {
  generateText(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
  generateStructured<T>(
    messages: LLMMessage[],
    schema: object,
    options?: LLMOptions
  ): Promise<T>;
  streamText(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string>;
}
```

## Creating a Custom Provider

### 1. Extend BaseProvider

```typescript
import { BaseProvider } from '../BaseProvider';
import { LLMProviderConfig, LLMMessage, LLMOptions, LLMResponse } from '../types';

export class CustomProvider extends BaseProvider {
  constructor(config: LLMProviderConfig) {
    super(config);
    // Initialize your provider client
  }

  protected validateConfig(): void {
    // Validate required configuration
  }

  async generateText(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    // Implementation
  }

  async generateStructured<T>(
    messages: LLMMessage[],
    schema: object,
    options?: LLMOptions
  ): Promise<T> {
    // Implementation
  }

  async *streamText(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string> {
    // Implementation
  }
}
```

### 2. Register Your Provider

Add your provider to the ProviderFactory:

```typescript
// In ProviderFactory.ts
import { CustomProvider } from './providers/CustomProvider';

export class ProviderFactory {
  static createProvider(type: string, config: LLMProviderConfig): LLMProvider {
    switch (type) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'local':
        return new LocalLLMProvider(config);
      case 'custom':
        return new CustomProvider(config);
      default:
        throw new Error(`Unsupported provider: ${type}`);
    }
  }
}
```

## Configuration

Providers are configured through FlowGuard settings:

```json
{
  "flowguard.llm.provider": "custom",
  "flowguard.llm.model": "custom-model",
  "flowguard.llm.temperature": 0.7,
  "flowguard.llm.maxTokens": 2048
}
```

## Best Practices

1. Implement proper error handling
2. Add retry logic for transient failures
3. Validate configuration parameters
4. Follow security best practices for API key handling

## Next Steps

- [Plugin Development Guide](plugin-development.md)
- [Custom Verification Rules Guide](custom-verification-rules.md)
