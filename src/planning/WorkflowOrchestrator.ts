import { v4 as uuidv4 } from 'uuid';
import { LLMProvider } from '../llm/types';
import { ClarificationEngine, ClarificationContext } from './ClarificationEngine';
import { SpecGenerator, SpecGenerationInput, Spec } from './SpecGenerator';
import { TicketGenerator, TicketGenerationInput } from './TicketGenerator';
import { TicketValidator } from './TicketValidator';
import { WorkflowState } from './WorkflowState';
import { ArtifactStorage } from '../core/storage/ArtifactStorage';
import { ReferenceResolver } from '../core/references/ReferenceResolver';
import { CodebaseExplorer } from './codebase/CodebaseExplorer';
import { Ticket } from '../core/models/Ticket';

export interface WorkflowInput {
  epicId: string;
  goal: string;
  tags?: string[];
  includeCodebaseContext?: boolean;
  onProgress?: (phase: WorkflowPhase, progress: number) => void;
  onQuestionsGenerated?: (questions: string[]) => Promise<string[]>;
}

export interface WorkflowResult {
  spec: Spec;
  tickets: Ticket[];
  summary: {
    totalTickets: number;
    estimatedTotalEffort: string;
    criticalTickets: number;
  };
}

export type WorkflowPhase = 'clarification' | 'spec_generation' | 'ticket_generation' | 'validation' | 'complete';

interface CreatedArtifacts {
  specId?: string;
  ticketIds: string[];
}

export class WorkflowOrchestrator {
  private provider: LLMProvider;
  private codebaseExplorer: CodebaseExplorer;
  private storage: ArtifactStorage;
  private referenceResolver: ReferenceResolver;
  private clarificationEngine: ClarificationEngine;
  private specGenerator: SpecGenerator;
  private ticketGenerator: TicketGenerator;
  private ticketValidator: TicketValidator;
  private workflowState: WorkflowState;

  constructor(
    provider: LLMProvider,
    codebaseExplorer: CodebaseExplorer,
    storage: ArtifactStorage,
    referenceResolver: ReferenceResolver
  ) {
    this.provider = provider;
    this.codebaseExplorer = codebaseExplorer;
    this.storage = storage;
    this.referenceResolver = referenceResolver;
    this.clarificationEngine = new ClarificationEngine(provider);
    this.specGenerator = new SpecGenerator(provider, codebaseExplorer, storage);
    this.ticketGenerator = new TicketGenerator(provider, storage, referenceResolver);
    this.ticketValidator = new TicketValidator();
    this.workflowState = new WorkflowState(storage);
  }

