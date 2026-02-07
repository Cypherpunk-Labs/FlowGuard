import { describe, it, expect, beforeEach, afterEach,  beforeAll } from '@jest/globals';
import * as path from 'path';
import { ArtifactStorage } from '../../../src/core/storage/ArtifactStorage';
import { Spec } from '../../../src/core/models/Spec';
import { Ticket } from '../../../src/core/models/Ticket';
import { Execution } from '../../../src/core/models/Execution';
import { Verification } from '../../../src/core/models/Verification';
import { ValidationError, NotFoundError } from '../../../src/core/storage/types';
import { v4 as uuidv4 } from 'uuid';

const tempWorkspace = '/tmp/test-flowguard-storage';
let storage: ArtifactStorage;

function createTestSpec(overrides: Partial<Spec> = {}): Spec {
  return {
    id: uuidv4(),
    epicId: uuidv4(),
    title: 'Test Spec',
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    author: 'Test Author',
    tags: ['test'],
    content: '# Test Spec\n\nThis is test content.',
    ...overrides
  };
}

function createTestTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: uuidv4(),
    epicId: uuidv4(),
    specId: uuidv4(),
    title: 'Test Ticket',
    status: 'todo',
    priority: 'medium',
    tags: [],
    content: '# Test Ticket\n\nTest content.',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

function createTestExecution(overrides: Partial<Execution> = {}): Execution {
  return {
    id: uuidv4(),
    epicId: uuidv4(),
    specIds: [],
    ticketIds: [],
    agentType: 'cursor',
    handoffPrompt: 'Test prompt',
    status: 'pending',
    startedAt: new Date(),
    ...overrides
  };
}

function createTestVerification(overrides: Partial<Verification> = {}): Verification {
  return {
    id: uuidv4(),
    epicId: uuidv4(),
    diffSource: {
      commitHash: 'abc123',
      branch: 'main',
      author: 'Test',
      timestamp: new Date(),
      message: 'Test'
    },
    analysis: {
      totalFiles: 1,
      totalLines: 10,
      additions: 5,
      deletions: 5,
      changedFiles: []
    },
    issues: [],
    summary: {
      passed: true,
      totalIssues: 0,
      issueCounts: { Critical: 0, High: 0, Medium: 0, Low: 0 },
      recommendation: 'Approved',
      approvalStatus: 'approved'
    },
    createdAt: new Date(),
    ...overrides
  };
}

jest.mock('../../../src/core/storage/fileSystem', () => ({
  fileExists: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  listFiles: jest.fn(),
  deleteFile: jest.fn(),
  ensureDirectory: jest.fn(),
  readJson: jest.fn(),
  writeJson: jest.fn()
}));

import { fileExists, readFile, writeFile, listFiles, deleteFile, ensureDirectory } from '../../../src/core/storage/fileSystem';

