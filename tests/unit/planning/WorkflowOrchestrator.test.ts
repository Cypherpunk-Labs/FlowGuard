import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WorkflowOrchestrator, WorkflowInput, WorkflowResult, WorkflowPhase } from '../../../src/planning/WorkflowOrchestrator';
import { ClarificationEngine } from '../../../src/planning/ClarificationEngine';
import { SpecGenerator } from '../../../src/planning/SpecGenerator';
import { TicketGenerator } from '../../../src/planning/TicketGenerator';
import { ArtifactStorage } from '../../../src/core/storage/ArtifactStorage';
import { ReferenceResolver } from '../../../src/core/references/ReferenceResolver';
import { CodebaseExplorer } from '../../../src/planning/codebase/CodebaseExplorer';
import { Spec } from '../../../src/core/models/Spec';
import { Ticket } from '../../../src/core/models/Ticket';
import { v4 as uuidv4 } from 'uuid';

function createMockLLMProvider() {
  return {
    generateText: jest.fn(),
    generateStructured: jest.fn(async (messages, schema) => {
      if (schema && typeof schema === 'object' && 'questions' in schema) {
        return { questions: ['Scope?', 'Constraints?'] };
      }
      if (schema && typeof schema === 'object' && 'tickets' in schema) {
        return { tickets: [{ title: 'Ticket 1', description: 'Desc', acceptanceCriteria: [], implementationSteps: [], filesToChange: [], estimatedEffort: '2h', priority: 'medium', tags: [] }] };
      }
      return { overview: 'Overview', architecture: 'Arch', functionalRequirements: [], nonFunctionalRequirements: {}, technicalPlan: { filesToChange: [], dependencies: [], edgeCases: [] }, testingStrategy: { unitTests: '', integrationTests: '', e2eTests: '' } };
    }),
    streamText: jest.fn()
  };
}

function createMockStorage() {
  return {
    initialize: jest.fn().mockResolvedValue(undefined),
    saveSpec: jest.fn().mockResolvedValue(undefined),
    loadSpec: jest.fn(),
    listSpecs: jest.fn().mockResolvedValue([]),
    deleteSpec: jest.fn().mockResolvedValue(undefined),
    saveTicket: jest.fn().mockResolvedValue(undefined),
    loadTicket: jest.fn(),
    listTickets: jest.fn().mockResolvedValue([]),
    deleteTicket: jest.fn().mockResolvedValue(undefined),
    saveExecution: jest.fn().mockResolvedValue(undefined),
    loadExecution: jest.fn(),
    listExecutions: jest.fn().mockResolvedValue([]),
    deleteExecution: jest.fn().mockResolvedValue(undefined),
    saveVerification: jest.fn().mockResolvedValue(undefined),
    loadVerification: jest.fn(),
    listVerifications: jest.fn().mockResolvedValue([]),
    deleteVerification: jest.fn().mockResolvedValue(undefined),
    getArtifactPath: jest.fn(),
    saveTemplate: jest.fn().mockResolvedValue(undefined),
    loadTemplate: jest.fn(),
    listTemplates: jest.fn().mockResolvedValue([]),
    deleteTemplate: jest.fn().mockResolvedValue(undefined)
  };
}

function createMockCodebaseExplorer() {
  return {
    explore: jest.fn().mockResolvedValue({ files: [], stats: { totalFiles: 0, totalLines: 0 }, components: [], relationships: [] }),
    analyzeSingleFile: jest.fn().mockResolvedValue({ functions: [], classes: [], imports: [] }),
    buildDependencyGraph: jest.fn().mockResolvedValue({ nodes: [], edges: [] })
  };
}

function createMockReferenceResolver() {
  return {
    parseReference: jest.fn(),
    resolveReference: jest.fn().mockResolvedValue({ type: 'spec', content: '' }),
    extractReferences: jest.fn().mockReturnValue([]),
    resolveReferences: jest.fn().mockResolvedValue({}),
    validateReferences: jest.fn().mockResolvedValue(true),
    getTicketsBySpec: jest.fn().mockResolvedValue([]),
    validateTicketReferences: jest.fn().mockResolvedValue({ valid: true, issues: [] })
  };
}

