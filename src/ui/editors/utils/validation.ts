import { Spec, SpecStatus } from '../../../core/models/Spec';
import { Ticket, TicketStatus, Priority } from '../../../core/models/Ticket';
import { ValidationError } from '../types';

export function validateSpec(spec: Partial<Spec>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!spec.title || spec.title.trim() === '') {
    errors.push({
      field: 'title',
      message: 'Title is required',
      severity: 'error'
    });
  }

  if (!spec.status) {
    errors.push({
      field: 'status',
      message: 'Status is required',
      severity: 'error'
    });
  } else {
    const validStatuses: SpecStatus[] = ['draft', 'in_review', 'approved', 'archived'];
    if (!validStatuses.includes(spec.status)) {
      errors.push({
        field: 'status',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        severity: 'error'
      });
    }
  }

  if (!spec.author || spec.author.trim() === '') {
    errors.push({
      field: 'author',
      message: 'Author is required',
      severity: 'warning'
    });
  }

  if (spec.tags && !Array.isArray(spec.tags)) {
    errors.push({
      field: 'tags',
      message: 'Tags must be an array',
      severity: 'error'
    });
  }

  return errors;
}

export function validateTicket(ticket: Partial<Ticket>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!ticket.title || ticket.title.trim() === '') {
    errors.push({
      field: 'title',
      message: 'Title is required',
      severity: 'error'
    });
  }

  if (!ticket.status) {
    errors.push({
      field: 'status',
      message: 'Status is required',
      severity: 'error'
    });
  } else {
    const validStatuses: TicketStatus[] = ['todo', 'in_progress', 'in_review', 'done', 'blocked'];
    if (!validStatuses.includes(ticket.status)) {
      errors.push({
        field: 'status',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        severity: 'error'
      });
    }
  }

  if (!ticket.priority) {
    errors.push({
      field: 'priority',
      message: 'Priority is required',
      severity: 'warning'
    });
  } else {
    const validPriorities: Priority[] = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(ticket.priority)) {
      errors.push({
        field: 'priority',
        message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
        severity: 'error'
      });
    }
  }

  if (ticket.assignee && typeof ticket.assignee !== 'string') {
    errors.push({
      field: 'assignee',
      message: 'Assignee must be a string',
      severity: 'error'
    });
  }

  if (ticket.estimatedEffort !== undefined && typeof ticket.estimatedEffort !== 'string') {
    errors.push({
      field: 'estimatedEffort',
      message: 'Estimated effort must be a string',
      severity: 'warning'
    });
  }

  if (ticket.tags && !Array.isArray(ticket.tags)) {
    errors.push({
      field: 'tags',
      message: 'Tags must be an array',
      severity: 'error'
    });
  }

  return errors;
}

export function validateRequired(value: any, fieldName: string): ValidationError | null {
  if (value === undefined || value === null || value === '') {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
      severity: 'error'
    };
  }
  return null;
}

export function validateStatus(status: string, allowedStatuses: string[]): ValidationError | null {
  if (!allowedStatuses.includes(status)) {
    return {
      field: 'status',
      message: `Status must be one of: ${allowedStatuses.join(', ')}`,
      severity: 'error'
    };
  }
  return null;
}

export function validatePriority(priority: string, allowedPriorities: string[]): ValidationError | null {
  if (!allowedPriorities.includes(priority)) {
    return {
      field: 'priority',
      message: `Priority must be one of: ${allowedPriorities.join(', ')}`,
      severity: 'error'
    };
  }
  return null;
}

export function validateTags(tags: any[]): ValidationError | null {
  if (!Array.isArray(tags)) {
    return {
      field: 'tags',
      message: 'Tags must be an array',
      severity: 'error'
    };
  }
  return null;
}

export function hasErrors(errors: ValidationError[]): boolean {
  return errors.some(e => e.severity === 'error');
}

export function hasWarnings(errors: ValidationError[]): boolean {
  return errors.some(e => e.severity === 'warning');
}

export function getErrorsByField(errors: ValidationError[]): Record<string, ValidationError[]> {
  return errors.reduce((acc, error) => {
    const field = error.field;
    if (!acc[field]) {
      acc[field] = [];
    }
    acc[field].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);
}
