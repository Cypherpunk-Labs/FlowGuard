"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestEpic = createTestEpic;
exports.createTestSpec = createTestSpec;
exports.createTestTicket = createTestTicket;
exports.createTestExecution = createTestExecution;
exports.createTestVerification = createTestVerification;
exports.createValidFrontmatter = createValidFrontmatter;
exports.createTestMarkdownWithFrontmatter = createTestMarkdownWithFrontmatter;
const uuid_1 = require("uuid");
function createTestEpic(overrides = {}) {
    const id = (0, uuid_1.v4)();
    return {
        id,
        title: 'Test Epic',
        overview: 'This is a test epic',
        phases: [
            {
                id: (0, uuid_1.v4)(),
                title: 'Phase 1',
                description: 'First phase',
                status: 'pending',
                deliverables: [],
                dependencies: [],
                order: 1
            }
        ],
        technicalPlan: {
            files: [],
            dependencies: [],
            edgeCases: [],
            nonFunctionalRequirements: [],
            testingStrategy: {
                unitTests: 'All tests',
                integrationTests: 'Integration tests',
                e2eTests: 'E2E tests'
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
        updatedAt: new Date(),
        ...overrides
    };
}
function createTestSpec(overrides = {}) {
    const epicId = overrides.epicId || (0, uuid_1.v4)();
    return {
        id: (0, uuid_1.v4)(),
        epicId,
        title: 'Test Spec',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'Test Author',
        tags: ['test'],
        content: '# Test Spec\n\nThis is a test spec.',
        ...overrides
    };
}
function createTestTicket(overrides = {}) {
    const epicId = overrides.epicId || (0, uuid_1.v4)();
    const specId = overrides.specId || (0, uuid_1.v4)();
    return {
        id: (0, uuid_1.v4)(),
        epicId,
        specId,
        title: 'Test Ticket',
        status: 'todo',
        priority: 'medium',
        tags: ['test'],
        content: '# Test Ticket\n\nThis is a test ticket.',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    };
}
function createTestExecution(overrides = {}) {
    const epicId = overrides.epicId || (0, uuid_1.v4)();
    return {
        id: (0, uuid_1.v4)(),
        epicId,
        specIds: [],
        ticketIds: [],
        agentType: 'cursor',
        handoffPrompt: 'Test handoff prompt',
        status: 'pending',
        startedAt: new Date(),
        ...overrides
    };
}
function createTestVerification(overrides = {}) {
    const epicId = overrides.epicId || (0, uuid_1.v4)();
    return {
        id: (0, uuid_1.v4)(),
        epicId,
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
        createdAt: new Date(),
        ...overrides
    };
}
function createValidFrontmatter(data) {
    return `---\n${Object.entries(data)
        .map(([key, value]) => {
        if (Array.isArray(value)) {
            return `${key}:\n${value.map((v) => `  - ${v}`).join('\n')}`;
        }
        if (typeof value === 'object' && value !== null) {
            return `${key}:\n${JSON.stringify(value, null, 2)}`;
        }
        return `${key}: ${value}`;
    })
        .join('\n')}\n---\n`;
}
function createTestMarkdownWithFrontmatter(frontmatter, content) {
    return `${createValidFrontmatter(frontmatter)}\n${content}`;
}
//# sourceMappingURL=fixtures.js.map