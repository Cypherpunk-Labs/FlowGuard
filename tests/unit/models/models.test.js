"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('Epic Model', () => {
    (0, vitest_1.describe)('Epic interface structure', () => {
        (0, vitest_1.it)('should have all required fields', () => {
            const epic = {
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
            (0, vitest_1.expect)(epic.id).toBe('test-id');
            (0, vitest_1.expect)(epic.title).toBe('Test Epic');
            (0, vitest_1.expect)(epic.status).toBe('draft');
        });
        (0, vitest_1.it)('should allow optional fields in metadata', () => {
            const epic = {
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
            (0, vitest_1.expect)(epic.metadata.targetDate).toBeDefined();
            (0, vitest_1.expect)(epic.metadata.stakeholders).toEqual(['Team A', 'Team B']);
        });
    });
    (0, vitest_1.describe)('EpicStatus enum', () => {
        (0, vitest_1.it)('should have all expected status values', () => {
            const statuses = ['draft', 'planning', 'in_progress', 'in_review', 'completed', 'archived'];
            (0, vitest_1.expect)(statuses).toHaveLength(6);
            (0, vitest_1.expect)(statuses).toContain('draft');
            (0, vitest_1.expect)(statuses).toContain('in_progress');
            (0, vitest_1.expect)(statuses).toContain('completed');
        });
    });
    (0, vitest_1.describe)('PhaseStatus enum', () => {
        (0, vitest_1.it)('should have all expected status values', () => {
            const statuses = ['pending', 'in_progress', 'completed', 'blocked'];
            (0, vitest_1.expect)(statuses).toHaveLength(4);
            (0, vitest_1.expect)(statuses).toContain('pending');
            (0, vitest_1.expect)(statuses).toContain('blocked');
        });
    });
    (0, vitest_1.describe)('Priority enum', () => {
        (0, vitest_1.it)('should have all expected priority values', () => {
            const priorities = ['low', 'medium', 'high', 'critical'];
            (0, vitest_1.expect)(priorities).toHaveLength(4);
            (0, vitest_1.expect)(priorities).toContain('critical');
        });
    });
});
(0, vitest_1.describe)('Spec Model', () => {
    (0, vitest_1.describe)('Spec interface structure', () => {
        (0, vitest_1.it)('should have all required fields', () => {
            const spec = {
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
            (0, vitest_1.expect)(spec.id).toBe('spec-id');
            (0, vitest_1.expect)(spec.epicId).toBe('epic-id');
            (0, vitest_1.expect)(spec.status).toBe('draft');
        });
    });
    (0, vitest_1.describe)('SpecStatus enum', () => {
        (0, vitest_1.it)('should have all expected status values', () => {
            const statuses = ['draft', 'in_review', 'approved', 'archived'];
            (0, vitest_1.expect)(statuses).toHaveLength(4);
            (0, vitest_1.expect)(statuses).toContain('in_review');
            (0, vitest_1.expect)(statuses).toContain('approved');
        });
    });
});
(0, vitest_1.describe)('Ticket Model', () => {
    (0, vitest_1.describe)('Ticket interface structure', () => {
        (0, vitest_1.it)('should have all required fields', () => {
            const ticket = {
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
            (0, vitest_1.expect)(ticket.id).toBe('ticket-id');
            (0, vitest_1.expect)(ticket.status).toBe('todo');
        });
        (0, vitest_1.it)('should allow optional assignee and estimatedEffort fields', () => {
            const ticket = {
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
            (0, vitest_1.expect)(ticket.assignee).toBe('test-user');
            (0, vitest_1.expect)(ticket.estimatedEffort).toBe('4h');
        });
    });
    (0, vitest_1.describe)('TicketStatus enum', () => {
        (0, vitest_1.it)('should have all expected status values', () => {
            const statuses = ['todo', 'in_progress', 'in_review', 'done', 'blocked'];
            (0, vitest_1.expect)(statuses).toHaveLength(5);
            (0, vitest_1.expect)(statuses).toContain('in_review');
        });
    });
});
(0, vitest_1.describe)('Execution Model', () => {
    (0, vitest_1.describe)('Execution interface structure', () => {
        (0, vitest_1.it)('should have all required fields', () => {
            const execution = {
                id: 'exec-id',
                epicId: 'epic-id',
                specIds: [],
                ticketIds: [],
                agentType: 'cursor',
                handoffPrompt: 'Test prompt',
                status: 'pending',
                startedAt: new Date()
            };
            (0, vitest_1.expect)(execution.id).toBe('exec-id');
            (0, vitest_1.expect)(execution.status).toBe('pending');
        });
        (0, vitest_1.it)('should allow optional results and completedAt fields', () => {
            const execution = {
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
            (0, vitest_1.expect)(execution.completedAt).toBeDefined();
            (0, vitest_1.expect)(execution.results).toBeDefined();
            (0, vitest_1.expect)(execution.results?.filesChanged).toHaveLength(1);
        });
    });
    (0, vitest_1.describe)('AgentType enum', () => {
        (0, vitest_1.it)('should have all expected agent types', () => {
            const agents = ['cursor', 'claude', 'windsurf', 'cline', 'aider', 'custom'];
            (0, vitest_1.expect)(agents).toHaveLength(6);
            (0, vitest_1.expect)(agents).toContain('cursor');
            (0, vitest_1.expect)(agents).toContain('aider');
        });
    });
    (0, vitest_1.describe)('ExecutionStatus enum', () => {
        (0, vitest_1.it)('should have all expected status values', () => {
            const statuses = ['pending', 'in_progress', 'completed', 'failed'];
            (0, vitest_1.expect)(statuses).toHaveLength(4);
        });
    });
});
(0, vitest_1.describe)('Verification Model', () => {
    (0, vitest_1.describe)('Verification interface structure', () => {
        (0, vitest_1.it)('should have all required fields', () => {
            const verification = {
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
            (0, vitest_1.expect)(verification.id).toBe('verify-id');
            (0, vitest_1.expect)(verification.summary.passed).toBe(true);
        });
        (0, vitest_1.it)('should allow optional issue fields', () => {
            const verification = {
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
            (0, vitest_1.expect)(verification.issues).toHaveLength(1);
            (0, vitest_1.expect)(verification.issues[0].severity).toBe('High');
            (0, vitest_1.expect)(verification.summary.approvalStatus).toBe('changes_requested');
        });
    });
    (0, vitest_1.describe)('Severity enum', () => {
        (0, vitest_1.it)('should have all expected severity values', () => {
            const severities = ['Critical', 'High', 'Medium', 'Low'];
            (0, vitest_1.expect)(severities).toHaveLength(4);
        });
    });
    (0, vitest_1.describe)('IssueCategory enum', () => {
        (0, vitest_1.it)('should have all expected category values', () => {
            const categories = [
                'security', 'performance', 'style', 'logic',
                'documentation', 'testing', 'architecture'
            ];
            (0, vitest_1.expect)(categories).toHaveLength(7);
        });
    });
    (0, vitest_1.describe)('ApprovalStatus enum', () => {
        (0, vitest_1.it)('should have all expected approval status values', () => {
            const statuses = [
                'approved', 'approved_with_conditions', 'changes_requested', 'pending'
            ];
            (0, vitest_1.expect)(statuses).toHaveLength(4);
        });
    });
});
//# sourceMappingURL=models.test.js.map