import { registerValidator, Validator } from '../parsers/frontmatter';
import {
  Epic, EpicStatus, EpicMetadata, Phase, PhaseStatus, Priority,
  Spec, SpecStatus,
  Ticket, TicketStatus,
  Execution, ExecutionStatus, AgentType,
  Verification, Severity, IssueCategory, ApprovalStatus, FixSuggestion
} from './index';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(obj: Record<string, unknown>, key: string, required: boolean = false): string | undefined {
  const value = obj[key];
  if (required && (value === undefined || value === null)) {
    throw new Error(`Missing required field: ${key}`);
  }
  if (value !== undefined && typeof value !== 'string') {
    throw new Error(`Field "${key}" must be a string`);
  }
  return value as string | undefined;
}

function getDate(obj: Record<string, unknown>, key: string, required: boolean = false): Date | undefined {
  const value = obj[key];
  if (required && (value === undefined || value === null)) {
    throw new Error(`Missing required field: ${key}`);
  }
  if (value === undefined || value === null) return undefined;
  if (value instanceof Date) return value;
  if (typeof value !== 'string') {
    throw new Error(`Field "${key}" must be a date`);
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`Field "${key}" has invalid date format`);
  }
  return date;
}

function getArray<T>(obj: Record<string, unknown>, key: string, required: boolean = false): T[] | undefined {
  const value = obj[key];
  if (required && (value === undefined || value === null)) {
    throw new Error(`Missing required field: ${key}`);
  }
  if (value !== undefined && !Array.isArray(value)) {
    throw new Error(`Field "${key}" must be an array`);
  }
  return value as T[] | undefined;
}

function getEnum<T extends string>(obj: Record<string, unknown>, key: string, allowed: T[], required: boolean = false): T | undefined {
  const value = obj[key];
  if (required && (value === undefined || value === null)) {
    throw new Error(`Missing required field: ${key}`);
  }
  if (value !== undefined && !allowed.includes(value as T)) {
    throw new Error(`Field "${key}" must be one of: ${allowed.join(', ')}`);
  }
  return value as T | undefined;
}

export function validateEpic(data: unknown): Epic {
  if (!isObject(data)) {
    throw new Error('Epic data must be an object');
  }
  const obj = data as Record<string, unknown>;

  return {
    id: getString(obj, 'id', true) || '',
    title: getString(obj, 'title', true) || '',
    overview: getString(obj, 'overview', true) || '',
    phases: getArray<Phase>(obj, 'phases', true) || [],
    technicalPlan: obj.technicalPlan as Epic['technicalPlan'],
    diagrams: getArray(obj, 'diagrams') || [],
    metadata: validateEpicMetadata(obj.metadata),
    status: getEnum<EpicStatus>(obj, 'status', ['draft', 'planning', 'in_progress', 'in_review', 'completed', 'archived'], true) || 'draft',
    createdAt: getDate(obj, 'createdAt', true) || new Date(),
    updatedAt: getDate(obj, 'updatedAt', true) || new Date()
  };
}

function validateEpicMetadata(data: unknown): EpicMetadata {
  if (!isObject(data)) {
    throw new Error('EpicMetadata must be an object');
  }
  const obj = data as Record<string, unknown>;

  return {
    author: getString(obj, 'author', true) || '',
    tags: getArray<string>(obj, 'tags') || [],
    priority: getEnum<Priority>(obj, 'priority', ['low', 'medium', 'high', 'critical'], true) || 'medium',
    targetDate: getDate(obj, 'targetDate'),
    stakeholders: getArray<string>(obj, 'stakeholders')
  };
}

export function validateSpec(data: unknown): Spec {
  if (!isObject(data)) {
    throw new Error('Spec data must be an object');
  }
  const obj = data as Record<string, unknown>;

  return {
    id: getString(obj, 'id', true) || '',
    epicId: getString(obj, 'epicId', true) || '',
    title: getString(obj, 'title', true) || '',
    status: getEnum<SpecStatus>(obj, 'status', ['draft', 'in_review', 'approved', 'archived'], true) || 'draft',
    createdAt: getDate(obj, 'createdAt', true) || new Date(),
    updatedAt: getDate(obj, 'updatedAt', true) || new Date(),
    author: getString(obj, 'author', true) || '',
    tags: getArray<string>(obj, 'tags') || [],
    content: getString(obj, 'content', true) || ''
  };
}

