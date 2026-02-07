import * as vscode from 'vscode';
import {
  FlowGuardConfiguration,
  LLMConfiguration,
  TemplateConfiguration,
  EditorConfiguration,
  CodebaseConfiguration,
  VerificationConfiguration,
  TelemetryConfiguration,
  GeneralConfiguration,
  ConfigurationChangeListener,
  ConfigurationChangeEvent,
  ValidationResult,
  LLMProviderType,
  AgentType,
  SeverityLevel,
  LogLevel
} from './types';
import { validateNumberRange, validateEnum, validateStringArray, validateGlobPatterns, validatePath } from './validators';

interface ConfigurationChangeDetails {
  section: string;
  keys: string[];
  oldValue: FlowGuardConfiguration;
  newValue?: FlowGuardConfiguration;
}

class ConfigurationManager {
  private static instance: ConfigurationManager | null = null;
  private cache: Map<string, any> = new Map();
  private listeners: Map<string, Set<ConfigurationChangeListener>> = new Map();
  private disposables: vscode.Disposable[] = [];
  private context: vscode.ExtensionContext | null = null;
  private beforeChangeEvent: vscode.EventEmitter<ConfigurationChangeDetails> | null = null;
  private lastKnownConfig: FlowGuardConfiguration | null = null;

  private constructor() {}

  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  initialize(context: vscode.ExtensionContext): void {
    this.context = context;
    this.beforeChangeEvent = new vscode.EventEmitter<ConfigurationChangeDetails>();
    
    const changeSubscription = vscode.workspace.onDidChangeConfiguration((event) => {
      this.handleConfigurationChange(event);
    });
    this.disposables.push(changeSubscription);
    this.invalidateCache();
  }

  get onBeforeChange(): vscode.Event<ConfigurationChangeDetails> {
    if (this.beforeChangeEvent) {
      return this.beforeChangeEvent.event;
    }
    return (() => { }) as unknown as vscode.Event<ConfigurationChangeDetails>;
  }

  dispose(): void {
    this.beforeChangeEvent?.dispose();
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.cache.clear();
    this.listeners.clear();
  }

  private handleConfigurationChange(event: vscode.ConfigurationChangeEvent): void {
    const allSections = ['llm', 'templates', 'editor', 'codebase', 'verification', 'telemetry', 'general'];
    const allKeys: Record<string, string[]> = {
      llm: ['provider', 'model', 'baseUrl', 'temperature', 'maxTokens', 'timeout', 'retryAttempts', 'streamResponses'],
      templates: ['defaultAgent', 'customPath', 'includeCodebaseContext', 'maxCodebaseFiles'],
      editor: ['autoSave', 'autoSaveDelay', 'enableDiagramPreview'],
      codebase: ['maxFilesToScan', 'excludePatterns', 'includePatterns', 'enableIncrementalScan'],
      verification: ['autoVerifyOnSave', 'minimumSeverity', 'enableAutoFix'],
      telemetry: ['enabled', 'includeErrorReports'],
      general: ['logLevel', 'showWelcomeOnStartup']
    };

    const changedDetails: ConfigurationChangeDetails[] = [];

    for (const section of allSections) {
      const keys = allKeys[section] || [];
      const changedKeys: string[] = [];

      for (const key of keys) {
        if (event.affectsConfiguration(`flowguard.${section}.${key}`)) {
          changedKeys.push(key);
        }
      }

      if (changedKeys.length > 0) {
        this.invalidateCacheForSection(section);
        
        const oldConfig = this.lastKnownConfig || this.getAll();
        const newConfig = this.getAll();
        this.lastKnownConfig = newConfig;

        changedDetails.push({
          section,
          keys: changedKeys,
          oldValue: oldConfig,
          newValue: newConfig
        });
      }
    }

    changedDetails.forEach(detail => {
      this.notifyListeners(detail.section, detail);
    });
  }

  private invalidateCache(): void {
    this.cache.clear();
  }

