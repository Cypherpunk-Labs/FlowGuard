import * as vscode from 'vscode';
import { ArtifactStorage } from '../core/storage/ArtifactStorage';
import { CodebaseExplorer } from '../planning/codebase/CodebaseExplorer';
import { ReferenceResolver } from '../core/references/ReferenceResolver';
import { EpicMetadataManager } from '../core/storage/EpicMetadataManager';
import { MarkdownExporter } from './MarkdownExporter';
import { ExecutionTracker } from './ExecutionTracker';
import { AgentTemplates } from './AgentTemplates';
import { TemplateEngine } from './TemplateEngine';
import {
  HandoffInput,
  HandoffOutput,
  HandoffMetadata,
  Execution,
  AgentType,
} from './types';

export interface HandoffResult {
  markdown: string;
  execution: Execution;
  metadata: HandoffMetadata;
}

export class HandoffGenerator {
  private storage: ArtifactStorage;
  private codebaseExplorer: CodebaseExplorer;
  private referenceResolver: ReferenceResolver;
  private epicMetadataManager: EpicMetadataManager;
  private markdownExporter: MarkdownExporter;
  private executionTracker: ExecutionTracker;
  private workspaceRoot: string;

  constructor(
    storage: ArtifactStorage,
    codebaseExplorer: CodebaseExplorer,
    referenceResolver: ReferenceResolver,
    epicMetadataManager: EpicMetadataManager,
    workspaceRoot: string
  ) {
    this.storage = storage;
    this.codebaseExplorer = codebaseExplorer;
    this.referenceResolver = referenceResolver;
    this.epicMetadataManager = epicMetadataManager;
    this.workspaceRoot = workspaceRoot;
    
    this.markdownExporter = new MarkdownExporter(
      storage,
      codebaseExplorer,
      referenceResolver,
      epicMetadataManager,
      workspaceRoot
    );
    
    this.executionTracker = new ExecutionTracker(storage);
  }

  async generateHandoff(input: HandoffInput): Promise<HandoffResult> {
    // Validate input
    await this.validateInput(input);

    // Generate markdown
    const output = await this.markdownExporter.exportHandoff(input);

    // Create execution record
    const execution = await this.executionTracker.createExecution(input, output.markdown);

    // Update output with execution ID
    output.executionId = execution.id;

    return {
      markdown: output.markdown,
      execution,
      metadata: output.metadata,
    };
  }

  async copyToClipboard(markdown: string): Promise<void> {
    await vscode.env.clipboard.writeText(markdown);
    vscode.window.showInformationMessage('Handoff prompt copied to clipboard!');
  }

  async generatePreview(input: HandoffInput): Promise<string> {
    // Generate markdown without creating execution record
    const output = await this.markdownExporter.exportHandoff(input);
    return output.markdown;
  }

  getAvailableAgents(): AgentType[] {
    return ['cursor', 'claude', 'windsurf', 'cline', 'aider', 'custom'];
  }

  private async validateInput(input: HandoffInput): Promise<void> {
    // Validate specs exist
    for (const specId of input.specIds) {
      try {
        await this.storage.loadSpec(specId);
      } catch (error) {
        throw new Error(`Spec not found: ${specId}`);
      }
    }

    // Validate tickets exist
    for (const ticketId of input.ticketIds) {
      try {
        await this.storage.loadTicket(ticketId);
      } catch (error) {
        throw new Error(`Ticket not found: ${ticketId}`);
      }
    }

    // Validate agent type
    const availableAgents = this.getAvailableAgents();
    if (!availableAgents.includes(input.agentType)) {
      throw new Error(`Unknown agent type: ${input.agentType}`);
    }
  }
}

export { MarkdownExporter } from './MarkdownExporter';
export { AgentTemplates } from './AgentTemplates';
export { ExecutionTracker } from './ExecutionTracker';
export { TemplateEngine } from './TemplateEngine';
export * from './types';
