import { Verification, VerificationIssue, ApprovalStatus, Severity, IssueCategory } from '../../core/models/Verification';
import { Execution, ExecutionStatus, AgentType } from '../../core/models/Execution';

export interface VerificationData extends Verification {
  isExpanded?: boolean;
  selectedIssueId?: string | null;
  filterSeverity?: Severity | 'All';
}

export interface ExecutionData extends Execution {
  duration?: string;
  formattedDates?: {
    startedAt: string;
    completedAt?: string;
  };
  specTitles?: string[];
  ticketTitles?: string[];
}

export interface GetVerificationRequest {
  type: 'getVerification';
  verificationId: string;
}

export interface GetExecutionRequest {
  type: 'getExecution';
  executionId: string;
}

export interface ApplyAutoFixRequest {
  type: 'applyAutoFix';
  verificationId: string;
  issueId: string;
}

export interface IgnoreIssueRequest {
  type: 'ignoreIssue';
  verificationId: string;
  issueId: string;
}

export interface ApproveVerificationRequest {
  type: 'approveVerification';
  verificationId: string;
  status: 'approved' | 'approved_with_conditions';
  comment?: string;
}

export interface RequestChangesRequest {
  type: 'requestChanges';
  verificationId: string;
  comment: string;
}

export interface OpenSpecRequest {
  type: 'openSpec';
  specId: string;
}

export interface OpenTicketRequest {
  type: 'openTicket';
  ticketId: string;
}

export interface ViewVerificationRequest {
  type: 'viewVerification';
  verificationId: string;
}

export interface OpenFileRequest {
  type: 'openFile';
  filePath: string;
  lineNumber?: number;
}

export interface RefreshRequest {
  type: 'refresh';
}

export type ViewRequestMessage =
  | GetVerificationRequest
  | GetExecutionRequest
  | ApplyAutoFixRequest
  | IgnoreIssueRequest
  | ApproveVerificationRequest
  | RequestChangesRequest
  | OpenSpecRequest
  | OpenTicketRequest
  | ViewVerificationRequest
  | OpenFileRequest
  | RefreshRequest;

export interface VerificationDataResponse {
  type: 'verificationDataResponse';
  data: VerificationData;
}

export interface ExecutionDataResponse {
  type: 'executionDataResponse';
  data: ExecutionData;
}

export interface ActionSuccessResponse {
  type: 'actionSuccess';
  action: string;
  message?: string;
}

export interface ActionErrorResponse {
  type: 'actionError';
  message: string;
}

export interface ErrorResponse {
  type: 'error';
  message: string;
}

export interface RefreshResponse {
  type: 'refresh';
}

export type ViewResponseMessage =
  | VerificationDataResponse
  | ExecutionDataResponse
  | ActionSuccessResponse
  | ActionErrorResponse
  | ErrorResponse
  | RefreshResponse;

export type IssueAction = 'applyFix' | 'ignore';

export interface ApprovalDecision {
  status: 'approved' | 'approved_with_conditions' | 'changes_requested';
  comment?: string;
  conditions?: string[];
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
}
