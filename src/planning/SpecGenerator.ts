import { v4 as uuidv4 } from 'uuid';
import { LLMProvider, LLMMessage } from '../llm/types';
import { ClarificationEngine, ClarificationContext } from './ClarificationEngine';
import { CodebaseExplorer } from './codebase/CodebaseExplorer';
import { ArtifactStorage } from '../core/storage/ArtifactStorage';
import { Spec as CoreSpec, SpecStatus } from '../core/models/Spec';
import { DiagramExtractor, MermaidGenerator } from './diagrams';

export interface SpecGenerationInput {
  epicId: string;
  goal: string;
  clarifications?: ClarificationContext;
  tags?: string[];
  includeCodebaseContext?: boolean;
}

export interface Spec {
  id: string;
  epicId: string;
  title: string;
  status: SpecStatus;
  author: string;
  tags: string[];
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SpecSections {
  overview: string;
  architecture: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: Record<string, string>;
  technicalPlan: {
    filesToChange: Array<{ path: string; description: string }>;
    dependencies: Array<{ name: string; purpose: string }>;
    edgeCases: Array<{ case: string; handling: string }>;
  };
  testingStrategy: {
    unitTests: string;
    integrationTests: string;
    e2eTests: string;
  };
}

export class SpecGenerator {
  private provider: LLMProvider;
  private explorer: CodebaseExplorer;
  private clarificationEngine: ClarificationEngine;
  private diagramExtractor: DiagramExtractor;
  private mermaidGenerator: MermaidGenerator;
  private storage: ArtifactStorage | null = null;

  constructor(provider: LLMProvider, explorer: CodebaseExplorer, storage?: ArtifactStorage) {
    this.provider = provider;
    this.explorer = explorer;
    this.clarificationEngine = new ClarificationEngine(provider);
    this.diagramExtractor = new DiagramExtractor();
    this.mermaidGenerator = new MermaidGenerator();
    this.storage = storage || null;
  }

  setStorage(storage: ArtifactStorage): void {
    this.storage = storage;
  }