  private invalidateCacheForSection(section: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(section)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private notifyListeners(section: string, detail: ConfigurationChangeDetails): void {
    const sectionListeners = this.listeners.get(section);
    if (sectionListeners) {
      sectionListeners.forEach(listener => {
        try {
          listener({
            section: detail.section,
            key: detail.keys.join(','),
            oldValue: detail.oldValue,
            newValue: detail.newValue
          });
        } catch (error) {
          console.error(`Error in configuration listener for ${section}:`, error);
        }
      });
    }

    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach(listener => {
        try {
          listener({
            section: detail.section,
            key: detail.keys.join(','),
            oldValue: detail.oldValue,
            newValue: detail.newValue
          });
        } catch (error) {
          console.error('Error in wildcard configuration listener:', error);
        }
      });
    }
  }

  onDidChangeConfiguration(listener: ConfigurationChangeListener, section?: string): vscode.Disposable {
    const sectionKey = section || '*';
    if (!this.listeners.has(sectionKey)) {
      this.listeners.set(sectionKey, new Set());
    }
    this.listeners.get(sectionKey)!.add(listener);

    return {
      dispose: () => {
        const sectionListeners = this.listeners.get(sectionKey);
        if (sectionListeners) {
          sectionListeners.delete(listener);
          if (sectionListeners.size === 0) {
            this.listeners.delete(sectionKey);
          }
        }
      }
    };
  }

