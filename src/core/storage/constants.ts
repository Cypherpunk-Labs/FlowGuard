export const FLOWGUARD_DIR = '.flowguard';

export const STORAGE_DIRS = {
  ROOT: FLOWGUARD_DIR,
  SPECS: 'specs',
  TICKETS: 'tickets',
  EXECUTIONS: 'executions',
  VERIFICATIONS: 'verifications',
  TEMPLATES: 'templates',
} as const;

export const FILE_PATTERNS = {
  SPEC: 'spec-{id}.md',
  TICKET: 'ticket-{id}.md',
  EXECUTION: 'execution-{id}.md',
  VERIFICATION: 'verification-{id}.md',
  EPIC_METADATA: 'epic.json',
  TEMPLATE: '{agentType}.md',
} as const;

export function getSpecFilename(id: string): string {
  return `spec-${id}.md`;
}

export function getTicketFilename(id: string): string {
  return `ticket-${id}.md`;
}

export function getExecutionFilename(id: string): string {
  return `execution-${id}.md`;
}

export function getVerificationFilename(id: string): string {
  return `verification-${id}.md`;
}

export function getEpicMetadataFilename(): string {
  return 'epic.json';
}

export function getTemplateFilename(agentType: string): string {
  return `${agentType}.md`;
}
