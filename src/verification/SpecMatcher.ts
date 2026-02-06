import { LLMProvider, LLMMessage } from '../llm/types';
import { ArtifactStorage } from '../core/storage/ArtifactStorage';
import { ReferenceResolver } from '../core/references/ReferenceResolver';
import { DiffAnalysis } from '../core/models/Verification';
import { SpecMatchResult, RequirementMatch, Deviation } from './types';

export class SpecMatcher {
  private llmProvider: LLMProvider;
  private storage: ArtifactStorage;
  private resolver: ReferenceResolver;
  private specCache: Map<string, { content: string; requirements: string[]; timestamp: number }> = new Map();

  constructor(
    llmProvider: LLMProvider,
    storage: ArtifactStorage,
    resolver: ReferenceResolver
  ) {
    this.llmProvider = llmProvider;
    this.storage = storage;
    this.resolver = resolver;
  }

  async matchChangesToSpec(diff: DiffAnalysis, specId: string): Promise<SpecMatchResult[]> {
    const specContent = await this.loadSpecContent(specId);
    const requirements = await this.extractRequirements(specContent);

    const results: SpecMatchResult[] = [];

    for (const file of diff.changedFiles) {
      const fileResult = await this.matchFileToRequirements(file, requirements, specContent);
      results.push(fileResult);
    }

    return results;
  }

  private async loadSpecContent(specId: string): Promise<string> {
    const cached = this.specCache.get(specId);
    if (cached) {
      return cached.content;
    }

    try {
      const spec = await this.storage.loadSpec(specId);
      return spec.content;
    } catch (error) {
      throw new Error(`Failed to load spec ${specId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async extractRequirements(specContent: string): Promise<string[]> {
    const requirements: string[] = [];
    
    const functionalMatch = specContent.match(/##?\s*Functional\s*Requirements?\s*\n([\s\S]*?)(?=##?\s|$)/i);
    if (functionalMatch && functionalMatch[1]) {
      const reqMatches = functionalMatch[1].match(/[-*]\s*(.+)/g);
      if (reqMatches) {
        requirements.push(...reqMatches.map(r => r.replace(/^[-*]\s*/, '').trim()));
      }
    }

    const nonFunctionalMatch = specContent.match(/##?\s*Non[-\s]?Functional\s*Requirements?\s*\n([\s\S]*?)(?=##?\s|$)/i);
    if (nonFunctionalMatch && nonFunctionalMatch[1]) {
      const reqMatches = nonFunctionalMatch[1].match(/[-*]\s*(.+)/g);
      if (reqMatches) {
        requirements.push(...reqMatches.map(r => r.replace(/^[-*]\s*/, '').trim()));
      }
    }

    const technicalMatch = specContent.match(/##?\s*Technical\s*(?:Plan|Requirements?)?\s*\n([\s\S]*?)(?=##?\s|$)/i);
    if (technicalMatch && technicalMatch[1]) {
      const reqMatches = technicalMatch[1].match(/[-*]\s*(.+)/g);
      if (reqMatches) {
        requirements.push(...reqMatches.map(r => r.replace(/^[-*]\s*/, '').trim()));
      }
    }

    if (requirements.length === 0) {
      const genericMatches = specContent.match(/[-*]\s*(?:FR|NFR|REQ)-?\d*[:\.]?\s*(.+)/gi);
      if (genericMatches) {
        requirements.push(...genericMatches.map(r => r.replace(/^[-*]\s*/, '').trim()));
      }
    }

    return requirements;
  }

  private async matchFileToRequirements(
    file: DiffAnalysis['changedFiles'][0],
    requirements: string[],
    specContent: string
  ): Promise<SpecMatchResult> {
    const diffSummary = this.buildDiffSummary(file);

    const schema = {
      type: 'object',
      properties: {
        matchedRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              requirementText: { type: 'string' },
              relevance: { type: 'number', minimum: 0, maximum: 1 },
              reasoning: { type: 'string' }
            },
            required: ['requirementId', 'requirementText', 'relevance', 'reasoning']
          }
        },
        deviations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['missing', 'extra', 'incorrect'] },
              description: { type: 'string' },
              expectedBehavior: { type: 'string' },
              actualBehavior: { type: 'string' },
              filePath: { type: 'string' },
              lineNumber: { type: 'number' }
            },
            required: ['type', 'description', 'expectedBehavior', 'actualBehavior']
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 }
      },
      required: ['matchedRequirements', 'deviations', 'confidence']
    };

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a code reviewer analyzing changes against specifications. Your task is to match code changes to requirements and identify any deviations.'
      },
      {
        role: 'user',
        content: `Please analyze the following code changes against the specification requirements.

## Changed File
Path: ${file.path}
Status: ${file.status}

## Changes
${diffSummary}

## Spec Requirements
${requirements.map((req, idx) => `${idx + 1}. ${req}`).join('\n')}

## Full Spec Context
${specContent.substring(0, 3000)}${specContent.length > 3000 ? '\n... (truncated)' : ''}

## Instructions
1. Identify which requirements are matched by these changes
2. Identify any deviations from the requirements (missing functionality, extra functionality, incorrect implementation)
3. Provide a confidence score (0-1) for your analysis
4. Be specific about what was expected vs what was implemented

For each deviation, specify:
- type: 'missing' (expected but not implemented), 'extra' (implemented but not required), or 'incorrect' (implemented differently than specified)
- description: Clear description of the deviation
- expectedBehavior: What the spec requires
- actualBehavior: What was actually implemented`
      }
    ];

    try {
      const result = await this.llmProvider.generateStructured<{
        matchedRequirements: RequirementMatch[];
        deviations: Deviation[];
        confidence: number;
      }>(messages, schema);

      return {
        fileChanges: [file],
        matchedRequirements: result.matchedRequirements.map((match, idx) => ({
          ...match,
          requirementId: match.requirementId || `req-${idx + 1}`
        })),
        deviations: result.deviations.map(dev => ({
          ...dev,
          filePath: dev.filePath || file.path
        })),
        confidence: result.confidence
      };
    } catch (error) {
      return {
        fileChanges: [file],
        matchedRequirements: [],
        deviations: [{
          type: 'incorrect',
          description: `Failed to analyze changes: ${error instanceof Error ? error.message : String(error)}`,
          expectedBehavior: 'Successful analysis',
          actualBehavior: 'Analysis failed',
          filePath: file.path
        }],
        confidence: 0
      };
    }
  }

  private buildDiffSummary(file: DiffAnalysis['changedFiles'][0]): string {
    const lines: string[] = [];
    
    for (const change of file.changes.slice(0, 50)) {
      const prefix = change.type === 'addition' ? '+' : change.type === 'deletion' ? '-' : ' ';
      lines.push(`${prefix} ${change.content.substring(0, 100)}${change.content.length > 100 ? '...' : ''}`);
    }

    if (file.changes.length > 50) {
      lines.push(`... and ${file.changes.length - 50} more changes`);
    }

    return lines.join('\n');
  }

  clearCache(): void {
    this.specCache.clear();
  }
}
