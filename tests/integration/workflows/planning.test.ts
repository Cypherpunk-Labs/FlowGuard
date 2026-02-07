import * as assert from 'assert';
import * as path from 'path';
import { WorkflowOrchestrator, WorkflowInput, WorkflowPhase } from '../../../src/planning/WorkflowOrchestrator';
import { ArtifactStorage } from '../../../src/core/storage/ArtifactStorage';
import { CodebaseExplorer } from '../../../src/planning/codebase/CodebaseExplorer';
import { ReferenceResolver } from '../../../src/core/references/ReferenceResolver';
import { createMockLLMProvider } from '../../utils/mocks';
import { Spec } from '../../../src/core/models/Spec';
import { v4 as uuidv4 } from 'uuid';

suite('Planning Workflow Integration Tests', () => {
  let orchestrator: WorkflowOrchestrator;
  let storage: ArtifactStorage;
  let mockProvider: ReturnType<typeof createMockLLMProvider>;
  const testWorkspacePath = path.resolve(__dirname, '../../../test-workspace');

  setup(async () => {
    mockProvider = createMockLLMProvider();
    storage = new ArtifactStorage(testWorkspacePath);
    const codebaseExplorer = new CodebaseExplorer(testWorkspacePath);
    const referenceResolver = new ReferenceResolver(storage, testWorkspacePath);
    
    await storage.initialize();
    
    orchestrator = new WorkflowOrchestrator(
      mockProvider,
      codebaseExplorer,
      storage,
      referenceResolver
    );
  });

  test('should execute complete workflow from goal to tickets', async function() {
    this.timeout(30000);
    
    const epicId = uuidv4();
    
    const mockSpec: Spec = {
      id: uuidv4(),
      epicId: epicId,
      title: 'Integration Test Spec',
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      author: 'Integration Test',
      tags: ['integration-test'],
      content: '## Overview\n\nTest overview\n\n## Requirements\n\n1. Requirement 1\n\n## Technical Plan\n\n### Files to Change\n- `src/test.ts` - Test file\n\n## Testing Strategy\n\n- **Unit Tests**: All tests'
    };

    await storage.saveSpec(mockSpec);

    const input: WorkflowInput = {
      epicId: epicId,
      goal: 'Implement feature X for integration testing',
      tags: ['integration-test'],
      includeCodebaseContext: false,
      onQuestionsGenerated: async () => ['Scope is limited', 'Performance matters'],
    };

    const result = await orchestrator.executeWorkflow(input);

    assert.ok(result.spec, 'Result should have spec');
    assert.ok(result.tickets, 'Result should have tickets');
    assert.ok(result.summary, 'Result should have summary');
    assert.ok(result.summary.totalTickets > 0, 'Should have at least one ticket');
  });

  test('should emit progress events during workflow execution', async function() {
    this.timeout(30000);
    
    const progressEvents: Array<{ phase: WorkflowPhase; progress: number }> = [];

    const mockSpec: Spec = {
      id: uuidv4(),
      epicId: 'test-epic',
      title: 'Progress Test Spec',
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      author: 'Test',
      tags: [],
      content: '## Overview\n\nTest\n\n## Requirements\n\n1. Req\n\n## Technical Plan\n\n### Files to Change\n\n## Testing Strategy\n'
    };

    await storage.saveSpec(mockSpec);

    const input: WorkflowInput = {
      epicId: 'test-epic',
      goal: 'Test progress callbacks',
      includeCodebaseContext: false,
      onProgress: (phase: WorkflowPhase, progress: number) => {
        progressEvents.push({ phase, progress });
      },
      onQuestionsGenerated: async () => [],
    };

    await orchestrator.executeWorkflow(input);

    assert.ok(progressEvents.length > 0, 'Should have progress events');
    assert.ok(
      progressEvents.some(e => e.phase === 'clarification'),
      'Should have clarification phase'
    );
    assert.ok(
      progressEvents.some(e => e.phase === 'spec_generation'),
      'Should have spec_generation phase'
    );
    assert.ok(
      progressEvents.some(e => e.phase === 'ticket_generation'),
      'Should have ticket_generation phase'
    );
  });

  test('should calculate correct summary from generated tickets', async function() {
    this.timeout(30000);
    
    const mockSpec: Spec = {
      id: uuidv4(),
      epicId: 'test-epic',
      title: 'Summary Test Spec',
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      author: 'Test',
      tags: [],
      content: '## Overview\n\nTest\n\n## Requirements\n\n1. Req\n\n## Technical Plan\n\n### Files to Change\n\n## Testing Strategy\n'
    };

    await storage.saveSpec(mockSpec);

    const input: WorkflowInput = {
      epicId: 'test-epic',
      goal: 'Test summary calculation',
      includeCodebaseContext: false,
      onQuestionsGenerated: async () => [],
    };

    const result = await orchestrator.executeWorkflow(input);

    assert.ok(result.summary.totalTickets > 0, 'Should have totalTickets');
    assert.ok(
      typeof result.summary.estimatedTotalEffort === 'string',
      'estimatedTotalEffort should be a string'
    );
  });

  test('should persist spec to storage', async function() {
    this.timeout(30000);
    
    const epicId = uuidv4();
    
    const input: WorkflowInput = {
      epicId: epicId,
      goal: 'Test spec persistence',
      includeCodebaseContext: false,
      onQuestionsGenerated: async () => [],
    };

    const result = await orchestrator.executeWorkflow(input);
    
    const specs = await storage.listSpecs(epicId);
    assert.ok(specs.length > 0, 'Should have at least one spec in storage');
    
    const savedSpec = specs.find(s => s.id === result.spec.id);
    assert.ok(savedSpec, 'Saved spec should exist');
    assert.strictEqual(savedSpec.title, result.spec.title);
  });
});
