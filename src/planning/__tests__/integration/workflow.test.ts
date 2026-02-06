import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkflowOrchestrator, WorkflowInput, WorkflowResult, WorkflowPhase } from '../WorkflowOrchestrator';
import { ClarificationEngine, ClarificationContext } from '../ClarificationEngine';
import { SpecGenerator, Spec } from '../SpecGenerator';
import { TicketGenerator, TicketGenerationInput } from '../TicketGenerator';
import { TicketValidator, ValidationResult } from '../TicketValidator';
import { LLMProvider, LLMMessage, LLMResponse } from '../../llm/types';
import { ArtifactStorage } from '../../core/storage/ArtifactStorage';
import { ReferenceResolver } from '../../core/references/ReferenceResolver';
import { CodebaseExplorer } from '../codebase/CodebaseExplorer';
import { Ticket } from '../../core/models/Ticket';
import { v4 as uuidv4 } from 'uuid';

const createMockLLMProvider = (): LLMProvider => ({
  generateText: vi.fn(),
  generateStructured: vi.fn(async (messages: LLMMessage[], schema: object) => {
    return generateMockStructuredResponse(schema);
  }),
  streamText: vi.fn(),
});

const generateMockStructuredResponse = (schema: object): object => {
  if (schema && typeof schema === 'object' && 'questions' in schema) {
    return { questions: ['What is the scope?', 'Any constraints?', 'Success criteria?'] };
  }
  if (schema && typeof schema === 'object' && 'tickets' in schema) {
    return {
      tickets: [
        {
          title: 'Implement feature X',
          description: 'Implement feature X according to spec',
          acceptanceCriteria: ['Feature X implemented', 'Tests pass'],
          implementationSteps: ['Create file', 'Implement logic', 'Add tests'],
          filesToChange: [{ path: 'src/test.ts', description: 'Implement feature' }],
          estimatedEffort: '4h',
          priority: 'high' as const,
          tags: ['feature'],
        },
        {
          title: 'Update documentation',
          description: 'Update documentation for feature X',
          acceptanceCriteria: ['Docs updated'],
          implementationSteps: ['Update README'],
          filesToChange: [{ path: 'README.md', description: 'Update docs' }],
          estimatedEffort: '1h',
          priority: 'medium' as const,
          tags: ['docs'],
        },
      ],
    };
  }
  if (schema && typeof schema === 'object') {
    return {
      overview: 'Test overview',
      architecture: 'Test architecture',
      functionalRequirements: ['Req 1', 'Req 2'],
      nonFunctionalRequirements: { performance: 'Fast', security: 'Secure', reliability: 'Reliable' },
      technicalPlan: {
        filesToChange: [{ path: 'src/test.ts', description: 'Implement feature' }],
        dependencies: [{ name: 'test-dep', purpose: 'Testing' }],
        edgeCases: [{ case: 'Error case', handling: 'Handle gracefully' }],
      },
      testingStrategy: { unitTests: 'All tests', integrationTests: 'Integration tests', e2eTests: 'E2E tests' },
    };
  }
  return {};
};

const createMockStorage = (): ArtifactStorage => ({
  initialize: vi.fn(),
  saveSpec: vi.fn(),
  loadSpec: vi.fn(),
  listSpecs: vi.fn(),
  deleteSpec: vi.fn(),
  saveTicket: vi.fn(),
  loadTicket: vi.fn(),
  listTickets: vi.fn(),
  deleteTicket: vi.fn(),
  saveExecution: vi.fn(),
  loadExecution: vi.fn(),
  listExecutions: vi.fn(),
  deleteExecution: vi.fn(),
  getArtifactPath: vi.fn(),
});

const createMockCodebaseExplorer = (): CodebaseExplorer => ({
  explore: vi.fn(),
  getFileContent: vi.fn(),
  findFiles: vi.fn(),
  analyzeDependencies: vi.fn(),
});

const createMockReferenceResolver = (): ReferenceResolver => ({
  parseReference: vi.fn(),
  resolveReference: vi.fn(),
  extractReferences: vi.fn(),
  resolveReferences: vi.fn(),
  validateReferences: vi.fn(),
  getTicketsBySpec: vi.fn(),
  validateTicketReferences: vi.fn(),
});

