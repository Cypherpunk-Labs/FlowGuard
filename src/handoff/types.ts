import { CodebaseContext } from '../planning/codebase/types';
import { Execution, AgentType, ExecutionStatus, ExecutionResults } from '../core/models/Execution';
import { Spec } from '../core/models/Spec';
import { Ticket } from '../core/models/Ticket';

export interface HandoffInput {
  epicId: string;
  specIds: string[];
  ticketIds: string[];
  agentType: AgentType;
  includeCodebaseContext?: boolean;
  customTemplate?: string;
}

export interface HandoffOutput {
  markdown: string;
  executionId: string;
  metadata: HandoffMetadata;
}

export interface HandoffMetadata {
  wordCount: number;
  estimatedReadingTime: number;
  specCount: number;
  ticketCount: number;
  totalEstimatedEffort: number;
  generatedAt: Date;
}

export interface TemplateVariables {
  epicTitle: string;
  epicId: string;
  timestamp: string;
  author: string;
  specs: SpecTemplateData[];
  tickets: TicketTemplateData[];
  codebaseContext: string;
  totalFiles: number;
  totalLines: number;
  languages: string;
  codebaseFiles: CodebaseFileData[];
}

export interface SpecTemplateData {
  id: string;
  title: string;
  content: string;
  status: string;
}

export interface TicketTemplateData {
  id: string;
  title: string;
  content: string;
  priority: string;
  estimatedEffort: string;
  status: string;
}

export interface CodebaseFileData {
  path: string;
  language: string;
  loc: number;
}

export interface AgentTemplate {
  name: string;
  agentType: AgentType;
  template: string;
  description: string;
  sections: TemplateSection[];
  preprocessor?: (data: TemplateVariables) => Promise<TemplateVariables>;
  postprocessor?: (markdown: string) => Promise<string>;
}

export interface TemplateSection {
  name: string;
  required: boolean;
  content: string;
  order: number;
}

export interface TemplateNode {
  type: 'text' | 'variable' | 'section' | 'conditional';
  content: string;
  name?: string;
  children?: TemplateNode[];
  condition?: string;
}

export type { Execution, AgentType, ExecutionStatus, ExecutionResults, Spec, Ticket };
