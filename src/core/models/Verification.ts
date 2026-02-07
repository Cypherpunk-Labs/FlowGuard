export interface Verification {
  id: string;
  epicId: string;
  diffSource: DiffSource;
  analysis: DiffAnalysis;
  issues: VerificationIssue[];
  summary: VerificationSummary;
  createdAt: Date;
}

export interface DiffSource {
  commitHash: string;
  branch: string;
  author: string;
  timestamp: Date;
  message: string;
}

export interface DiffAnalysis {
  totalFiles: number;
  totalLines: number;
  additions: number;
  deletions: number;
  changedFiles: ChangedFile[];
}

export interface ChangedFile {
  path: string;
  status: 'added' | 'modified' | 'deleted';
  changes: Change[];
}

export interface Change {
  type: 'addition' | 'deletion' | 'modification';
  lineNumber: number;
  content: string;
}

export interface VerificationIssue {
  id: string;
  severity: Severity;
  category: IssueCategory;
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
  code?: string;
  specRequirementId?: string;
  fixSuggestion?: FixSuggestion;
}

export interface FixSuggestion {
  description: string;
  codeExample?: string;
  automatedFix?: boolean;
  steps: string[];
}

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export type IssueCategory =
  | 'security'
  | 'performance'
  | 'style'
  | 'logic'
  | 'documentation'
  | 'testing'
  | 'architecture';

export interface SuggestedFix {
  description: string;
  replacement?: string;
  additionalContext?: string;
}

export interface VerificationSummary {
  passed: boolean;
  totalIssues: number;
  issueCounts: Record<Severity, number>;
  recommendation: string;
  approvalStatus: ApprovalStatus;
}

export type ApprovalStatus = 'approved' | 'approved_with_conditions' | 'changes_requested' | 'pending';
