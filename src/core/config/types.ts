export type LLMProviderType = 'openai' | 'anthropic' | 'local' | 'openrouter' | 'opencode';

export type AgentType = 'cursor' | 'claude' | 'windsurf' | 'cline' | 'aider' | 'custom';

export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LLMConfiguration {
  provider: LLMProviderType;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens: number;
  timeout: number;
  retryAttempts: number;
  streamResponses: boolean;
}

export interface TemplateConfiguration {
  defaultAgent: AgentType;
  customPath?: string;
  includeCodebaseContext: boolean;
  maxCodebaseFiles: number;
}

export interface EditorConfiguration {
  autoSave: boolean;
  autoSaveDelay: number;
  enableDiagramPreview: boolean;
}

export interface CodebaseConfiguration {
  maxFilesToScan: number;
  excludePatterns: string[];
  includePatterns: string[];
  enableIncrementalScan: boolean;
}

export interface VerificationConfiguration {
  autoVerifyOnSave: boolean;
  minimumSeverity: SeverityLevel;
  enableAutoFix: boolean;
}

export interface TelemetryConfiguration {
  enabled: boolean;
  includeErrorReports: boolean;
}

export interface GeneralConfiguration {
  logLevel: LogLevel;
  showWelcomeOnStartup: boolean;
}

export interface FlowGuardConfiguration {
  llm: LLMConfiguration;
  templates: TemplateConfiguration;
  editor: EditorConfiguration;
  codebase: CodebaseConfiguration;
  verification: VerificationConfiguration;
  telemetry: TelemetryConfiguration;
  general: GeneralConfiguration;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ConfigurationChangeEvent {
  section: string;
  key: string;
  oldValue: any;
  newValue: any;
}

export interface ConfigurationChangeListener {
  (event: ConfigurationChangeEvent): void;
}
