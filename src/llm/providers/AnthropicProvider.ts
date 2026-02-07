import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from '../BaseProvider';
import { LLMProviderConfig, LLMMessage, LLMOptions, LLMResponse } from '../types';

export class AnthropicProvider extends BaseProvider {
  private client: Anthropic | null = null;

  constructor(config: LLMProviderConfig) {
    super(config);
    // Client is created lazily on first use
  }

  private getClient(): Anthropic {
    if (!this.client) {
      this.client = new Anthropic({
        apiKey: this.config.apiKey,
        timeout: this.config.timeout,
      });
    }
    return this.client;
  }

  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key is required. Run "FlowGuard: Enter API Key" command to configure.');
    }
  }

  async generateText(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    this.ensureValidated();
    return this.retryWithBackoff(async () => {
      const model = options?.model || this.config.model || 'claude-3-5-sonnet-20241022';
      
      const systemMessage = messages.find(m => m.role === 'system');
      const userMessages = messages.filter(m => m.role !== 'system');

      const response = await this.getClient().messages.create({
        model,
        max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4096,
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        system: systemMessage?.content,
        messages: userMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      });

      return {
        text: response.content[0]?.type === 'text' ? response.content[0].text : '',
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        finishReason: response.stop_reason || 'stop',
      };
    });
  }

  async generateStructured<T>(
    messages: LLMMessage[],
    _schema: object,
    options?: LLMOptions
  ): Promise<T> {
    this.ensureValidated();
    return this.retryWithBackoff(async () => {
      const model = options?.model || this.config.model || 'claude-3-5-sonnet-20241022';

      const structuredPrompt = [
        ...messages,
        { role: 'user', content: '\n\nRespond with valid JSON only.' },
      ];

      const response = await this.getClient().messages.create({
        model,
        max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 8192,
        temperature: options?.temperature ?? this.config.temperature ?? 0.3,
        messages: structuredPrompt.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      });

      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
      return JSON.parse(content) as T;
    });
  }

  async *streamText(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string> {
    this.ensureValidated();
    const model = options?.model || this.config.model || 'claude-3-5-sonnet-20241022';

    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const stream = await this.getClient().messages.stream({
      model,
      max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4096,
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      system: systemMessage?.content,
      messages: userMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }
}