describe('ArtifactStorage', () => {
  beforeAll(() => {
    storage = new ArtifactStorage(tempWorkspace);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(ensureDirectory).mockResolvedValue(undefined);
    jest.mocked(writeFile).mockResolvedValue(undefined);
    jest.mocked(deleteFile).mockResolvedValue(undefined);
  });

  describe('initialize', () => {
    it('should create all required directories', async () => {
      await storage.initialize();

      expect(ensureDirectory).toHaveBeenCalledTimes(6);
    });
  });

  describe('Spec CRUD operations', () => {
    it('should save spec with proper frontmatter', async () => {
      const spec = createTestSpec();
      jest.mocked(fileExists).mockResolvedValue(false);
      jest.mocked(readFile).mockResolvedValue(
        `---\nid: ${spec.id}\nepicId: ${spec.epicId}\ntitle: ${spec.title}\nstatus: ${spec.status}\ncreatedAt: ${spec.createdAt.toISOString()}\nupdatedAt: ${spec.updatedAt.toISOString()}\nauthor: ${spec.author}\ntags:\n  - test\n---\n# Test Spec\n\nThis is test content.`
      );
      jest.mocked(listFiles).mockResolvedValue([]);

      await storage.saveSpec(spec);

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining(`spec-${spec.id}.md`),
        expect.stringContaining('---')
      );
    });

    it('should load and parse spec correctly', async () => {
      const spec = createTestSpec();
      const specContent = `-----
id: ${spec.id}
epicId: ${spec.epicId}
title: ${spec.title}
status: ${spec.status}
createdAt: ${spec.createdAt.toISOString()}
updatedAt: ${spec.updatedAt.toISOString()}
author: ${spec.author}
tags:
  - test
---
# Test Spec
This is test content.`;

      jest.mocked(readFile).mockResolvedValue(specContent);
      jest.mocked(fileExists).mockResolvedValue(true);

      const loaded = await storage.loadSpec(spec.id);

      expect(loaded.id).toBe(spec.id);
      expect(loaded.title).toBe(spec.title);
      expect(loaded.status).toBe(spec.status);
    });

    it('should throw ValidationError for malformed frontmatter', async () => {
      jest.mocked(readFile).mockResolvedValue('---\ninvalid: data\n---');
      jest.mocked(fileExists).mockResolvedValue(true);

      await expect(storage.loadSpec('test-id')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for missing spec', async () => {
      jest.mocked(fileExists).mockResolvedValue(false);

      await expect(storage.loadSpec('missing-id')).rejects.toThrow(NotFoundError);
    });

    it('should list specs filtered by epicId', async () => {
      const epicId = uuidv4();
      const spec1 = createTestSpec({ epicId });
      const spec2 = createTestSpec({ epicId });
      const otherSpec = createTestSpec({ epicId: uuidv4() });

      const specContent = `---\nid: ID\nepicId: ${epicId}\ntitle: Title\nstatus: draft\ncreatedAt: ${new Date().toISOString()}\nupdatedAt: ${new Date().toISOString()}\nauthor: Author\ntags: []\n---`;

      jest.mocked(listFiles).mockResolvedValue([
        `spec-${spec1.id}.md`,
        `spec-${spec2.id}.md`,
        `spec-${otherSpec.id}.md`
      ]);
      jest.mocked(readFile).mockResolvedValue(specContent);
      jest.mocked(fileExists).mockResolvedValue(true);

      const specs = await storage.listSpecs(epicId);

      expect(specs).toHaveLength(2);
      specs.forEach(s => expect(s.epicId).toBe(epicId));
    });

    it('should delete spec successfully', async () => {
      const specId = 'test-spec-id';
      jest.mocked(fileExists).mockResolvedValue(true);

      await storage.deleteSpec(specId);

      expect(deleteFile).toHaveBeenCalledWith(expect.stringContaining(specId));
    });

    it('should throw NotFoundError when deleting missing spec', async () => {
      jest.mocked(fileExists).mockResolvedValue(false);

      await expect(storage.deleteSpec('missing')).rejects.toThrow(NotFoundError);
    });
  });

  describe('Ticket CRUD operations', () => {
    it('should save ticket with frontmatter', async () => {
      const ticket = createTestTicket();
      jest.mocked(fileExists).mockResolvedValue(false);
      jest.mocked(listFiles).mockResolvedValue([]);
      jest.mocked(readFile).mockResolvedValue(
        `---\nid: ${ticket.id}\nepicId: ${ticket.epicId}\nspecId: ${ticket.specId}\ntitle: ${ticket.title}\nstatus: ${ticket.status}\npriority: ${ticket.priority}\ncreatedAt: ${ticket.createdAt.toISOString()}\nupdatedAt: ${ticket.updatedAt.toISOString()}\ntags: []\n---\n# Test Ticket`
      );

      await storage.saveTicket(ticket);

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining(`ticket-${ticket.id}.md`),
        expect.any(String)
      );
    });

    it('should load and parse ticket correctly', async () => {
      const ticket = createTestTicket();
      const content = `---\nid: ${ticket.id}\nepicId: ${ticket.epicId}\nspecId: ${ticket.specId}\ntitle: ${ticket.title}\nstatus: ${ticket.status}\npriority: ${ticket.priority}\ncreatedAt: ${ticket.createdAt.toISOString()}\nupdatedAt: ${ticket.updatedAt.toISOString()}\ntags: []\n---\n# Test Ticket`;

      jest.mocked(readFile).mockResolvedValue(content);
      jest.mocked(fileExists).mockResolvedValue(true);

      const loaded = await storage.loadTicket(ticket.id);

      expect(loaded.id).toBe(ticket.id);
      expect(loaded.priority).toBe(ticket.priority);
    });

    it('should list tickets filtered by epicId and specId', async () => {
      const epicId = uuidv4();
      const specId = uuidv4();
      const ticket1 = createTestTicket({ epicId, specId });
      const otherTicket = createTestTicket({ epicId, specId: uuidv4() });

      const content = `---\nid: ID\tepicId: ${epicId}\nspecId: ${specId}\ntitle: Title\nstatus: todo\npriority: medium\ncreatedAt: ${new Date().toISOString()}\nupdatedAt: ${new Date().toISOString()}\ntags: []\n---`;

      jest.mocked(listFiles).mockResolvedValue([`ticket-${ticket1.id}.md`, `ticket-${otherTicket.id}.md`]);
      jest.mocked(readFile).mockResolvedValue(content);
      jest.mocked(fileExists).mockResolvedValue(true);

      const tickets = await storage.listTickets(epicId, specId);

      expect(tickets).toHaveLength(1);
    });

    it('should delete ticket successfully', async () => {
      jest.mocked(fileExists).mockResolvedValue(true);

      await storage.deleteTicket('test-id');

      expect(deleteFile).toHaveBeenCalled();
    });
  });

  describe('Execution CRUD operations', () => {
    it('should save execution with frontmatter', async () => {
      const execution = createTestExecution();
      jest.mocked(fileExists).mockResolvedValue(false);
      jest.mocked(listFiles).mockResolvedValue([]);
      jest.mocked(readFile).mockResolvedValue(
        `---\nid: ${execution.id}\nepicId: ${execution.epicId}\nspecIds: []\nticketIds: []\nagentType: ${execution.agentType}\nhandoffPrompt: ${execution.handoffPrompt}\nstatus: ${execution.status}\nstartedAt: ${execution.startedAt.toISOString()}\n---`
      );

      await storage.saveExecution(execution);

      expect(writeFile).toHaveBeenCalled();
    });

    it('should load and parse execution correctly', async () => {
      const execution = createTestExecution();
      const content = `---\nid: ${execution.id}\nepicId: ${execution.epicId}\nspecIds: []\nticketIds: []\nagentType: ${execution.agentType}\nhandoffPrompt: ${execution.handoffPrompt}\nstatus: ${execution.status}\nstartedAt: ${execution.startedAt.toISOString()}\n---`;

      jest.mocked(readFile).mockResolvedValue(content);
      jest.mocked(fileExists).mockResolvedValue(true);

      const loaded = await storage.loadExecution(execution.id);

      expect(loaded.id).toBe(execution.id);
      expect(loaded.agentType).toBe(execution.agentType);
    });

    it('should list executions filtered by epicId', async () => {
      const epicId = uuidv4();
      const exec1 = createTestExecution({ epicId });
      const otherExec = createTestExecution({ epicId: uuidv4() });

      const content = `---\nid: ID\epicId: ${epicId}\nspecIds: []\nticketIds: []\nagentType: cursor\nhandoffPrompt: test\nstatus: pending\nstartedAt: ${new Date().toISOString()}\n---`;

      jest.mocked(listFiles).mockResolvedValue([`execution-${exec1.id}.md`, `execution-${otherExec.id}.md`]);
      jest.mocked(readFile).mockResolvedValue(content);
      jest.mocked(fileExists).mockResolvedValue(true);

      const executions = await storage.listExecutions(epicId);

      expect(executions).toHaveLength(1);
    });

    it('should delete execution successfully', async () => {
      jest.mocked(fileExists).mockResolvedValue(true);

      await storage.deleteExecution('test-id');

      expect(deleteFile).toHaveBeenCalled();
    });
  });

  describe('Verification CRUD operations', () => {
    it('should save verification with frontmatter', async () => {
      const verification = createTestVerification();
      jest.mocked(fileExists).mockResolvedValue(false);
      jest.mocked(listFiles).mockResolvedValue([]);
      jest.mocked(readFile).mockResolvedValue(`---\nid: ${verification.id}\nepicId: ${verification.epicId}\n---`);

      await storage.saveVerification(verification);

      expect(writeFile).toHaveBeenCalled();
    });

    it('should load and parse verification correctly', async () => {
      const verification = createTestVerification();
      const content = `---\nid: ${verification.id}\nepicId: ${verification.epicId}\ndiffSource:\n  commitHash: abc123\n  branch: main\n  author: Test\n  timestamp: ${verification.diffSource.timestamp.toISOString()}\n  message: test\nanalysis:\n  totalFiles: 1\n  totalLines: 10\n  additions: 5\n  deletions: 5\n  changedFiles: []\nissues: []\nsummary:\n  passed: true\n  totalIssues: 0\n  issueCounts:\n    Critical: 0\n    High: 0\n    Medium: 0\n    Low: 0\n  recommendation: Approved\n  approvalStatus: approved\ncreatedAt: ${verification.createdAt.toISOString()}\n---`;

      jest.mocked(readFile).mockResolvedValue(content);
      jest.mocked(fileExists).mockResolvedValue(true);

      const loaded = await storage.loadVerification(verification.id);

      expect(loaded.id).toBe(verification.id);
      expect(loaded.summary.passed).toBe(true);
    });

    it('should list verifications filtered by epicId', async () => {
      const epicId = uuidv4();
      const v1 = createTestVerification({ epicId });
      const otherV = createTestVerification({ epicId: uuidv4() });

      const content = `---\nid: ID\epicId: ${epicId}\ndiffSource:\n  commitHash: abc\n  branch: main\n  author: test\n  timestamp: ${new Date().toISOString()}\n  message: test\nanalysis:\n  totalFiles: 0\n  totalLines: 0\n  additions: 0\n  deletions: 0\n  changedFiles: []\nissues: []\nsummary:\n  passed: true\n  totalIssues: 0\n  issueCounts:\n    Critical: 0\n    High: 0\n    Medium: 0\n    Low: 0\n  recommendation: test\n  approvalStatus: approved\ncreatedAt: ${new Date().toISOString()}\n---`;

      jest.mocked(listFiles).mockResolvedValue([`verification-${v1.id}.md`, `verification-${otherV.id}.md`]);
      jest.mocked(readFile).mockResolvedValue(content);
      jest.mocked(fileExists).mockResolvedValue(true);

      const verifications = await storage.listVerifications(epicId);

      expect(verifications).toHaveLength(1);
    });

    it('should delete verification successfully', async () => {
      jest.mocked(fileExists).mockResolvedValue(true);

      await storage.deleteVerification('test-id');

      expect(deleteFile).toHaveBeenCalled();
    });
  });

  describe('Template operations', () => {
    it('should save and load template', async () => {
      const templateName = 'feature-template';
      const templateContent = '# Feature Template\n\nTemplate content';

      jest.mocked(fileExists).mockResolvedValue(false);
      jest.mocked(readFile).mockResolvedValue(`---\nname: ${templateName}\n---\n${templateContent}`);

      await storage.saveTemplate(templateName, templateContent);
      const loaded = await storage.loadTemplate(templateName);

      expect(loaded).toBe(templateContent);
    });

    it('should list templates', async () => {
      jest.mocked(listFiles).mockResolvedValue(['template1.md', 'template2.md']);

      const templates = await storage.listTemplates();

      expect(templates).toEqual(['template1.md', 'template2.md']);
    });

    it('should delete template successfully', async () => {
      jest.mocked(fileExists).mockResolvedValue(true);

      await storage.deleteTemplate('test-template');

      expect(deleteFile).toHaveBeenCalled();
    });
  });

  describe('getArtifactPath', () => {
    it('should return correct paths for each artifact type', () => {
      const specPath = (storage as any).getSpecPath('test-id');
      const ticketPath = (storage as any).getTicketPath('test-id');
      const execPath = (storage as any).getExecutionPath('test-id');
      const verifyPath = (storage as any).getVerificationPath('test-id');

      expect(specPath).toContain('spec-test-id.md');
      expect(ticketPath).toContain('ticket-test-id.md');
      expect(execPath).toContain('execution-test-id.md');
      expect(verifyPath).toContain('verification-test-id.md');
    });
  });

  describe('Error handling', () => {
    it('should handle file read errors gracefully in list operations', async () => {
      jest.mocked(listFiles).mockResolvedValue(['spec-1.md']);
      jest.mocked(readFile).mockRejectedValue(new Error('Read error'));

      const specs = await storage.listSpecs();

      expect(specs).toEqual([]);
    });

    it('should throw ValidationError for missing required fields', async () => {
      const content = '---\nid: test\n---';

      jest.mocked(readFile).mockResolvedValue(content);
      jest.mocked(fileExists).mockResolvedValue(true);

      await expect(storage.loadSpec('test')).rejects.toThrow(ValidationError);
    });
  });
});
