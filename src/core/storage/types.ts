export type ArtifactType = 'spec' | 'ticket' | 'execution' | 'verification';

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: StorageError;
}

export interface ArtifactMetadata {
  id: string;
  path: string;
  type: ArtifactType;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorageOptions {
  validate?: boolean;
  atomic?: boolean;
}

export interface EpicMetadata {
  epicId: string;
  title: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  artifacts: {
    specs: string[];
    tickets: string[];
    executions: string[];
  };
  settings: {
    defaultAgent?: string;
    autoCommit?: boolean;
    templatePreferences?: Record<string, unknown>;
  };
}

export interface Reference {
  type: 'spec' | 'ticket' | 'file' | 'execution';
  id: string;
  label?: string;
  fragment?: string;
}

export interface ResolvedReference extends Reference {
  path: string;
  exists: boolean;
  title?: string;
}

export type StorageErrorType = 'not_found' | 'validation' | 'filesystem' | 'git' | 'unknown';

export class StorageError extends Error {
  type: StorageErrorType;
  artifactType?: ArtifactType;
  artifactId?: string;
  operation?: string;

  constructor(
    message: string,
    type: StorageErrorType = 'unknown',
    options?: {
      artifactType?: ArtifactType;
      artifactId?: string;
      operation?: string;
    }
  ) {
    super(message);
    this.type = type;
    this.artifactType = options?.artifactType;
    this.artifactId = options?.artifactId;
    this.operation = options?.operation;
    this.name = 'StorageError';
  }
}

export class NotFoundError extends StorageError {
  constructor(artifactType: ArtifactType, id: string) {
    super(
      `Artifact not found: ${artifactType} with id "${id}"`,
      'not_found',
      { artifactType, artifactId: id, operation: 'read' }
    );
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends StorageError {
  field?: string;

  constructor(message: string, field?: string) {
    super(message, 'validation', { operation: 'validate' });
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class FileSystemError extends StorageError {
  constructor(message: string, operation: string, path?: string) {
    super(message, 'filesystem', { operation });
    if (path) {
      this.message += `: ${path}`;
    }
    this.name = 'FileSystemError';
  }
}

export class GitError extends StorageError {
  constructor(message: string, operation: string) {
    super(message, 'git', { operation });
    this.name = 'GitError';
  }
}
