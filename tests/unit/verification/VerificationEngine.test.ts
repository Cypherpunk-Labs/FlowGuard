import { describe, it, expect, beforeEach } from '@jest/globals';
import { VerificationEngine } from '../../../src/verification/VerificationEngine';
import { LLMProvider, LLMMessage } from '../../../src/llm/types';
import { ArtifactStorage } from '../../../src/core/storage/ArtifactStorage';
import { GitHelper } from '../../../src/core/git/GitHelper';
import { ReferenceResolver } from '../../../src/core/references/ReferenceResolver';
import { CodebaseExplorer } from '../../../src/planning/codebase/CodebaseExplorer';
import { VerificationInput, DiffFormat } from '../../../src/verification';

describe('VerificationEngine', () => {
  let engine: VerificationEngine;
  let mockLLMProvider: jest.Mocked<LLMProvider>;
  let mockStorage: jest.Mocked<ArtifactStorage>;
  let mockGitHelper: jest.Mocked<GitHelper>;
  let mockResolver: jest.Mocked<ReferenceResolver>;
  let mockCodebaseExplorer: jest.Mocked<CodebaseExplorer>;

  beforeEach(() => {
    mockLLMProvider = {
      generateText: jest.fn(),
      generateStructured: jest.fn(),
      streamText: jest.fn()
    } as unknown as jest.Mocked<LLMProvider>;

    mockStorage = {
      listSpecs: jest.fn(),
      loadSpec: jest.fn(),
      saveVerification: jest.fn()
    } as unknown as jest.Mocked<ArtifactStorage>;

    mockGitHelper = {
      getDiff: jest.fn(),
      getCommitHash: jest.fn(),
      getCurrentBranch: jest.fn(),
      getAuthor: jest.fn(),
      getCommitMessage: jest.fn()
    } as unknown as jest.Mocked<GitHelper>;

    mockResolver = {
      parseReference: jest.fn(),
      resolveReference: jest.fn(),
      extractReferences: jest.fn()
    } as unknown as jest.Mocked<ReferenceResolver>;

    mockCodebaseExplorer = {
      explore: jest.fn(),
      analyzeSingleFile: jest.fn(),
      buildDependencyGraph: jest.fn()
    } as unknown as jest.Mocked<CodebaseExplorer>;

    engine = new VerificationEngine(
      mockLLMProvider,
      mockStorage,
      mockGitHelper,
      mockResolver,
      mockCodebaseExplorer
    );
  });

  describe('verifyChanges', () => {
    it('should create verification with git format diff', async () => {
      const input: VerificationInput = {
        epicId: 'epic-123',
        diffInput: {
          format: 'git',
          content: 'diff --git a/src/test.ts b/src/test.ts\n+line 1'
        }
      };

      mockStorage.listSpecs.mockResolvedValue([
        { id: 'spec-1', title: 'Spec 1', epicId: 'epic-123' }
      ] as any);
      mockStorage.loadSpec.mockResolvedValue({
        id: 'spec-1',
        content: '# Test Spec',
        epicId: 'epic-123'
      } as any);

      const result = await engine.verifyChanges(input);

      expect(result).toBeDefined();
      expect(result.epicId).toBe('epic-123');
      expect(result.analysis).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should use provided specIds instead of listing all specs', async () => {
      const input: VerificationInput = {
        epicId: 'epic-123',
        specIds: ['spec-1', 'spec-2'],
        diffInput: {
          format: 'git',
          content: 'diff --git a/src/test.ts b/src/test.ts\n+line 1'
        }
      };

      mockStorage.loadSpec.mockResolvedValue({
        id: 'spec-1',
        content: '# Test Spec',
        epicId: 'epic-123'
      } as any);

      const result = await engine.verifyChanges(input);

      expect(result).toBeDefined();
      expect(mockStorage.listSpecs).not.toHaveBeenCalled();
    });

    it('should filter low severity issues when skipLowSeverity is true', async () => {
      const input: VerificationInput = {
        epicId: 'epic-123',
        diffInput: {
          format: 'git',
          content: 'diff --git a/src/test.ts b/src/test.ts\n+line 1'
        },
        options: {
          skipLowSeverity: true
        }
      };

      mockStorage.listSpecs.mockResolvedValue([
        { id: 'spec-1', title: 'Spec 1', epicId: 'epic-123' }
      ] as any);
      mockStorage.loadSpec.mockResolvedValue({
        id: 'spec-1',
        content: '# Test Spec',
        epicId: 'epic-123'
      } as any);

      const result = await engine.verifyChanges(input);

      expect(result).toBeDefined();
      const lowSeverityIssues = result.issues.filter(i => i.severity === 'Low');
      expect(lowSeverityIssues.length).toBe(0);
    });

    it('should limit issues when maxIssues is provided', async () => {
      const input: VerificationInput = {
        epicId: 'epic-123',
        diffInput: {
          format: 'git',
          content: 'diff --git a/src/test.ts b/src/test.ts\n+line 1'
        },
        options: {
          maxIssues: 2
        }
      };

      mockStorage.listSpecs.mockResolvedValue([
        { id: 'spec-1', title: 'Spec 1', epicId: 'epic-123' }
      ] as any);
      mockStorage.loadSpec.mockResolvedValue({
        id: 'spec-1',
        content: '# Test Spec',
        epicId: 'epic-123'
      } as any);

      const result = await engine.verifyChanges(input);

      expect(result).toBeDefined();
      expect(result.issues.length).toBeLessThanOrEqual(2);
    });

    it('should save verification to storage', async () => {
      const input: VerificationInput = {
        epicId: 'epic-123',
        diffInput: {
          format: 'git',
          content: 'diff --git a/src/test.ts b/src/test.ts\n+line 1'
        }
      };

      mockStorage.listSpecs.mockResolvedValue([
        { id: 'spec-1', title: 'Spec 1', epicId: 'epic-123' }
      ] as any);
      mockStorage.loadSpec.mockResolvedValue({
        id: 'spec-1',
        content: '# Test Spec',
        epicId: 'epic-123'
      } as any);

      await engine.verifyChanges(input);

      expect(mockStorage.saveVerification).toHaveBeenCalled();
    });

    it('should handle GitHub format diff input', async () => {
      const input: VerificationInput = {
        epicId: 'epic-123',
        diffInput: {
          format: 'github',
          content: JSON.stringify([
            {
              filename: 'src/test.ts',
              status: 'modified',
              additions: 10,
              deletions: 5,
              patch: '@@ -1,5 +1,10 @@\n+new line'
            }
          ]),
          metadata: {
            prUrl: 'https://github.com/owner/repo/pull/123',
            commitHash: 'abc123',
            branch: 'feature-branch',
            author: 'testuser',
            timestamp: new Date(),
            message: 'Test PR'
          }
        }
      };

      mockStorage.listSpecs.mockResolvedValue([
        { id: 'spec-1', title: 'Spec 1', epicId: 'epic-123' }
      ] as any);
      mockStorage.loadSpec.mockResolvedValue({
        id: 'spec-1',
        content: '# Test Spec',
        epicId: 'epic-123'
      } as any);

      const result = await engine.verifyChanges(input);

      expect(result.diffSource.commitHash).toBe('abc123');
      expect(result.diffSource.branch).toBe('feature-branch');
      expect(result.diffSource.author).toBe('testuser');
    });

    it('should handle empty spec list gracefully', async () => {
      const input: VerificationInput = {
        epicId: 'epic-123',
        diffInput: {
          format: 'git',
          content: 'diff --git a/src/test.ts b/src/test.ts\n+line 1'
        }
      };

      mockStorage.listSpecs.mockResolvedValue([]);

      const result = await engine.verifyChanges(input);

      expect(result).toBeDefined();
      expect(result.issues.length).toBe(0);
    });
  });
});
