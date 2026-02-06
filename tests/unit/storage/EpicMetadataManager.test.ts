import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EpicMetadataManager } from '../../../src/core/storage/EpicMetadataManager';
import { Epic } from '../../../src/core/models/Epic';
import { EpicMetadata, ValidationError } from '../../../src/core/storage/types';
import { v4 as uuidv4 } from 'uuid';

const tempWorkspace = '/tmp/test-flowguard-metadata';
let manager: EpicMetadataManager;

jest.mock('../../../src/core/storage/fileSystem', () => ({
  fileExists: jest.fn(),
  readJson: jest.fn(),
  writeJson: jest.fn()
}));

import { fileExists, readJson, writeJson } from '../../../src/core/storage/fileSystem';

describe('EpicMetadataManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    manager = new EpicMetadataManager(tempWorkspace);
  });

  describe('loadEpicMetadata', () => {
    it('should load and return cached metadata', async () => {
      const mockMetadata: EpicMetadata = {
        epicId: 'epic-123',
        title: 'Test Epic',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        artifacts: { specs: [], tickets: [], executions: [] },
        settings: { autoCommit: false }
      };

      jest.mocked(fileExists).mockResolvedValue(true);
      jest.mocked(readJson).mockResolvedValue(mockMetadata);

      const result1 = await manager.loadEpicMetadata();
      const result2 = await manager.loadEpicMetadata();

      expect(result1).toEqual(mockMetadata);
      expect(result2).toEqual(mockMetadata);
      expect(readJson).toHaveBeenCalledTimes(1);
    });

    it('should throw ValidationError when epic.json not found', async () => {
      jest.mocked(fileExists).mockResolvedValue(false);

      await expect(manager.loadEpicMetadata()).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for corrupted JSON', async () => {
      jest.mocked(fileExists).mockResolvedValue(true);
      jest.mocked(readJson).mockResolvedValue('not-an-object');

      await expect(manager.loadEpicMetadata()).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing required fields', async () => {
      jest.mocked(fileExists).mockResolvedValue(true);
      jest.mocked(readJson).mockResolvedValue({ title: 'Test' });

      await expect(manager.loadEpicMetadata()).rejects.toThrow('epic.json is missing required field: epicId');
    });
  });

  describe('saveEpicMetadata', () => {
    it('should save metadata and update cache', async () => {
      const metadata: EpicMetadata = {
        epicId: 'epic-123',
        title: 'Test Epic',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        artifacts: { specs: ['spec-1'], tickets: [], executions: [] },
        settings: { autoCommit: true }
      };

      await manager.saveEpicMetadata(metadata);

      expect(writeJson).toHaveBeenCalledWith(
        expect.stringContaining('epic.json'),
        metadata
      );
    });
  });

  describe('updateEpicMetadata', () => {
    it('should merge updates with existing metadata', async () => {
      const existingMetadata: EpicMetadata = {
        epicId: 'epic-123',
        title: 'Test Epic',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        artifacts: { specs: [], tickets: [], executions: [] },
        settings: { autoCommit: false }
      };

      jest.mocked(fileExists).mockResolvedValue(true);
      jest.mocked(readJson).mockResolvedValue(existingMetadata);

      await manager.updateEpicMetadata({ title: 'Updated Title' });

      expect(writeJson).toHaveBeenCalled();
      const savedData = jest.mocked(writeJson).mock.calls[0][1] as EpicMetadata;
      expect(savedData.title).toBe('Updated Title');
    });
  });

  describe('initializeEpic', () => {
    it('should initialize epic metadata from Epic object', async () => {
      const epic: Epic = {
        id: 'epic-123',
        title: 'My Epic',
        overview: 'Epic overview',
        phases: [],
        technicalPlan: {
          files: [],
          dependencies: [],
          edgeCases: [],
          nonFunctionalRequirements: [],
          testingStrategy: { unitTests: '', integrationTests: '', e2eTests: '' }
        },
        diagrams: [],
        metadata: {
          author: 'Test Author',
          tags: ['test'],
          priority: 'high'
        },
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await manager.initializeEpic(epic);

      expect(writeJson).toHaveBeenCalled();
      const savedData = jest.mocked(writeJson).mock.calls[0][1] as EpicMetadata;
      expect(savedData.epicId).toBe(epic.id);
      expect(savedData.title).toBe(epic.title);
      expect(savedData.artifacts).toEqual({ specs: [], tickets: [], executions: [] });
    });
  });

  describe('registerArtifact', () => {
    it('should register a new spec artifact', async () => {
      const existingMetadata: EpicMetadata = {
        epicId: 'epic-123',
        title: 'Test Epic',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        artifacts: { specs: [], tickets: [], executions: [] },
        settings: { autoCommit: false }
      };

      jest.mocked(fileExists).mockResolvedValue(true);
      jest.mocked(readJson).mockResolvedValue(existingMetadata);

      await manager.registerArtifact('spec', 'spec-123');

      expect(writeJson).toHaveBeenCalled();
      const savedData = jest.mocked(writeJson).mock.calls[0][1] as EpicMetadata;
      expect(savedData.artifacts.specs).toContain('spec-123');
    });

    it('should not duplicate artifact registration', async () => {
      const existingMetadata: EpicMetadata = {
        epicId: 'epic-123',
        title: 'Test Epic',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        artifacts: { specs: ['spec-123'], tickets: [], executions: [] },
        settings: { autoCommit: false }
      };

      jest.mocked(fileExists).mockResolvedValue(true);
      jest.mocked(readJson).mockResolvedValue(existingMetadata);

      await manager.registerArtifact('spec', 'spec-123');

      expect(writeJson).not.toHaveBeenCalled();
    });

    it('should register ticket artifacts', async () => {
      const existingMetadata: EpicMetadata = {
        epicId: 'epic-123',
        title: 'Test Epic',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        artifacts: { specs: [], tickets: [], executions: [] },
        settings: { autoCommit: false }
      };

      jest.mocked(fileExists).mockResolvedValue(true);
      jest.mocked(readJson).mockResolvedValue(existingMetadata);

      await manager.registerArtifact('ticket', 'ticket-456');

      const savedData = jest.mocked(writeJson).mock.calls[0][1] as EpicMetadata;
      expect(savedData.artifacts.tickets).toContain('ticket-456');
    });
  });

  describe('unregisterArtifact', () => {
    it('should unregister an existing artifact', async () => {
      const existingMetadata: EpicMetadata = {
        epicId: 'epic-123',
        title: 'Test Epic',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        artifacts: { specs: ['spec-123', 'spec-456'], tickets: [], executions: [] },
        settings: { autoCommit: false }
      };

      jest.mocked(fileExists).mockResolvedValue(true);
      jest.mocked(readJson).mockResolvedValue(existingMetadata);

      await manager.unregisterArtifact('spec', 'spec-123');

      const savedData = jest.mocked(writeJson).mock.calls[0][1] as EpicMetadata;
      expect(savedData.artifacts.specs).not.toContain('spec-123');
      expect(savedData.artifacts.specs).toContain('spec-456');
    });

    it('should not error when unregistering non-existent artifact', async () => {
      const existingMetadata: EpicMetadata = {
        epicId: 'epic-123',
        title: 'Test Epic',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        artifacts: { specs: ['spec-123'], tickets: [], executions: [] },
        settings: { autoCommit: false }
      };

      jest.mocked(fileExists).mockResolvedValue(true);
      jest.mocked(readJson).mockResolvedValue(existingMetadata);

      await manager.unregisterArtifact('spec', 'non-existent');

      expect(writeJson).not.toHaveBeenCalled();
    });
  });

  describe('validateMetadata', () => {
    it('should validate correct metadata', () => {
      const validMetadata = {
        epicId: 'epic-123',
        title: 'Test Epic',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        artifacts: { specs: [], tickets: [], executions: [] },
        settings: { autoCommit: false }
      };

      const result = manager.validateMetadata(validMetadata);

      expect(result.epicId).toBe('epic-123');
      expect(result.artifacts.specs).toEqual([]);
    });

    it('should handle partial settings', () => {
      const metadata = {
        epicId: 'epic-123',
        title: 'Test Epic',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        artifacts: { specs: [], tickets: [], executions: [] }
      };

      const result = manager.validateMetadata(metadata);

      expect(result.settings.autoCommit).toBeUndefined();
    });
  });

  describe('clearCache', () => {
    it('should clear the metadata cache', async () => {
      const mockMetadata: EpicMetadata = {
        epicId: 'epic-123',
        title: 'Test Epic',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        artifacts: { specs: [], tickets: [], executions: [] },
        settings: { autoCommit: false }
      };

      jest.mocked(fileExists).mockResolvedValue(true);
      jest.mocked(readJson).mockResolvedValue(mockMetadata);

      await manager.loadEpicMetadata();
      manager.clearCache();
      await manager.loadEpicMetadata();

      expect(readJson).toHaveBeenCalledTimes(2);
    });
  });
});
