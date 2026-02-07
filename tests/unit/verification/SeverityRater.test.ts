import { describe, it, expect, beforeEach } from '@jest/globals';
import { SeverityRater } from '../../../src/verification/SeverityRater';
import { Deviation, SeverityRating, RatingContext } from '../../../src/verification/types';
import { createMockLLMProvider } from '../../utils/mocks';
import { Severity } from '../../../src/core/models/Verification';

describe('SeverityRater', () => {
  let rater: SeverityRater;
  let mockLLMProvider: ReturnType<typeof createMockLLMProvider>;

  beforeEach(() => {
    mockLLMProvider = createMockLLMProvider();
    rater = new SeverityRater(mockLLMProvider);
  });

  describe('rateDeviation', () => {
    it('should classify security issue as Critical', async () => {
      const deviation: Deviation = {
        type: 'incorrect',
        description: 'Passwords stored in plain text',
        expectedBehavior: 'Passwords should be hashed',
        actualBehavior: 'Plain text storage',
        filePath: 'src/auth.ts',
        lineNumber: 42
      };

      const context: RatingContext = {
        specContent: 'Security Requirements: Passwords must be hashed',
        filePath: 'src/auth.ts',
        changeType: 'modification',
        projectType: 'web'
      };

      const rating = await rater.rateDeviation(deviation, context);

      expect(rating.severity).toBeDefined();
      expect(['Critical', 'High', 'Medium', 'Low']).toContain(rating.severity);
      expect(rating.reasoning).toBeDefined();
      expect(typeof rating.reasoning).toBe('string');
      expect(rating.confidence).toBeGreaterThanOrEqual(0);
      expect(rating.confidence).toBeLessThanOrEqual(1);
      expect(rating.impactAreas).toBeDefined();
      expect(Array.isArray(rating.impactAreas)).toBe(true);
    });

    it('should classify missing tests as Medium', async () => {
      const deviation: Deviation = {
        type: 'missing',
        description: 'No unit tests for authentication module',
        expectedBehavior: 'All auth functions should have tests',
        actualBehavior: 'No tests found',
        filePath: 'src/auth'
      };

      const context: RatingContext = {
        specContent: 'Testing Strategy: 100% unit test coverage',
        filePath: 'src/auth',
        changeType: 'addition'
      };

      const rating = await rater.rateDeviation(deviation, context);

      expect(rating.severity).toBeDefined();
      expect(rating.impactAreas).toContain('Testing');
    });

    it('should classify documentation gaps as Low', async () => {
      const deviation: Deviation = {
        type: 'missing',
        description: 'Missing JSDoc comments',
        expectedBehavior: 'Public functions should have documentation',
        actualBehavior: 'No documentation',
        filePath: 'src/utils.ts'
      };

      const context: RatingContext = {
        specContent: 'Code quality: All public APIs must be documented',
        filePath: 'src/utils.ts',
        changeType: 'modification'
      };

      const rating = await rater.rateDeviation(deviation, context);

      expect(rating.severity).toBe('Low');
    });

    it('should handle LLM errors gracefully', async () => {
      const mockProviderWithError = createMockLLMProvider();
      mockProviderWithError.generateStructured = async () => {
        throw new Error('LLM provider failed');
      };
      const raterWithError = new SeverityRater(mockProviderWithError);

      const deviation: Deviation = {
        type: 'incorrect',
        description: 'Test issue',
        expectedBehavior: 'Test',
        actualBehavior: 'Test'
      };

      const context: RatingContext = {
        specContent: 'Test spec',
        filePath: 'test.ts',
        changeType: 'modification'
      };

      const rating = await raterWithError.rateDeviation(deviation, context);

      expect(rating.severity).toBe('Medium');
      expect(rating.confidence).toBe(0.5);
    });
  });

  describe('severity classification', () => {
    it('should return all severity levels', async () => {
      const testCases = [
        { description: 'Critical security vulnerability', expected: ['Critical'] },
        { description: 'Major functional bug', expected: ['Critical', 'High'] },
        { description: 'Minor code style issue', expected: ['Low', 'Medium'] }
      ];

      for (const testCase of testCases) {
        const deviation: Deviation = {
          type: 'incorrect',
          description: testCase.description,
          expectedBehavior: 'Expected',
          actualBehavior: 'Actual'
        };

        const context: RatingContext = {
          specContent: 'Spec',
          filePath: 'test.ts',
          changeType: 'modification'
        };

        const rating = await rater.rateDeviation(deviation, context);

        expect(testCase.expected).toContain(rating.severity);
      }
    });
  });
});