describe('WorkflowOrchestrator', () => {
  let mockProvider: LLMProvider;
  let mockStorage: ArtifactStorage;
  let mockExplorer: CodebaseExplorer;
  let mockResolver: ReferenceResolver;
  let orchestrator: WorkflowOrchestrator;

  beforeEach(() => {
    mockProvider = createMockLLMProvider();
    mockStorage = createMockStorage();
    mockExplorer = createMockCodebaseExplorer();
    mockResolver = createMockReferenceResolver();

    orchestrator = new WorkflowOrchestrator(
      mockProvider,
      mockExplorer,
      mockStorage,
      mockResolver
    );
  });

  describe('executeWorkflow', () => {
    it('should execute complete workflow from goal to tickets', async () => {
      const mockSpec: Spec = {
        id: uuidv4(),
        epicId: 'epic-123',
        title: 'Test Spec',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'Test User',
        tags: [],
        content: '## Overview\n\nTest overview\n\n## Requirements\n\n1. Requirement 1\n\n## Technical Plan\n\n### Files to Change\n- `src/test.ts` - Test file\n\n## Testing Strategy\n\n- **Unit Tests**: All tests',
      };

      vi.spyOn(mockStorage, 'loadSpec').mockResolvedValue(mockSpec);

      const input: WorkflowInput = {
        epicId: 'epic-123',
        goal: 'Implement feature X',
        tags: ['test'],
        includeCodebaseContext: false,
        onProgress: vi.fn(),
        onQuestionsGenerated: vi.fn().mockResolvedValue(['Scope is limited', 'Performance matters', 'Success = tests pass']),
      };

      const result = await orchestrator.executeWorkflow(input);

      expect(result).toHaveProperty('spec');
      expect(result).toHaveProperty('tickets');
      expect(result).toHaveProperty('summary');
      expect(result.summary.totalTickets).toBe(2);
    });

    it('should handle workflow without clarification questions', async () => {
      const mockSpec: Spec = {
        id: uuidv4(),
        epicId: 'epic-123',
        title: 'Test Spec',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'Test User',
        tags: [],
        content: '## Overview\n\nTest\n\n## Requirements\n\n1. Req\n\n## Technical Plan\n\n### Files to Change\n\n## Testing Strategy\n',
      };

      vi.spyOn(mockStorage, 'loadSpec').mockResolvedValue(mockSpec);

      const mockProviderNoQuestions = createMockLLMProvider();
      mockProviderNoQuestions.generateStructured = vi.fn().mockImplementation((messages: LLMMessage[], schema: object) => {
        if (schema && typeof schema === 'object' && 'questions' in schema) {
          return Promise.resolve({ questions: [] });
        }
        return generateMockStructuredResponse(schema);
      });

      const orchestratorNoQuestions = new WorkflowOrchestrator(
        mockProviderNoQuestions,
        mockExplorer,
        mockStorage,
        mockResolver
      );

      const input: WorkflowInput = {
        epicId: 'epic-123',
        goal: 'Simple goal',
        includeCodebaseContext: false,
      };

      const result = await orchestratorNoQuestions.executeWorkflow(input);

      expect(result.spec).toBeDefined();
      expect(result.tickets).toBeDefined();
    });

    it('should validate tickets against spec', async () => {
      const mockSpec: Spec = {
        id: 'spec-123',
        epicId: 'epic-123',
        title: 'Test Spec',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'Test User',
        tags: [],
        content: '## Overview\n\nTest\n\n## Requirements\n\n1. Req 1\n\n## Technical Plan\n\n### Files to Change\n- `src/test.ts` - Test file\n\n## Testing Strategy\n',
      };

      vi.spyOn(mockStorage, 'loadSpec').mockResolvedValue(mockSpec);

      const input: WorkflowInput = {
        epicId: 'epic-123',
        goal: 'Goal with validation',
        includeCodebaseContext: false,
        onQuestionsGenerated: vi.fn().mockResolvedValue([]),
      };

      await orchestrator.executeWorkflow(input);

      expect(mockStorage.saveTicket).toHaveBeenCalled();
    });
  });

  describe('progress callbacks', () => {
    it('should emit progress events during workflow execution', async () => {
      const mockSpec: Spec = {
        id: uuidv4(),
        epicId: 'epic-123',
        title: 'Test Spec',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'Test User',
        tags: [],
        content: '## Overview\n\nTest\n\n## Requirements\n\n1. Req\n\n## Technical Plan\n\n### Files to Change\n\n## Testing Strategy\n',
      };

      vi.spyOn(mockStorage, 'loadSpec').mockResolvedValue(mockSpec);

      const progressEvents: Array<{ phase: WorkflowPhase; progress: number }> = [];

      const input: WorkflowInput = {
        epicId: 'epic-123',
        goal: 'Test progress callbacks',
        includeCodebaseContext: false,
        onProgress: (phase, progress) => {
          progressEvents.push({ phase, progress });
        },
        onQuestionsGenerated: vi.fn().mockResolvedValue([]),
      };

      await orchestrator.executeWorkflow(input);

      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents.some(e => e.phase === 'clarification')).toBe(true);
      expect(progressEvents.some(e => e.phase === 'spec_generation')).toBe(true);
      expect(progressEvents.some(e => e.phase === 'ticket_generation')).toBe(true);
      expect(progressEvents.some(e => e.phase === 'complete')).toBe(true);
    });
  });

  describe('summary calculation', () => {
    it('should calculate correct summary from generated tickets', async () => {
      const mockSpec: Spec = {
        id: uuidv4(),
        epicId: 'epic-123',
        title: 'Test Spec',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'Test User',
        tags: [],
        content: '## Overview\n\nTest\n\n## Requirements\n\n1. Req\n\n## Technical Plan\n\n### Files to Change\n\n## Testing Strategy\n',
      };

      vi.spyOn(mockStorage, 'loadSpec').mockResolvedValue(mockSpec);

      const input: WorkflowInput = {
        epicId: 'epic-123',
        goal: 'Test summary',
        includeCodebaseContext: false,
        onQuestionsGenerated: vi.fn().mockResolvedValue([]),
      };

      const result = await orchestrator.executeWorkflow(input);

      expect(result.summary.totalTickets).toBe(2);
      expect(result.summary.estimatedTotalEffort).toBeDefined();
      expect(typeof result.summary.estimatedTotalEffort).toBe('string');
    });
  });
});