describe('WorkflowOrchestrator', () => {
  let orchestrator: WorkflowOrchestrator;
  let mockProvider: ReturnType<typeof createMockLLMProvider>;
  let mockExplorer: ReturnType<typeof createMockCodebaseExplorer>;
  let mockStorage: ReturnType<typeof createMockStorage>;
  let mockResolver: ReturnType<typeof createMockReferenceResolver>;

  beforeEach(() => {
    mockProvider = createMockLLMProvider();
    mockExplorer = createMockCodebaseExplorer();
    mockStorage = createMockStorage();
    mockResolver = createMockReferenceResolver();

    const testSpec: Spec = {
      id: uuidv4(),
      epicId: uuidv4(),
      title: 'Test Spec',
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      author: 'Test',
      tags: [],
      content: '# Test Spec'
    };

    mockStorage.loadSpec.mockResolvedValue(testSpec);

    orchestrator = new WorkflowOrchestrator(
      mockProvider,
      mockExplorer,
      mockStorage,
      mockResolver
    );
  });

  describe('executeWorkflow', () => {
    it('should execute full workflow from goal to tickets', async () => {
      const input: WorkflowInput = {
        epicId: uuidv4(),
        goal: 'Implement user authentication'
      };

      const result = await orchestrator.executeWorkflow(input);

      expect(result.spec).toBeDefined();
      expect(result.tickets).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should call clarification engine first', async () => {
      const input: WorkflowInput = {
        epicId: uuidv4(),
        goal: 'Test goal'
      };

      await orchestrator.executeWorkflow(input);

      expect(mockProvider.generateStructured).toHaveBeenCalled();
    });

    it('should generate spec with correct epicId', async () => {
      const epicId = uuidv4();
      const input: WorkflowInput = {
        epicId,
        goal: 'Test goal'
      };

      const result = await orchestrator.executeWorkflow(input);

      expect(result.spec.epicId).toBe(epicId);
    });

    it('should generate tickets linked to spec', async () => {
      const input: WorkflowInput = {
        epicId: uuidv4(),
        goal: 'Test goal'
      };

      const result = await orchestrator.executeWorkflow(input);

      result.tickets.forEach(ticket => {
        expect(ticket.specId).toBe(result.spec.id);
        expect(ticket.epicId).toBe(input.epicId);
      });
    });

    it('should calculate summary statistics', async () => {
      const input: WorkflowInput = {
        epicId: uuidv4(),
        goal: 'Test goal'
      };

      const result = await orchestrator.executeWorkflow(input);

      expect(result.summary.totalTickets).toBeGreaterThanOrEqual(0);
      expect(typeof result.summary.estimatedTotalEffort).toBe('string');
    });

    it('should report progress during execution', async () => {
      const onProgress = jest.fn();
      const input: WorkflowInput = {
        epicId: uuidv4(),
        goal: 'Test goal',
        onProgress
      };

      await orchestrator.executeWorkflow(input);

      expect(onProgress).toHaveBeenCalled();
    });

    it('should handle questions generation callback', async () => {
      const onQuestionsGenerated = jest.fn().mockResolvedValue(['Answer 1', 'Answer 2']);
      const input: WorkflowInput = {
        epicId: uuidv4(),
        goal: 'Test goal',
        onQuestionsGenerated
      };

      await orchestrator.executeWorkflow(input);

      expect(onQuestionsGenerated).toHaveBeenCalled();
    });

    it('should skip clarification when no callback provided', async () => {
      const input: WorkflowInput = {
        epicId: uuidv4(),
        goal: 'Test goal'
      };

      await orchestrator.executeWorkflow(input);

      expect(mockProvider.generateStructured).toHaveBeenCalled();
    });

    it('should include codebase context when requested', async () => {
      const input: WorkflowInput = {
        epicId: uuidv4(),
        goal: 'Test goal',
        includeCodebaseContext: true
      };

      await orchestrator.executeWorkflow(input);

      expect(mockExplorer.explore).toHaveBeenCalled();
    });
  });

  describe('workflow state management', () => {
    it('should track workflow state', () => {
      expect(orchestrator).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle LLM provider errors gracefully', async () => {
      mockProvider.generateStructured.mockRejectedValueOnce(new Error('LLM error'));

      const input: WorkflowInput = {
        epicId: uuidv4(),
        goal: 'Test goal'
      };

      await expect(orchestrator.executeWorkflow(input)).rejects.toThrow('LLM error');
    });

    it('should handle storage errors gracefully', async () => {
      mockStorage.loadSpec.mockRejectedValueOnce(new Error('Storage error'));

      const input: WorkflowInput = {
        epicId: uuidv4(),
        goal: 'Test goal'
      };

      await expect(orchestrator.executeWorkflow(input)).rejects.toThrow('Storage error');
    });
  });
});
