import * as fs from 'fs/promises';
import * as path from 'path';
import { FileSystemError } from './types';

export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    throw new FileSystemError(
      `Failed to create directory: ${err instanceof Error ? err.message : String(err)}`,
      'mkdir',
      dirPath
    );
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

export async function readFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      throw new FileSystemError(`File not found: ${filePath}`, 'read', filePath);
    }
    throw new FileSystemError(
      `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
      'read',
      filePath
    );
  }
}

export async function writeFile(filePath: string, content: string, atomic: boolean = true): Promise<void> {
  try {
    const dir = path.dirname(filePath);
    await ensureDirectory(dir);

    if (atomic) {
      const tempPath = `${filePath}.tmp.${Date.now()}`;
      await fs.writeFile(tempPath, content, 'utf-8');
      await fs.rename(tempPath, filePath);
    } else {
      await fs.writeFile(filePath, content, 'utf-8');
    }
  } catch (err) {
    throw new FileSystemError(
      `Failed to write file: ${err instanceof Error ? err.message : String(err)}`,
      'write',
      filePath
    );
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    const exists = await fileExists(filePath);
    if (exists) {
      await fs.unlink(filePath);
    }
  } catch (err) {
    throw new FileSystemError(
      `Failed to delete file: ${err instanceof Error ? err.message : String(err)}`,
      'delete',
      filePath
    );
  }
}

export async function listFiles(directory: string, pattern?: RegExp): Promise<string[]> {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      if (entry.isFile() && (!pattern || pattern.test(entry.name))) {
        files.push(entry.name);
      }
    }

    return files;
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      return [];
    }
    throw new FileSystemError(
      `Failed to list files: ${err instanceof Error ? err.message : String(err)}`,
      'readdir',
      directory
    );
  }
}

export async function readJson<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath);
  try {
    return JSON.parse(content) as T;
  } catch (err) {
    throw new FileSystemError(
      `Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`,
      'parse',
      filePath
    );
  }
}

export async function writeJson(filePath: string, data: unknown, atomic: boolean = true): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  await writeFile(filePath, content, atomic);
}
