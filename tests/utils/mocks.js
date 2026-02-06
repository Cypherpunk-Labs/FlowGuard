"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockVSCodeContext = createMockVSCodeContext;
exports.createMockWorkspaceFolder = createMockWorkspaceFolder;
exports.createMockLLMProvider = createMockLLMProvider;
exports.createMockStorage = createMockStorage;
exports.createMockCodebaseExplorer = createMockCodebaseExplorer;
exports.createMockReferenceResolver = createMockReferenceResolver;
exports.createMockGitHelper = createMockGitHelper;
const vitest_1 = require("vitest");
function createMockVSCodeContext() {
    return {
        subscriptions: [],
        workspaceState: {
            get: vitest_1.vi.fn(),
            update: vitest_1.vi.fn()
        },
        globalState: {
            get: vitest_1.vi.fn(),
            update: vitest_1.vi.fn()
        },
        secrets: {
            get: vitest_1.vi.fn(),
            store: vitest_1.vi.fn(),
            delete: vitest_1.vi.fn()
        },
        extensionUri: { fsPath: '/mock/extension' },
        extensionPath: '/mock/extension',
        asAbsolutePath: (relativePath) => `/mock/extension/${relativePath}`
    };
}
function createMockWorkspaceFolder() {
    return {
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0
    };
}
function createMockLLMProvider() {
    return {
        generateText: vitest_1.vi.fn().mockResolvedValue({
            text: 'Mock response',
            usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            finishReason: 'stop'
        }),
        generateStructured: vitest_1.vi.fn().mockImplementation(async (messages, schema) => {
            return generateMockStructuredResponse(schema);
        }),
        streamText: vitest_1.vi.fn()
    };
}
function generateMockStructuredResponse(schema) {
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
                    priority: 'high',
                    tags: ['feature']
                }
            ]
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
                edgeCases: [{ case: 'Error case', handling: 'Handle gracefully' }]
            },
            testingStrategy: { unitTests: 'All tests', integrationTests: 'Integration tests', e2eTests: 'E2E tests' }
        };
    }
    return {};
}
function createMockStorage() {
    return {
        initialize: vitest_1.vi.fn(),
        saveSpec: vitest_1.vi.fn(),
        loadSpec: vitest_1.vi.fn(),
        listSpecs: vitest_1.vi.fn(),
        deleteSpec: vitest_1.vi.fn(),
        saveTicket: vitest_1.vi.fn(),
        loadTicket: vitest_1.vi.fn(),
        listTickets: vitest_1.vi.fn(),
        deleteTicket: vitest_1.vi.fn(),
        saveExecution: vitest_1.vi.fn(),
        loadExecution: vitest_1.vi.fn(),
        listExecutions: vitest_1.vi.fn(),
        deleteExecution: vitest_1.vi.fn(),
        saveVerification: vitest_1.vi.fn(),
        loadVerification: vitest_1.vi.fn(),
        listVerifications: vitest_1.vi.fn(),
        deleteVerification: vitest_1.vi.fn(),
        getArtifactPath: vitest_1.vi.fn(),
        saveTemplate: vitest_1.vi.fn(),
        loadTemplate: vitest_1.vi.fn(),
        listTemplates: vitest_1.vi.fn(),
        deleteTemplate: vitest_1.vi.fn()
    };
}
function createMockCodebaseExplorer() {
    return {
        explore: vitest_1.vi.fn(),
        analyzeSingleFile: vitest_1.vi.fn(),
        buildDependencyGraph: vitest_1.vi.fn()
    };
}
function createMockReferenceResolver() {
    return {
        parseReference: vitest_1.vi.fn(),
        resolveReference: vitest_1.vi.fn(),
        extractReferences: vitest_1.vi.fn(),
        resolveReferences: vitest_1.vi.fn(),
        validateReferences: vitest_1.vi.fn(),
        getTicketsBySpec: vitest_1.vi.fn(),
        validateTicketReferences: vitest_1.vi.fn()
    };
}
function createMockGitHelper() {
    return {
        getDiff: vitest_1.vi.fn().mockResolvedValue(''),
        getCommitHash: vitest_1.vi.fn().mockResolvedValue('abc123'),
        getCurrentBranch: vitest_1.vi.fn().mockResolvedValue('main'),
        getAuthor: vitest_1.vi.fn().mockResolvedValue('Test User'),
        getCommitMessage: vitest_1.vi.fn().mockResolvedValue('Test commit')
    };
}
//# sourceMappingURL=mocks.js.map