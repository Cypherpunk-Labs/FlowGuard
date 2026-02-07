import * as path from 'path';
import { Spec, SpecStatus } from '../models/Spec';
import { Ticket, TicketStatus, Priority } from '../models/Ticket';
import { Execution, ExecutionStatus, AgentType } from '../models/Execution';
import { parseFrontmatter, serializeFrontmatter } from '../parsers/frontmatter';
import { fileExists, readFile, writeFile, listFiles, deleteFile, ensureDirectory } from './fileSystem';
import {
  STORAGE_DIRS,
  getSpecFilename,
  getTicketFilename,
  getExecutionFilename,
  getVerificationFilename,
  getTemplateFilename,
} from './constants';
import {
  ArtifactType,
  StorageError,
  NotFoundError,
  ValidationError,
} from './types';
import { log, error } from '../../utils/logger';

export class ArtifactStorage {
  private flowguardRoot: string;

  constructor(workspaceRoot: string) {
    this.flowguardRoot = path.join(workspaceRoot, '.flowguard');
  }

  async initialize(): Promise<void> {
    await ensureDirectory(this.flowguardRoot);
    await ensureDirectory(path.join(this.flowguardRoot, STORAGE_DIRS.SPECS));
    await ensureDirectory(path.join(this.flowguardRoot, STORAGE_DIRS.TICKETS));
    await ensureDirectory(path.join(this.flowguardRoot, STORAGE_DIRS.EXECUTIONS));
    await ensureDirectory(path.join(this.flowguardRoot, STORAGE_DIRS.VERIFICATIONS));
    await ensureDirectory(path.join(this.flowguardRoot, STORAGE_DIRS.TEMPLATES));
    await ensureDirectory(path.join(this.flowguardRoot, STORAGE_DIRS.PLUGINS));
    log('ArtifactStorage initialized');
  }

  private getSpecsDir(): string {
    return path.join(this.flowguardRoot, STORAGE_DIRS.SPECS);
  }

  private getTicketsDir(): string {
    return path.join(this.flowguardRoot, STORAGE_DIRS.TICKETS);
  }

  private getExecutionsDir(): string {
    return path.join(this.flowguardRoot, STORAGE_DIRS.EXECUTIONS);
  }

  private getVerificationsDir(): string {
    return path.join(this.flowguardRoot, STORAGE_DIRS.VERIFICATIONS);
  }

  private getSpecPath(id: string): string {
    return path.join(this.getSpecsDir(), getSpecFilename(id));
  }

  private getTicketPath(id: string): string {
    return path.join(this.getTicketsDir(), getTicketFilename(id));
  }

  private getExecutionPath(id: string): string {
    return path.join(this.getExecutionsDir(), getExecutionFilename(id));
  }

  private getVerificationPath(id: string): string {
    return path.join(this.getVerificationsDir(), getVerificationFilename(id));
  }

  async saveSpec(spec: Spec): Promise<void> {
    const filePath = this.getSpecPath(spec.id);
    const frontmatter = {
      id: spec.id,
      epicId: spec.epicId,
      title: spec.title,
      status: spec.status,
      createdAt: spec.createdAt.toISOString(),
      updatedAt: spec.updatedAt.toISOString(),
      author: spec.author,
      tags: spec.tags,
    };
    const markdown = serializeFrontmatter(frontmatter, spec.content);
    await writeFile(filePath, markdown);
    log(`Saved spec: ${spec.id}`);
  }

  async loadSpec(id: string): Promise<Spec> {
    const filePath = this.getSpecPath(id);
    const content = await readFile(filePath);
    const { data, content: markdownContent } = parseFrontmatter<Record<string, unknown>>(content, { validate: true });

    if (!data.id || !data.epicId || !data.title) {
      throw new ValidationError('Spec is missing required fields: id, epicId, or title');
    }

    const spec: Spec = {
      id: data.id as string,
      epicId: data.epicId as string,
      title: data.title as string,
      status: data.status as SpecStatus,
      createdAt: new Date(data.createdAt as string),
      updatedAt: new Date(data.updatedAt as string),
      author: data.author as string,
      tags: (data.tags as string[]) || [],
      content: markdownContent,
    };

    return spec;
  }

