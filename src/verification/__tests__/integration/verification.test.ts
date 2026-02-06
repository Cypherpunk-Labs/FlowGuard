import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerificationEngine } from '../VerificationEngine';
import { DiffAnalyzer } from '../DiffAnalyzer';
import { SpecMatcher } from '../SpecMatcher';
import { SeverityRater } from '../SeverityRater';
import { FeedbackGenerator } from '../FeedbackGenerator';
import { LLMProvider, LLMMessage } from '../../llm/types';
import { ArtifactStorage } from '../../core/storage/ArtifactStorage';
import { GitHelper } from '../../core/git/GitHelper';
import { ReferenceResolver } from '../../core/references/ReferenceResolver';
import { CodebaseExplorer } from '../../planning/codebase/CodebaseExplorer';
import { VerificationInput } from '../types';

const createMockLLMProvider = (): LLMProvider => ({
  generateText: vi.fn(),
  generateStructured: vi.fn(async (messages: LLMMessage[], schema: object) => {
    return generateMockStructuredResponse(schema);
  }),
  streamText: vi.fn(),
});

const generateMockStructuredResponse = (schema: object): object => {
  const schemaStr = JSON.stringify(schema);
  
  if (schemaStr.includes('matchedRequirements')) {
    return {
      matchedRequirements: [
        {
          requirementId: 'req-1',
          requirementText: 'Implement feature X',
          relevance: 0.9,
          reasoning: 'Changes implement the required feature'
        }
      ],
      deviations: [],
      confidence: 0.85
    };
  }
  
  if (schemaStr.includes('severity')) {
    return {
      severity: 'Medium',
      reasoning: 'This is a medium severity issue',
      confidence: 0.8,
      impactAreas: ['functionality']
    };
  }
  
  if (schemaStr.includes('description')) {
    return {
      description: 'Fix the issue by updating the code',
      codeExample: '// Fixed code\nfunction fixed() { return true; }',
      automatedFix: false,
      steps: ['Update the function', 'Add tests', 'Verify the fix']
    };
  }
  
  return {};
};

const createMockStorage = (): ArtifactStorage => ({
  initialize: vi.fn(),
  saveSpec: vi.fn(),
  loadSpec: vi.fn().mockResolvedValue({
    id: 'spec-123',
    epicId: 'epic-123',
    title: 'Test Spec',
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    author: 'Test User',
    tags: [],
    content: '## Requirements\n1. Implement feature X\n2. Add tests'
  }),
  listSpecs: vi.fn().mockResolvedValue([{ id: 'spec-123' }]),
  deleteSpec: vi.fn(),
  saveTicket: vi.fn(),
  loadTicket: vi.fn(),
  listTickets: vi.fn(),
  deleteTicket: vi.fn(),
  saveExecution: vi.fn(),
  loadExecution: vi.fn(),
  listExecutions: vi.fn(),
  deleteExecution: vi.fn(),
  saveVerification: vi.fn(),
  loadVerification: vi.fn(),
  listVerifications: vi.fn(),
  deleteVerification: vi.fn(),
  getArtifactPath: vi.fn(),
} as any);

const createMockGitHelper = (): GitHelper => ({
  isGitRepository: vi.fn().mockResolvedValue(true),
  initRepository: vi.fn(),
  stageFiles: vi.fn(),
  commit: vi.fn(),
  getCurrentBranch: vi.fn().mockResolvedValue('main'),
  getStatus: vi.fn(),
  getDiff: vi.fn().mockResolvedValue(''),
  stageFlowGuardArtifact: vi.fn(),
  commitArtifact: vi.fn(),
  getArtifactHistory: vi.fn(),
} as any);

const createMockCodebaseExplorer = (): CodebaseExplorer => ({
  explore: vi.fn(),
  analyzeSingleFile: vi.fn(),
  buildDependencyGraph: vi.fn(),
  clearCache: vi.fn(),
} as any);

const createMockReferenceResolver = (): ReferenceResolver => ({
  parseReference: vi.fn(),
  resolveReference: vi.fn(),
  extractReferences: vi.fn(),
  resolveReferences: vi.fn(),
  validateReferences: vi.fn(),
  getTicketsBySpec: vi.fn(),
  validateTicketReferences: vi.fn(),
} as any);