describe('TicketValidator', () => {
  let validator: TicketValidator;

  beforeEach(() => {
    validator = new TicketValidator();
  });

  describe('validateTicketCompleteness', () => {
    it('should pass for valid ticket', () => {
      const validTicket: Ticket = {
        id: uuidv4(),
        epicId: 'epic-123',
        specId: 'spec-123',
        title: 'Valid Ticket',
        status: 'todo',
        priority: 'high',
        estimatedEffort: '4h',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        content: `## Description

Implement feature X

Related Spec: [spec:spec-123]

## Acceptance Criteria
- [ ] Feature implemented
- [ ] Tests pass

## Implementation Steps
1. Create file
2. Implement logic

## Files to Change
- \`src/test.ts\` - Implement feature

## Testing Checklist
- [ ] Unit tests added
- [ ] Integration tests pass
- [ ] Manual testing completed`,
      };

      const result = validator.validateTicketCompleteness(validTicket);

      expect(result.valid).toBe(true);
      expect(result.issues.filter(i => i.severity === 'error').length).toBe(0);
    });

    it('should fail for ticket missing title', () => {
      const invalidTicket: Ticket = {
        id: uuidv4(),
        epicId: 'epic-123',
        specId: 'spec-123',
        title: '',
        status: 'todo',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        content: '## Description\n\nContent',
      };

      const result = validator.validateTicketCompleteness(invalidTicket);

      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.field === 'title')).toBe(true);
    });

    it('should warn for missing estimated effort', () => {
      const ticket: Ticket = {
        id: uuidv4(),
        epicId: 'epic-123',
        specId: 'spec-123',
        title: 'Ticket',
        status: 'todo',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        content: `## Description

Content

## Acceptance Criteria
- [ ] Criterion`,
      };

      const result = validator.validateTicketCompleteness(ticket);

      expect(result.issues.some(i => i.field === 'estimatedEffort')).toBe(true);
    });

    it('should validate effort format', () => {
      const validEffortTicket: Ticket = {
        id: uuidv4(),
        epicId: 'epic-123',
        specId: 'spec-123',
        title: 'Ticket',
        status: 'todo',
        priority: 'medium',
        estimatedEffort: '2h',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        content: `## Description\n\nContent`,
      };

      const invalidEffortTicket: Ticket = {
        ...validEffortTicket,
        estimatedEffort: 'invalid',
      };

      const validResult = validator.validateTicketCompleteness(validEffortTicket);
      const invalidResult = validator.validateTicketCompleteness(invalidEffortTicket);

      expect(validResult.issues.filter(i => i.field === 'estimatedEffort').length).toBe(0);
      expect(invalidResult.issues.filter(i => i.field === 'estimatedEffort').length).toBeGreaterThan(0);
    });
  });

  describe('validateTicketAlignment', () => {
    it('should validate spec reference', () => {
      const spec: Spec = {
        id: 'spec-123',
        epicId: 'epic-123',
        title: 'Test Spec',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'Test',
        tags: [],
        content: '## Overview\n\nTest\n\n## Requirements\n\n1. Req 1\n\n## Technical Plan\n\n### Files to Change\n- `src/test.ts` - Test\n\n## Testing Strategy\n',
      };

      const ticket: Ticket = {
        id: uuidv4(),
        epicId: 'epic-123',
        specId: 'spec-123',
        title: 'Ticket',
        status: 'todo',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        content: `## Description

Content

Related Spec: [spec:spec-123]`,
      };

      const result = validator.validateTicketAlignment(ticket, spec);

      expect(result.valid).toBe(true);
    });

    it('should fail for mismatched specId', () => {
      const spec: Spec = {
        id: 'spec-123',
        epicId: 'epic-123',
        title: 'Test Spec',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'Test',
        tags: [],
        content: 'Content',
      };

      const ticket: Ticket = {
        id: uuidv4(),
        epicId: 'epic-123',
        specId: 'spec-456',
        title: 'Ticket',
        status: 'todo',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        content: '## Description\n\nContent',
      };

      const result = validator.validateTicketAlignment(ticket, spec);

      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.field === 'specId')).toBe(true);
    });
  });
});

