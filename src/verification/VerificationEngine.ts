import { LLMProvider } from '../llm/types';
import { ArtifactStorage } from '../core/storage/ArtifactStorage';
import { GitHelper } from '../core/git/GitHelper';
import { ReferenceResolver } from '../core/references/ReferenceResolver';
import { CodebaseExplorer } from '../planning/codebase/CodebaseExplorer';
import { Verification, DiffSource, DiffAnalysis, VerificationIssue } from '../core/models/Verification';
import { DiffAnalyzer } from './DiffAnalyzer';
import { SpecMatcher } from './SpecMatcher';
import { SeverityRater } from './SeverityRater';
import { FeedbackGenerator } from './FeedbackGenerator';
import { VerificationInput, VerificationOptions, SpecMatchResult, SeverityRating, ParsedDiff, MatchWithRatings } from './types';
import { generateUUID } from '../utils/uuid';
import { PluginManager } from '../plugins/PluginManager';
import { ValidationContext } from '../plugins/types';
import * as vscode from 'vscode';

export class VerificationEngine {
  private llmProvider: LLMProvider;
  private storage: ArtifactStorage;
  private gitHelper: GitHelper;
  private resolver: ReferenceResolver;
  private codebaseExplorer: CodebaseExplorer;
  private pluginManager: PluginManager | null;

  private diffAnalyzer: DiffAnalyzer;
  private specMatcher: SpecMatcher;
  private severityRater: SeverityRater;
  private feedbackGenerator: FeedbackGenerator;

  constructor(
    llmProvider: LLMProvider,
    storage: ArtifactStorage,
    gitHelper: GitHelper,
    resolver: ReferenceResolver,
    codebaseExplorer: CodebaseExplorer,
    pluginManager: PluginManager | null = null
  ) {
    this.llmProvider = llmProvider;
    this.storage = storage;
    this.gitHelper = gitHelper;
    this.resolver = resolver;
    this.codebaseExplorer = codebaseExplorer;
    this.pluginManager = pluginManager;

    this.diffAnalyzer = new DiffAnalyzer();
    this.specMatcher = new SpecMatcher(llmProvider, storage, resolver);
    this.severityRater = new SeverityRater(llmProvider);
    this.feedbackGenerator = new FeedbackGenerator(llmProvider, codebaseExplorer);
  }