  async listSpecs(epicId?: string): Promise<Spec[]> {
    const files = await listFiles(this.getSpecsDir(), /^spec-.+\.md$/);
    const specs: Spec[] = [];

    for (const file of files) {
      const id = file.replace('spec-', '').replace('.md', '');
      try {
        const spec = await this.loadSpec(id);
        if (!epicId || spec.epicId === epicId) {
          specs.push(spec);
        }
      } catch (err) {
        error(`Failed to load spec ${id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return specs;
  }

  async deleteSpec(id: string): Promise<void> {
    const filePath = this.getSpecPath(id);
    const exists = await fileExists(filePath);
    if (!exists) {
      throw new NotFoundError('spec', id);
    }
    await deleteFile(filePath);
    log(`Deleted spec: ${id}`);
  }

  async saveTicket(ticket: Ticket): Promise<void> {
    const filePath = this.getTicketPath(ticket.id);
    const frontmatter: Record<string, unknown> = {
      id: ticket.id,
      epicId: ticket.epicId,
      specId: ticket.specId,
      title: ticket.title,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      tags: ticket.tags,
    };
    if (ticket.assignee !== undefined) {
      frontmatter.assignee = ticket.assignee;
    }
    if (ticket.estimatedEffort !== undefined) {
      frontmatter.estimatedEffort = ticket.estimatedEffort;
    }
    const markdown = serializeFrontmatter(frontmatter, ticket.content);
    await writeFile(filePath, markdown);
    log(`Saved ticket: ${ticket.id}`);
  }

  async loadTicket(id: string): Promise<Ticket> {
    const filePath = this.getTicketPath(id);
    const content = await readFile(filePath);
    const { data, content: markdownContent } = parseFrontmatter<Record<string, unknown>>(content, { validate: true });

    if (!data.id || !data.epicId || !data.title) {
      throw new ValidationError('Ticket is missing required fields: id, epicId, or title');
    }

    const ticket: Ticket = {
      id: data.id as string,
      epicId: data.epicId as string,
      specId: data.specId as string,
      title: data.title as string,
      status: data.status as TicketStatus,
      priority: data.priority as Priority,
      assignee: data.assignee as string | undefined,
      estimatedEffort: data.estimatedEffort as string | undefined,
      createdAt: new Date(data.createdAt as string),
      updatedAt: new Date(data.updatedAt as string),
      tags: (data.tags as string[]) || [],
      content: markdownContent,
    };

    return ticket;
  }

  async listTickets(epicId?: string, specId?: string): Promise<Ticket[]> {
    const files = await listFiles(this.getTicketsDir(), /^ticket-.+\.md$/);
    const tickets: Ticket[] = [];

    for (const file of files) {
      const id = file.replace('ticket-', '').replace('.md', '');
      try {
        const ticket = await this.loadTicket(id);
        if ((!epicId || ticket.epicId === epicId) && (!specId || ticket.specId === specId)) {
          tickets.push(ticket);
        }
      } catch (err) {
        error(`Failed to load ticket ${id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return tickets;
  }

  async deleteTicket(id: string): Promise<void> {
    const filePath = this.getTicketPath(id);
    const exists = await fileExists(filePath);
    if (!exists) {
      throw new NotFoundError('ticket', id);
    }
    await deleteFile(filePath);
    log(`Deleted ticket: ${id}`);
  }

  async saveExecution(execution: Execution): Promise<void> {
    const filePath = this.getExecutionPath(execution.id);
    const frontmatter: Record<string, unknown> = {
      id: execution.id,
      epicId: execution.epicId,
      specIds: execution.specIds,
      ticketIds: execution.ticketIds,
      agentType: execution.agentType,
      handoffPrompt: execution.handoffPrompt,
      status: execution.status,
      startedAt: execution.startedAt.toISOString(),
    };
    if (execution.completedAt !== undefined) {
      frontmatter.completedAt = execution.completedAt.toISOString();
    }
    if (execution.results !== undefined) {
      frontmatter.results = execution.results;
    }
    const markdown = serializeFrontmatter(frontmatter, '');
    await writeFile(filePath, markdown);
    log(`Saved execution: ${execution.id}`);
  }

  async loadExecution(id: string): Promise<Execution> {
    const filePath = this.getExecutionPath(id);
    const content = await readFile(filePath);
    const { data } = parseFrontmatter<Record<string, unknown>>(content, { validate: true });

    if (!data.id || !data.epicId) {
      throw new ValidationError('Execution is missing required fields: id or epicId');
    }

    const execution: Execution = {
      id: data.id as string,
      epicId: data.epicId as string,
      specIds: (data.specIds as string[]) || [],
      ticketIds: (data.ticketIds as string[]) || [],
      agentType: data.agentType as AgentType,
      handoffPrompt: data.handoffPrompt as string,
      status: data.status as ExecutionStatus,
      startedAt: new Date(data.startedAt as string),
      completedAt: data.completedAt ? new Date(data.completedAt as string) : undefined,
      results: data.results as Execution['results'],
    };

    return execution;
  }

  async listExecutions(epicId?: string): Promise<Execution[]> {
    const files = await listFiles(this.getExecutionsDir(), /^execution-.+\.md$/);
    const executions: Execution[] = [];

    for (const file of files) {
      const id = file.replace('execution-', '').replace('.md', '');
      try {
        const execution = await this.loadExecution(id);
        if (!epicId || execution.epicId === epicId) {
          executions.push(execution);
        }
      } catch (err) {
        error(`Failed to load execution ${id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return executions;
  }

  async deleteExecution(id: string): Promise<void> {
    const filePath = this.getExecutionPath(id);
    const exists = await fileExists(filePath);
    if (!exists) {
      throw new NotFoundError('execution', id);
    }
    await deleteFile(filePath);
    log(`Deleted execution: ${id}`);
  }

  async saveVerification(verification: import('../models/Verification').Verification): Promise<void> {
    const filePath = this.getVerificationPath(verification.id);
    const frontmatter = {
      id: verification.id,
      epicId: verification.epicId,
      diffSource: verification.diffSource,
      analysis: {
        totalFiles: verification.analysis.totalFiles,
        totalLines: verification.analysis.totalLines,
        additions: verification.analysis.additions,
        deletions: verification.analysis.deletions
      },
      summary: verification.summary,
      createdAt: verification.createdAt.toISOString()
    };
    const content = JSON.stringify({
      issues: verification.issues,
      changedFiles: verification.analysis.changedFiles
    }, null, 2);
    const markdown = serializeFrontmatter(frontmatter, content);
    await writeFile(filePath, markdown);
    log(`Saved verification: ${verification.id}`);
  }

  async loadVerification(id: string): Promise<import('../models/Verification').Verification> {
    const filePath = this.getVerificationPath(id);
    const content = await readFile(filePath);
    const { data, content: markdownContent } = parseFrontmatter<Record<string, unknown>>(content, { validate: true });

    if (!data.id || !data.epicId) {
      throw new ValidationError('Verification is missing required fields: id or epicId');
    }

    const jsonContent = JSON.parse(markdownContent || '{}');

    const verification: import('../models/Verification').Verification = {
      id: data.id as string,
      epicId: data.epicId as string,
      diffSource: data.diffSource as import('../models/Verification').Verification['diffSource'],
      analysis: {
        totalFiles: (data.analysis as Record<string, unknown>)?.totalFiles as number || 0,
        totalLines: (data.analysis as Record<string, unknown>)?.totalLines as number || 0,
        additions: (data.analysis as Record<string, unknown>)?.additions as number || 0,
        deletions: (data.analysis as Record<string, unknown>)?.deletions as number || 0,
        changedFiles: jsonContent.changedFiles || []
      },
      issues: jsonContent.issues || [],
      summary: data.summary as import('../models/Verification').Verification['summary'],
      createdAt: new Date(data.createdAt as string)
    };

    return verification;
  }

  async listVerifications(epicId?: string): Promise<import('../models/Verification').Verification[]> {
    const files = await listFiles(this.getVerificationsDir(), /^verification-.+\.md$/);
    const verifications: import('../models/Verification').Verification[] = [];

    for (const file of files) {
      const id = file.replace('verification-', '').replace('.md', '');
      try {
        const verification = await this.loadVerification(id);
        if (!epicId || verification.epicId === epicId) {
          verifications.push(verification);
        }
      } catch (err) {
        error(`Failed to load verification ${id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return verifications;
  }

  async deleteVerification(id: string): Promise<void> {
    const filePath = this.getVerificationPath(id);
    const exists = await fileExists(filePath);
    if (!exists) {
      throw new NotFoundError('verification', id);
    }
    await deleteFile(filePath);
    log(`Deleted verification: ${id}`);
  }

  getArtifactPath(type: ArtifactType, id: string): string {
    switch (type) {
      case 'spec':
        return this.getSpecPath(id);
      case 'ticket':
        return this.getTicketPath(id);
      case 'execution':
        return this.getExecutionPath(id);
      case 'verification':
        return this.getVerificationPath(id);
      default:
        throw new StorageError(`Unknown artifact type: ${type}`, 'filesystem', { operation: 'getArtifactPath' });
    }
  }

  getTemplatesDir(): string {
    return path.join(this.flowguardRoot, STORAGE_DIRS.TEMPLATES);
  }

  private getTemplatePath(agentType: string): string {
    return path.join(this.getTemplatesDir(), getTemplateFilename(agentType));
  }

  async saveTemplate(agentType: string, template: string): Promise<void> {
    await ensureDirectory(this.getTemplatesDir());
    const filePath = this.getTemplatePath(agentType);
    await writeFile(filePath, template);
    log(`Saved template: ${agentType}`);
  }

  async loadTemplate(agentType: string): Promise<string | null> {
    const filePath = this.getTemplatePath(agentType);
    const exists = await fileExists(filePath);
    if (!exists) {
      return null;
    }
    return await readFile(filePath);
  }

  async listTemplates(): Promise<string[]> {
    const dir = this.getTemplatesDir();
    const exists = await fileExists(dir);
    if (!exists) {
      return [];
    }
    const files = await listFiles(dir, /\.md$/);
    return files.map(file => file.replace('.md', ''));
  }

  async deleteTemplate(agentType: string): Promise<void> {
    const filePath = this.getTemplatePath(agentType);
    const exists = await fileExists(filePath);
    if (!exists) {
      throw new StorageError(`Template not found: ${agentType}`, 'not_found', { operation: 'deleteTemplate' });
    }
    await deleteFile(filePath);
    log(`Deleted template: ${agentType}`);
  }

  getPluginsDir(): string {
    return path.join(this.flowguardRoot, STORAGE_DIRS.PLUGINS);
  }

  getPluginPath(pluginId: string): string {
    return path.join(this.getPluginsDir(), pluginId);
  }
}
