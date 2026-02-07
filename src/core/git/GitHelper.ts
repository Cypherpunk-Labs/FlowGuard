import simpleGit, { SimpleGit, StatusResult, LogResult } from 'simple-git';
import * as path from 'path';
import { GitError } from '../storage/types';
import { log, error } from '../../utils/logger';

export class GitHelper {
  private git: SimpleGit;
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.git = simpleGit(workspaceRoot);
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.raw(['rev-parse', '--git-dir']);
      return true;
    } catch {
      return false;
    }
  }

  async initRepository(): Promise<void> {
    try {
      const isRepo = await this.isGitRepository();
      if (!isRepo) {
        await this.git.init();
        log('Initialized Git repository');
      }
    } catch (err) {
      throw new GitError(
        `Failed to initialize Git repository: ${err instanceof Error ? err.message : String(err)}`,
        'init'
      );
    }
  }

  async stageFiles(paths: string[]): Promise<void> {
    try {
      if (paths.length > 0) {
        await this.git.add(paths);
        log(`Staged files: ${paths.join(', ')}`);
      }
    } catch (err) {
      throw new GitError(
        `Failed to stage files: ${err instanceof Error ? err.message : String(err)}`,
        'add'
      );
    }
  }

  async commit(message: string): Promise<void> {
    try {
      await this.git.commit(message);
      log(`Committed: ${message}`);
    } catch (err) {
      throw new GitError(
        `Failed to commit: ${err instanceof Error ? err.message : String(err)}`,
        'commit'
      );
    }
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const branch = await this.git.branch();
      return branch.current;
    } catch (err) {
      throw new GitError(
        `Failed to get current branch: ${err instanceof Error ? err.message : String(err)}`,
        'branch'
      );
    }
  }

  async getStatus(): Promise<StatusResult> {
    try {
      const status = await this.git.status();
      return status;
    } catch (err) {
      throw new GitError(
        `Failed to get status: ${err instanceof Error ? err.message : String(err)}`,
        'status'
      );
    }
  }

  async getDiff(filePath?: string): Promise<string> {
    try {
      if (filePath) {
        const diff = await this.git.diff([filePath]);
        return diff;
      } else {
        const diff = await this.git.diff();
        return diff;
      }
    } catch (err) {
      throw new GitError(
        `Failed to get diff: ${err instanceof Error ? err.message : String(err)}`,
        'diff'
      );
    }
  }

  async stageFlowGuardArtifact(artifactPath: string): Promise<void> {
    const relativePath = path.relative(this.workspaceRoot, artifactPath);
    await this.stageFiles([relativePath]);
  }

  async commitArtifact(type: string, id: string, action: 'create' | 'update' | 'delete'): Promise<void> {
    const message = `flowguard: ${action} ${type} ${id}`;
    const isRepo = await this.isGitRepository();

    if (!isRepo) {
      error('Not a Git repository, skipping commit');
      return;
    }

    try {
      await this.commit(message);
    } catch (err) {
      if (err instanceof GitError && err.message.includes('nothing to commit')) {
        return;
      }
      throw err;
    }
  }

  async getArtifactHistory(artifactPath: string): Promise<LogResult> {
    try {
      const relativePath = path.relative(this.workspaceRoot, artifactPath);
      const logResult = await this.git.log({ file: relativePath });
      return logResult;
    } catch (err) {
      throw new GitError(
        `Failed to get artifact history: ${err instanceof Error ? err.message : String(err)}`,
        'log'
      );
    }
  }
}
