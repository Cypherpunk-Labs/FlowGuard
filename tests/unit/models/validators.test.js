"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const validators_1 = require("../../src/core/models/validators");
(0, vitest_1.describe)('Validators', () => {
    (0, vitest_1.describe)('validateEpic', () => {
        (0, vitest_1.it)('should validate a valid epic object', () => {
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
            const result = (0, validators_1.validateEpic)(validEpic);
            (0, vitest_1.expect)(result.id).toBe('test-id');
            (0, vitest_1.expect)(result.title).toBe('Test Epic');
        });
        (0, vitest_1.it)('should throw error for invalid epic data', () => {
            (0, vitest_1.expect)(() => (0, validators_1.validateEpic)(null)).toThrow('Epic data must be an object');
            (0, vitest_1.expect)(() => (0, validators_1.validateEpic)('string')).toThrow('Epic data must be an object');
            (0, vitest_1.expect)(() => (0, validators_1.validateEpic)([])).toThrow('Epic data must be an object');
        });
        (0, vitest_1.it)('should throw error for missing required fields', () => {
            const invalidEpic = {
                title: 'Test Epic'
            };
            (0, vitest_1.expect)(() => (0, validators_1.validateEpic)(invalidEpic)).toThrow('Missing required field: id');
        });
        (0, vitest_1.it)('should throw error for invalid enum values', () => {
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
            (0, vitest_1.expect)(() => (0, validators_1.validateEpic)(invalidEpic)).toThrow('Field "priority" must be one of');
            (0, vitest_1.expect)(() => (0, validators_1.validateEpic)(invalidEpic)).toThrow('Field "status" must be one of');
        });
        (0, vitest_1.it)('should handle edge cases for arrays', () => {
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
            const result = (0, validators_1.validateEpic)(epicWithEmptyArrays);
            (0, vitest_1.expect)(result.metadata.tags).toEqual([]);
        });
    });
    (0, vitest_1.describe)('validateSpec', () => {
        (0, vitest_1.it)('should validate a valid spec object', () => {
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
            const result = (0, validators_1.validateSpec)(validSpec);
            (0, vitest_1.expect)(result.id).toBe('spec-id');
            (0, vitest_1.expect)(result.status).toBe('draft');
        });
        (0, vitest_1.it)('should throw error for missing required fields', () => {
            const invalidSpec = {
                id: 'spec-id'
            };
            (0, vitest_1.expect)(() => (0, validators_1.validateSpec)(invalidSpec)).toThrow('Missing required field: epicId');
            (0, vitest_1.expect)(() => (0, validators_1.validateSpec)(invalidSpec)).toThrow('Missing required field: title');
        });
        (0, vitest_1.it)('should throw error for invalid status enum', () => {
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
            (0, vitest_1.expect)(() => (0, validators_1.validateSpec)(invalidSpec)).toThrow('Field "status" must be one of: draft, in_review, approved, archived');
        });
    });
    (0, vitest_1.describe)('validateTicket', () => {
        (0, vitest_1.it)('should validate a valid ticket object', () => {
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
            const result = (0, validators_1.validateTicket)(validTicket);
            (0, vitest_1.expect)(result.id).toBe('ticket-id');
            (0, vitest_1.expect)(result.status).toBe('todo');
        });
        (0, vitest_1.it)('should throw error for invalid enum values', () => {
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
            (0, vitest_1.expect)(() => (0, validators_1.validateTicket)(invalidTicket)).toThrow('Field "status" must be one of');
            (0, vitest_1.expect)(() => (0, validators_1.validateTicket)(invalidTicket)).toThrow('Field "priority" must be one of');
        });
        (0, vitest_1.it)('should handle optional fields', () => {
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
            const result = (0, validators_1.validateTicket)(ticketWithOptional);
            (0, vitest_1.expect)(result.assignee).toBe('test-user');
            (0, vitest_1.expect)(result.estimatedEffort).toBe('4h');
        });
    });
    (0, vitest_1.describe)('validateExecution', () => {
        (0, vitest_1.it)('should validate a valid execution object', () => {
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
            const result = (0, validators_1.validateExecution)(validExecution);
            (0, vitest_1.expect)(result.id).toBe('exec-id');
            (0, vitest_1.expect)(result.agentType).toBe('cursor');
        });
        (0, vitest_1.it)('should throw error for invalid date format', () => {
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
            (0, vitest_1.expect)(() => (0, validators_1.validateExecution)(invalidExecution)).toThrow('Field "startedAt" has invalid date format');
        });
        (0, vitest_1.it)('should throw error for invalid enum values', () => {
            const invalidExecution = {
                id: 'exec-id',
                epicId: 'epic-id',
                specIds: [],
                ticketIds: [],
                agentType: 'invalid',
                handoffPrompt: 'Test prompt',
                status: 'invalid',
                startedAt: new Date().toISOString()
            };
            (0, vitest_1.expect)(() => (0, validators_1.validateExecution)(invalidExecution)).toThrow('Field "agentType" must be one of');
            (0, vitest_1.expect)(() => (0, validators_1.validateExecution)(invalidExecution)).toThrow('Field "status" must be one of');
        });
    });
    (0, vitest_1.describe)('validateVerification', () => {
        (0, vitest_1.it)('should validate a valid verification object', () => {
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
            const result = (0, validators_1.validateVerification)(validVerification);
            (0, vitest_1.expect)(result.id).toBe('verify-id');
            (0, vitest_1.expect)(result.summary.passed).toBe(true);
        });
        (0, vitest_1.it)('should throw error for non-object data', () => {
            (0, vitest_1.expect)(() => (0, validators_1.validateVerification)(null)).toThrow('Verification data must be an object');
            (0, vitest_1.expect)(() => (0, validators_1.validateVerification)('string')).toThrow('Verification data must be an object');
        });
        (0, vitest_1.it)('should validate nested issue structures', () => {
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
            const result = (0, validators_1.validateVerification)(verificationWithIssues);
            (0, vitest_1.expect)(result.issues).toHaveLength(1);
            (0, vitest_1.expect)(result.issues[0].severity).toBe('High');
        });
        (0, vitest_1.it)('should handle empty verification summary gracefully', () => {
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
            const result = (0, validators_1.validateVerification)(verificationWithNoSummary);
            (0, vitest_1.expect)(result.summary.passed).toBe(false);
            (0, vitest_1.expect)(result.summary.issueCounts).toEqual({ Critical: 0, High: 0, Medium: 0, Low: 0 });
        });
    });
});
//# sourceMappingURL=validators.test.js.map