  private getFromVSCode<T>(section: string, key: string, defaultValue: T): T {
    try {
      const config = vscode.workspace.getConfiguration(section);
      const value = config.get<T>(key);
      return value !== undefined ? value : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private getOptionalFromVSCode<T>(section: string, key: string): T | undefined {
    try {
      const config = vscode.workspace.getConfiguration(section);
      return config.get<T>(key);
    } catch {
      return undefined;
    }
  }

  private async setInVSCode<T>(section: string, key: string, value: T): Promise<void> {
    try {
      const fullSection = `flowguard.${section}`;
      const oldConfig = this.getAll();
      
      if (this.beforeChangeEvent) {
        this.beforeChangeEvent.fire({
          section: fullSection,
          keys: [key],
          oldValue: oldConfig
        });
      }

      const config = vscode.workspace.getConfiguration(fullSection);
      await config.update(key, value, vscode.ConfigurationTarget.Workspace);
    } catch (error) {
      throw new Error(`Failed to set configuration ${section}.${key}: ${error}`);
    }
  }

  private getCacheKey(section: string, key: string): string {
    return `${section}.${key}`;
  }

  get<T>(section: string, key: string): T | undefined {
    const cacheKey = this.getCacheKey(section, key);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    let value: T | undefined;
    switch (section) {
      case 'llm':
        value = this.getLLMValue(key) as T;
        break;
      case 'templates':
        value = this.getTemplatesValue(key) as T;
        break;
      case 'editor':
        value = this.getEditorValue(key) as T;
        break;
      case 'codebase':
        value = this.getCodebaseValue(key) as T;
        break;
      case 'verification':
        value = this.getVerificationValue(key) as T;
        break;
      case 'telemetry':
        value = this.getTelemetryValue(key) as T;
        break;
      case 'general':
        value = this.getGeneralValue(key) as T;
        break;
      default:
        value = this.getOptionalFromVSCode<T>(`flowguard.${section}`, key);
    }
    
    if (value !== undefined) {
      this.cache.set(cacheKey, value);
    }
    return value;
  }

  private getLLMValue(key: string): any {
    switch (key) {
      case 'provider':
        return this.getResolvedProvider();
      case 'model':
        return this.getOptionalFromVSCode<string>('flowguard.llm', 'model') || this.getDefaultModel(this.getResolvedProvider());
      case 'baseUrl':
        return this.getOptionalFromVSCode<string>('flowguard.llm', 'baseUrl');
      case 'temperature':
        return this.getFromVSCode<number>('flowguard.llm', 'temperature', 0.7);
      case 'maxTokens':
        return this.getFromVSCode<number>('flowguard.llm', 'maxTokens', 4096);
      case 'timeout':
        return this.getFromVSCode<number>('flowguard.llm', 'timeout', 60000);
      case 'retryAttempts':
        return this.getFromVSCode<number>('flowguard.llm', 'retryAttempts', 3);
      case 'streamResponses':
        return this.getFromVSCode<boolean>('flowguard.llm', 'streamResponses', false);
      default:
        return undefined;
    }
  }

  private getTemplatesValue(key: string): any {
    switch (key) {
      case 'defaultAgent':
        return this.getFromVSCode<AgentType>('flowguard.templates', 'defaultAgent', 'cursor');
      case 'customPath':
        return this.getOptionalFromVSCode<string>('flowguard.templates', 'customPath');
      case 'includeCodebaseContext':
        return this.getFromVSCode<boolean>('flowguard.templates', 'includeCodebaseContext', true);
      case 'maxCodebaseFiles':
        return this.getFromVSCode<number>('flowguard.templates', 'maxCodebaseFiles', 50);
      default:
        return undefined;
    }
  }

  private getEditorValue(key: string): any {
    switch (key) {
      case 'autoSave':
        return this.getFromVSCode<boolean>('flowguard.editor', 'autoSave', true);
      case 'autoSaveDelay':
        return this.getFromVSCode<number>('flowguard.editor', 'autoSaveDelay', 30000);
      case 'enableDiagramPreview':
        return this.getFromVSCode<boolean>('flowguard.editor', 'enableDiagramPreview', true);
      default:
        return undefined;
    }
  }

  private getCodebaseValue(key: string): any {
    switch (key) {
      case 'maxFilesToScan':
        return this.getFromVSCode<number>('flowguard.codebase', 'maxFilesToScan', 1000);
      case 'excludePatterns':
        return this.getFromVSCode<string[]>('flowguard.codebase', 'excludePatterns', ['node_modules', 'dist', 'build', '.git', '.flowguard']);
      case 'includePatterns':
        return this.getFromVSCode<string[]>('flowguard.codebase', 'includePatterns', ['**/*.ts', '**/*.js', '**/*.py', '**/*.java', '**/*.go', '**/*.rs']);
      case 'enableIncrementalScan':
        return this.getFromVSCode<boolean>('flowguard.codebase', 'enableIncrementalScan', true);
      default:
        return undefined;
    }
  }

  private getVerificationValue(key: string): any {
    switch (key) {
      case 'autoVerifyOnSave':
        return this.getFromVSCode<boolean>('flowguard.verification', 'autoVerifyOnSave', false);
      case 'minimumSeverity':
        return this.getFromVSCode<SeverityLevel>('flowguard.verification', 'minimumSeverity', 'Medium');
      case 'enableAutoFix':
        return this.getFromVSCode<boolean>('flowguard.verification', 'enableAutoFix', false);
      default:
        return undefined;
    }
  }

  private getTelemetryValue(key: string): any {
    switch (key) {
      case 'enabled':
        return this.getFromVSCode<boolean>('flowguard.telemetry', 'enabled', false);
      case 'includeErrorReports':
        return this.getFromVSCode<boolean>('flowguard.telemetry', 'includeErrorReports', false);
      default:
        return undefined;
    }
  }

  private getGeneralValue(key: string): any {
    switch (key) {
      case 'logLevel':
        return this.getFromVSCode<LogLevel>('flowguard.general', 'logLevel', 'INFO');
      case 'showWelcomeOnStartup':
        return this.getFromVSCode<boolean>('flowguard.general', 'showWelcomeOnStartup', true);
      default:
        return undefined;
    }
  }

  private getProviderFromSettings(): LLMProviderType | undefined {
    try {
      const config = vscode.workspace.getConfiguration('flowguard.llm');
      const provider: string | undefined = config.get('provider');
      if (provider && ['openai', 'anthropic', 'local'].includes(provider)) {
        return provider as LLMProviderType;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  private getProviderFromEnv(): LLMProviderType | undefined {
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

  getResolvedProvider(): LLMProviderType {
    return this.getProviderFromSettings() || this.getProviderFromEnv() || 'openai';
  }

  private getDefaultModel(provider: LLMProviderType | undefined): string {
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

  async set<T>(section: string, key: string, value: T): Promise<void> {
    await this.setInVSCode(`flowguard.${section}`, key, value);
    this.invalidateCacheForSection(section);
  }

  getLLMConfig(): LLMConfiguration {
    return {
      provider: this.get('llm', 'provider') || 'openai',
      model: this.get('llm', 'model'),
      baseUrl: this.get('llm', 'baseUrl'),
      temperature: this.get('llm', 'temperature'),
      maxTokens: this.get('llm', 'maxTokens') || 4096,
      timeout: this.get('llm', 'timeout') || 60000,
      retryAttempts: this.get('llm', 'retryAttempts') || 3,
      streamResponses: this.get('llm', 'streamResponses') || false
    };
  }

  getTemplateConfig(): TemplateConfiguration {
    return {
      defaultAgent: this.get('templates', 'defaultAgent') || 'cursor',
      customPath: this.get('templates', 'customPath'),
      includeCodebaseContext: this.get('templates', 'includeCodebaseContext') ?? true,
      maxCodebaseFiles: this.get('templates', 'maxCodebaseFiles') || 50
    };
  }

  getEditorConfig(): EditorConfiguration {
    return {
      autoSave: this.get('editor', 'autoSave') ?? true,
      autoSaveDelay: this.get('editor', 'autoSaveDelay') || 30000,
      enableDiagramPreview: this.get('editor', 'enableDiagramPreview') ?? true
    };
  }

  getCodebaseConfig(): CodebaseConfiguration {
    return {
      maxFilesToScan: this.get('codebase', 'maxFilesToScan') || 1000,
      excludePatterns: this.get('codebase', 'excludePatterns') || ['node_modules', 'dist', 'build', '.git', '.flowguard'],
      includePatterns: this.get('codebase', 'includePatterns') || ['**/*.ts', '**/*.js', '**/*.py', '**/*.java', '**/*.go', '**/*.rs'],
      enableIncrementalScan: this.get('codebase', 'enableIncrementalScan') ?? true
    };
  }

  getVerificationConfig(): VerificationConfiguration {
    return {
      autoVerifyOnSave: this.get('verification', 'autoVerifyOnSave') ?? false,
      minimumSeverity: this.get('verification', 'minimumSeverity') || 'Medium',
      enableAutoFix: this.get('verification', 'enableAutoFix') ?? false
    };
  }

  getTelemetryConfig(): TelemetryConfiguration {
    return {
      enabled: this.get('telemetry', 'enabled') ?? false,
      includeErrorReports: this.get('telemetry', 'includeErrorReports') ?? false
    };
  }

  getGeneralConfig(): GeneralConfiguration {
    return {
      logLevel: this.get('general', 'logLevel') || 'INFO',
      showWelcomeOnStartup: this.get('general', 'showWelcomeOnStartup') ?? true
    };
  }

  getAll(): FlowGuardConfiguration {
    return {
      llm: this.getLLMConfig(),
      templates: this.getTemplateConfig(),
      editor: this.getEditorConfig(),
      codebase: this.getCodebaseConfig(),
      verification: this.getVerificationConfig(),
      telemetry: this.getTelemetryConfig(),
      general: this.getGeneralConfig()
    };
  }

  async reset(section?: string): Promise<void> {
    if (section) {
      this.invalidateCacheForSection(section);
    } else {
      this.invalidateCache();
    }
  }

  validate(config: Partial<FlowGuardConfiguration>): ValidationResult {
    const errors: string[] = [];

    if (config.llm) {
      if (config.llm.maxTokens !== undefined && !validateNumberRange(config.llm.maxTokens, 100, 128000)) {
        errors.push('llm.maxTokens must be between 100 and 128000');
      }
      if (config.llm.timeout !== undefined && !validateNumberRange(config.llm.timeout, 5000, 300000)) {
        errors.push('llm.timeout must be between 5000 and 300000 milliseconds');
      }
      if (config.llm.retryAttempts !== undefined && !validateNumberRange(config.llm.retryAttempts, 0, 10)) {
        errors.push('llm.retryAttempts must be between 0 and 10');
      }
    }

    if (config.templates) {
      if (config.templates.maxCodebaseFiles !== undefined && !validateNumberRange(config.templates.maxCodebaseFiles, 10, 500)) {
        errors.push('templates.maxCodebaseFiles must be between 10 and 500');
      }
      if (config.templates.customPath && !validatePath(config.templates.customPath, false)) {
        errors.push('templates.customPath must be a valid path');
      }
    }

    if (config.editor) {
      if (config.editor.autoSaveDelay !== undefined && !validateNumberRange(config.editor.autoSaveDelay, 1000, 300000)) {
        errors.push('editor.autoSaveDelay must be between 1000 and 300000 milliseconds');
      }
    }

    if (config.codebase) {
      if (config.codebase.maxFilesToScan !== undefined && !validateNumberRange(config.codebase.maxFilesToScan, 100, 10000)) {
        errors.push('codebase.maxFilesToScan must be between 100 and 10000');
      }
      if (config.codebase.excludePatterns && !validateStringArray(config.codebase.excludePatterns)) {
        errors.push('codebase.excludePatterns must be an array of strings');
      }
      if (config.codebase.includePatterns && !validateGlobPatterns(config.codebase.includePatterns)) {
        errors.push('codebase.includePatterns must be valid glob patterns');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateValue(section: string, key: string, value: any): boolean {
    switch (section) {
      case 'llm':
        return this.validateLLMValue(key, value);
      case 'templates':
        return this.validateTemplatesValue(key, value);
      case 'editor':
        return this.validateEditorValue(key, value);
      case 'codebase':
        return this.validateCodebaseValue(key, value);
      case 'verification':
        return this.validateVerificationValue(key, value);
      case 'telemetry':
        return this.validateTelemetryValue(key, value);
      case 'general':
        return this.validateGeneralValue(key, value);
      default:
        return true;
    }
  }

  private validateLLMValue(key: string, value: any): boolean {
    switch (key) {
      case 'provider':
        return validateEnum(value, ['openai', 'anthropic', 'local']);
      case 'maxTokens':
        return validateNumberRange(value, 100, 128000);
      case 'timeout':
        return validateNumberRange(value, 5000, 300000);
      case 'retryAttempts':
        return validateNumberRange(value, 0, 10);
      case 'temperature':
        return validateNumberRange(value, 0, 2);
      default:
        return true;
    }
  }

  private validateTemplatesValue(key: string, value: any): boolean {
    switch (key) {
      case 'defaultAgent':
        return validateEnum(value, ['cursor', 'claude', 'windsurf', 'cline', 'aider', 'custom']);
      case 'maxCodebaseFiles':
        return validateNumberRange(value, 10, 500);
      case 'customPath':
        return typeof value === 'string' && (value.length === 0 || validatePath(value, false));
      default:
        return true;
    }
  }

  private validateEditorValue(key: string, value: any): boolean {
    switch (key) {
      case 'autoSaveDelay':
        return validateNumberRange(value, 1000, 300000);
      default:
        return typeof value === 'boolean' || typeof value === 'number';
    }
  }

  private validateCodebaseValue(key: string, value: any): boolean {
    switch (key) {
      case 'maxFilesToScan':
        return validateNumberRange(value, 100, 10000);
      case 'excludePatterns':
        return validateStringArray(value);
      case 'includePatterns':
        return validateGlobPatterns(value);
      default:
        return true;
    }
  }

  private validateVerificationValue(key: string, value: any): boolean {
    switch (key) {
      case 'minimumSeverity':
        return validateEnum(value, ['Critical', 'High', 'Medium', 'Low']);
      default:
        return typeof value === 'boolean';
    }
  }

  private validateTelemetryValue(key: string, value: any): boolean {
    return typeof value === 'boolean';
  }

  private validateGeneralValue(key: string, value: any): boolean {
    switch (key) {
      case 'logLevel':
        return validateEnum(value, ['DEBUG', 'INFO', 'WARN', 'ERROR']);
      default:
        return typeof value === 'boolean';
    }
  }
}

export const configurationManager = ConfigurationManager.getInstance();