  async verifyChanges(input: VerificationInput): Promise<Verification> {
    const { epicId, specIds, diffInput, options } = input;

    try {
      const parsedDiff = this.diffAnalyzer.parseDiff(diffInput.content, diffInput.format);
      const diffMetadata = diffInput.metadata || this.extractDiffMetadata(diffInput);

      const diffSource: DiffSource = {
        commitHash: diffMetadata.commitHash || 'unknown',
        branch: diffMetadata.branch || 'unknown',
        author: diffMetadata.author || 'unknown',
        timestamp: diffMetadata.timestamp || new Date(),
        message: diffMetadata.message || 'No message'
      };

      const matchResults: MatchWithRatings[] = [];

      const targetSpecIds = specIds && specIds.length > 0 
        ? specIds 
        : await this.getSpecsForEpic(epicId);

      for (const specId of targetSpecIds) {
        try {
          const matches = await this.specMatcher.matchChangesToSpec(parsedDiff, specId);

          for (const match of matches) {
            const spec = await this.storage.loadSpec(specId);
            const matchRatings: SeverityRating[] = [];
            
            if (match.deviations.length === 0) {
              continue;
            }
            
            for (const deviation of match.deviations) {
              const context = {
                specContent: spec.content,
                filePath: deviation.filePath || match.fileChanges[0]?.path || 'unknown',
                changeType: match.fileChanges[0]?.status || 'modified'
              };

              const rating = await this.severityRater.rateDeviation(deviation, context);
              matchRatings.push(rating);
            }
            matchResults.push({ match, ratings: matchRatings });
          }
        } catch (error) {
          console.error(`Failed to process spec ${specId}:`, error);
        }
      }

      let issues = await this.feedbackGenerator.generateFeedback(matchResults, {
        includeCodeExamples: options?.includeCodeExamples
      });

      // Execute plugin verification rules
      const pluginIssues = await this.executePluginRules(parsedDiff);
      issues = [...issues, ...pluginIssues];

      if (options?.skipLowSeverity) {
        issues = issues.filter(issue => issue.severity !== 'Low');
      }

      if (options?.maxIssues && issues.length > options.maxIssues) {
        issues = issues.slice(0, options.maxIssues);
      }

      const summary = this.feedbackGenerator.generateSummary(issues);

      if (options?.autoApprove && summary.approvalStatus === 'approved_with_conditions') {
        summary.approvalStatus = 'approved';
        summary.recommendation = 'Auto-approved based on configuration';
      }

      const verification: Verification = {
        id: generateUUID(),
        epicId,
        diffSource,
        analysis: this.convertToDiffAnalysis(parsedDiff),
        issues,
        summary,
        createdAt: new Date()
      };

      await this.storage.saveVerification(verification);

      return verification;
    } catch (error) {
      console.error('Verification failed:', error);
      
      return {
        id: generateUUID(),
        epicId,
        diffSource: {
          commitHash: 'unknown',
          branch: 'unknown',
          author: 'unknown',
          timestamp: new Date(),
          message: 'Verification failed'
        },
        analysis: {
          totalFiles: 0,
          totalLines: 0,
          additions: 0,
          deletions: 0,
          changedFiles: []
        },
        issues: [{
          id: generateUUID(),
          severity: 'High',
          category: 'logic',
          file: 'verification-system',
          message: `Verification failed: ${error instanceof Error ? error.message : String(error)}`,
          suggestion: 'Please check the diff input and try again'
        }],
        summary: {
          passed: false,
          totalIssues: 1,
          issueCounts: { Critical: 0, High: 1, Medium: 0, Low: 0 },
          recommendation: 'Verification system error - please retry',
          approvalStatus: 'changes_requested'
        },
        createdAt: new Date()
      };
    }
  }

  private extractDiffMetadata(diffInput: VerificationInput['diffInput']): {
    commitHash?: string;
    branch?: string;
    author?: string;
    timestamp?: Date;
    message?: string;
  } {
    return this.diffAnalyzer.extractMetadata(diffInput.content, diffInput.format);
  }

  private async getSpecsForEpic(epicId: string): Promise<string[]> {
    try {
      const specs = await this.storage.listSpecs(epicId);
      return specs.map(spec => spec.id);
    } catch (error) {
      console.error('Failed to list specs:', error);
      return [];
    }
  }

  private convertToDiffAnalysis(parsedDiff: ParsedDiff): DiffAnalysis {
    return {
      totalFiles: parsedDiff.totalFiles,
      totalLines: parsedDiff.totalLines,
      additions: parsedDiff.additions,
      deletions: parsedDiff.deletions,
      changedFiles: parsedDiff.changedFiles
    };
  }

  private async executePluginRules(parsedDiff: ParsedDiff): Promise<VerificationIssue[]> {
    if (!this.pluginManager) {
      return [];
    }

    const rules = this.pluginManager.getVerificationRules();
    const allIssues: VerificationIssue[] = [];

    for (const rule of rules) {
      try {
        // Check if rule is enabled via configuration
        const config = vscode.workspace.getConfiguration('flowguard.plugins.verificationRules');
        const isEnabled = config.get<boolean>(rule.id, rule.enabled);

        if (!isEnabled) {
          continue;
        }

        // Create validation context for each file
        for (const changedFile of parsedDiff.changedFiles) {
          const validationContext: ValidationContext = {
            fileChanges: parsedDiff.changedFiles,
            specContent: '', // Will be populated if needed by the rule
            fileContent: changedFile.changes.map(c => c.content).join('\n'),
            filePath: changedFile.path,
            workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''
          };

          const issues = await rule.validate(validationContext);
          allIssues.push(...issues);
        }
      } catch (error) {
        console.error(`Failed to execute plugin rule ${rule.id}:`, error);
      }
    }

    return allIssues;
  }
}
