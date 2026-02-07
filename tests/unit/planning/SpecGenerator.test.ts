import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SpecGenerator, SpecGenerationInput } from '../../../src/planning/SpecGenerator';
import { ClarificationEngine, ClarificationContext } from '../../../src/planning/ClarificationEngine';
import { CodebaseExplorer } from '../../../src/planning/codebase/CodebaseExplorer';
import { ArtifactStorage } from '../../../src/core/storage/ArtifactStorage';
import { createMockLLMProvider } from '../../utils/mocks';
import { createMockCodebaseExplorer } from '../../utils/mocks';
import { v4 as uuidv4 } from 'uuid';

describe('SpecGenerator', () => {
  let generator: SpecGenerator;
  let mockLLMProvider: ReturnType<typeof createMockLLMProvider>;
  let mockExplorer: ReturnType<typeof createMockCodebaseExplorer>;
  let mockStorage: Partial<ArtifactStorage>;

  beforeEach(() => {
    mockLLMProvider = createMockLLMProvider();
    mockExplorer = createMockCodebaseExplorer();
    mockStorage = {
      saveSpec: jest.fn().mockResolvedValue(undefined),
      loadSpec: jest.fn()
    };

    mockExplorer.explore = jest.fn().mockResolvedValue({
      files: [],
      stats: { totalFiles: 0, totalLines: 0 },
      components: [],
      relationships: []
    });

    generator = new SpecGenerator(mockLLMProvider, mockExplorer as unknown as CodebaseExplorer, mockStorage as ArtifactStorage);
  });

  describe('generateSpec', () => {
    it('should generate spec with required fields', async () => {
      const input: SpecGenerationInput = {
        epicId: uuidv4(),
        goal: 'Implement user authentication',
        tags: ['auth', 'security']
      };

      const spec = await generator.generateSpec(input);

      expect(spec.id).toBeDefined();
      expect(spec.epicId).toBe(input.epicId);
      expect(spec.title).toContain('User Authentication');
      expect(spec.status).toBe('draft');
      expect(spec.tags).toContain('auth');
      expect(spec.content).toContain('#');
    });

    it('should include codebase context when requested', async () => {
      const input: SpecGenerationInput = {
        epicId: uuidv4(),
        goal: 'Add new feature',
        includeCodebaseContext: true
      };

      await generator.generateSpec(input);

      expect(mockExplorer.explore).toHaveBeenCalled();
    });

    it('should skip codebase context when disabled', async () => {
      const input: SpecGenerationInput = {
        epicId: uuidv4(),
        goal: 'Add new feature',
        includeCodebaseContext: false
      };

      await generator.generateSpec(input);

      expect(mockExplorer.explore).not.toHaveBeenCalled();
    });

    it('should save spec to storage when provided', async () => {
      const input: SpecGenerationInput = {
        epicId: uuidv4(),
        goal: 'Implement feature'
      };

      await generator.generateSpec(input);

      expect(mockStorage.saveSpec).toHaveBeenCalled();
    });

    it('should generate spec with clarification context', async () => {
      const clarifications: ClarificationContext = {
        goal: 'Implement feature',
        clarifications: [
          { question: 'What is the scope?', answer: 'Full implementation' },
          { question: 'What are the constraints?', answer: 'Must use existing auth' }
        ],
        extractedRequirements: ['Requirement 1', 'Requirement 2']
      };

      const input: SpecGenerationInput = {
        epicId: uuidv4(),
        goal: 'Implement feature',
        clarifications
      };

      const spec = await generator.generateSpec(input);

      expect(spec.id).toBeDefined();
      expect(spec.content).toContain('#');
    });

    it('should set storage after construction', async () => {
      const newStorage = {
        saveSpec: jest.fn().mockResolvedValue(undefined)
      };

      generator.setStorage(newStorage as unknown as ArtifactStorage);

      const input: SpecGenerationInput = {
        epicId: uuidv4(),
        goal: 'Test goal'
      };

      await generator.generateSpec(input);

      expect(newStorage.saveSpec).toHaveBeenCalled();
    });
  });

  describe('spec structure validation', () => {
    it('should generate spec with frontmatter-like structure', async () => {
      const input: SpecGenerationInput = {
        epicId: uuidv4(),
        goal: 'Test feature'
      };

      const spec = await generator.generateSpec(input);

      expect(spec.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(spec.createdAt).toBeInstanceOf(Date);
      expect(spec.updatedAt).toBeInstanceOf(Date);
      expect(typeof spec.content).toBe('string');
    });

    it('should generate spec with title derived from goal', async () => {
      const input: SpecGenerationInput = {
        epicId: uuidv4(),
        goal: 'Add OAuth2 authentication to the login flow'
      };

      const spec = await generator.generateSpec(input);

      expect(spec.title.length).toBeGreaterThan(0);
    });
  });
});
