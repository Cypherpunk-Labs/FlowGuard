import { LLMProvider, LLMMessage } from '../llm/types';
import { CodebaseExplorer } from '../planning/codebase/CodebaseExplorer';
import { VerificationIssue, VerificationSummary, Severity, IssueCategory, ApprovalStatus, FixSuggestion } from '../core/models/Verification';
import { SpecMatchResult, SeverityRating, MatchWithRatings } from './types';
import { generateUUID } from '../utils/uuid';

export class FeedbackGenerator {
  private llmProvider: LLMProvider;
  private codebaseExplorer: CodebaseExplorer;

  constructor(llmProvider: LLMProvider, codebaseExplorer: CodebaseExplorer) {
    this.llmProvider = llmProvider;
    this.codebaseExplorer = codebaseExplorer;
  }

  async generateFeedback(
    matchResults: MatchWithRatings[],
    options?: { includeCodeExamples?: boolean }
  ): Promise<VerificationIssue[]> {
    const issues: VerificationIssue[] = [];

    for (const { match, ratings } of matchResults) {
      if (match.deviations.length !== ratings.length) {
        console.warn(`Mismatch: ${match.deviations.length} devs vs ${ratings.length} ratings for match`);
        continue;
      }
      for (let j = 0; j < match.deviations.length; j++) {
        const deviation = match.deviations[j]!;
        const rating = ratings[j]!;
        const issue = await this.createIssueFromDeviation(deviation, rating, match, options);
        issues.push(issue);
      }
    }

    return issues;
  }

  private async createIssueFromDeviation(
    deviation: any,
    rating: SeverityRating,
    match: SpecMatchResult,
    options?: { includeCodeExamples?: boolean }
  ): Promise<VerificationIssue> {
    const filePath = deviation.filePath || match.fileChanges[0]?.path || 'unknown';
    const lineNumber = deviation.lineNumber || this.findLineNumber(match, deviation);

    const category = this.classifyCategory(rating.impactAreas);

    let fixSuggestion: FixSuggestion | undefined;
    if (options?.includeCodeExamples !== false) {
      fixSuggestion = await this.generateFixSuggestion(
        deviation,
        rating,
        filePath,
        lineNumber
      );
    }

    return {
      id: generateUUID(),
      severity: rating.severity,
      category,
      file: filePath,
      line: lineNumber,
      message: this.buildIssueMessage(deviation, rating),
      suggestion: fixSuggestion?.description,
      code: fixSuggestion?.codeExample,
      fixSuggestion
    };
  }

  private buildIssueMessage(deviation: any, rating: SeverityRating): string {
    const parts: string[] = [];
    
    parts.push(`[${deviation.type.toUpperCase()}] ${deviation.description}`);
    
    if (deviation.expectedBehavior) {
      parts.push(`Expected: ${deviation.expectedBehavior}`);
    }
    
    if (deviation.actualBehavior) {
      parts.push(`Actual: ${deviation.actualBehavior}`);
    }

    parts.push(`Severity: ${rating.severity} (${rating.reasoning})`);

    return parts.join('\n');
  }

  private classifyCategory(impactAreas: string[]): IssueCategory {
    const areas = impactAreas.map(a => a.toLowerCase());
    
    if (areas.some(a => a.includes('security'))) return 'security';
    if (areas.some(a => a.includes('performance'))) return 'performance';
    if (areas.some(a => a.includes('logic') || a.includes('functionality'))) return 'logic';
    if (areas.some(a => a.includes('style') || a.includes('format'))) return 'style';
    if (areas.some(a => a.includes('document'))) return 'documentation';
    if (areas.some(a => a.includes('test'))) return 'testing';
    if (areas.some(a => a.includes('architecture') || a.includes('design'))) return 'architecture';
    
    return 'logic';
  }

  private findLineNumber(match: SpecMatchResult, deviation: any): number | undefined {
    for (const fileChange of match.fileChanges) {
      for (const change of fileChange.changes) {
        if (change.content.includes(deviation.description.substring(0, 50))) {
          return change.lineNumber;
        }
      }
    }
    return undefined;
  }

  private async generateFixSuggestion(
    deviation: any,
    rating: SeverityRating,
    filePath: string,
    lineNumber?: number
  ): Promise<FixSuggestion | undefined> {
    const schema = {
      type: 'object',
      properties: {
        description: { type: 'string' },
        codeExample: { type: 'string' },
        automatedFix: { type: 'boolean' },
        steps: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['description', 'steps']
    };

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a code reviewer generating fix suggestions for identified issues. Provide clear, actionable guidance with code examples when applicable.'
      },
      {
        role: 'user',
        content: `Generate a fix suggestion for the following issue:

## Issue Details
**Type**: ${deviation.type}
**Description**: ${deviation.description}
**Expected**: ${deviation.expectedBehavior}
**Actual**: ${deviation.actualBehavior}
**Severity**: ${rating.severity}
**Impact Areas**: ${rating.impactAreas.join(', ')}

## Location
**File**: ${filePath}
**Line**: ${lineNumber || 'N/A'}

## Instructions
1. Provide a clear description of how to fix the issue
2. Include a code example showing the fix (if applicable)
3. Indicate if this can be automated (true/false)
4. List the steps needed to implement the fix`
      }
    ];

    try {
      const result = await this.llmProvider.generateStructured<FixSuggestion>(messages, schema);
      return {
        description: result.description,
        codeExample: result.codeExample,
        automatedFix: result.automatedFix || false,
        steps: result.steps || []
      };
    } catch (error) {
      return {
        description: `Fix suggestion generation failed: ${error instanceof Error ? error.message : String(error)}`,
        steps: ['Review the deviation manually', 'Consult the specification', 'Implement the expected behavior']
      };
    }
  }

  generateSummary(issues: VerificationIssue[]): VerificationSummary {
    const issueCounts: Record<Severity, number> = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0
    };

    for (const issue of issues) {
      issueCounts[issue.severity]++;
    }

    const totalIssues = issues.length;
    const hasCritical = issueCounts.Critical > 0;
    const hasHigh = issueCounts.High > 0;

    let passed = !hasCritical && !hasHigh;
    let approvalStatus: ApprovalStatus;
    let recommendation: string;

    if (hasCritical) {
      approvalStatus = 'changes_requested';
      recommendation = 'Changes requested - Critical issues must be resolved before approval';
    } else if (hasHigh) {
      approvalStatus = 'changes_requested';
      recommendation = 'Changes requested - High severity issues must be addressed';
    } else if (issueCounts.Medium > 0) {
      approvalStatus = 'approved_with_conditions';
      recommendation = 'Approved with conditions - Address medium severity issues when convenient';
      passed = true;
    } else if (issueCounts.Low > 0) {
      approvalStatus = 'approved_with_conditions';
      recommendation = 'Approved with conditions - Minor issues can be addressed later';
      passed = true;
    } else {
      approvalStatus = 'approved';
      recommendation = 'Approved - No issues found';
      passed = true;
    }

    return {
      passed,
      totalIssues,
      issueCounts,
      recommendation,
      approvalStatus
    };
  }
}