export function validateTicket(data: unknown): Ticket {
  if (!isObject(data)) {
    throw new Error('Ticket data must be an object');
  }
  const obj = data as Record<string, unknown>;

  return {
    id: getString(obj, 'id', true) || '',
    epicId: getString(obj, 'epicId', true) || '',
    specId: getString(obj, 'specId', true) || '',
    title: getString(obj, 'title', true) || '',
    status: getEnum<TicketStatus>(obj, 'status', ['todo', 'in_progress', 'in_review', 'done', 'blocked'], true) || 'todo',
    priority: getEnum<Priority>(obj, 'priority', ['low', 'medium', 'high', 'critical'], true) || 'medium',
    assignee: getString(obj, 'assignee'),
    estimatedEffort: getString(obj, 'estimatedEffort'),
    createdAt: getDate(obj, 'createdAt', true) || new Date(),
    updatedAt: getDate(obj, 'updatedAt', true) || new Date(),
    tags: getArray<string>(obj, 'tags') || [],
    content: getString(obj, 'content', true) || ''
  };
}

export function validateExecution(data: unknown): Execution {
  if (!isObject(data)) {
    throw new Error('Execution data must be an object');
  }
  const obj = data as Record<string, unknown>;

  return {
    id: getString(obj, 'id', true) || '',
    epicId: getString(obj, 'epicId', true) || '',
    specIds: getArray<string>(obj, 'specIds') || [],
    ticketIds: getArray<string>(obj, 'ticketIds') || [],
    agentType: getEnum<AgentType>(obj, 'agentType', ['cursor', 'claude', 'windsurf', 'cline', 'aider', 'custom'], true) || 'custom',
    handoffPrompt: getString(obj, 'handoffPrompt', true) || '',
    status: getEnum<ExecutionStatus>(obj, 'status', ['pending', 'in_progress', 'completed', 'failed'], true) || 'pending',
    startedAt: getDate(obj, 'startedAt', true) || new Date(),
    completedAt: getDate(obj, 'completedAt'),
    results: obj.results as Execution['results']
  };
}

function validateFixSuggestion(data: unknown): FixSuggestion | undefined {
  if (!data) return undefined;
  if (!isObject(data)) {
    throw new Error('FixSuggestion must be an object');
  }
  const obj = data as Record<string, unknown>;

  return {
    description: getString(obj, 'description', true) || '',
    codeExample: getString(obj, 'codeExample'),
    automatedFix: typeof obj.automatedFix === 'boolean' ? obj.automatedFix : undefined,
    steps: getArray<string>(obj, 'steps') || []
  };
}

export function validateVerification(data: unknown): Verification {
  if (!isObject(data)) {
    throw new Error('Verification data must be an object');
  }
  const obj = data as Record<string, unknown>;

  const issues = getArray<Record<string, unknown>>(obj, 'issues') || [];
  const validatedIssues = issues.map(issue => {
    const category = getEnum<IssueCategory>(issue, 'category', ['security', 'performance', 'style', 'logic', 'documentation', 'testing', 'architecture']) || 'logic';
    return {
      id: getString(issue, 'id', true) || '',
      severity: getEnum<Severity>(issue, 'severity', ['Critical', 'High', 'Medium', 'Low']) || 'Medium',
      category,
      file: getString(issue, 'file', true) || '',
      line: typeof issue.line === 'number' ? issue.line : undefined,
      message: getString(issue, 'message', true) || '',
      suggestion: getString(issue, 'suggestion'),
      code: getString(issue, 'code'),
      specRequirementId: getString(issue, 'specRequirementId'),
      fixSuggestion: validateFixSuggestion(issue.fixSuggestion)
    };
  });

  const summary = obj.summary as Record<string, unknown> | undefined;
  let validatedSummary: Verification['summary'];
  
  if (summary) {
    const issueCounts = summary.issueCounts as Record<string, number> | undefined;
    validatedSummary = {
      passed: typeof summary.passed === 'boolean' ? summary.passed : false,
      totalIssues: typeof summary.totalIssues === 'number' ? summary.totalIssues : 0,
      issueCounts: {
        Critical: issueCounts?.Critical || 0,
        High: issueCounts?.High || 0,
        Medium: issueCounts?.Medium || 0,
        Low: issueCounts?.Low || 0
      },
      recommendation: getString(summary, 'recommendation') || '',
      approvalStatus: getEnum<ApprovalStatus>(summary, 'approvalStatus', ['approved', 'approved_with_conditions', 'changes_requested', 'pending']) || 'pending'
    };
  } else {
    validatedSummary = {
      passed: false,
      totalIssues: 0,
      issueCounts: { Critical: 0, High: 0, Medium: 0, Low: 0 },
      recommendation: '',
      approvalStatus: 'pending'
    };
  }

  return {
    id: getString(obj, 'id', true) || '',
    epicId: getString(obj, 'epicId', true) || '',
    diffSource: obj.diffSource as Verification['diffSource'],
    analysis: obj.analysis as Verification['analysis'],
    issues: validatedIssues,
    summary: validatedSummary,
    createdAt: getDate(obj, 'createdAt', true) || new Date()
  };
}

registerValidator('Epic', validateEpic);
registerValidator('Spec', validateSpec);
registerValidator('Ticket', validateTicket);
registerValidator('Execution', validateExecution);
registerValidator('Verification', validateVerification);
