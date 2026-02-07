import { LLMProvider, LLMMessage } from '../llm/types';
import { Severity } from '../core/models/Verification';
import { Deviation, SeverityRating, RatingContext } from './types';

export class SeverityRater {
  private llmProvider: LLMProvider;

  constructor(llmProvider: LLMProvider) {
    this.llmProvider = llmProvider;
  }

  async rateDeviation(deviation: Deviation, context: RatingContext): Promise<SeverityRating> {
    const schema = {
      type: 'object',
      properties: {
        severity: {
          type: 'string',
          enum: ['Critical', 'High', 'Medium', 'Low']
        },
        reasoning: { type: 'string' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        impactAreas: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['severity', 'reasoning', 'confidence', 'impactAreas']
    };

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are a code review expert who classifies the severity of deviations from specifications. 

Use the following severity criteria:

**Critical**: Security vulnerabilities, data loss risks, breaking changes to public APIs, critical functionality completely broken, production outage risks

**High**: Functional requirements not met, performance degradation, incorrect business logic, data integrity issues

**Medium**: Non-functional requirements partially met, code quality issues, missing edge cases, minor performance concerns

**Low**: Style inconsistencies, documentation gaps, minor optimizations, cosmetic issues

Provide your classification with detailed reasoning and confidence score.`
      },
      {
        role: 'user',
        content: `Please classify the severity of the following deviation:

## Deviation Details
**Type**: ${deviation.type}
**Description**: ${deviation.description}
**Expected Behavior**: ${deviation.expectedBehavior}
**Actual Behavior**: ${deviation.actualBehavior}
**File**: ${deviation.filePath || context.filePath}
**Line**: ${deviation.lineNumber || 'N/A'}

## Context
**File Path**: ${context.filePath}
**Change Type**: ${context.changeType}
**Project Type**: ${context.projectType || 'Not specified'}

## Spec Context
${context.specContent.substring(0, 2000)}${context.specContent.length > 2000 ? '\n... (truncated)' : ''}

## Instructions
1. Classify the severity as Critical, High, Medium, or Low
2. Provide detailed reasoning for your classification
3. Assign a confidence score (0-1)
4. List the impact areas (e.g., security, performance, functionality, user experience, maintainability)`
      }
    ];

    try {
      const result = await this.llmProvider.generateStructured<{
        severity: Severity;
        reasoning: string;
        confidence: number;
        impactAreas: string[];
      }>(messages, schema);

      return {
        severity: result.severity,
        reasoning: result.reasoning,
        confidence: result.confidence,
        impactAreas: result.impactAreas || []
      };
    } catch (error) {
      return {
        severity: 'Medium',
        reasoning: `Failed to rate severity: ${error instanceof Error ? error.message : String(error)}`,
        confidence: 0.5,
        impactAreas: ['unknown']
      };
    }
  }

  async rateDeviationsBatch(
    deviations: Deviation[],
    context: RatingContext
  ): Promise<SeverityRating[]> {
    const ratings: SeverityRating[] = [];

    for (const deviation of deviations) {
      const rating = await this.rateDeviation(deviation, context);
      ratings.push(rating);
    }

    return ratings;
  }
}
