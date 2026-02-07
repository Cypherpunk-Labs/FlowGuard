export interface Execution {
  id: string;
  epicId: string;
  specIds: string[];
  ticketIds: string[];
  agentType: AgentType;
  handoffPrompt: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  results?: ExecutionResults;
}

export type AgentType = 'cursor' | 'claude' | 'windsurf' | 'cline' | 'aider' | 'custom';

export type ExecutionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface ExecutionResults {
  diffSummary: string;
  agentNotes: string;
  filesChanged: string[];
}
