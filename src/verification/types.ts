import { DiffAnalysis, ChangedFile, Severity } from '../core/models/Verification';

export type DiffFormat = 'git' | 'github' | 'gitlab' | 'unified';

export interface DiffMetadata {
  prUrl?: string;
  commitHash?: string;
  branch?: string;
  author?: string;
  timestamp?: Date;
  message?: string;
}

export interface DiffInput {
  format: DiffFormat;
  content: string;
  metadata?: DiffMetadata;
}

export interface ParsedDiff extends DiffAnalysis {
  format: DiffFormat;
  metadata?: DiffMetadata;
  parsingErrors?: string[];
}

export interface SpecMatchResult {
  fileChanges: ChangedFile[];
  matchedRequirements: RequirementMatch[];
  deviations: Deviation[];
  confidence: number;
}

export interface RequirementMatch {
  requirementId: string;
  requirementText: string;
  relevance: number;
  reasoning: string;
}

export interface Deviation {
  type: 'missing' | 'extra' | 'incorrect';
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  filePath?: string;
  lineNumber?: number;
}

export interface SeverityRating {
  severity: Severity;
  reasoning: string;
  confidence: number;
  impactAreas: string[];
}

export interface MatchWithRatings {
  match: SpecMatchResult;
  ratings: SeverityRating[];
}

export interface RatingContext {
  specContent: string;
  filePath: string;
  changeType: string;
  projectType?: string;
}

export interface FeedbackContext {
  fileContent: string;
  surroundingLines: string[];
  specRequirement: string;
}

export interface FixSuggestion {
  description: string;
  codeExample?: string;
  automatedFix?: boolean;
  steps: string[];
}

export interface VerificationInput {
  epicId: string;
  specIds?: string[];
  diffInput: DiffInput;
  options?: VerificationOptions;
}

export interface VerificationOptions {
  skipLowSeverity?: boolean;
  autoApprove?: boolean;
  includeCodeExamples?: boolean;
  maxIssues?: number;
}

export interface DiffAdapter {
  adapt(input: string): DiffInput | Promise<DiffInput>;
}

export interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  oldPath?: string;
  changes: LineChange[];
  isBinary?: boolean;
  oldMode?: string;
  newMode?: string;
}

export interface LineChange {
  type: 'addition' | 'deletion' | 'unchanged';
  lineNumber: number;
  oldLineNumber?: number;
  content: string;
}

export interface DiffStatistics {
  totalFiles: number;
  totalLines: number;
  additions: number;
  deletions: number;
  modifiedFiles: number;
  addedFiles: number;
  deletedFiles: number;
  renamedFiles: number;
}
