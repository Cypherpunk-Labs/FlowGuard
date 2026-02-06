import { describe, it, expect } from '@jest/globals';
import { validateEpic, validateSpec, validateTicket, validateExecution, validateVerification } from '../../../src/core/models/validators';

describe('Validators', () => {
  describe('validateEpic', () => {
    it('should validate a valid epic object', () => {
      const validEpic = {
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
            unitTests: 'Tests',
            integrationTests: 'Tests',
            e2eTests: 'Tests'
          }
        },
        diagrams: [],
        metadata: {
          author: 'Test Author',
          tags: ['test'],
          priority: 'medium'
        },
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = validateEpic(validEpic);
      expect(result.id).toBe('test-id');
      expect(result.title).toBe('Test Epic');
    });

    it('should throw error for invalid epic data', () => {
      expect(() => validateEpic(null)).toThrow('Epic data must be an object');
      expect(() => validateEpic('string')).toThrow('Epic data must be an object');
      expect(() => validateEpic([])).toThrow('Epic data must be an object');
    });

    it('should throw error for missing required fields', () => {
      const invalidEpic = {
        title: 'Test Epic'
      };

      expect(() => validateEpic(invalidEpic)).toThrow('Missing required field: id');
    });

    it('should throw error for invalid enum values', () => {
      const invalidEpic = {
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
            unitTests: 'Tests',
            integrationTests: 'Tests',
            e2eTests: 'Tests'
          }
        },
        diagrams: [],
        metadata: {
          author: 'Test Author',
          tags: ['test'],
          priority: 'invalid'
        },
        status: 'invalid-status',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      expect(() => validateEpic(invalidEpic)).toThrow('Field "priority" must be one of');

      const invalidEpicStatus = {
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
            unitTests: 'Tests',
            integrationTests: 'Tests',
            e2eTests: 'Tests'
          }
        },
        diagrams: [],
        metadata: {
          author: 'Test Author',
          tags: ['test'],
          priority: 'medium'
        },
        status: 'invalid-status',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      expect(() => validateEpic(invalidEpicStatus)).toThrow('Field "status" must be one of: draft, planning, in_progress, in_review, completed, archived');
    });

    it('should handle edge cases for arrays', () => {
      const epicWithEmptyArrays = {
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
            unitTests: 'Tests',
            integrationTests: 'Tests',
            e2eTests: 'Tests'
          }
        },
        diagrams: [],
        metadata: {
          author: 'Test Author',
          tags: [],
          priority: 'low'
        },
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = validateEpic(epicWithEmptyArrays);
      expect(result.metadata.tags).toEqual([]);
    });
  });

  describe('validateSpec', () => {
    it('should validate a valid spec object', () => {
      const validSpec = {
        id: 'spec-id',
        epicId: 'epic-id',
        title: 'Test Spec',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'Test Author',
        tags: ['test'],
        content: '# Test Spec'
      };

      const result = validateSpec(validSpec);
      expect(result.id).toBe('spec-id');
      expect(result.status).toBe('draft');
    });

    it('should throw error for missing required fields', () => {
      const invalidSpecOnlyId = { id: 'spec-id' };
      expect(() => validateSpec(invalidSpecOnlyId)).toThrow('Missing required field: epicId');

      const invalidSpecMissingTitle = {
        id: 'spec-id',
        epicId: 'epic-id'
      };
      expect(() => validateSpec(invalidSpecMissingTitle)).toThrow('Missing required field: title');
    });

    it('should throw error for invalid status enum', () => {
      const invalidSpec = {
        id: 'spec-id',
        epicId: 'epic-id',
        title: 'Test Spec',
        status: 'invalid',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'Test Author',
        tags: [],
        content: '# Test Spec'
      };

      expect(() => validateSpec(invalidSpec)).toThrow('Field "status" must be one of: draft, in_review, approved, archived');
    });
  });

  describe('validateTicket', () => {
    it('should validate a valid ticket object', () => {
      const validTicket = {
        id: 'ticket-id',
        epicId: 'epic-id',
        specId: 'spec-id',
        title: 'Test Ticket',
        status: 'todo',
        priority: 'medium',
        tags: ['test'],
        content: '# Test Ticket',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = validateTicket(validTicket);
      expect(result.id).toBe('ticket-id');
      expect(result.status).toBe('todo');
    });

    it('should throw error for invalid enum values', () => {
      const invalidTicket = {
        id: 'ticket-id',
        epicId: 'epic-id',
        specId: 'spec-id',
        title: 'Test Ticket',
        status: 'invalid-status',
        priority: 'invalid-priority',
        tags: [],
        content: '# Test Ticket',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      expect(() => validateTicket(invalidTicket)).toThrow('Field "status" must be one of');

      const invalidTicketPriority = {
        id: 'ticket-id',
        epicId: 'epic-id',
        specId: 'spec-id',
        title: 'Test Ticket',
        status: 'todo',
        priority: 'invalid-priority',
        tags: [],
        content: '# Test Ticket',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      expect(() => validateTicket(invalidTicketPriority)).toThrow('Field "priority" must be one of');
    });

    it('should handle optional fields', () => {
      const ticketWithOptional = {
        id: 'ticket-id',
        epicId: 'epic-id',
        specId: 'spec-id',
        title: 'Test Ticket',
        status: 'in_progress',
        priority: 'high',
        tags: ['test'],
        content: '# Test Ticket',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignee: 'test-user',
        estimatedEffort: '4h'
      };

      const result = validateTicket(ticketWithOptional);
      expect(result.assignee).toBe('test-user');
      expect(result.estimatedEffort).toBe('4h');
    });
  });

  describe('validateExecution', () => {
    it('should validate a valid execution object', () => {
      const validExecution = {
        id: 'exec-id',
        epicId: 'epic-id',
        specIds: [],
        ticketIds: [],
        agentType: 'cursor',
        handoffPrompt: 'Test prompt',
        status: 'pending',
        startedAt: new Date().toISOString()
      };

      const result = validateExecution(validExecution);
      expect(result.id).toBe('exec-id');
      expect(result.agentType).toBe('cursor');
    });

    it('should throw error for invalid date format', () => {
      const invalidExecution = {
        id: 'exec-id',
        epicId: 'epic-id',
        specIds: [],
        ticketIds: [],
        agentType: 'cursor',
        handoffPrompt: 'Test prompt',
        status: 'pending',
        startedAt: 'invalid-date'
      };

      expect(() => validateExecution(invalidExecution)).toThrow('Field "startedAt" has invalid date format');
    });

    it('should throw error for invalid enum values', () => {
      const invalidExecutionAgent = {
        id: 'exec-id',
        epicId: 'epic-id',
        specIds: [],
        ticketIds: [],
        agentType: 'invalid',
        handoffPrompt: 'Test prompt',
        status: 'pending',
        startedAt: new Date().toISOString()
      };

      expect(() => validateExecution(invalidExecutionAgent)).toThrow('Field "agentType" must be one of');

      const invalidExecutionStatus = {
        id: 'exec-id',
        epicId: 'epic-id',
        specIds: [],
        ticketIds: [],
        agentType: 'cursor',
        handoffPrompt: 'Test prompt',
        status: 'invalid',
        startedAt: new Date().toISOString()
      };
      expect(() => validateExecution(invalidExecutionStatus)).toThrow('Field "status" must be one of');
    });
  });

  describe('validateVerification', () => {
    it('should validate a valid verification object', () => {
      const validVerification = {
        id: 'verify-id',
        epicId: 'epic-id',
        diffSource: {
          commitHash: 'abc123',
          branch: 'main',
          author: 'Test User',
          timestamp: new Date().toISOString(),
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
        createdAt: new Date().toISOString()
      };

      const result = validateVerification(validVerification);
      expect(result.id).toBe('verify-id');
      expect(result.summary.passed).toBe(true);
    });

    it('should throw error for non-object data', () => {
      expect(() => validateVerification(null)).toThrow('Verification data must be an object');
      expect(() => validateVerification('string')).toThrow('Verification data must be an object');
    });

    it('should validate nested issue structures', () => {
      const verificationWithIssues = {
        id: 'verify-id',
        epicId: 'epic-id',
        diffSource: {
          commitHash: 'abc123',
          branch: 'main',
          author: 'Test User',
          timestamp: new Date().toISOString(),
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
            message: 'Security issue',
            fixSuggestion: {
              description: 'Fix it',
              steps: ['Step 1', 'Step 2']
            }
          }
        ],
        summary: {
          passed: false,
          totalIssues: 1,
          issueCounts: { Critical: 0, High: 1, Medium: 0, Low: 0 },
          recommendation: 'Fix issues',
          approvalStatus: 'changes_requested'
        },
        createdAt: new Date().toISOString()
      };

      const result = validateVerification(verificationWithIssues);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].severity).toBe('High');
    });

    it('should handle empty verification summary gracefully', () => {
      const verificationWithNoSummary = {
        id: 'verify-id',
        epicId: 'epic-id',
        diffSource: {
          commitHash: 'abc123',
          branch: 'main',
          author: 'Test User',
          timestamp: new Date().toISOString(),
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
        createdAt: new Date().toISOString()
      };

      const result = validateVerification(verificationWithNoSummary);
      expect(result.summary.passed).toBe(false);
      expect(result.summary.issueCounts).toEqual({ Critical: 0, High: 0, Medium: 0, Low: 0 });
    });
  });
});
