import { describe, it, expect } from '@jest/globals';
import { Epic, EpicStatus, PhaseStatus, Priority } from '../../../src/core/models/Epic';
import { Spec, SpecStatus } from '../../../src/core/models/Spec';
import { Ticket, TicketStatus } from '../../../src/core/models/Ticket';
import { Execution, ExecutionStatus, AgentType } from '../../../src/core/models/Execution';
import { Verification, Severity, IssueCategory, ApprovalStatus } from '../../../src/core/models/Verification';
import { validateEpic, validateSpec, validateTicket, validateExecution, validateVerification } from '../../../src/core/models/validators';

describe('Epic Model', () => {
  describe('Epic interface structure', () => {
    it('should have all required fields', () => {
      const epic: Epic = {
        id: 'test-id',
        title: 'Test Epic',
        overview: 'Test overview',
        phases: [],
        technicalPlan: {
          files: [],
          dependencies: [],
          edgeCases: [],
          nonFunctionalRequirements: [],
          testingStrategy: {
            unitTests: 'Test unit tests',
            integrationTests: 'Test integration tests',
            e2eTests: 'Test e2e tests'
          }
        },
        diagrams: [],
        metadata: {
          author: 'Test Author',
          tags: ['test'],
          priority: 'medium'
        },
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(epic.id).toBe('test-id');
      expect(epic.title).toBe('Test Epic');
      expect(epic.status).toBe('draft');
    });

    it('should allow optional fields in metadata', () => {
      const epic: Epic = {
        id: 'test-id',
        title: 'Test Epic',
        overview: 'Test overview',
        phases: [],
        technicalPlan: {
          files: [],
          dependencies: [],
          edgeCases: [],
          nonFunctionalRequirements: [],
          testingStrategy: {
            unitTests: 'Test unit tests',
            integrationTests: 'Test integration tests',
            e2eTests: 'Test e2e tests'
          }
        },
        diagrams: [],
        metadata: {
          author: 'Test Author',
          tags: ['test'],
          priority: 'high',
          targetDate: new Date('2024-12-31'),
          stakeholders: ['Team A', 'Team B']
        },
        status: 'planning',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(epic.metadata.targetDate).toBeDefined();
      expect(epic.metadata.stakeholders).toEqual(['Team A', 'Team B']);
    });
  });

  describe('EpicStatus enum', () => {
    it('should have all expected status values', () => {
      const statuses: EpicStatus[] = ['draft', 'planning', 'in_progress', 'in_review', 'completed', 'archived'];
      expect(statuses).toHaveLength(6);
      expect(statuses).toContain('draft');
      expect(statuses).toContain('in_progress');
      expect(statuses).toContain('completed');
    });
  });

  describe('PhaseStatus enum', () => {
    it('should have all expected status values', () => {
      const statuses: PhaseStatus[] = ['pending', 'in_progress', 'completed', 'blocked'];
      expect(statuses).toHaveLength(4);
      expect(statuses).toContain('pending');
      expect(statuses).toContain('blocked');
    });
  });

  describe('Priority enum', () => {
    it('should have all expected priority values', () => {
      const priorities: Priority[] = ['low', 'medium', 'high', 'critical'];
      expect(priorities).toHaveLength(4);
      expect(priorities).toContain('critical');
    });
  });
});

describe('Spec Model', () => {
  describe('Spec interface structure', () => {
    it('should have all required fields', () => {
      const spec: Spec = {
        id: 'spec-id',
        epicId: 'epic-id',
        title: 'Test Spec',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'Test Author',
        tags: ['test'],
        content: '# Test Spec'
      };

      expect(spec.id).toBe('spec-id');
      expect(spec.epicId).toBe('epic-id');
      expect(spec.status).toBe('draft');
    });
  });

  describe('SpecStatus enum', () => {
    it('should have all expected status values', () => {
      const statuses: SpecStatus[] = ['draft', 'in_review', 'approved', 'archived'];
      expect(statuses).toHaveLength(4);
      expect(statuses).toContain('in_review');
      expect(statuses).toContain('approved');
    });
  });
});

describe('Ticket Model', () => {
  describe('Ticket interface structure', () => {
    it('should have all required fields', () => {
      const ticket: Ticket = {
        id: 'ticket-id',
        epicId: 'epic-id',
        specId: 'spec-id',
        title: 'Test Ticket',
        status: 'todo',
        priority: 'medium',
        tags: ['test'],
        content: '# Test Ticket',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(ticket.id).toBe('ticket-id');
      expect(ticket.status).toBe('todo');
    });

    it('should allow optional assignee and estimatedEffort fields', () => {
      const ticket: Ticket = {
        id: 'ticket-id',
        epicId: 'epic-id',
        specId: 'spec-id',
        title: 'Test Ticket',
        status: 'in_progress',
        priority: 'high',
        tags: ['test'],
        content: '# Test Ticket',
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: 'test-user',
        estimatedEffort: '4h'
      };

      expect(ticket.assignee).toBe('test-user');
      expect(ticket.estimatedEffort).toBe('4h');
    });
  });

  describe('TicketStatus enum', () => {
    it('should have all expected status values', () => {
      const statuses: TicketStatus[] = ['todo', 'in_progress', 'in_review', 'done', 'blocked'];
      expect(statuses).toHaveLength(5);
      expect(statuses).toContain('in_review');
    });
  });
});

describe('Execution Model', () => {
  describe('Execution interface structure', () => {
    it('should have all required fields', () => {
      const execution: Execution = {
        id: 'exec-id',
        epicId: 'epic-id',
        specIds: [],
        ticketIds: [],
        agentType: 'cursor',
        handoffPrompt: 'Test prompt',
        status: 'pending',
        startedAt: new Date()
      };

      expect(execution.id).toBe('exec-id');
      expect(execution.status).toBe('pending');
    });

    it('should allow optional results and completedAt fields', () => {
      const execution: Execution = {
        id: 'exec-id',
        epicId: 'epic-id',
        specIds: ['spec-id'],
        ticketIds: ['ticket-id'],
        agentType: 'claude',
        handoffPrompt: 'Test prompt',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        results: {
          diffSummary: 'Test diff',
          agentNotes: 'Test notes',
          filesChanged: ['file1.ts']
        }
      };

      expect(execution.completedAt).toBeDefined();
      expect(execution.results).toBeDefined();
      expect(execution.results?.filesChanged).toHaveLength(1);
    });
  });

  describe('AgentType enum', () => {
    it('should have all expected agent types', () => {
      const agents: AgentType[] = ['cursor', 'claude', 'windsurf', 'cline', 'aider', 'custom'];
      expect(agents).toHaveLength(6);
      expect(agents).toContain('cursor');
      expect(agents).toContain('aider');
    });
  });

  describe('ExecutionStatus enum', () => {
    it('should have all expected status values', () => {
      const statuses: ExecutionStatus[] = ['pending', 'in_progress', 'completed', 'failed'];
      expect(statuses).toHaveLength(4);
    });
  });
});

describe('Verification Model', () => {
  describe('Verification interface structure', () => {
    it('should have all required fields', () => {
      const verification: Verification = {
        id: 'verify-id',
        epicId: 'epic-id',
        diffSource: {
          commitHash: 'abc123',
          branch: 'main',
          author: 'Test User',
          timestamp: new Date(),
          message: 'Test commit'
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
        createdAt: new Date()
      };

      expect(verification.id).toBe('verify-id');
      expect(verification.summary.passed).toBe(true);
    });

    it('should allow optional issue fields', () => {
      const verification: Verification = {
        id: 'verify-id',
        epicId: 'epic-id',
        diffSource: {
          commitHash: 'abc123',
          branch: 'main',
          author: 'Test User',
          timestamp: new Date(),
          message: 'Test commit'
        },
        analysis: {
          totalFiles: 1,
          totalLines: 10,
          additions: 5,
          deletions: 5,
          changedFiles: []
        },
        issues: [
          {
            id: 'issue-1',
            severity: 'High',
            category: 'security',
            file: 'src/auth.ts',
            line: 42,
            message: 'Security vulnerability detected',
            suggestion: 'Use parameterized queries',
            specRequirementId: 'SEC-001'
          }
        ],
        summary: {
          passed: false,
          totalIssues: 1,
          issueCounts: { Critical: 0, High: 1, Medium: 0, Low: 0 },
          recommendation: 'Fix security issues',
          approvalStatus: 'changes_requested'
        },
        createdAt: new Date()
      };

      expect(verification.issues).toHaveLength(1);
      expect(verification.issues[0].severity).toBe('High');
      expect(verification.summary.approvalStatus).toBe('changes_requested');
    });
  });

  describe('Severity enum', () => {
    it('should have all expected severity values', () => {
      const severities: Severity[] = ['Critical', 'High', 'Medium', 'Low'];
      expect(severities).toHaveLength(4);
    });
  });

  describe('IssueCategory enum', () => {
    it('should have all expected category values', () => {
      const categories: IssueCategory[] = [
        'security', 'performance', 'style', 'logic',
        'documentation', 'testing', 'architecture'
      ];
      expect(categories).toHaveLength(7);
    });
  });

  describe('ApprovalStatus enum', () => {
    it('should have all expected approval status values', () => {
      const statuses: ApprovalStatus[] = [
        'approved', 'approved_with_conditions', 'changes_requested', 'pending'
      ];
      expect(statuses).toHaveLength(4);
    });
  });
});