describe('TicketTemplates', () => {
  let templates: import('../templates/TicketTemplates').TicketTemplates;

  beforeEach(async () => {
    const module = await import('../templates/TicketTemplates');
    templates = new module.TicketTemplates();
  });

  describe('getTemplate', () => {
    it('should return feature template', () => {
      const template = templates.getTemplate('feature');

      expect(template.type).toBe('feature');
      expect(template.sections.some(s => s.name === 'Description')).toBe(true);
      expect(template.sections.some(s => s.name === 'Acceptance Criteria')).toBe(true);
    });

    it('should return bugfix template', () => {
      const template = templates.getTemplate('bugfix');

      expect(template.type).toBe('bugfix');
      expect(template.sections.some(s => s.name === 'Reproduction Steps')).toBe(true);
      expect(template.sections.some(s => s.name === 'Expected Behavior')).toBe(true);
    });

    it('should throw for unknown type', () => {
      expect(() => templates.getTemplate('unknown' as 'feature')).toThrow();
    });
  });

  describe('applyTemplate', () => {
    it('should apply feature template correctly', () => {
      const template = templates.getTemplate('feature');
      const data = {
        title: 'Test Feature',
        description: 'Implement a test feature',
        acceptanceCriteria: ['Criteria 1', 'Criteria 2'],
        implementationSteps: ['Step 1', 'Step 2'],
        filesToChange: [{ path: 'src/test.ts', description: 'Implement feature' }],
        estimatedEffort: '4h',
        priority: 'high' as const,
        tags: ['feature'],
        specId: 'spec-123',
      };

      const content = templates.applyTemplate(template, data);

      expect(content).toContain('## Description');
      expect(content).toContain('Implement a test feature');
      expect(content).toContain('Related Spec: [spec:spec-123]');
      expect(content).toContain('- [ ] Criteria 1');
      expect(content).toContain('1. Step 1');
      expect(content).toContain('`src/test.ts`');
    });
  });

  describe('getAvailableTypes', () => {
    it('should return all available ticket types', () => {
      const types = templates.getAvailableTypes();

      expect(types).toContain('feature');
      expect(types).toContain('bugfix');
      expect(types).toContain('refactor');
      expect(types).toContain('test');
      expect(types).toContain('documentation');
      expect(types.length).toBe(5);
    });
  });
});
