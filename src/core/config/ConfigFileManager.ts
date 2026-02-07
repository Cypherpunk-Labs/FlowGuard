import * as path from 'path';
import * as vscode from 'vscode';
import { LLMConfiguration, LLMProviderType } from './types';
import { fileExists, readFile } from '../storage/fileSystem';

export interface LLMConfigFile {
  provider?: LLMProviderType;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retryAttempts?: number;
  streamResponses?: boolean;
}

export class ConfigFileManager {
  private static instance: ConfigFileManager | null = null;
  private configFileWatcher: vscode.FileSystemWatcher | null = null;
  private cachedConfig: LLMConfigFile | null = null;
  private configPath: string | null = null;

  private constructor() {}

  static getInstance(): ConfigFileManager {
    if (!ConfigFileManager.instance) {
      ConfigFileManager.instance = new ConfigFileManager();
    }
    return ConfigFileManager.instance;
  }

  initialize(workspaceRoot: string): void {
    this.configPath = path.join(workspaceRoot, '.flowguard', 'llm.config.json');
    this.setupFileWatcher();
    this.invalidateCache();
  }

  private setupFileWatcher(): void {
    if (!this.configPath) return;

    this.configFileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(path.dirname(this.configPath), path.basename(this.configPath))
    );

    this.configFileWatcher.onDidChange(() => {
      this.invalidateCache();
    });

    this.configFileWatcher.onDidCreate(() => {
      this.invalidateCache();
    });

    this.configFileWatcher.onDidDelete(() => {
      this.invalidateCache();
    });
  }

  invalidateCache(): void {
    this.cachedConfig = null;
  }

  dispose(): void {
    this.configFileWatcher?.dispose();
    this.configFileWatcher = null;
    this.cachedConfig = null;
    this.configPath = null;
  }

  getConfigPath(): string | null {
    return this.configPath;
  }

  async configFileExists(): Promise<boolean> {
    if (!this.configPath) return false;
    return await fileExists(this.configPath);
  }

  async readConfigFile(): Promise<LLMConfigFile | null> {
    if (!this.configPath) return null;

    try {
      const exists = await fileExists(this.configPath);
      if (!exists) return null;

      const content = await readFile(this.configPath);
      const config = JSON.parse(content) as LLMConfigFile;
      return config;
    } catch (error) {
      console.error(`Failed to read LLM config file: ${error}`);
      return null;
    }
  }

  async getLLMConfigFromFile(): Promise<LLMConfiguration | null> {
    if (this.cachedConfig !== null) {
      return this.cachedConfig as LLMConfiguration;
    }

    const fileConfig = await this.readConfigFile();
    if (!fileConfig) {
      return null;
    }

    const llmConfig: LLMConfiguration = {
      provider: fileConfig.provider || 'openai',
      model: fileConfig.model,
      baseUrl: fileConfig.baseUrl,
      temperature: fileConfig.temperature,
      maxTokens: fileConfig.maxTokens || 4096,
      timeout: fileConfig.timeout || 60000,
      retryAttempts: fileConfig.retryAttempts || 3,
      streamResponses: fileConfig.streamResponses || false
    };

    this.cachedConfig = fileConfig;
    return llmConfig;
  }

  async getApiKeyFromFile(): Promise<string | null> {
    const fileConfig = await this.readConfigFile();
    return fileConfig?.apiKey || null;
  }

  async getProviderFromFile(): Promise<LLMProviderType | null> {
    const fileConfig = await this.readConfigFile();
    return fileConfig?.provider || null;
  }
}

export const configFileManager = ConfigFileManager.getInstance();
