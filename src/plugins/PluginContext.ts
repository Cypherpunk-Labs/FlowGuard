import { ArtifactStorage } from '../core/storage/ArtifactStorage';
import { LLMProvider } from '../llm/types';
import { CodebaseExplorer } from '../planning/codebase/CodebaseExplorer';
import {
  PluginContext,
  PluginLogger,
  VerificationRule,
  AgentIntegration,
  DiagramType,
  TemplateContribution,
} from './types';
import { PluginManager } from './PluginManager';
import { log, debug, warn, error } from '../utils/logger';

/**
 * Implementation of PluginContext that provides access to core services
 */
export class PluginContextImpl implements PluginContext {
  storage: ArtifactStorage;
  llmProvider: LLMProvider;
  codebaseExplorer: CodebaseExplorer;
  workspaceRoot: string;
  extensionPath: string;
  logger: PluginLogger;
  
  private pluginId: string;
  private pluginManager: PluginManager;

  constructor(
    pluginId: string,
    storage: ArtifactStorage,
    llmProvider: LLMProvider,
    codebaseExplorer: CodebaseExplorer,
    workspaceRoot: string,
    extensionPath: string,
    pluginManager: PluginManager
  ) {
    this.pluginId = pluginId;
    this.storage = storage;
    this.llmProvider = llmProvider;
    this.codebaseExplorer = codebaseExplorer;
    this.workspaceRoot = workspaceRoot;
    this.extensionPath = extensionPath;
    this.pluginManager = pluginManager;

    // Create plugin-specific logger
    this.logger = {
      debug: (message: string, ..._args: any[]) => {
        debug(`[${pluginId}] ${message}`);
      },
      info: (message: string, ..._args: any[]) => {
        log(`[${pluginId}] ${message}`, 'INFO');
      },
      warn: (message: string, ..._args: any[]) => {
        warn(`[${pluginId}] ${message}`);
      },
      error: (message: string, ..._args: any[]) => {
        error(`[${pluginId}] ${message}`);
      },
    };
  }

  /**
   * Register a custom verification rule
   */
  registerVerificationRule(rule: VerificationRule): void {
    // Validate rule interface
    this.validateVerificationRule(rule);

    // Check for duplicate IDs
    const existingRule = this.pluginManager.getVerificationRule(rule.id);
    if (existingRule) {
      throw new Error(`Verification rule ${rule.id} is already registered`);
    }

    // Register with plugin manager
    this.pluginManager.registerVerificationRule(rule, this.pluginId);
    
    this.logger.info(`Registered verification rule: ${rule.id}`);
  }

  /**
   * Register an agent integration
   */
  registerAgentIntegration(integration: AgentIntegration): void {
    // Validate integration interface
    this.validateAgentIntegration(integration);

    // Check for duplicate IDs
    const existingIntegration = this.pluginManager.getAgentIntegration(integration.id);
    if (existingIntegration) {
      throw new Error(`Agent integration ${integration.id} is already registered`);
    }

    // Register with plugin manager
    this.pluginManager.registerAgentIntegration(integration, this.pluginId);
    
    this.logger.info(`Registered agent integration: ${integration.id}`);
  }

  /**
   * Register a custom diagram type
   */
  registerDiagramType(type: DiagramType): void {
    // Validate diagram type interface
    this.validateDiagramType(type);

    // Check for duplicate IDs
    const existingType = this.pluginManager.getDiagramTypes().find(t => t.id === type.id);
    if (existingType) {
      throw new Error(`Diagram type ${type.id} is already registered`);
    }

    // Register with plugin manager
    this.pluginManager.registerDiagramType(type, this.pluginId);
    
    this.logger.info(`Registered diagram type: ${type.id}`);
  }

  /**
   * Register a custom template
   */
  registerTemplate(template: TemplateContribution): void {
    // Validate template structure
    this.validateTemplate(template);

    // Check for duplicate IDs
    const existingTemplate = this.pluginManager.getTemplates().find(t => t.id === template.id);
    if (existingTemplate) {
      throw new Error(`Template ${template.id} is already registered`);
    }

    // Register with plugin manager
    this.pluginManager.registerTemplate(template, this.pluginId);
    
    this.logger.info(`Registered template: ${template.id}`);
  }

  /**
   * Validate verification rule interface
   */
  private validateVerificationRule(rule: VerificationRule): void {
    const requiredFields = ['id', 'name', 'category', 'severity', 'enabled'];
    const requiredMethods = ['validate'];

    for (const field of requiredFields) {
      if (!(field in rule)) {
        throw new Error(`Verification rule missing required field: ${field}`);
      }
    }

    for (const method of requiredMethods) {
      if (typeof (rule as any)[method] !== 'function') {
        throw new Error(`Verification rule missing required method: ${method}`);
      }
    }
  }

  /**
   * Validate agent integration interface
   */
  private validateAgentIntegration(integration: AgentIntegration): void {
    const requiredFields = ['id', 'name', 'agentType', 'template'];

    for (const field of requiredFields) {
      if (!(field in integration)) {
        throw new Error(`Agent integration missing required field: ${field}`);
      }
    }
  }

  /**
   * Validate diagram type interface
   */
  private validateDiagramType(type: DiagramType): void {
    const requiredFields = ['id', 'name', 'fileExtension'];
    const requiredMethods = ['generate'];

    for (const field of requiredFields) {
      if (!(field in type)) {
        throw new Error(`Diagram type missing required field: ${field}`);
      }
    }

    for (const method of requiredMethods) {
      if (typeof (type as any)[method] !== 'function') {
        throw new Error(`Diagram type missing required method: ${method}`);
      }
    }
  }

  /**
   * Validate template structure
   */
  private validateTemplate(template: TemplateContribution): void {
    const requiredFields = ['id', 'name', 'type', 'template', 'variables'];

    for (const field of requiredFields) {
      if (!(field in template)) {
        throw new Error(`Template contribution missing required field: ${field}`);
      }
    }

    const validTypes = ['spec', 'ticket', 'handoff', 'verification'];
    if (!validTypes.includes(template.type)) {
      throw new Error(`Invalid template type: ${template.type}. Must be one of: ${validTypes.join(', ')}`);
    }
  }
}
