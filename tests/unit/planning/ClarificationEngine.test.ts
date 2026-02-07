import { describe, it, expect, beforeEach } from '@jest/globals';
import { ClarificationEngine } from '../../../src/planning/ClarificationEngine';
import { createMockLLMProvider } from '../../utils/mocks';

describe('ClarificationEngine', () => {
  let engine: ClarificationEngine;
  let mockLLMProvider: ReturnType<typeof createMockLLMProvider>;

  beforeEach(() => {
    mockLLMProvider = createMockLLMProvider();
    engine = new ClarificationEngine(mockLLMProvider);
  });

  describe('analyzeGoal', () => {
    it('should return questions for a feature goal', async () => {
      const questions = await engine.analyzeGoal('Add user authentication');

      expect(questions).toBeDefined();
      expect(Array.isArray(questions)).toBe(true);
    });

    it('should return questions for a bugfix goal', async () => {
      const questions = await engine.analyzeGoal('Fix the login page crash');

      expect(questions).toBeDefined();
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should return questions for a refactor goal', async () => {
      const questions = await engine.analyzeGoal('Refactor the payment processing module');

      expect(questions).toBeDefined();
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should handle LLM provider errors gracefully', async () => {
      const mockProviderWithError = createMockLLMProvider();
      mockProviderWithError.generateStructured = async () => {
        throw new Error('LLM provider failed');
      };
      const engineWithError = new ClarificationEngine(mockProviderWithError);

      const questions = await engineWithError.analyzeGoal('Test goal');

      expect(questions).toBeDefined();
      expect(Array.isArray(questions)).toBe(true);
    });
  });

  describe('parseResponses', () => {
    it('should parse questions and responses into context', () => {
      const questions = ['What is the scope?', 'What are the constraints?'];
      const responses = ['Full authentication system', 'Must use OAuth 2.0'];

      const context = engine.parseResponses(questions, responses);

      expect(context.goal).toBe('');
      expect(context.clarifications).toHaveLength(2);
      expect(context.clarifications[0].question).toBe('What is the scope?');
      expect(context.clarifications[0].answer).toBe('Full authentication system');
    });

    it('should handle empty questions and responses', () => {
      const context = engine.parseResponses([], []);

      expect(context.clarifications).toHaveLength(0);
      expect(context.extractedRequirements).toHaveLength(0);
    });
  });
});