  async executeWorkflow(input: WorkflowInput): Promise<WorkflowResult> {
    const workflowId = uuidv4();
    let artifacts: CreatedArtifacts = { ticketIds: [] };

    this.emitProgress(input.onProgress, 'clarification', 0);

    try {
      const questions = await this.clarificationEngine.analyzeGoal(input.goal);
      
      let clarifications: ClarificationContext;
      if (questions.length > 0 && input.onQuestionsGenerated) {
        const answers = await input.onQuestionsGenerated(questions);
        clarifications = this.clarificationEngine.parseResponsesWithGoal(input.goal, questions, answers);
      } else {
        clarifications = { goal: input.goal, clarifications: [], extractedRequirements: [] };
      }

      await this.workflowState.saveWorkflowState({
        id: workflowId,
        epicId: input.epicId,
        currentPhase: 'clarification',
        createdArtifacts: artifacts,
        userResponses: clarifications.clarifications,
        startedAt: new Date(),
        lastUpdatedAt: new Date(),
      });

      this.emitProgress(input.onProgress, 'clarification', 100);
      this.emitProgress(input.onProgress, 'spec_generation', 0);

      const specInput: SpecGenerationInput = {
        epicId: input.epicId,
        goal: input.goal,
        clarifications,
        tags: input.tags,
        includeCodebaseContext: input.includeCodebaseContext,
      };

      const spec = await this.specGenerator.generateSpec(specInput);
      artifacts.specId = spec.id;

      await this.workflowState.saveWorkflowState({
        id: workflowId,
        epicId: input.epicId,
        currentPhase: 'spec_generation',
        createdArtifacts: artifacts,
        userResponses: clarifications.clarifications,
        startedAt: new Date(),
        lastUpdatedAt: new Date(),
      });

      this.emitProgress(input.onProgress, 'spec_generation', 100);
      this.emitProgress(input.onProgress, 'ticket_generation', 0);

      const ticketInput: TicketGenerationInput = {
        epicId: input.epicId,
        specId: spec.id,
        maxTickets: 5,
        priorityDistribution: 'balanced',
      };

      const tickets = await this.ticketGenerator.generateTickets(ticketInput);
      artifacts.ticketIds = tickets.map(t => t.id);

      await this.workflowState.saveWorkflowState({
        id: workflowId,
        epicId: input.epicId,
        currentPhase: 'ticket_generation',
        createdArtifacts: artifacts,
        userResponses: clarifications.clarifications,
        startedAt: new Date(),
        lastUpdatedAt: new Date(),
      });

      this.emitProgress(input.onProgress, 'ticket_generation', 50);

      const validTickets: Ticket[] = [];
      const invalidTicketIds: string[] = [];

      for (const ticket of tickets) {
        const alignmentResult = this.ticketValidator.validateTicketAlignment(ticket, spec);
        const completenessResult = this.ticketValidator.validateTicketCompleteness(ticket);

        if (alignmentResult.valid && completenessResult.valid) {
          validTickets.push(ticket);
        } else {
          console.warn(`Ticket ${ticket.id} failed validation:`);
          [...alignmentResult.issues, ...completenessResult.issues].forEach(issue => {
            console.warn(`  [${issue.severity}] ${issue.message}`);
          });
          invalidTicketIds.push(ticket.id);
        }
      }

      // Clean up invalid tickets to keep storage consistent
      for (const ticketId of invalidTicketIds) {
        try {
          await this.storage.deleteTicket(ticketId);
        } catch (error) {
          console.warn(`Failed to delete invalid ticket ${ticketId}:`, error);
        }
      }

      await this.workflowState.saveWorkflowState({
        id: workflowId,
        epicId: input.epicId,
        currentPhase: 'validation',
        createdArtifacts: { ...artifacts, ticketIds: validTickets.map(t => t.id) },
        userResponses: clarifications.clarifications,
        startedAt: new Date(),
        lastUpdatedAt: new Date(),
      });

      this.emitProgress(input.onProgress, 'ticket_generation', 100);
      this.emitProgress(input.onProgress, 'validation', 100);
      this.emitProgress(input.onProgress, 'complete', 100);

      const summary = this.calculateSummary(validTickets);

      await this.workflowState.saveWorkflowState({
        id: workflowId,
        epicId: input.epicId,
        currentPhase: 'complete',
        createdArtifacts: { ...artifacts, ticketIds: validTickets.map(t => t.id) },
        userResponses: clarifications.clarifications,
        startedAt: new Date(),
        lastUpdatedAt: new Date(),
      });

      return {
        spec,
        tickets: validTickets,
        summary,
      };
    } catch (error) {
      console.error('Workflow execution failed:', error);

      await this.workflowState.saveWorkflowState({
        id: workflowId,
        epicId: input.epicId,
        currentPhase: 'complete',
        createdArtifacts: artifacts,
        userResponses: [],
        startedAt: new Date(),
        lastUpdatedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  async resumeWorkflow(workflowId: string): Promise<WorkflowResult> {
    const state = await this.workflowState.loadWorkflowState(workflowId);

    if (state.currentPhase === 'complete') {
      throw new Error('Workflow is already complete');
    }

    if (state.cancelled) {
      throw new Error('Workflow was cancelled');
    }

    let spec: Spec | undefined;
    let tickets: Ticket[] = [];

    if (state.createdArtifacts.specId) {
      spec = await this.storage.loadSpec(state.createdArtifacts.specId);
    }

    for (const ticketId of state.createdArtifacts.ticketIds) {
      try {
        const ticket = await this.storage.loadTicket(ticketId);
        tickets.push(ticket);
      } catch (error) {
        console.warn(`Failed to load ticket ${ticketId}:`, error);
      }
    }

    const goal = spec?.content
      ? spec.content.match(/## Overview\s*\n([\s\S]*?)(?=##|$)/i)?.[1]?.trim() || ''
      : '';

    const clarifications: ClarificationContext = {
      goal,
      clarifications: state.userResponses,
      extractedRequirements: [],
    };

    switch (state.currentPhase) {
      case 'clarification':
        throw new Error('Cannot resume workflow: goal information not available from clarification phase');

      case 'spec_generation': {
        if (!spec) {
          throw new Error('Cannot resume workflow: spec not found');
        }

        const ticketInput: TicketGenerationInput = {
          epicId: state.epicId,
          specId: spec.id,
          maxTickets: 5,
          priorityDistribution: 'balanced',
        };

        tickets = await this.ticketGenerator.generateTickets(ticketInput);
        state.createdArtifacts.ticketIds = tickets.map(t => t.id);
        await this.workflowState.saveWorkflowState({
          ...state,
          currentPhase: 'ticket_generation',
          lastUpdatedAt: new Date(),
        });

        // Fall through to validation
      }

      case 'ticket_generation':
      case 'validation': {
        if (!spec) {
          throw new Error('Cannot resume workflow: spec not found');
        }

        const validTickets: Ticket[] = [];
        const invalidTicketIds: string[] = [];

        for (const ticket of tickets) {
          const alignmentResult = this.ticketValidator.validateTicketAlignment(ticket, spec);
          const completenessResult = this.ticketValidator.validateTicketCompleteness(ticket);

          if (alignmentResult.valid && completenessResult.valid) {
            validTickets.push(ticket);
          } else {
            console.warn(`Ticket ${ticket.id} failed validation:`);
            [...alignmentResult.issues, ...completenessResult.issues].forEach(issue => {
              console.warn(`  [${issue.severity}] ${issue.message}`);
            });
            invalidTicketIds.push(ticket.id);
          }
        }

        // Clean up invalid tickets
        for (const ticketId of invalidTicketIds) {
          try {
            await this.storage.deleteTicket(ticketId);
          } catch (error) {
            console.warn(`Failed to delete invalid ticket ${ticketId}:`, error);
          }
        }

        await this.workflowState.saveWorkflowState({
          ...state,
          currentPhase: 'complete',
          createdArtifacts: { ...state.createdArtifacts, ticketIds: validTickets.map(t => t.id) },
          lastUpdatedAt: new Date(),
        });

        const summary = this.calculateSummary(validTickets);

        return {
          spec,
          tickets: validTickets,
          summary,
        };
      }

      default:
        throw new Error(`Unknown workflow phase: ${state.currentPhase}`);
    }
  }

  async cancelWorkflow(workflowId: string): Promise<void> {
    const state = await this.workflowState.loadWorkflowState(workflowId);

    if (state.currentPhase === 'complete') {
      return;
    }

    for (const ticketId of state.createdArtifacts.ticketIds) {
      try {
        await this.storage.deleteTicket(ticketId);
      } catch (error) {
        console.warn(`Failed to delete ticket ${ticketId}:`, error);
      }
    }

    if (state.createdArtifacts.specId) {
      try {
        await this.storage.deleteSpec(state.createdArtifacts.specId);
      } catch (error) {
        console.warn(`Failed to delete spec ${state.createdArtifacts.specId}:`, error);
      }
    }

    await this.workflowState.saveWorkflowState({
      ...state,
      currentPhase: 'complete',
      lastUpdatedAt: new Date(),
      cancelled: true,
    });
  }

  private emitProgress(
    onProgress: WorkflowInput['onProgress'],
    phase: WorkflowPhase,
    progress: number
  ): void {
    if (onProgress) {
      onProgress(phase, progress);
    }
  }

  private calculateSummary(tickets: Ticket[]): WorkflowResult['summary'] {
    let totalEffortMs = 0;
    let effortPattern: RegExp;

    for (const ticket of tickets) {
      if (ticket.estimatedEffort) {
        const match = ticket.estimatedEffort.match(/(\d+)([hmhd])/);
        if (match && match[1] && match[2]) {
          const value = parseInt(match[1], 10);
          const unit = match[2];
          
          switch (unit) {
            case 'm':
              totalEffortMs += value * 60 * 1000;
              break;
            case 'h':
              totalEffortMs += value * 60 * 60 * 1000;
              break;
            case 'd':
              totalEffortMs += value * 8 * 60 * 60 * 1000;
              break;
          }
        }
      }
    }

    let estimatedTotalEffort: string;
    if (totalEffortMs >= 8 * 60 * 60 * 1000) {
      const days = Math.ceil(totalEffortMs / (8 * 60 * 60 * 1000));
      estimatedTotalEffort = `${days}d`;
    } else if (totalEffortMs >= 60 * 60 * 1000) {
      const hours = Math.ceil(totalEffortMs / (60 * 60 * 1000));
      estimatedTotalEffort = `${hours}h`;
    } else {
      const mins = Math.ceil(totalEffortMs / (60 * 1000));
      estimatedTotalEffort = `${mins}m`;
    }

    const criticalTickets = tickets.filter(t => t.priority === 'critical').length;

    return {
      totalTickets: tickets.length,
      estimatedTotalEffort,
      criticalTickets,
    };
  }
}
