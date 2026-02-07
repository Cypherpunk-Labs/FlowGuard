import { Ticket } from '../core/models/Ticket';
import { Spec } from '../core/models/Spec';

export interface ValidationResult {
  valid: boolean;
  issues: Array<{
    severity: 'error' | 'warning';
    message: string;
    field?: string;
  }>;
}

export class TicketValidator {
  validateTicketAlignment(ticket: Ticket, spec: Spec): ValidationResult {
    const issues: ValidationResult['issues'] = [];

    if (ticket.specId !== spec.id) {
      issues.push({
        severity: 'error',
        message: `Ticket specId '${ticket.specId}' does not match spec id '${spec.id}'`,
        field: 'specId',
      });
    }

    const specRefRegex = new RegExp(`spec:${spec.id}`, 'i');
    if (!specRefRegex.test(ticket.content)) {
      issues.push({
        severity: 'warning',
        message: 'Ticket content does not reference the parent spec',
        field: 'content',
      });
    }

    const fileReferences = this.extractFileReferences(ticket.content);
    const specFileReferences = this.extractSpecFileReferences(spec.content);

    for (const fileRef of fileReferences) {
      if (!specFileReferences.includes(fileRef)) {
        issues.push({
          severity: 'warning',
          message: `File '${fileRef}' referenced in ticket is not in spec's technical plan`,
          field: 'content',
        });
      }
    }

    const ticketRequirements = this.extractRequirements(ticket.content);
    const specRequirements = this.extractSpecRequirements(spec.content);

    for (const req of ticketRequirements) {
      const found = specRequirements.some(specReq => 
        req.toLowerCase().includes(specReq.toLowerCase()) ||
        specReq.toLowerCase().includes(req.toLowerCase())
      );
      if (!found) {
        issues.push({
          severity: 'warning',
          message: `Ticket requirement may not map to any spec requirement`,
          field: 'content',
        });
      }
    }

    return {
      valid: !issues.some(i => i.severity === 'error'),
      issues,
    };
  }

  validateTicketCompleteness(ticket: Ticket): ValidationResult {
    const issues: ValidationResult['issues'] = [];

    if (!ticket.title || ticket.title.trim().length === 0) {
      issues.push({
        severity: 'error',
        message: 'Ticket title is missing or empty',
        field: 'title',
      });
    }

    if (!ticket.content || ticket.content.trim().length === 0) {
      issues.push({
        severity: 'error',
        message: 'Ticket content is missing or empty',
        field: 'content',
      });
    }

    const hasDescription = /## Description/i.test(ticket.content);
    if (!hasDescription) {
      issues.push({
        severity: 'warning',
        message: 'Ticket is missing a Description section',
        field: 'content',
      });
    }

    const hasAcceptanceCriteria = /## Acceptance Criteria/i.test(ticket.content);
    if (!hasAcceptanceCriteria) {
      issues.push({
        severity: 'error',
        message: 'Ticket is missing an Acceptance Criteria section',
        field: 'content',
      });
      } else {
        const criteria = this.extractRequirements(ticket.content);
        if (criteria.length === 0) {
          issues.push({
            severity: 'warning',
            message: 'Acceptance Criteria section is empty',
            field: 'content',
          });
        } else {
          const actionableCriteria = criteria.filter((c: string) => 
            /^\s*-\s*\[\s*\]\s*\S/i.test(c)
          );
        if (actionableCriteria.length === 0) {
          issues.push({
            severity: 'warning',
            message: 'No actionable acceptance criteria found (should start with "- [ ] verb"',
            field: 'content',
          });
        }
      }
    }

    const hasImplementationSteps = /## Implementation Steps/i.test(ticket.content);
    if (!hasImplementationSteps) {
      issues.push({
        severity: 'warning',
        message: 'Ticket is missing an Implementation Steps section',
        field: 'content',
      });
    }

    const hasFilesToChange = /## Files to Change/i.test(ticket.content);
    if (!hasFilesToChange) {
      issues.push({
        severity: 'warning',
        message: 'Ticket is missing a Files to Change section',
        field: 'content',
      });
    } else {
      const files = this.extractFileReferences(ticket.content);
      if (files.length === 0) {
        issues.push({
          severity: 'warning',
          message: 'Files to Change section is empty',
          field: 'content',
        });
      }
    }

    if (!ticket.estimatedEffort) {
      issues.push({
        severity: 'warning',
        message: 'Ticket is missing estimated effort',
        field: 'estimatedEffort',
      });
    } else {
      const effortValid = /^\d+[hmhd]$/.test(ticket.estimatedEffort);
      if (!effortValid) {
        issues.push({
          severity: 'warning',
          message: 'Estimated effort format is invalid (use format like "2h", "4h", "1d")',
          field: 'estimatedEffort',
        });
      }
    }

    if (!ticket.priority) {
      issues.push({
        severity: 'warning',
        message: 'Ticket is missing priority',
        field: 'priority',
      });
    }

    return {
      valid: !issues.some(i => i.severity === 'error'),
      issues,
    };
  }

  private extractFileReferences(content: string): string[] {
    const fileRefs: string[] = [];
    const regex = /`([^`]+(?:\.[a-zA-Z]+)?)`/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const filePath = match[1];
      if (filePath && !fileRefs.includes(filePath)) {
        fileRefs.push(filePath);
      }
    }

    return fileRefs;
  }

  private extractSpecFileReferences(content: string): string[] {
    const fileRefs: string[] = [];
    const filesMatch = content.match(/### Files to Change\s*\n([\s\S]*?)(?=###|$)/i);
    
    if (filesMatch && filesMatch[1]) {
      const lines = filesMatch[1].split('\n');
      for (const line of lines) {
        const match = line.match(/`([^`]+)`/);
        if (match && match[1]) {
          fileRefs.push(match[1]);
        }
      }
    }

    return fileRefs;
  }

  private extractRequirements(content: string): string[] {
    const requirements: string[] = [];
    
    const acMatch = content.match(/## Acceptance Criteria\s*\n([\s\S]*?)(?=##|$)/i);
    if (acMatch && acMatch[1]) {
      const lines = acMatch[1].split('\n');
      for (const line of lines) {
        const match = line.match(/-\s*\[\s*\]\s*(.+)/);
        if (match && match[1]) {
          requirements.push(match[1].trim());
        }
      }
    }

    return requirements;
  }

  private extractSpecRequirements(content: string): string[] {
    const requirements: string[] = [];
    
    const reqMatch = content.match(/### Functional Requirements\s*\n([\s\S]*?)(?=###|$)/i);
    if (reqMatch && reqMatch[1]) {
      const lines = reqMatch[1].split('\n');
      for (const line of lines) {
        const match = line.match(/^\d+\.\s*(.+)/);
        if (match && match[1]) {
          requirements.push(match[1].trim());
        }
      }
    }

    return requirements;
  }
}