  async generateSpec(input: SpecGenerationInput): Promise<Spec> {
    try {
      let codebaseContext = '';
      let architectureDiagram = '';
      let sequenceDiagram = '';

      if (input.includeCodebaseContext !== false) {
        const context = await this.explorer.explore();
        codebaseContext = this.summarizeCodebaseContext(context);
        const { components, relationships } = this.diagramExtractor.extractArchitectureDiagram(context);
        architectureDiagram = this.mermaidGenerator.generateArchitectureDiagram(components, relationships);
      }

      const systemPrompt: LLMMessage = {
        role: 'system',
        content: `You are a technical architect creating detailed software specifications. 
Generate comprehensive specs with clear requirements, architecture decisions, and implementation guidance.
Respond with a JSON object containing the spec sections.`,
      };

      const userPrompt = this.buildSpecPrompt(input, codebaseContext, architectureDiagram);

      const specSections = await this.provider.generateStructured<SpecSections>(
        [systemPrompt, userPrompt],
        {
          overview: { type: 'string' },
          architecture: { type: 'string' },
          functionalRequirements: { type: 'array', items: { type: 'string' } },
          nonFunctionalRequirements: {
            type: 'object',
            properties: {
              performance: { type: 'string' },
              security: { type: 'string' },
              reliability: { type: 'string' },
            },
          },
          technicalPlan: {
            type: 'object',
            properties: {
              filesToChange: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    path: { type: 'string' },
                    description: { type: 'string' },
                  },
                },
              },
              dependencies: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    purpose: { type: 'string' },
                  },
                },
              },
              edgeCases: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    case: { type: 'string' },
                    handling: { type: 'string' },
                  },
                },
              },
            },
          },
          testingStrategy: {
            type: 'object',
            properties: {
              unitTests: { type: 'string' },
              integrationTests: { type: 'string' },
              e2eTests: { type: 'string' },
            },
          },
        }
      );

      const content = this.formatSpecContent(input, specSections, architectureDiagram, sequenceDiagram);

      const spec: Spec = {
        id: uuidv4(),
        epicId: input.epicId,
        title: this.extractTitle(input.goal, specSections.overview),
        status: 'draft',
        author: this.getAuthor(),
        tags: input.tags || [],
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.saveSpec(spec);

      return spec;
    } catch (error) {
      console.error('Error generating spec:', error);
      throw new Error(`Failed to generate spec: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveSpec(spec: Spec): Promise<void> {
    if (!this.storage) {
      console.warn('No storage configured, spec will not be saved');
      return;
    }

    try {
      await this.storage.saveSpec(spec);
      console.log(`Spec ${spec.id} saved successfully`);
    } catch (error) {
      console.error('Error saving spec:', error);
      throw error;
    }
  }

  private buildSpecPrompt(input: SpecGenerationInput, codebaseContext: string, architectureDiagram: string): LLMMessage {
    let prompt = `Generate a detailed technical specification for the following goal:\n\n${input.goal}`;

    if (input.clarifications) {
      prompt += `\n\nClarifications:\n`;
      input.clarifications.clarifications.forEach(qa => {
        prompt += `- Q: ${qa.question}\n  A: ${qa.answer}\n`;
      });
      if (input.clarifications.extractedRequirements.length > 0) {
        prompt += `\nExtracted Requirements:\n`;
        input.clarifications.extractedRequirements.forEach(r => {
          prompt += `- ${r}\n`;
        });
      }
    }

    if (codebaseContext) {
      prompt += `\n\nCodebase Context:\n${codebaseContext}`;
    }

    if (architectureDiagram) {
      prompt += `\n\nCurrent Architecture:\n${architectureDiagram}`;
    }

    prompt += `\n\nRespond with a JSON object containing: overview, architecture, functionalRequirements (array), nonFunctionalRequirements (with performance, security, reliability), technicalPlan (filesToChange, dependencies, edgeCases), and testingStrategy.`;

    return { role: 'user', content: prompt };
  }

  private summarizeCodebaseContext(context: { files: Array<{ path: string; language: string; loc: number }>; symbols: Array<{ name: string; kind: string }>; statistics: { totalFiles: number; totalLines: number; languageBreakdown: Record<string, number> } }): string {
    const { statistics, files, symbols } = context;
    
    let summary = `Codebase contains ${statistics.totalFiles} files with ${statistics.totalLines} lines of code.\n`;
    summary += `Languages: ${Object.entries(statistics.languageBreakdown).map(([lang, count]) => `${lang} (${count})`).join(', ')}.\n\n`;
    
    const topSymbols = symbols.slice(0, 10);
    if (topSymbols.length > 0) {
      summary += `Key symbols: ${topSymbols.map(s => `${s.name} (${s.kind})`).join(', ')}.\n`;
    }

    return summary;
  }

  private formatSpecContent(
    input: SpecGenerationInput,
    sections: SpecSections,
    architectureDiagram: string,
    sequenceDiagram: string
  ): string {
    let content = `## Overview\n\n${sections.overview}\n\n`;

    content += `## Architecture\n\n`;
    if (architectureDiagram) {
      content += '```mermaid\n' + architectureDiagram + '\n```\n\n';
    }
    content += sections.architecture + '\n\n';

    content += `## Requirements\n\n### Functional Requirements\n`;
    sections.functionalRequirements.forEach((req, i) => {
      content += `${i + 1}. ${req}\n`;
    });
    content += '\n### Non-Functional Requirements\n';
    content += `- **Performance**: ${sections.nonFunctionalRequirements.performance || 'TBD'}\n`;
    content += `- **Security**: ${sections.nonFunctionalRequirements.security || 'TBD'}\n`;
    content += `- **Reliability**: ${sections.nonFunctionalRequirements.reliability || 'TBD'}\n\n`;

    content += `## Technical Plan\n\n### Files to Change\n`;
    sections.technicalPlan.filesToChange.forEach(file => {
      content += `- \`${file.path}\` - ${file.description}\n`;
    });
    content += '\n### Dependencies\n';
    sections.technicalPlan.dependencies.forEach(dep => {
      content += `- **${dep.name}**: ${dep.purpose}\n`;
    });
    content += '\n### Edge Cases\n';
    sections.technicalPlan.edgeCases.forEach(edge => {
      content += `- **${edge.case}**: ${edge.handling}\n`;
    });
    content += '\n';

    content += `## Testing Strategy\n`;
    content += `- **Unit Tests**: ${sections.testingStrategy.unitTests || 'TBD'}\n`;
    content += `- **Integration Tests**: ${sections.testingStrategy.integrationTests || 'TBD'}\n`;
    content += `- **E2E Tests**: ${sections.testingStrategy.e2eTests || 'TBD'}\n`;

    return content;
  }

  private extractTitle(goal: string, overview: string): string {
    if (overview.length > 10) {
      const firstSentence = overview.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length <= 100) {
        return firstSentence.trim();
      }
    }
    
    const goalWords = goal.split(' ').slice(0, 6).join(' ');
    return goalWords.charAt(0).toUpperCase() + goalWords.slice(1);
  }

  private getAuthor(): string {
    try {
      const vscode = require('vscode');
      return vscode.env.uiMode || 'Unknown User';
    } catch {
      return 'Unknown User';
    }
  }
}
