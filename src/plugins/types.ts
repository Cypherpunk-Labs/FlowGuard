import { ArtifactStorage } from '../core/storage/ArtifactStorage';
import { LLMProvider } from '../llm/types';
import { CodebaseExplorer } from '../planning/codebase/CodebaseExplorer';
import { Severity, IssueCategory, VerificationIssue, ChangedFile, FixSuggestion } from '../core/models/Verification';

/**
 * Core plugin interface that all FlowGuard plugins must implement
 */
export interface FlowGuardPlugin {
  /** Unique plugin identifier */
  id: string;
  /** Display name of the plugin */
  name: string;
  /** Semantic version of the plugin */
  version: string;
  /** Plugin description */
  description: string;
  /** Plugin author (optional) */
  author?: string;

  /**
   * Initialize the plugin
   * Called when the plugin is loaded
   */
  activate(context: PluginContext): Promise<void>;

  /**
   * Clean up resources
   * Called when the plugin is unloaded or the extension is deactivated
   */
  deactivate(): Promise<void>;
}

/**
 * Context provided to plugins during activation
 */
export interface PluginContext {
  /** Artifact storage for persisting data */
  storage: ArtifactStorage;

  /** LLM provider instance for AI operations */
  llmProvider: LLMProvider;

  /** Codebase explorer for analyzing code */
  codebaseExplorer: CodebaseExplorer;

  /** Workspace root path */
  workspaceRoot: string;

  /** Extension installation path */
  extensionPath: string;

  /**
   * Register a custom verification rule
   */
  registerVerificationRule(rule: VerificationRule): void;

  /**
   * Register an agent integration
   */
  registerAgentIntegration(integration: AgentIntegration): void;

  /**
   * Register a custom diagram type
   */
  registerDiagramType(type: DiagramType): void;

  /**
   * Register a custom template
   */
  registerTemplate(template: TemplateContribution): void;

  /** Logger interface for plugin logging */
  logger: PluginLogger;
}

/**
 * Logger interface for plugins
 */
export interface PluginLogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

/**
 * Verification rule interface for custom validation logic
 */
export interface VerificationRule {
  /** Unique rule identifier */
  id: string;
  /** Rule display name */
  name: string;
  /** Issue category */
  category: IssueCategory;
  /** Default severity level */
  severity: Severity;
  /** Whether the rule is enabled by default */
  enabled: boolean;

  /**
   * Validate the file changes
   * Returns a list of issues found
   */
  validate(context: ValidationContext): Promise<VerificationIssue[]>;

  /**
   * Optional auto-fix implementation
   * Returns the fixed code content
   */
  autoFix?(issue: VerificationIssue, context: ValidationContext): Promise<string>;
}

/**
 * Context provided to verification rules during validation
 */
export interface ValidationContext {
  /** Changed files from the diff */
  fileChanges: ChangedFile[];
  /** Relevant spec content */
  specContent: string;
  /** Full file content */
  fileContent: string;
  /** File path being validated */
  filePath: string;
  /** Workspace root path */
  workspaceRoot: string;
}

/**
 * Agent integration interface for custom handoff templates
 */
export interface AgentIntegration {
  /** Unique integration identifier */
  id: string;
  /** Agent name */
  name: string;
  /** Agent type identifier */
  agentType: string;
  /** Handoff template content */
  template: string;

  /**
   * Optional data transformation before template rendering
   */
  preprocessor?(data: TemplateVariables): Promise<TemplateVariables>;

  /**
   * Optional output transformation after template rendering
   */
  postprocessor?(markdown: string): Promise<string>;
}

/**
 * Variables available in agent templates
 */
export interface TemplateVariables {
  [key: string]: any;
}

/**
 * Diagram type interface for custom diagram generators
 */
export interface DiagramType {
  /** Unique diagram type identifier */
  id: string;
  /** Diagram type name */
  name: string;
  /** File extension (e.g., 'mmd', 'puml') */
  fileExtension: string;

  /**
   * Generate diagram content
   */
  generate(context: DiagramContext): Promise<string>;

  /**
   * Optional validation for generated diagrams
   */
  validate?(diagram: string): Promise<boolean>;
}

/**
 * Context provided to diagram generators
 */
export interface DiagramContext {
  /** Files to include in the diagram */
  files: string[];
  /** Additional context for diagram generation */
  context?: any;
}

/**
 * Template contribution interface
 */
export interface TemplateContribution {
  /** Unique template identifier */
  id: string;
  /** Template name */
  name: string;
  /** Template type */
  type: 'spec' | 'ticket' | 'handoff' | 'verification';
  /** Template content */
  template: string;
  /** Available variables in the template */
  variables: TemplateVariable[];
}

/**
 * Variable definition in a template
 */
export interface TemplateVariable {
  /** Variable name */
  name: string;
  /** Variable description */
  description: string;
  /** Whether the variable is required */
  required: boolean;
  /** Variable default value */
  defaultValue?: string;
}

/**
 * Plugin manifest interface for plugin.json
 */
export interface PluginManifest {
  /** Plugin identifier */
  id: string;
  /** Plugin name */
  name: string;
  /** Semantic version */
  version: string;
  /** Plugin description */
  description: string;
  /** Plugin author */
  author?: string;
  /** Entry point file path */
  main: string;
  /** Contribution declarations */
  contributes?: PluginContributions;
  /** NPM dependencies */
  dependencies?: Record<string, string>;
  /** FlowGuard version compatibility */
  engines?: {
    flowguard: string;
  };
}

/**
 * Plugin contribution declarations
 */
export interface PluginContributions {
  /** Verification rules provided by the plugin */
  verificationRules?: string[];
  /** Agent integrations provided by the plugin */
  agentIntegrations?: string[];
  /** Diagram types provided by the plugin */
  diagramTypes?: string[];
  /** Templates provided by the plugin */
  templates?: string[];
}

/**
 * Loaded plugin state
 */
export interface LoadedPlugin {
  /** Plugin manifest */
  manifest: PluginManifest;
  /** Plugin instance */
  instance: FlowGuardPlugin;
  /** Plugin status */
  status: PluginStatus;
  /** Plugin path */
  path: string;
  /** Load time */
  loadedAt: Date;
  /** Any error message if failed */
  error?: string;
}

/**
 * Plugin status
 */
export type PluginStatus = 'loading' | 'active' | 'inactive' | 'error';
