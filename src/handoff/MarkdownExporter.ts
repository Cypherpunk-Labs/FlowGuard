import { ArtifactStorage } from '../core/storage/ArtifactStorage';
import { CodebaseExplorer } from '../planning/codebase/CodebaseExplorer';
import { ReferenceResolver } from '../core/references/ReferenceResolver';
import { EpicMetadataManager } from '../core/storage/EpicMetadataManager';
import { TemplateEngine } from './TemplateEngine';
import { AgentTemplates } from './AgentTemplates';
import {
  HandoffInput,
  HandoffOutput,
  HandoffMetadata,
  TemplateVariables,
  SpecTemplateData,
  TicketTemplateData,
  CodebaseFileData,
  AgentTemplate
} from './types';
import { Spec } from '../core/models/Spec';
import { Ticket } from '../core/models/Ticket';
import { CodebaseContext } from '../planning/codebase/types';

export class MarkdownExporter {
  private storage: ArtifactStorage;
  private codebaseExplorer: CodebaseExplorer;
  private referenceResolver: ReferenceResolver;
  private epicMetadataManager: EpicMetadataManager;
  private templateEngine: TemplateEngine;
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
    this.templateEngine = new TemplateEngine();
    this.workspaceRoot = workspaceRoot;
  }

  async exportHandoff(input: HandoffInput): Promise<HandoffOutput> {
    const { specs, tickets } = await this.loadArtifacts(input.specIds, input.ticketIds);
    
    let codebaseContext: CodebaseContext | undefined;
    if (input.includeCodebaseContext) {
      codebaseContext = await this.codebaseExplorer.explore();
    }

    let epicTitle = 'Untitled Epic';
    try {
      const epicMetadata = await this.epicMetadataManager.loadEpicMetadata();
      epicTitle = epicMetadata.title;
    } catch (error) {
      console.warn('Failed to load epic metadata:', error);
    }
    
    const templateVariables = this.buildTemplateVariables(
      epicTitle,
      input.epicId,
      specs,
      tickets,
      codebaseContext
    );

    const agentTemplate = AgentTemplates.getTemplate(input.agentType, this.workspaceRoot);
    
    // Apply preprocessor hook if available
    let processedVariables = templateVariables;
    if (agentTemplate.preprocessor) {
      processedVariables = await agentTemplate.preprocessor(templateVariables);
    }
    
    const template = input.customTemplate || agentTemplate.template;
    let markdown = this.templateEngine.render(template, processedVariables);
    
    // Apply postprocessor hook if available
    if (agentTemplate.postprocessor) {
      markdown = await agentTemplate.postprocessor(markdown);
    }
    
    const resolvedMarkdown = await this.resolveReferences(markdown);
    const metadata = this.calculateMetadata(resolvedMarkdown, specs, tickets);

    return {
      markdown: resolvedMarkdown,
      executionId: '', // Will be set by ExecutionTracker
      metadata,
    };
  }

  private async loadArtifacts(
    specIds: string[],
    ticketIds: string[]
  ): Promise<{ specs: Spec[]; tickets: Ticket[] }> {
    const specs: Spec[] = [];
    const tickets: Ticket[] = [];

    for (const specId of specIds) {
      try {
        const spec = await this.storage.loadSpec(specId);
        specs.push(spec);
      } catch (error) {
        console.warn(`Failed to load spec ${specId}:`, error);
      }
    }

    for (const ticketId of ticketIds) {
      try {
        const ticket = await this.storage.loadTicket(ticketId);
        tickets.push(ticket);
      } catch (error) {
        console.warn(`Failed to load ticket ${ticketId}:`, error);
      }
    }

    return { specs, tickets };
  }

  private buildTemplateVariables(
    epicTitle: string,
    epicId: string,
    specs: Spec[],
    tickets: Ticket[],
    codebaseContext?: CodebaseContext
  ): TemplateVariables {
    const now = new Date();
    
    const specData: SpecTemplateData[] = specs.map(spec => ({
      id: spec.id,
      title: spec.title,
      content: spec.content,
      status: spec.status,
    }));

    const ticketData: TicketTemplateData[] = tickets.map(ticket => ({
      id: ticket.id,
      title: ticket.title,
      content: ticket.content,
      priority: ticket.priority,
      estimatedEffort: ticket.estimatedEffort || 'Not specified',
      status: ticket.status,
    }));

    return {
      epicTitle,
      epicId,
      timestamp: now.toISOString(),
      author: '', // Will be filled in by caller
      specs: specData,
      tickets: ticketData,
      codebaseContext: codebaseContext ? this.formatCodebaseContext(codebaseContext) : '',
      totalFiles: codebaseContext?.statistics?.totalFiles || 0,
      totalLines: codebaseContext?.statistics?.totalLines || 0,
      languages: codebaseContext?.statistics?.languageBreakdown 
        ? Object.keys(codebaseContext.statistics.languageBreakdown).join(', ')
        : '',
      codebaseFiles: codebaseContext?.files?.map(f => ({
        path: f.path,
        language: f.language,
        loc: f.loc,
      })) || [],
    };
  }

  private formatCodebaseContext(context: CodebaseContext): string {
    const lines: string[] = [];

    // Statistics
    if (context.statistics) {
      lines.push('### Statistics');
      lines.push(`- Total Files: ${context.statistics.totalFiles}`);
      lines.push(`- Total Lines of Code: ${context.statistics.totalLines}`);
      
      if (context.statistics.languageBreakdown) {
        const languages = Object.entries(context.statistics.languageBreakdown)
          .map(([lang, count]) => `${lang} (${count} lines)`)
          .join(', ');
        lines.push(`- Languages: ${languages}`);
      }
      lines.push('');
    }

    // Key Symbols
    if (context.symbols && context.symbols.length > 0) {
      lines.push('### Key Symbols');
      const keySymbols = context.symbols.slice(0, 20); // Limit to first 20
      for (const symbol of keySymbols) {
        const visibility = symbol.visibility ? `[${symbol.visibility}] ` : '';
        lines.push(`- ${visibility}${symbol.name} (${symbol.kind}) - ${symbol.filePath}:${symbol.line}`);
      }
      lines.push('');
    }

    // Dependency Summary
    if (context.dependencies) {
      lines.push('### Dependencies');
      const entries = Object.entries(context.dependencies);
      if (entries.length > 0) {
        lines.push(`- ${entries.length} dependency relationships found`);
        const circularDeps = entries.filter(([_, deps]) => deps.circular);
        if (circularDeps.length > 0) {
          lines.push(`- Warning: ${circularDeps.length} circular dependencies detected`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private async resolveReferences(content: string): Promise<string> {
    const REFERENCE_REGEX = /(spec|ticket|file):([a-f0-9-]{36,})(?:#([^\s\]]+))?/gi;
    
    let result = content;
    let match: RegExpExecArray | null;
    
    while ((match = REFERENCE_REGEX.exec(content)) !== null) {
      const [fullMatch, type, id, fragment] = match;
      
      try {
        const ref = this.referenceResolver.parseReference(`${type}:${id}${fragment ? `#${fragment}` : ''}`);
        if (!ref) {
          continue;
        }
        
        const resolved = await this.referenceResolver.resolveReference(ref);
        if (resolved && resolved.exists) {
          const replacement = `[${resolved.title || resolved.id}](${fullMatch})`;
          result = result.replace(fullMatch, replacement);
        }
      } catch (error) {
        console.warn(`Failed to resolve reference ${fullMatch}:`, error);
      }
    }

    return result;
  }

  private calculateMetadata(
    markdown: string,
    specs: Spec[],
    tickets: Ticket[]
  ): HandoffMetadata {
    const wordCount = markdown.split(/\s+/).filter(w => w.length > 0).length;
    const estimatedReadingTime = Math.ceil(wordCount / 200);
    const totalEstimatedEffort = tickets.reduce((sum, t) => {
      const effort = parseFloat(t.estimatedEffort || '0');
      return sum + (isNaN(effort) ? 0 : effort);
    }, 0);

    return {
      wordCount,
      estimatedReadingTime,
      specCount: specs.length,
      ticketCount: tickets.length,
      totalEstimatedEffort,
      generatedAt: new Date(),
    };
  }
}
