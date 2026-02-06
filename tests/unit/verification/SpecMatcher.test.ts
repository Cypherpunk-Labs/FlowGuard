import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SpecMatcher } from '../../../src/verification/SpecMatcher';
import { ArtifactStorage } from '../../../src/core/storage/ArtifactStorage';
import { ReferenceResolver } from '../../../src/core/references/ReferenceResolver';
import { DiffAnalysis } from '../../../src/core/models/Verification';
import { Spec } from '../../../src/core/models/Spec';
import { createMockLLMProvider } from '../../utils/mocks';
import { createMockStorage } from '../../utils/mocks';
import { createMockReferenceResolver } from '../../utils/mocks';
import { v4 as uuidv4 } from 'uuid';

describe('SpecMatcher', () => {
  let matcher: SpecMatcher;
  let mockLLMProvider: ReturnType<typeof createMockLLMProvider>;
  let mockStorage: Partial<ArtifactStorage>;
  let mockResolver: Partial<ReferenceResolver>;

  beforeEach(() => {
    mockLLMProvider = createMockLLMProvider();
    mockStorage = createMockStorage();
    mockResolver = createMockReferenceResolver();

    const testSpec: Spec = {
      id: uuidv4(),
      epicId: uuidv4(),
      title: 'Test Spec',
      status: 'approved',
      createdAt: new Date(),
      updatedAt: new Date(),
      author: 'Test',
      tags: [],
      content: `# Test Spec

## Overview
This is a test spec.

## Functional Requirements
1. User authentication should work
2. Password reset should be secure
3. Session management should be robust

## Technical Plan
### Files to Change
- \`src/auth.ts\`
- \`src/session.ts\`

## Testing Strategy
Unit tests for all authentication logic.`
    };

    (mockStorage.loadSpec as jest.Mock).mockResolvedValue(testSpec);
    (mockResolver.resolveReference as jest.Mock).mockResolvedValue({ type: 'spec', content: '' });

    matcher = new SpecMatcher(
      mockLLMProvider,
      mockStorage as ArtifactStorage,
      mockResolver as ReferenceResolver
    );
  });

  describe('matchChangesToSpec', () => {
    it('should return match results for changed files', async () => {
      const diff: DiffAnalysis = {
        totalFiles: 1,
        totalLines: 10,
        additions: 5,
        deletions: 5,
        changedFiles: [
          {
            path: 'src/auth.ts',
            status: 'modified',
            changes: [
              { type: 'modification', lineNumber: 10, content: 'new auth logic' }
            ]
          }
        ]
      };

      const results = await matcher.matchChangesToSpec(diff, uuidv4());

      expect(results.length).toBe(1);
      expect(results[0].filePath).toBe('src/auth.ts');
    });

    it('should calculate confidence scores', async () => {
      const diff: DiffAnalysis = {
        totalFiles: 1,
        totalLines: 5,
        additions: 3,
        deletions: 2,
        changedFiles: [
          {
            path: 'src/auth.ts',
            status: 'modified',
            changes: [
              { type: 'modification', lineNumber: 5, content: 'auth code' }
            ]
          }
        ]
      };

      const results = await matcher.matchChangesToSpec(diff, uuidv4());

      expect(results[0].confidence).toBeDefined();
      expect(typeof results[0].confidence).toBe('number');
      expect(results[0].confidence).toBeGreaterThanOrEqual(0);
      expect(results[0].confidence).toBeLessThanOrEqual(1);
    });

    it('should match changes to requirements', async () => {
      const diff: DiffAnalysis = {
        totalFiles: 1,
        totalLines: 10,
        additions: 5,
        deletions: 5,
        changedFiles: [
          {
            path: 'src/auth.ts',
            status: 'modified',
            changes: [
              { type: 'modification', lineNumber: 10, content: 'login implementation' }
            ]
          }
        ]
      };

      const results = await matcher.matchChangesToSpec(diff, uuidv4());

      expect(results[0].matches).toBeDefined();
      expect(Array.isArray(results[0].matches)).toBe(true);
    });

    it('should handle multiple changed files', async () => {
      const diff: DiffAnalysis = {
        totalFiles: 2,
        totalLines: 20,
        additions: 10,
        deletions: 10,
        changedFiles: [
          {
            path: 'src/auth.ts',
            status: 'modified',
            changes: []
          },
          {
            path: 'src/session.ts',
            status: 'added',
            changes: []
          }
        ]
      };

      const results = await matcher.matchChangesToSpec(diff, uuidv4());

      expect(results.length).toBe(2);
    });

    it('should handle empty diff', async () => {
      const diff: DiffAnalysis = {
        totalFiles: 0,
        totalLines: 0,
        additions: 0,
        deletions: 0,
        changedFiles: []
      };

      const results = await matcher.matchChangesToSpec(diff, uuidv4());

      expect(results).toEqual([]);
    });
  });

  describe('requirement matching', () => {
    it('should identify unmatched requirements', async () => {
      const diff: DiffAnalysis = {
        totalFiles: 1,
        totalLines: 5,
        additions: 5,
        deletions: 0,
        changedFiles: [
          {
            path: 'src/unrelated.ts',
            status: 'added',
            changes: []
          }
        ]
      };

      const results = await matcher.matchChangesToSpec(diff, uuidv4());

      expect(results[0].unmatchedRequirements).toBeDefined();
    });
  });

  describe('semantic matching with LLM', () => {
    it('should use LLM provider for semantic analysis', async () => {
      const diff: DiffAnalysis = {
        totalFiles: 1,
        totalLines: 10,
        additions: 5,
        deletions: 5,
        changedFiles: [
          {
            path: 'src/auth.ts',
            status: 'modified',
            changes: [
              { type: 'modification', lineNumber: 20, content: 'password hashing' }
            ]
          }
        ]
      };

      await matcher.matchChangesToSpec(diff, uuidv4());

      expect(mockLLMProvider.generateStructured).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw error when spec not found', async () => {
      const diff: DiffAnalysis = {
        totalFiles: 1,
        totalLines: 5,
        additions: 3,
        deletions: 2,
        changedFiles: [
          {
            path: 'src/test.ts',
            status: 'modified',
            changes: []
          }
        ]
      };

      (mockStorage.loadSpec as jest.Mock).mockRejectedValue(new Error('Spec not found'));

      await expect(matcher.matchChangesToSpec(diff, uuidv4())).rejects.toThrow('Failed to load spec');
    });

    it('should handle LLM errors gracefully', async () => {
      const diff: DiffAnalysis = {
        totalFiles: 1,
        totalLines: 5,
        additions: 3,
        deletions: 2,
        changedFiles: [
          {
            path: 'src/auth.ts',
            status: 'modified',
            changes: []
          }
        ]
      };

      (mockLLMProvider.generateStructured as jest.Mock).mockRejectedValue(new Error('LLM error'));

      const results = await matcher.matchChangesToSpec(diff, uuidv4());

      expect(results.length).toBe(1);
    });
  });
});
