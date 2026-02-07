import { v4 as uuidv4 } from 'uuid';
import { Epic, Spec, Ticket, Execution, Verification } from '../../src/core/models';
import { Diagram } from '../../src/core/models/Diagram';
import { TechnicalPlan } from '../../src/core/models/TechnicalPlan';

export function createTestEpic(overrides: Partial<Epic> = {}): Epic {
  const id = uuidv4();
  return {
    id,
    title: 'Test Epic',
    overview: 'This is a test epic',
    phases: [
      {
        id: uuidv4(),
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

export function createTestSpec(overrides: Partial<Spec> = {}): Spec {
  const epicId = overrides.epicId || uuidv4();
  return {
    id: uuidv4(),
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

export function createTestTicket(overrides: Partial<Ticket> = {}): Ticket {
  const epicId = overrides.epicId || uuidv4();
  const specId = overrides.specId || uuidv4();
  return {
    id: uuidv4(),
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

export function createTestExecution(overrides: Partial<Execution> = {}): Execution {
  const epicId = overrides.epicId || uuidv4();
  return {
    id: uuidv4(),
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

export function createTestVerification(overrides: Partial<Verification> = {}): Verification {
  const epicId = overrides.epicId || uuidv4();
  return {
    id: uuidv4(),
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

export function createValidFrontmatter(data: Record<string, unknown>): string {
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

export function createTestMarkdownWithFrontmatter(frontmatter: Record<string, unknown>, content: string): string {
  return `${createValidFrontmatter(frontmatter)}\n${content}`;
}
