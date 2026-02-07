import { v4 as uuidv4 } from 'uuid';
import { LLMProvider, LLMMessage } from '../llm/types';
import { ArtifactStorage } from '../core/storage/ArtifactStorage';
import { ReferenceResolver } from '../core/references/ReferenceResolver';
import { Ticket, TicketStatus, Priority } from '../core/models/Ticket';
import { Spec } from '../core/models/Spec';

export interface TicketGenerationInput {
  epicId: string;
  specId: string;
  maxTickets?: number;
  priorityDistribution?: 'balanced' | 'critical-first';
}

export interface TicketBreakdown {
  tickets: Array<{
    title: string;
    description: string;
    acceptanceCriteria: string[];
    implementationSteps: string[];
    filesToChange: Array<{ path: string; description: string }>;
    estimatedEffort: string;
    priority: Priority;
    tags: string[];
  }>;
}

interface ParsedSpecContent {
  overview: string;
  functionalRequirements: string[];
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

export class TicketGenerator {
  private provider: LLMProvider;
  private storage: ArtifactStorage;
  private referenceResolver: ReferenceResolver | null = null;

  constructor(provider: LLMProvider, storage: ArtifactStorage, referenceResolver?: ReferenceResolver) {
    this.provider = provider;
    this.storage = storage;
    this.referenceResolver = referenceResolver || null;
  }

  setReferenceResolver(resolver: ReferenceResolver): void {
    this.referenceResolver = resolver;
  }

