import * as path from 'path';
import { Epic } from '../models/Epic';
import { readJson, writeJson, fileExists } from './fileSystem';
import { getEpicMetadataFilename } from './constants';
import { EpicMetadata, ValidationError } from './types';
import { log, error } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class EpicMetadataManager {
  private workspaceRoot: string;
  private metadataCache: EpicMetadata | null = null;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  private getEpicMetadataPath(): string {
    return path.join(this.workspaceRoot, '.flowguard', getEpicMetadataFilename());
  }

  async loadEpicMetadata(): Promise<EpicMetadata> {
    if (this.metadataCache) {
      return this.metadataCache;
    }

    const metadataPath = this.getEpicMetadataPath();
    const exists = await fileExists(metadataPath);

    if (!exists) {
      throw new ValidationError('epic.json not found. Please initialize an epic first.');
    }

    const data = await readJson<unknown>(metadataPath);
    const metadata = this.validateMetadata(data);
    this.metadataCache = metadata;
    return metadata;
  }

  async saveEpicMetadata(metadata: EpicMetadata): Promise<void> {
    const metadataPath = this.getEpicMetadataPath();
    await writeJson(metadataPath, metadata);
    this.metadataCache = metadata;
    log('Saved epic metadata');
  }

  async updateEpicMetadata(updates: Partial<EpicMetadata>): Promise<void> {
    const current = await this.loadEpicMetadata();
    const updated: EpicMetadata = {
      ...current,
      ...updates,
      artifacts: {
        specs: updates.artifacts?.specs ?? current.artifacts.specs,
        tickets: updates.artifacts?.tickets ?? current.artifacts.tickets,
        executions: updates.artifacts?.executions ?? current.artifacts.executions,
      },
      settings: {
        ...current.settings,
        ...updates.settings,
      },
    };
    updated.updatedAt = new Date().toISOString();
    await this.saveEpicMetadata(updated);
  }

  async registerArtifact(type: 'spec' | 'ticket' | 'execution', id: string): Promise<void> {
    const metadata = await this.loadEpicMetadata();
    const artifactList = metadata.artifacts[type === 'spec' ? 'specs' : type === 'ticket' ? 'tickets' : 'executions'];

    if (!artifactList.includes(id)) {
      artifactList.push(id);
      await this.updateEpicMetadata({ artifacts: metadata.artifacts });
      log(`Registered ${type}: ${id}`);
    }
  }

  async unregisterArtifact(type: 'spec' | 'ticket' | 'execution', id: string): Promise<void> {
    const metadata = await this.loadEpicMetadata();
    const artifactListKey = type === 'spec' ? 'specs' : type === 'ticket' ? 'tickets' : 'executions';
    const artifactList = metadata.artifacts[artifactListKey];

    const index = artifactList.indexOf(id);
    if (index > -1) {
      artifactList.splice(index, 1);
      await this.updateEpicMetadata({ artifacts: metadata.artifacts });
      log(`Unregistered ${type}: ${id}`);
    }
  }

  async initializeEpic(epic: Epic): Promise<void> {
    const metadata: EpicMetadata = {
      epicId: epic.id,
      title: epic.title,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      artifacts: {
        specs: [],
        tickets: [],
        executions: [],
      },
      settings: {
        autoCommit: false,
      },
    };

    await this.saveEpicMetadata(metadata);
    log(`Initialized epic: ${epic.id}`);
  }

  validateMetadata(data: unknown): EpicMetadata {
    if (typeof data !== 'object' || data === null) {
      throw new ValidationError('epic.json must be an object');
    }

    const metadata = data as Record<string, unknown>;

    if (!metadata.epicId || typeof metadata.epicId !== 'string') {
      throw new ValidationError('epic.json is missing required field: epicId');
    }

    if (!metadata.title || typeof metadata.title !== 'string') {
      throw new ValidationError('epic.json is missing required field: title');
    }

    if (!metadata.version || typeof metadata.version !== 'string') {
      throw new ValidationError('epic.json is missing required field: version');
    }

    if (!metadata.createdAt || typeof metadata.createdAt !== 'string') {
      throw new ValidationError('epic.json is missing required field: createdAt');
    }

    if (!metadata.updatedAt || typeof metadata.updatedAt !== 'string') {
      throw new ValidationError('epic.json is missing required field: updatedAt');
    }

    const artifacts = metadata.artifacts as Record<string, unknown>;
    if (!artifacts || typeof artifacts !== 'object') {
      throw new ValidationError('epic.json is missing required field: artifacts');
    }

    const settings = metadata.settings as Record<string, unknown> | undefined;

    const validated: EpicMetadata = {
      epicId: metadata.epicId as string,
      title: metadata.title as string,
      version: metadata.version as string,
      createdAt: metadata.createdAt as string,
      updatedAt: metadata.updatedAt as string,
      artifacts: {
        specs: Array.isArray(artifacts.specs) ? (artifacts.specs as string[]) : [],
        tickets: Array.isArray(artifacts.tickets) ? (artifacts.tickets as string[]) : [],
        executions: Array.isArray(artifacts.executions) ? (artifacts.executions as string[]) : [],
      },
      settings: {
        defaultAgent: settings?.defaultAgent as string | undefined,
        autoCommit: settings?.autoCommit as boolean | undefined,
        templatePreferences: settings?.templatePreferences as Record<string, unknown> | undefined,
      },
    };

    return validated;
  }

  clearCache(): void {
    this.metadataCache = null;
  }
}
