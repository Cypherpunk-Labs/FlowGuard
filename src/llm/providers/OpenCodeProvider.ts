import OpenAI from 'openai';
import { BaseProvider } from '../BaseProvider';
import { LLMProviderConfig, LLMMessage, LLMOptions, LLMResponse } from '../types';

export class OpenCodeProvider extends BaseProvider {
  private client: OpenAI | null = null;

  constructor(config: LLMProviderConfig) {
    super(config);
    // Client is created lazily on first use
  }

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseUrl || 'https://api.opencode.ai/v1',
        timeout: this.config.timeout,
      });
    }
    return this.client;
  }

  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('OpenCode API key is required. Get one at https://opencode.ai and run "FlowGuard: Enter API Key" command to configure.');
    }
  }

  async generateText(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    this.ensureValidated();
    return this.retryWithBackoff(async () => {
      const model = options?.model || this.config.model || 'opencode-default';

      const response = await this.getClient().chat.completions.create({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4096,
        stop: options?.stopSequences,
      });

      const choice = response.choices[0];
      if (!choice) {
        throw new Error('No response choices received from OpenCode');
      }

      return {
        text: choice.message?.content || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        finishReason: choice.finish_reason || 'stop',
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
      const model = options?.model || this.config.model || 'opencode-default';

      const response = await this.getClient().chat.completions.create({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? this.config.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 8192,
        response_format: { type: 'json_object' },
      });

      const choice = response.choices[0];
      if (!choice) {
        throw new Error('No response choices received from OpenCode');
      }

      const content = choice.message?.content || '';
      return JSON.parse(content) as T;
    });
  }

  async *streamText(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string> {
    this.ensureValidated();
    const model = options?.model || this.config.model || 'opencode-default';

    const stream = await this.getClient().chat.completions.create({
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4096,
      stop: options?.stopSequences,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}