  async generateTickets(input: TicketGenerationInput): Promise<Ticket[]> {
    try {
      const spec = await this.storage.loadSpec(input.specId);
      const parsedContent = this.parseSpecContent(spec.content);
      
      const maxTickets = input.maxTickets || 5;
      const systemPrompt: LLMMessage = {
        role: 'system',
        content: `You are a technical lead breaking down software specifications into actionable, granular tickets.
Each ticket should be completable in 2-8 hours of work.
Generate tickets that are independent, testable, and have clear acceptance criteria.
Respond with a JSON object containing a "tickets" array.`,
      };

      const userPrompt = this.buildTicketPrompt(input, spec, parsedContent);

      const ticketBreakdown = await this.provider.generateStructured<TicketBreakdown>(
        [systemPrompt, userPrompt],
        {
          tickets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                acceptanceCriteria: { type: 'array', items: { type: 'string' } },
                implementationSteps: { type: 'array', items: { type: 'string' } },
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
                estimatedEffort: { type: 'string' },
                priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                tags: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        }
      );

      const tickets: Ticket[] = [];
      const createdTickets = ticketBreakdown.tickets.slice(0, maxTickets);

      for (const ticketData of createdTickets) {
        const ticket = await this.createTicket(input, spec, ticketData);
        tickets.push(ticket);
      }

      return tickets;
    } catch (error) {
      console.error('Error generating tickets:', error);
      throw new Error(`Failed to generate tickets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseSpecContent(content: string): ParsedSpecContent {
    const result: ParsedSpecContent = {
      overview: '',
      functionalRequirements: [],
      technicalPlan: {
        filesToChange: [],
        dependencies: [],
        edgeCases: [],
      },
      testingStrategy: {
        unitTests: '',
        integrationTests: '',
        e2eTests: '',
      },
    };

    const overviewMatch = content.match(/## Overview\s*\n([\s\S]*?)(?=##|$)/i);
    if (overviewMatch && overviewMatch[1]) {
      result.overview = overviewMatch[1].trim();
    }

    const requirementsMatch = content.match(/## Requirements\s*\n([\s\S]*?)(?=##|$)/i);
    if (requirementsMatch && requirementsMatch[1]) {
      const reqText = requirementsMatch[1];
      const functionalMatch = reqText.match(/### Functional Requirements\s*\n([\s\S]*?)(?=###|$)/i);
      if (functionalMatch && functionalMatch[1]) {
        const reqLines = functionalMatch[1].split('\n');
        result.functionalRequirements = reqLines
          .filter(line => line.match(/^\d+\./))
          .map(line => line.replace(/^\d+\.\s*/, '').trim());
      }
    }

    const technicalMatch = content.match(/## Technical Plan\s*\n([\s\S]*?)(?=##|$)/i);
    if (technicalMatch && technicalMatch[1]) {
      const techText = technicalMatch[1];
      
      const filesMatch = techText.match(/### Files to Change\s*\n([\s\S]*?)(?=###|$)/i);
      if (filesMatch && filesMatch[1]) {
        const fileLines = filesMatch[1].split('\n');
        result.technicalPlan.filesToChange = fileLines
          .filter(line => line.trim().startsWith('-'))
          .map(line => {
            const match = line.match(/`([^`]+)`\s*-\s*(.+)/);
            if (match && match[1] && match[2]) {
              return { path: match[1], description: match[2].trim() };
            }
            return null;
          })
          .filter((f): f is { path: string; description: string } => f !== null);
      }

      const depsMatch = techText.match(/### Dependencies\s*\n([\s\S]*?)(?=###|$)/i);
      if (depsMatch && depsMatch[1]) {
        const depLines = depsMatch[1].split('\n');
        result.technicalPlan.dependencies = depLines
          .filter(line => line.trim().startsWith('-'))
          .map(line => {
            const match = line.match(/\*\*([^*]+)\*\*:\s*(.+)/);
            if (match && match[1] && match[2]) {
              return { name: match[1], purpose: match[2].trim() };
            }
            return null;
          })
          .filter((d): d is { name: string; purpose: string } => d !== null);
      }
    }

    const testingMatch = content.match(/## Testing Strategy\s*\n([\s\S]*?)(?=##|$)/i);
    if (testingMatch && testingMatch[1]) {
      const testText = testingMatch[1];
      const unitMatch = testText.match(/\*\*Unit Tests\*\*:\s*(.+)/i);
      if (unitMatch && unitMatch[1]) result.testingStrategy.unitTests = unitMatch[1].trim();
      const intMatch = testText.match(/\*\*Integration Tests\*\*:\s*(.+)/i);
      if (intMatch && intMatch[1]) result.testingStrategy.integrationTests = intMatch[1].trim();
      const e2eMatch = testText.match(/\*\*E2E Tests\*\*:\s*(.+)/i);
      if (e2eMatch && e2eMatch[1]) result.testingStrategy.e2eTests = e2eMatch[1].trim();
    }

    return result;
  }

  private buildTicketPrompt(input: TicketGenerationInput, spec: Spec, parsedContent: ParsedSpecContent): LLMMessage {
    let prompt = `Generate granular tickets for the following specification:

Spec Title: ${spec.title}
Spec ID: ${spec.id}

Overview:
${parsedContent.overview}

Functional Requirements:
${parsedContent.functionalRequirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Files to Change:
${parsedContent.technicalPlan.filesToChange.map(f => `- \`${f.path}\`: ${f.description}`).join('\n')}

Dependencies:
${parsedContent.technicalPlan.dependencies.map(d => `- ${d.name}: ${d.purpose}`).join('\n')}

Generate ${input.maxTickets || 5} tickets that:
- Are each completable in 2-8 hours
- Have clear, actionable acceptance criteria
- Reference specific files to change
- Include implementation steps
- Have realistic effort estimates (e.g., "2h", "4h", "1d")

${input.priorityDistribution === 'critical-first' ? 'Prioritize critical and high-priority tickets first.' : 'Balance ticket priorities appropriately.'}

Respond with a JSON object containing a "tickets" array with: title, description, acceptanceCriteria (array), implementationSteps (array), filesToChange (array with path and description), estimatedEffort, priority (low/medium/high/critical), and tags (array).`;

    return { role: 'user', content: prompt };
  }

  private async createTicket(
    input: TicketGenerationInput,
    spec: Spec,
    ticketData: TicketBreakdown['tickets'][0]
  ): Promise<Ticket> {
    const content = this.formatTicketContent(spec.id, ticketData);

    const ticket: Ticket = {
      id: uuidv4(),
      epicId: input.epicId,
      specId: input.specId,
      title: ticketData.title,
      status: 'todo' as TicketStatus,
      priority: ticketData.priority,
      estimatedEffort: ticketData.estimatedEffort,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ticketData.tags || [],
      content,
    };

    await this.storage.saveTicket(ticket);
    console.log(`Ticket ${ticket.id} created successfully`);

    return ticket;
  }

  private formatTicketContent(specId: string, ticketData: TicketBreakdown['tickets'][0]): string {
    let content = `## Description\n\n${ticketData.description}\n\n`;
    content += `Related Spec: [spec:${specId}]\n\n`;

    content += `## Acceptance Criteria\n`;
    ticketData.acceptanceCriteria.forEach(criterion => {
      content += `- [ ] ${criterion}\n`;
    });
    content += '\n';

    content += `## Implementation Steps\n`;
    ticketData.implementationSteps.forEach((step, index) => {
      content += `${index + 1}. ${step}\n`;
    });
    content += '\n';

    content += `## Files to Change\n`;
    ticketData.filesToChange.forEach(file => {
      content += `- \`${file.path}\` - ${file.description}\n`;
    });
    content += '\n';

    content += `## Testing Checklist\n`;
    content += `- [ ] Unit tests added/updated\n`;
    content += `- [ ] Integration tests pass\n`;
    content += `- [ ] Manual testing completed\n`;

    return content;
  }
}
