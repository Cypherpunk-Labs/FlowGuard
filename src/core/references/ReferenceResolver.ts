import * as path from 'path';
import { ArtifactStorage } from '../storage/ArtifactStorage';
import { Reference, ResolvedReference, ArtifactType } from '../storage/types';
import { log, error } from '../../utils/logger';
import { Ticket } from '../models/Ticket';
import { TicketValidator, ValidationResult } from '../../planning/TicketValidator';
import { Spec } from '../models/Spec';

const REFERENCE_REGEX = /\[([^\]]+)\]\(([^)]+:[^)]+)\)|(?:spec|ticket|execution|file):([a-f0-9-]{36,})(?:#([^\s\]]+))?/gi;

export class ReferenceResolver {
  private storage: ArtifactStorage;
  private workspaceRoot: string;

  constructor(storage: ArtifactStorage, workspaceRoot: string) {
    this.storage = storage;
    this.workspaceRoot = workspaceRoot;
  }

  parseReference(ref: string): Reference | null {
    const specMatch = ref.match(/^spec:([a-f0-9-]{36,})(?:#(.+))?$/);
    if (specMatch && specMatch[1]) {
      return {
        type: 'spec',
        id: specMatch[1],
        fragment: specMatch[2] as string | undefined,
      };
    }

    const ticketMatch = ref.match(/^ticket:([a-f0-9-]{36,})(?:#(.+))?$/);
    if (ticketMatch && ticketMatch[1]) {
      return {
        type: 'ticket',
        id: ticketMatch[1],
        fragment: ticketMatch[2] as string | undefined,
      };
    }

    const executionMatch = ref.match(/^execution:([a-f0-9-]{36,})(?:#(.+))?$/);
    if (executionMatch && executionMatch[1]) {
      return {
        type: 'execution',
        id: executionMatch[1],
        fragment: executionMatch[2] as string | undefined,
      };
    }

    const fileMatch = ref.match(/^file:(.+)$/);
    if (fileMatch && fileMatch[1]) {
      return {
        type: 'file',
        id: fileMatch[1],
      };
    }

    return null;
  }

  async resolveReference(ref: Reference): Promise<ResolvedReference> {
    const resolved: ResolvedReference = {
      type: ref.type,
      id: ref.id,
      label: ref.label,
      fragment: ref.fragment,
      path: '',
      exists: false,
    };

    try {
      switch (ref.type) {
        case 'spec':
          const spec = await this.storage.loadSpec(ref.id);
          resolved.path = this.storage.getArtifactPath('spec', ref.id);
          resolved.exists = true;
          resolved.title = spec.title;
          break;

        case 'ticket':
          const ticket = await this.storage.loadTicket(ref.id);
          resolved.path = this.storage.getArtifactPath('ticket', ref.id);
          resolved.exists = true;
          resolved.title = ticket.title;
          break;

        case 'execution':
          await this.storage.loadExecution(ref.id);
          resolved.path = this.storage.getArtifactPath('execution', ref.id);
          resolved.exists = true;
          break;

        case 'file':
          const filePath = path.isAbsolute(ref.id)
            ? ref.id
            : path.join(this.workspaceRoot, ref.id);
          resolved.path = filePath;
          const { fileExists } = await import('../storage/fileSystem');
          resolved.exists = await fileExists(filePath);
          break;
      }
    } catch (err) {
      resolved.exists = false;
      error(`Failed to resolve reference ${ref.type}:${ref.id}: ${err instanceof Error ? err.message : String(err)}`);
    }

    return resolved;
  }

  extractReferences(content: string): Reference[] {
    const references: Reference[] = [];

    const inlineRegex = /\[([^\]]+)\]\(([^)]+:[^)]+)\)/g;
    let match;

    while ((match = inlineRegex.exec(content)) !== null) {
      const label = match[1];
      const refString = match[2] as string;
      const ref = this.parseReference(refString);
      if (ref) {
        ref.label = label;
        references.push(ref);
      }
    }

    const standaloneRegex = /(?:spec|ticket|execution|file):([a-f0-9-]{36,}|.+)/g;

    while ((match = standaloneRegex.exec(content)) !== null) {
      const refString = match[0];
      const ref = this.parseReference(refString);
      if (ref && !references.some(r => r.type === ref.type && r.id === ref.id)) {
        references.push(ref);
      }
    }

    return references;
  }

  async resolveReferences(content: string): Promise<Map<string, ResolvedReference>> {
    const references = this.extractReferences(content);
    const resolvedMap = new Map<string, ResolvedReference>();

    for (const ref of references) {
      const key = `${ref.type}:${ref.id}`;
      const resolved = await this.resolveReference(ref);
      resolvedMap.set(key, resolved);
    }

    return resolvedMap;
  }

  async validateReferences(content: string): Promise<{ valid: Reference[]; invalid: Reference[] }> {
    const references = this.extractReferences(content);
    const valid: Reference[] = [];
    const invalid: Reference[] = [];

    for (const ref of references) {
      const resolved = await this.resolveReference(ref);
      if (resolved.exists) {
        valid.push(ref);
      } else {
        invalid.push(ref);
      }
    }

    return { valid, invalid };
  }

  async getTicketsBySpec(specId: string): Promise<Ticket[]> {
    try {
      const tickets = await this.storage.listTickets(undefined, specId);
      
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      
      return tickets.sort((a, b) => {
        const priorityDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    } catch (err) {
      error(`Failed to get tickets for spec ${specId}: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }

  async validateTicketReferences(ticket: Ticket, spec?: Spec): Promise<ValidationResult> {
    const validator = new TicketValidator();
    const completenessResult = validator.validateTicketCompleteness(ticket);

    if (spec) {
      const alignmentResult = validator.validateTicketAlignment(ticket, spec);
      return {
        valid: completenessResult.valid && alignmentResult.valid,
        issues: [...completenessResult.issues, ...alignmentResult.issues],
      };
    }

    const references = this.extractReferences(ticket.content);
    const issues: ValidationResult['issues'] = [];

    const specRef = references.find(r => r.type === 'spec');
    if (!specRef) {
      issues.push({
        severity: 'warning',
        message: 'Ticket does not reference a parent spec',
        field: 'content',
      });
    } else {
      const resolved = await this.resolveReference(specRef);
      if (!resolved.exists) {
        issues.push({
          severity: 'error',
          message: `Referenced spec ${specRef.id} does not exist`,
          field: 'content',
        });
      }
    }

    const fileRefs = references.filter(r => r.type === 'file');
    for (const fileRef of fileRefs) {
      const resolved = await this.resolveReference(fileRef);
      if (!resolved.exists) {
        issues.push({
          severity: 'warning',
          message: `File reference ${fileRef.id} does not exist`,
          field: 'content',
        });
      }
    }

    return {
      valid: completenessResult.valid && !issues.some(i => i.severity === 'error'),
      issues: [...completenessResult.issues, ...issues],
    };
  }
}