describe('VerificationEngine Integration', () => {
  let mockProvider: LLMProvider;
  let mockStorage: ArtifactStorage;
  let mockGitHelper: GitHelper;
  let mockCodebaseExplorer: CodebaseExplorer;
  let mockResolver: ReferenceResolver;
  let engine: VerificationEngine;

  beforeEach(() => {
    mockProvider = createMockLLMProvider();
    mockStorage = createMockStorage();
    mockGitHelper = createMockGitHelper();
    mockCodebaseExplorer = createMockCodebaseExplorer();
    mockResolver = createMockReferenceResolver();

    engine = new VerificationEngine(
      mockProvider,
      mockStorage,
      mockGitHelper,
      mockResolver,
      mockCodebaseExplorer
    );
  });

  describe('verifyChanges', () => {
    it('should complete verification workflow successfully', async () => {
      const diffText = `diff --git a/src/test.ts b/src/test.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/test.ts
@@ -0,0 +1,5 @@
+export function test() {
+  return true;
+}
`;

      const input: VerificationInput = {
        epicId: 'epic-123',
        specIds: ['spec-123'],
        diffInput: {
          format: 'git',
          content: diffText,
          metadata: {
            commitHash: 'abc123',
            branch: 'feature-branch',
            author: 'Test User',
            message: 'Add test function'
          }
        }
      };

      const result = await engine.verifyChanges(input);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('epicId', 'epic-123');
      expect(result).toHaveProperty('diffSource');
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('createdAt');

      expect(mockStorage.saveVerification).toHaveBeenCalledWith(expect.objectContaining({
        epicId: 'epic-123'
      }));
    });

    it('should handle missing spec by returning error', async () => {
      mockStorage.loadSpec = vi.fn().mockRejectedValue(new Error('Spec not found'));

      const diffText = `diff --git a/src/test.ts b/src/test.ts
--- a/src/test.ts
+++ b/src/test.ts
@@ -1 +1 @@
-old
+new
`;

      const input: VerificationInput = {
        epicId: 'epic-123',
        specIds: ['non-existent-spec'],
        diffInput: {
          format: 'git',
          content: diffText
        }
      };

      const result = await engine.verifyChanges(input);

      expect(result.summary.passed).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should respect skipLowSeverity option', async () => {
      mockProvider.generateStructured = vi.fn(async (messages: LLMMessage[], schema: object) => {
        if (JSON.stringify(schema).includes('severity')) {
          return {
            severity: 'Low',
            reasoning: 'Minor issue',
            confidence: 0.7,
            impactAreas: ['style']
          };
        }
        return generateMockStructuredResponse(schema);
      });

      const diffText = `diff --git a/src/test.ts b/src/test.ts
--- a/src/test.ts
+++ b/src/test.ts
@@ -1 +1 @@
-old
+new
`;

      const input: VerificationInput = {
        epicId: 'epic-123',
        diffInput: {
          format: 'git',
          content: diffText
        },
        options: {
          skipLowSeverity: true
        }
      };

      const result = await engine.verifyChanges(input);

      expect(result.issues.every(i => i.severity !== 'Low')).toBe(true);
    });

    it('should limit issues when maxIssues option is set', async () => {
      mockProvider.generateStructured = vi.fn(async (messages: LLMMessage[], schema: object) => {
        if (JSON.stringify(schema).includes('matchedRequirements')) {
          return {
            matchedRequirements: [],
            deviations: [
              { type: 'missing', description: 'Issue 1', expectedBehavior: 'X', actualBehavior: 'Y' },
              { type: 'missing', description: 'Issue 2', expectedBehavior: 'X', actualBehavior: 'Y' },
              { type: 'missing', description: 'Issue 3', expectedBehavior: 'X', actualBehavior: 'Y' },
              { type: 'missing', description: 'Issue 4', expectedBehavior: 'X', actualBehavior: 'Y' },
              { type: 'missing', description: 'Issue 5', expectedBehavior: 'X', actualBehavior: 'Y' }
            ],
            confidence: 0.5
          };
        }
        return generateMockStructuredResponse(schema);
      });

      const diffText = `diff --git a/src/test.ts b/src/test.ts
--- a/src/test.ts
+++ b/src/test.ts
@@ -1 +1 @@
-old
+new
`;

      const input: VerificationInput = {
        epicId: 'epic-123',
        diffInput: {
          format: 'git',
          content: diffText
        },
        options: {
          maxIssues: 3
        }
      };

      const result = await engine.verifyChanges(input);

      expect(result.issues.length).toBeLessThanOrEqual(3);
    });
  });
});

describe('DiffAnalyzer', () => {
  let analyzer: DiffAnalyzer;

  beforeEach(() => {
    analyzer = new DiffAnalyzer();
  });

  it('should parse diff and extract changes', () => {
    const diffText = `diff --git a/src/test.ts b/src/test.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/test.ts
@@ -0,0 +1,3 @@
+line 1
+line 2
+line 3
`;

    const result = analyzer.parseDiff(diffText, 'git');

    expect(result.totalFiles).toBe(1);
    expect(result.additions).toBe(3);
    expect(result.deletions).toBe(0);
    expect(result.changedFiles.length).toBe(1);
  });
});

describe('SpecMatcher', () => {
  let matcher: SpecMatcher;
  let mockProvider: LLMProvider;
  let mockStorage: ArtifactStorage;
  let mockResolver: ReferenceResolver;

  beforeEach(() => {
    mockProvider = createMockLLMProvider();
    mockStorage = createMockStorage();
    mockResolver = createMockReferenceResolver();
    matcher = new SpecMatcher(mockProvider, mockStorage, mockResolver);
  });

  it('should match changes to spec requirements', async () => {
    const diffAnalysis = {
      totalFiles: 1,
      totalLines: 10,
      additions: 10,
      deletions: 0,
      changedFiles: [{
        path: 'src/test.ts',
        status: 'added' as const,
        changes: [
          { type: 'addition' as const, lineNumber: 1, content: 'export function test() {}' }
        ]
      }]
    };

    const results = await matcher.matchChangesToSpec(diffAnalysis, 'spec-123');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('matchedRequirements');
    expect(results[0]).toHaveProperty('deviations');
    expect(results[0]).toHaveProperty('confidence');
  });
});
