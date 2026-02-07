import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { fileExists, readFile, writeFile, listFiles, deleteFile, ensureDirectory } from '../../../src/core/storage/fileSystem';

describe('FileSystem Utilities', () => {
  const testDir = '/tmp/test-flowguard';
  const testFile = path.join(testDir, 'test-file.txt');
  const testContent = 'Test file content';

  beforeEach(async () => {
    await ensureDirectory(testDir);
    await writeFile(testFile, testContent);
  });

  afterEach(async () => {
    try {
      await deleteFile(testFile);
      const { rm } = await import('fs/promises');
      await rm(testDir, { recursive: true, force: true });
    } catch {
    }
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const exists = await fileExists(testFile);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const exists = await fileExists('/tmp/non-existing-file.txt');
      expect(exists).toBe(false);
    });

    it('should return false for directory', async () => {
      const exists = await fileExists(testDir);
      expect(exists).toBe(false);
    });
  });

  describe('readFile', () => {
    it('should read file content correctly', async () => {
      const content = await readFile(testFile);
      expect(content).toBe(testContent);
    });

    it('should throw error for non-existing file', async () => {
      await expect(readFile('/tmp/non-existing-file.txt')).rejects.toThrow();
    });
  });

  describe('writeFile', () => {
    it('should write content to file', async () => {
      const newContent = 'New content';
      await writeFile(testFile, newContent);
      const content = await readFile(testFile);
      expect(content).toBe(newContent);
    });

    it('should create file in new directory', async () => {
      const newFile = path.join(testDir, 'subdir', 'new-file.txt');
      const newContent = 'New file content';
      await writeFile(newFile, newContent);
      const content = await readFile(newFile);
      expect(content).toBe(newContent);
    });
  });

  describe('listFiles', () => {
    it('should list files in directory', async () => {
      await writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await writeFile(path.join(testDir, 'file2.txt'), 'content2');

      const files = await listFiles(testDir);
      expect(files.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter files by regex pattern', async () => {
      await writeFile(path.join(testDir, 'test-1.ts'), 'content');
      await writeFile(path.join(testDir, 'test-2.ts'), 'content');
      await writeFile(path.join(testDir, 'other.txt'), 'content');

      const files = await listFiles(testDir, /\.ts$/);
      expect(files.every(f => f.endsWith('.ts'))).toBe(true);
    });

    it('should return empty array for non-existing directory', async () => {
      const files = await listFiles('/tmp/non-existing-dir');
      expect(files).toEqual([]);
    });
  });

  describe('deleteFile', () => {
    it('should delete existing file', async () => {
      const fileToDelete = path.join(testDir, 'to-delete.txt');
      await writeFile(fileToDelete, 'content');
      expect(await fileExists(fileToDelete)).toBe(true);

      await deleteFile(fileToDelete);
      expect(await fileExists(fileToDelete)).toBe(false);
    });

    it('should not throw for non-existing file', async () => {
      await expect(deleteFile('/tmp/non-existing-file.txt')).resolves.not.toThrow();
    });
  });

  describe('ensureDirectory', () => {
    it('should create nested directories', async () => {
      const nestedDir = path.join(testDir, 'level1', 'level2', 'level3');
      await ensureDirectory(nestedDir);
      expect(await fileExists(nestedDir)).toBe(false);
    });

    it('should not throw for existing directory', async () => {
      await expect(ensureDirectory(testDir)).resolves.not.toThrow();
    });
  });
});
