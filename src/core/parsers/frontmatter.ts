import matter from 'gray-matter';

export interface FrontmatterDocument<T> {
  data: T;
  content: string;
}

export interface FrontmatterParseError extends Error {
  readonly isParseError: true;
}

export interface FrontmatterValidationError extends Error {
  readonly isValidationError: true;
  readonly fieldPath: string;
  readonly expectedType: string;
}

export function createParseError(message: string): FrontmatterParseError {
  const error = new Error(message) as FrontmatterParseError;
  error.isParseError = true;
  return error;
}

export function createValidationError(fieldPath: string, expectedType: string, message: string): FrontmatterValidationError {
  const error = new Error(message) as FrontmatterValidationError;
  error.isValidationError = true;
  error.fieldPath = fieldPath;
  error.expectedType = expectedType;
  return error;
}

const DATE_FIELDS = [
  'createdAt', 'updatedAt', 'startedAt', 'completedAt', 'targetDate', 'timestamp'
];

type EnumType = string;

const ENUM_VALIDATORS: Record<string, EnumType[]> = {
  EpicStatus: ['draft', 'planning', 'in_progress', 'in_review', 'completed', 'archived'],
  PhaseStatus: ['pending', 'in_progress', 'completed', 'blocked'],
  DeliverableStatus: ['pending', 'in_progress', 'done'],
  DeliverableType: ['spec', 'ticket', 'documentation', 'diagram'],
  Priority: ['low', 'medium', 'high', 'critical'],
  SpecStatus: ['draft', 'in_review', 'approved', 'archived'],
  TicketStatus: ['todo', 'in_progress', 'in_review', 'done', 'blocked'],
  AgentType: ['cursor', 'claude', 'windsurf', 'cline', 'aider', 'custom'],
  ExecutionStatus: ['pending', 'in_progress', 'completed', 'failed'],
  Severity: ['error', 'warning', 'info'],
  IssueCategory: ['security', 'performance', 'style', 'logic', 'documentation', 'testing', 'architecture'],
  FileChangeStatus: ['added', 'modified', 'deleted'],
  ChangeType: ['addition', 'deletion', 'modification']
};

function isValidEnum(value: unknown, allowedValues: EnumType[]): boolean {
  return typeof value === 'string' && allowedValues.includes(value as EnumType);
}

function validateEnum(value: unknown, enumName: string, fieldPath: string): void {
  const allowedValues = ENUM_VALIDATORS[enumName];
  if (!allowedValues) return;
  if (!isValidEnum(value, allowedValues)) {
    throw createValidationError(
      fieldPath,
      enumName,
      `Field "${fieldPath}" has invalid value "${value}". Expected one of: ${allowedValues.join(', ')}`
    );
  }
}

function coerceDate(value: unknown, fieldPath: string): Date {
  if (value instanceof Date) return value;
  if (typeof value !== 'string') {
    throw createValidationError(fieldPath, 'Date', `Field "${fieldPath}" must be a date string or Date object`);
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw createValidationError(fieldPath, 'Date', `Field "${fieldPath}" has invalid date format: "${value}"`);
  }
  return date;
}

function normalizeObject(obj: Record<string, unknown>, fieldPath: string = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = fieldPath ? `${fieldPath}.${key}` : key;

    if (DATE_FIELDS.includes(key) && (typeof value === 'string' || value instanceof Date || value === null || value === undefined)) {
      if (value !== null && value !== undefined) {
        result[key] = coerceDate(value, currentPath);
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = normalizeObject(value as Record<string, unknown>, currentPath);
    } else if (typeof value === 'string' && key === 'status') {
      validateEnum(value, 'EpicStatus', currentPath);
      result[key] = value;
    } else if (typeof value === 'string' && key === 'priority') {
      validateEnum(value, 'Priority', currentPath);
      result[key] = value;
    } else {
      result[key] = value;
    }
  }

  return result;
}

export interface Validator<T> {
  (data: unknown): T;
}

const validators: Record<string, Validator<unknown>> = {};

export function registerValidator<T>(typeName: string, validator: Validator<T>): void {
  validators[typeName] = validator as Validator<unknown>;
}

export function getValidator<T>(typeName: string): Validator<T> {
  return validators[typeName] as Validator<T>;
}

export function normalizeData<T>(data: unknown, typeName?: string): T {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw createValidationError('', 'object', 'Frontmatter data must be an object');
  }

  const normalized = normalizeObject(data as Record<string, unknown>);

  if (typeName && validators[typeName]) {
    return validators[typeName](normalized);
  }

  return normalized as T;
}

export function parseFrontmatter<T>(markdown: string, options?: { validate?: boolean; typeName?: string }): FrontmatterDocument<T> {
  try {
    const result = matter(markdown);
    let data: T = result.data as T;

    if (options?.validate) {
      data = normalizeData<T>(result.data, options.typeName);
    }

    return {
      data,
      content: result.content
    };
  } catch (err) {
    if (err instanceof Error && ('isParseError' in err || 'isValidationError' in err)) {
      throw err;
    }
    throw createParseError(`Failed to parse frontmatter: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function serializeFrontmatter<T>(data: T, content: string): string {
  try {
    return matter.stringify(content, data);
  } catch (err) {
    throw new Error(`Failed to serialize frontmatter: ${err instanceof Error ? err.message : String(err)}`);
  }
}
