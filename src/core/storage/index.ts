import * as path from 'path';
import { ArtifactStorage } from './ArtifactStorage';
import { EpicMetadataManager } from './EpicMetadataManager';
import { GitHelper } from '../git/GitHelper';
import { Spec } from '../models/Spec';
import { Ticket } from '../models/Ticket';
import { Execution } from '../models/Execution';
import { Epic } from '../models/Epic';
import { log } from '../../utils/logger';

export class StorageManager {
  private artifactStorage: ArtifactStorage;
  private epicMetadataManager: EpicMetadataManager;
  private gitHelper: GitHelper;
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.artifactStorage = new ArtifactStorage(workspaceRoot);
    this.epicMetadataManager = new EpicMetadataManager(workspaceRoot);
    this.gitHelper = new GitHelper(workspaceRoot);
  }

  async initialize(): Promise<void> {
    await this.artifactStorage.initialize();
    await this.gitHelper.initRepository();
    log('StorageManager initialized');
  }

  async createSpec(spec: Spec, autoCommit: boolean = true): Promise<void> {
    await this.artifactStorage.saveSpec(spec);
    await this.epicMetadataManager.registerArtifact('spec', spec.id);

    if (autoCommit) {
      await this.gitHelper.stageFlowGuardArtifact(
        this.artifactStorage.getArtifactPath('spec', spec.id)
      );
      await this.gitHelper.commitArtifact('spec', spec.id, 'create');
    }

    log(`Created spec: ${spec.id}`);
  }

  async createTicket(ticket: Ticket, autoCommit: boolean = true): Promise<void> {
    await this.artifactStorage.saveTicket(ticket);
    await this.epicMetadataManager.registerArtifact('ticket', ticket.id);

    if (autoCommit) {
      await this.gitHelper.stageFlowGuardArtifact(
        this.artifactStorage.getArtifactPath('ticket', ticket.id)
      );
      await this.gitHelper.commitArtifact('ticket', ticket.id, 'create');
    }

    log(`Created ticket: ${ticket.id}`);
  }

  async createExecution(execution: Execution, autoCommit: boolean = true): Promise<void> {
    await this.artifactStorage.saveExecution(execution);
    await this.epicMetadataManager.registerArtifact('execution', execution.id);

    if (autoCommit) {
      await this.gitHelper.stageFlowGuardArtifact(
        this.artifactStorage.getArtifactPath('execution', execution.id)
      );
      await this.gitHelper.commitArtifact('execution', execution.id, 'create');
    }

    log(`Created execution: ${execution.id}`);
  }

  async updateSpec(spec: Spec, autoCommit: boolean = true): Promise<void> {
    await this.artifactStorage.saveSpec(spec);
    await this.epicMetadataManager.updateEpicMetadata({});

    if (autoCommit) {
      await this.gitHelper.stageFlowGuardArtifact(
        this.artifactStorage.getArtifactPath('spec', spec.id)
      );
      await this.gitHelper.commitArtifact('spec', spec.id, 'update');
    }

    log(`Updated spec: ${spec.id}`);
  }

  async updateTicket(ticket: Ticket, autoCommit: boolean = true): Promise<void> {
    await this.artifactStorage.saveTicket(ticket);
    await this.epicMetadataManager.updateEpicMetadata({});

    if (autoCommit) {
      await this.gitHelper.stageFlowGuardArtifact(
        this.artifactStorage.getArtifactPath('ticket', ticket.id)
      );
      await this.gitHelper.commitArtifact('ticket', ticket.id, 'update');
    }

    log(`Updated ticket: ${ticket.id}`);
  }

  async updateExecution(execution: Execution, autoCommit: boolean = true): Promise<void> {
    await this.artifactStorage.saveExecution(execution);
    await this.epicMetadataManager.updateEpicMetadata({});

    if (autoCommit) {
      await this.gitHelper.stageFlowGuardArtifact(
        this.artifactStorage.getArtifactPath('execution', execution.id)
      );
      await this.gitHelper.commitArtifact('execution', execution.id, 'update');
    }

    log(`Updated execution: ${execution.id}`);
  }

  async deleteSpec(id: string, autoCommit: boolean = true): Promise<void> {
    const artifactPath = this.artifactStorage.getArtifactPath('spec', id);
    await this.artifactStorage.deleteSpec(id);
    await this.epicMetadataManager.unregisterArtifact('spec', id);

    if (autoCommit) {
      await this.gitHelper.stageFiles([artifactPath]);
      await this.gitHelper.commitArtifact('spec', id, 'delete');
    }

    log(`Deleted spec: ${id}`);
  }

  async deleteTicket(id: string, autoCommit: boolean = true): Promise<void> {
    const artifactPath = this.artifactStorage.getArtifactPath('ticket', id);
    await this.artifactStorage.deleteTicket(id);
    await this.epicMetadataManager.unregisterArtifact('ticket', id);

    if (autoCommit) {
      await this.gitHelper.stageFiles([artifactPath]);
      await this.gitHelper.commitArtifact('ticket', id, 'delete');
    }

    log(`Deleted ticket: ${id}`);
  }

  async deleteExecution(id: string, autoCommit: boolean = true): Promise<void> {
    const artifactPath = this.artifactStorage.getArtifactPath('execution', id);
    await this.artifactStorage.deleteExecution(id);
    await this.epicMetadataManager.unregisterArtifact('execution', id);

    if (autoCommit) {
      await this.gitHelper.stageFiles([artifactPath]);
      await this.gitHelper.commitArtifact('execution', id, 'delete');
    }

    log(`Deleted execution: ${id}`);
  }

  async loadSpec(id: string): Promise<Spec> {
    return this.artifactStorage.loadSpec(id);
  }

  async loadTicket(id: string): Promise<Ticket> {
    return this.artifactStorage.loadTicket(id);
  }

  async loadExecution(id: string): Promise<Execution> {
    return this.artifactStorage.loadExecution(id);
  }

  async listSpecs(epicId?: string): Promise<Spec[]> {
    return this.artifactStorage.listSpecs(epicId);
  }

  async listTickets(epicId?: string, specId?: string): Promise<Ticket[]> {
    return this.artifactStorage.listTickets(epicId, specId);
  }

  async listExecutions(epicId?: string): Promise<Execution[]> {
    return this.artifactStorage.listExecutions(epicId);
  }

  async loadAllArtifacts(epicId: string): Promise<{
    specs: Spec[];
    tickets: Ticket[];
    executions: Execution[];
  }> {
    const [specs, tickets, executions] = await Promise.all([
      this.artifactStorage.listSpecs(epicId),
      this.artifactStorage.listTickets(epicId),
      this.artifactStorage.listExecutions(epicId),
    ]);

    return { specs, tickets, executions };
  }

  async initializeEpic(epic: Epic): Promise<void> {
    await this.artifactStorage.initialize();
    await this.epicMetadataManager.initializeEpic(epic);
    await this.gitHelper.initRepository();
    log(`Initialized epic: ${epic.id}`);
  }

  getArtifactStorage(): ArtifactStorage {
    return this.artifactStorage;
  }

  getEpicMetadataManager(): EpicMetadataManager {
    return this.epicMetadataManager;
  }

  getGitHelper(): GitHelper {
    return this.gitHelper;
  }
}
