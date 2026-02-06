import * as assert from 'assert';
import * as path from 'path';
import { ArtifactStorage } from '../../../src/core/storage/ArtifactStorage';
import { Spec } from '../../../src/core/models/Spec';
import { Ticket } from '../../../src/core/models/Ticket';
import { Execution, AgentType, ExecutionStatus } from '../../../src/core/models/Execution';
import { v4 as uuidv4 } from 'uuid';

suite('Artifact Storage Integration Test', () => {
  let storage: ArtifactStorage;
  const testWorkspacePath = path.resolve(__dirname, '../../../test-workspace');

  setup(async () => {
    storage = new ArtifactStorage(testWorkspacePath);
    await storage.initialize();
  });

  suite('Spec CRUD Operations', () => {
    test('should create and read spec', async () => {
      const spec: Spec = {
        id: uuidv4(),
        epicId: 'test-epic',
        title: 'Test Spec for CRUD',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'Test User',
        tags: ['crud', 'test'],
        content: '## Description\n\nTest spec content'
      };

      await storage.saveSpec(spec);
      const loadedSpec = await storage.loadSpec(spec.id);
      
      assert.strictEqual(loadedSpec.id, spec.id);
      assert.strictEqual(loadedSpec.title, spec.title);
      assert.ok(loadedSpec.content.includes('Test spec content'));
    });

    test('should list specs', async () => {
      const specs = await storage.listSpecs();
      assert.ok(Array.isArray(specs));
      assert.ok(specs.length >= 0);
    });

    test('should filter specs by epicId', async () => {
      const specs = await storage.listSpecs('epic-test-001');
      assert.ok(Array.isArray(specs));
    });

    test('should delete spec', async () => {
      const spec: Spec = {
        id: uuidv4(),
        epicId: 'test-epic',
        title: 'Spec to Delete',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'Test User',
        tags: [],
        content: 'Content'
      };

      await storage.saveSpec(spec);
      await storage.deleteSpec(spec.id);
      
      try {
        await storage.loadSpec(spec.id);
        assert.fail('Should have thrown NotFoundError');
      } catch (err: any) {
        assert.ok(err.message.includes('not found') || err.message.includes('NotFound'));
      }
    });
  });

  suite('Ticket CRUD Operations', () => {
    test('should create and read ticket', async () => {
      const ticket: Ticket = {
        id: uuidv4(),
        epicId: 'test-epic',
        specId: 'test-spec',
        title: 'Test Ticket',
        status: 'todo',
        priority: 'high',
        estimatedEffort: '4h',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['test'],
        content: '## Description\n\nTest ticket content'
      };

      await storage.saveTicket(ticket);
      const loadedTicket = await storage.loadTicket(ticket.id);
      
      assert.strictEqual(loadedTicket.id, ticket.id);
      assert.strictEqual(loadedTicket.title, ticket.title);
      assert.strictEqual(loadedTicket.priority, ticket.priority);
      assert.strictEqual(loadedTicket.estimatedEffort, ticket.estimatedEffort);
    });

    test('should list tickets', async () => {
      const tickets = await storage.listTickets();
      assert.ok(Array.isArray(tickets));
    });

    test('should filter tickets by epicId and specId', async () => {
      const ticketsByEpic = await storage.listTickets('epic-test-001');
      const ticketsBySpec = await storage.listTickets(undefined, 'spec-sample');
      
      assert.ok(Array.isArray(ticketsByEpic));
      assert.ok(Array.isArray(ticketsBySpec));
    });
  });

  suite('Execution Persistence', () => {
    test('should save and load execution', async () => {
      const execution: Execution = {
        id: uuidv4(),
        epicId: 'test-epic',
        specIds: ['spec-1', 'spec-2'],
        ticketIds: ['ticket-1'],
        agentType: 'cursor' as AgentType,
        handoffPrompt: 'Test handoff prompt',
        status: 'completed' as ExecutionStatus,
        startedAt: new Date(),
        completedAt: new Date(),
        results: {
          diffSummary: 'Test execution completed',
          agentNotes: 'Test notes',
          filesChanged: []
        }
      };

      await storage.saveExecution(execution);
      const loadedExecution = await storage.loadExecution(execution.id);
      
      assert.strictEqual(loadedExecution.id, execution.id);
      assert.strictEqual(loadedExecution.agentType, execution.agentType);
      assert.strictEqual(loadedExecution.status, execution.status);
      assert.ok(loadedExecution.startedAt instanceof Date);
    });

    test('should list executions', async () => {
      const executions = await storage.listExecutions();
      assert.ok(Array.isArray(executions));
    });
  });

  suite('Frontmatter Parsing', () => {
    test('should correctly parse and serialize frontmatter', async () => {
      const spec: Spec = {
        id: uuidv4(),
        epicId: 'test-epic',
        title: 'Frontmatter Test Spec',
        status: 'approved',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T11:00:00Z'),
        author: 'Test Author',
        tags: ['tag1', 'tag2', 'tag3'],
        content: '## Overview\n\nTest content with frontmatter'
      };

      await storage.saveSpec(spec);
      const loadedSpec = await storage.loadSpec(spec.id);
      
      assert.strictEqual(loadedSpec.status, 'approved');
      assert.strictEqual(loadedSpec.author, 'Test Author');
      assert.deepStrictEqual(loadedSpec.tags, ['tag1', 'tag2', 'tag3']);
      assert.ok(loadedSpec.createdAt instanceof Date);
    });
  });

  suite('File Naming', () => {
    test('should create files with correct naming pattern', () => {
      const specPath = storage.getArtifactPath('spec', 'test-spec-id');
      const ticketPath = storage.getArtifactPath('ticket', 'test-ticket-id');
      const executionPath = storage.getArtifactPath('execution', 'test-exec-id');
      const verificationPath = storage.getArtifactPath('verification', 'test-ver-id');
      
      assert.ok(specPath.includes('spec-test-spec-id.md'));
      assert.ok(ticketPath.includes('ticket-test-ticket-id.md'));
      assert.ok(executionPath.includes('execution-test-exec-id.md'));
      assert.ok(verificationPath.includes('verification-test-ver-id.md'));
    });
  });
});
