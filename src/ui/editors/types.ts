import { Spec, SpecStatus } from '../../core/models/Spec';
import { Ticket, TicketStatus, Priority } from '../../core/models/Ticket';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface SpecEditorData extends Spec {
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt?: Date;
  validationErrors: ValidationError[];
}

export interface TicketEditorData extends Ticket {
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt?: Date;
  validationErrors: ValidationError[];
}

export interface FieldSchema {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'tags' | 'number';
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  validation?: (value: any) => ValidationError | null;
}

export interface ToolbarAction {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface DiagramTemplate {
  id: string;
  name: string;
  type: 'architecture' | 'sequence' | 'flow' | 'class';
  template: string;
  description?: string;
}

export interface DiagramPreviewResponse {
  type: 'diagramPreview';
  svg: string;
  error?: string;
}

export interface MarkdownPreviewResponse {
  type: 'markdownPreview';
  html: string;
  error?: string;
}

export interface ArtifactDataResponse {
  type: 'artifactData';
  data: SpecEditorData | TicketEditorData;
}

export interface SaveSuccessResponse {
  type: 'saveSuccess';
  timestamp: string;
}

export interface SaveErrorResponse {
  type: 'saveError';
  message: string;
  canRetry: boolean;
}

export interface StatusUpdateResponse {
  type: 'statusUpdated';
  status: SpecStatus | TicketStatus;
  timestamp: string;
}

export interface ExportResponse {
  type: 'exportComplete';
  format: string;
  filePath?: string;
  content?: string;
}

export interface ApprovalResponse {
  type: 'approved';
  specId: string;
  approvedBy: string;
  timestamp: string;
}

export interface ErrorResponse {
  type: 'error';
  message: string;
  code?: string;
}

export interface LoadArtifactRequest {
  type: 'loadArtifact';
}

export interface SaveArtifactRequest {
  type: 'saveArtifact';
  content: string;
  metadata: Record<string, any>;
}

export interface UpdateStatusRequest {
  type: 'updateStatus';
  status: SpecStatus | TicketStatus;
  comment?: string;
}

export interface UpdatePriorityRequest {
  type: 'updatePriority';
  priority: Priority;
}

export interface UpdateAssigneeRequest {
  type: 'updateAssignee';
  assignee: string;
}

export interface InsertDiagramRequest {
  type: 'insertDiagram';
  diagram: string;
  cursorPosition: number;
}

export interface PreviewMarkdownRequest {
  type: 'previewMarkdown';
  content: string;
}

export interface ExportArtifactRequest {
  type: 'exportArtifact';
  format: 'markdown' | 'pdf' | 'html' | 'clipboard';
}

export interface ApproveArtifactRequest {
  type: 'approveArtifact';
  approvedBy: string;
  comment?: string;
}

export interface RequestArtifactDataMessage {
  type: 'requestArtifactData';
}

export type EditorRequestMessage =
  | LoadArtifactRequest
  | SaveArtifactRequest
  | UpdateStatusRequest
  | UpdatePriorityRequest
  | UpdateAssigneeRequest
  | InsertDiagramRequest
  | PreviewMarkdownRequest
  | ExportArtifactRequest
  | ApproveArtifactRequest
  | RequestArtifactDataMessage;

export type EditorResponseMessage =
  | ArtifactDataResponse
  | SaveSuccessResponse
  | SaveErrorResponse
  | StatusUpdateResponse
  | DiagramPreviewResponse
  | MarkdownPreviewResponse
  | ExportResponse
  | ApprovalResponse
  | ErrorResponse;

export interface DiagramInsertion {
  type: string;
  code: string;
  position: number;
}

export interface DiagramRenderResult {
  svg: string;
  error?: string;
}

export interface ExportOptions {
  format: 'markdown' | 'pdf' | 'html';
  includeMetadata: boolean;
  includeDiagrams: boolean;
  theme?: 'light' | 'dark';
}
