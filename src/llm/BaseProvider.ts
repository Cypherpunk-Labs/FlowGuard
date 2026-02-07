import { LLMProvider, LLMProviderConfig, LLMMessage, LLMOptions, LLMResponse } from './types';

export abstract class BaseProvider implements LLMProvider {
  protected config: LLMProviderConfig;
  private validated = false;

  constructor(config: LLMProviderConfig) {
    this.config = config;
    // Validation is now lazy - happens on first use, not construction
  }

  protected abstract validateConfig(): void;

  protected ensureValidated(): void {
    if (!this.validated) {
      this.validateConfig();
      this.validated = true;
    }
  }

  protected handleError(error: unknown): never {
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new Error('Invalid API key. Please check your configuration.');
      }
      if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (error.message.includes('500') || error.message.includes('503')) {
        throw new Error('Service temporarily unavailable. Please try again later.');
      }
      throw new Error(`LLM error: ${error.message}`);
    }
    throw new Error('An unknown error occurred');
  }

  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const isRetryable = error instanceof Error && (
          error.message.includes('429') ||
          error.message.includes('500') ||
          error.message.includes('503')
        );
        if (!isRetryable || i === maxRetries - 1) {
          throw error;
        }
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  abstract generateText(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
  abstract generateStructured<T>(
    messages: LLMMessage[],
    schema: object,
    options?: LLMOptions
  ): Promise<T>;
  abstract streamText(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string>;
}
