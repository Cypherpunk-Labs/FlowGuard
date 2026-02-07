import { describe, it, expect, beforeEach } from '@jest/globals';
import { FeedbackGenerator } from '../../../src/verification/FeedbackGenerator';
import { SpecMatchResult, SeverityRating, MatchWithRatings } from '../../../src/verification/types';
import { VerificationIssue } from '../../../src/core/models/Verification';

describe('FeedbackGenerator', () => {
  let generator: FeedbackGenerator;

  beforeEach(() => {
    generator = new FeedbackGenerator(
      {} as any,
      {} as any
    );
  });

  describe('generateFeedback', () => {
    it('should generate structured feedback report', async () => {
      const matchResults: MatchWithRatings[] = [
        {
          match: {
            fileChanges: [],
            matchedRequirements: [
              { requirementId: 'REQ-1', requirementText: 'Requirement 1', relevance: 0.9, reasoning: 'Matches well' }
            ],
            deviations: [
              {
                type: 'incorrect',
                description: 'Wrong implementation',
                expectedBehavior: 'Should do X',
                actualBehavior: 'Does Y',
                filePath: 'src/test.ts',
                lineNumber: 10
              }
            ],
            confidence: 0.85
          },
          ratings: [
            { severity: 'Medium', reasoning: 'Moderate issue', confidence: 0.8, impactAreas: ['Testing'] }
          ]
        }
      ];

      const feedback = await generator.generateFeedback(matchResults);

      expect(feedback).toBeDefined();
      expect(feedback.length).toBe(1);
      expect(feedback[0]).toBeDefined();
      expect(feedback[0].severity).toBe('Medium');
    });

    it('should handle empty match results', async () => {
      const matchResults: MatchWithRatings[] = [];

      const feedback = await generator.generateFeedback(matchResults);

      expect(feedback).toBeDefined();
      expect(feedback.length).toBe(0);
    });

    it('should create issues for each deviation with rating', async () => {
      const matchResults: MatchWithRatings[] = [
        {
          match: {
            fileChanges: [{ path: 'test.ts', status: 'modified', changes: [] }],
            matchedRequirements: [],
            deviations: [
              {
                type: 'missing',
                description: 'Missing feature',
                expectedBehavior: 'Should implement feature',
                actualBehavior: 'Not implemented'
              }
            ],
            confidence: 0.9
          },
          ratings: [
            { severity: 'High', reasoning: 'Critical issue', confidence: 0.9, impactAreas: ['Functionality'] }
          ]
        }
      ];

      const feedback = await generator.generateFeedback(matchResults);

      expect(feedback.length).toBe(1);
      expect(feedback[0].severity).toBe('High');
    });
  });
});
