import type { LLMProvider, LLMMessage, LLMOptions } from '../../src/llm/types';
import type { ArtifactStorage } from '../../src/core/storage/ArtifactStorage';
import type { CodebaseExplorer } from '../../src/planning/codebase/CodebaseExplorer';
import type { ReferenceResolver } from '../../src/core/references/ReferenceResolver';
import { jest } from '@jest/globals';

export function createMockVSCodeContext(): object {
  return {
    subscriptions: [],
    workspaceState: {
      get: jest.fn(),
      update: jest.fn()
    },
    globalState: {
      get: jest.fn(),
      update: jest.fn()
    },
    secrets: {
      get: jest.fn(),
      store: jest.fn(),
      delete: jest.fn()
    },
    extensionUri: { fsPath: '/mock/extension' },
    extensionPath: '/mock/extension',
    asAbsolutePath: (relativePath: string) => `/mock/extension/${relativePath}`
  };
}

export function createMockWorkspaceFolder(): object {
  return {
    uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
    name: 'mock-workspace',
    index: 0
  };
}

export function createMockLLMProvider(): LLMProvider {
  return {
    generateText: jest.fn().mockResolvedValue({
      text: 'Mock response',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      finishReason: 'stop'
    }),
    generateStructured: jest.fn().mockImplementation(async (messages: LLMMessage[], schema: object) => {
      return generateMockStructuredResponse(schema);
    }),
    streamText: jest.fn()
  } as unknown as LLMProvider;
}

function generateMockStructuredResponse(schema: object): object {
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

export function createMockStorage(): Partial<ArtifactStorage> {
  return {
    initialize: jest.fn(),
    saveSpec: jest.fn(),
    loadSpec: jest.fn(),
    listSpecs: jest.fn(),
    deleteSpec: jest.fn(),
    saveTicket: jest.fn(),
    loadTicket: jest.fn(),
    listTickets: jest.fn(),
    deleteTicket: jest.fn(),
    saveExecution: jest.fn(),
    loadExecution: jest.fn(),
    listExecutions: jest.fn(),
    deleteExecution: jest.fn(),
    saveVerification: jest.fn(),
    loadVerification: jest.fn(),
    listVerifications: jest.fn(),
    deleteVerification: jest.fn(),
    getArtifactPath: jest.fn(),
    saveTemplate: jest.fn(),
    loadTemplate: jest.fn(),
    listTemplates: jest.fn(),
    deleteTemplate: jest.fn()
  };
}

export function createMockCodebaseExplorer(): Partial<CodebaseExplorer> {
  return {
    explore: jest.fn(),
    analyzeSingleFile: jest.fn(),
    buildDependencyGraph: jest.fn()
  };
}

export function createMockReferenceResolver(): Partial<ReferenceResolver> {
  return {
    parseReference: jest.fn(),
    resolveReference: jest.fn(),
    extractReferences: jest.fn(),
    resolveReferences: jest.fn(),
    validateReferences: jest.fn(),
    getTicketsBySpec: jest.fn(),
    validateTicketReferences: jest.fn()
  };
}

export function createMockGitHelper(): object {
  return {
    getDiff: jest.fn().mockResolvedValue(''),
    getCommitHash: jest.fn().mockResolvedValue('abc123'),
    getCurrentBranch: jest.fn().mockResolvedValue('main'),
    getAuthor: jest.fn().mockResolvedValue('Test User'),
    getCommitMessage: jest.fn().mockResolvedValue('Test commit')
  };
}
