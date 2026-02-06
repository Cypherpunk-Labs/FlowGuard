import { DiffAnalysis, ChangedFile, Change } from '../core/models/Verification';
import { DiffFormat, DiffInput, ParsedDiff, FileChange, LineChange, DiffStatistics } from './types';

export class DiffAnalyzer {
  parseDiff(diffText: string, format: DiffFormat): ParsedDiff {
    switch (format) {
      case 'git':
      case 'unified':
        return this.parseUnifiedDiff(diffText, format);
      case 'github':
        return this.parseGitHubDiff(diffText);
      case 'gitlab':
        return this.parseGitLabDiff(diffText);
      default:
        throw new Error(`Unsupported diff format: ${format}`);
    }
  }

  private parseUnifiedDiff(diffText: string, format: DiffFormat): ParsedDiff {
    const lines = diffText.split('\n');
    const fileChanges: FileChange[] = [];
    const errors: string[] = [];

    let currentFile: FileChange | null = null;
    let oldLineNumber = 0;
    let newLineNumber = 0;
    let inHunk = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      if (line.startsWith('diff --git')) {
        if (currentFile) {
          fileChanges.push(currentFile);
        }
        const fileMatch = line.match(/diff --git a\/(.+) b\/(.+)$/);
        if (fileMatch) {
          currentFile = {
            path: fileMatch[2] || '',
            status: 'modified',
            changes: []
          };
        }
        inHunk = false;
      } else if (line.startsWith('new file mode')) {
        if (currentFile) {
          currentFile.status = 'added';
        }
      } else if (line.startsWith('deleted file mode')) {
        if (currentFile) {
          currentFile.status = 'deleted';
        }
      } else if (line.startsWith('rename from')) {
        if (currentFile) {
          currentFile.status = 'renamed';
          currentFile.oldPath = line.substring(12).trim();
        }
      } else if (line.startsWith('@@')) {
        const hunkMatch = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        if (hunkMatch && hunkMatch[1] && hunkMatch[3]) {
          oldLineNumber = parseInt(hunkMatch[1], 10);
          newLineNumber = parseInt(hunkMatch[3], 10);
          inHunk = true;
        }
      } else if (inHunk && currentFile) {
        if (line.startsWith('+')) {
          currentFile.changes.push({
            type: 'addition',
            lineNumber: newLineNumber,
            content: line.substring(1)
          });
          newLineNumber++;
        } else if (line.startsWith('-')) {
          currentFile.changes.push({
            type: 'deletion',
            lineNumber: oldLineNumber,
            oldLineNumber,
            content: line.substring(1)
          });
          oldLineNumber++;
        } else if (line.startsWith(' ')) {
          currentFile.changes.push({
            type: 'unchanged',
            lineNumber: newLineNumber,
            oldLineNumber,
            content: line.substring(1)
          });
          oldLineNumber++;
          newLineNumber++;
        } else if (line.startsWith('\\')) {
          continue;
        } else if (line === '') {
          currentFile.changes.push({
            type: 'unchanged',
            lineNumber: newLineNumber,
            oldLineNumber,
            content: ''
          });
          oldLineNumber++;
          newLineNumber++;
        }
      }
    }

    if (currentFile) {
      fileChanges.push(currentFile);
    }

    const statistics = this.calculateStatistics(fileChanges);
    const changedFiles = this.convertToChangedFiles(fileChanges);

    return {
      ...statistics,
      changedFiles,
      format,
      parsingErrors: errors.length > 0 ? errors : undefined
    };
  }

  private parseGitHubDiff(diffText: string): ParsedDiff {
    try {
      const data = JSON.parse(diffText);
      
      if (Array.isArray(data)) {
        const fileChanges: FileChange[] = data.map((file: any) => ({
          path: file.filename,
          status: this.mapGitHubStatus(file.status),
          changes: this.parseGitHubFilePatch(file.patch),
          isBinary: file.status === 'removed' || file.status === 'added' ? false : undefined
        }));

        const statistics = this.calculateStatistics(fileChanges);
        const changedFiles = this.convertToChangedFiles(fileChanges);

        return {
          ...statistics,
          changedFiles,
          format: 'github'
        };
      }

      return this.parseUnifiedDiff(diffText, 'unified');
    } catch (e) {
      return this.parseUnifiedDiff(diffText, 'unified');
    }
  }

  private parseGitLabDiff(diffText: string): ParsedDiff {
    try {
      const data = JSON.parse(diffText);
      
      if (data.changes && Array.isArray(data.changes)) {
        const fileChanges: FileChange[] = data.changes.map((change: any) => ({
          path: change.new_path,
          oldPath: change.old_path,
          status: this.mapGitLabStatus(change.new_file, change.deleted_file, change.renamed_file),
          changes: change.diff ? this.parseGitLabPatch(change.diff) : [],
          isBinary: change.diff === '' && (change.new_file || change.deleted_file)
        }));

        const statistics = this.calculateStatistics(fileChanges);
        const changedFiles = this.convertToChangedFiles(fileChanges);

        return {
          ...statistics,
          changedFiles,
          format: 'gitlab'
        };
      }

      return this.parseUnifiedDiff(diffText, 'unified');
    } catch (e) {
      return this.parseUnifiedDiff(diffText, 'unified');
    }
  }

  private mapGitHubStatus(status: string): FileChange['status'] {
    switch (status) {
      case 'added':
        return 'added';
      case 'removed':
        return 'deleted';
      case 'modified':
        return 'modified';
      case 'renamed':
        return 'renamed';
      default:
        return 'modified';
    }
  }

  private mapGitLabStatus(newFile: boolean, deletedFile: boolean, renamedFile: boolean): FileChange['status'] {
    if (newFile) return 'added';
    if (deletedFile) return 'deleted';
    if (renamedFile) return 'renamed';
    return 'modified';
  }

  private parseGitHubFilePatch(patch: string | undefined): LineChange[] {
    if (!patch) return [];
    
    const changes: LineChange[] = [];
    const lines = patch.split('\n');
    let oldLine = 0;
    let newLine = 0;

    for (const line of lines) {
      if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match && match[1] && match[2]) {
          oldLine = parseInt(match[1], 10);
          newLine = parseInt(match[2], 10);
        }
      } else if (line.startsWith('+')) {
        changes.push({
          type: 'addition',
          lineNumber: newLine,
          content: line.substring(1)
        });
        newLine++;
      } else if (line.startsWith('-')) {
        changes.push({
          type: 'deletion',
          lineNumber: oldLine,
          content: line.substring(1)
        });
        oldLine++;
      } else if (line.startsWith(' ')) {
        changes.push({
          type: 'unchanged',
          lineNumber: newLine,
          content: line.substring(1)
        });
        oldLine++;
        newLine++;
      }
    }

    return changes;
  }

  private parseGitLabPatch(diff: string): LineChange[] {
    return this.parseGitHubFilePatch(diff);
  }

  private calculateStatistics(fileChanges: FileChange[]): DiffStatistics {
    let additions = 0;
    let deletions = 0;
    let addedFiles = 0;
    let deletedFiles = 0;
    let modifiedFiles = 0;
    let renamedFiles = 0;

    for (const file of fileChanges) {
      switch (file.status) {
        case 'added':
          addedFiles++;
          break;
        case 'deleted':
          deletedFiles++;
          break;
        case 'modified':
          modifiedFiles++;
          break;
        case 'renamed':
          renamedFiles++;
          break;
      }

      for (const change of file.changes) {
        if (change.type === 'addition') additions++;
        if (change.type === 'deletion') deletions++;
      }
    }

    return {
      totalFiles: fileChanges.length,
      totalLines: additions + deletions,
      additions,
      deletions,
      modifiedFiles,
      addedFiles,
      deletedFiles,
      renamedFiles
    };
  }

  private convertToChangedFiles(fileChanges: FileChange[]): ChangedFile[] {
    return fileChanges.map(file => ({
      path: file.path,
      status: file.status === 'renamed' ? 'modified' : file.status,
      changes: file.changes
        .filter(c => c.type !== 'unchanged')
        .map(c => ({
          type: c.type === 'addition' ? 'addition' : 'deletion',
          lineNumber: c.lineNumber,
          content: c.content
        }))
    }));
  }

  detectFormat(input: string): DiffFormat {
    if (input.trim().startsWith('diff --git')) {
      return 'git';
    }
    
    if (input.trim().startsWith('{') || input.trim().startsWith('[')) {
      try {
        const data = JSON.parse(input);
        if (Array.isArray(data) && data[0]?.filename) {
          return 'github';
        }
        if (data.changes && Array.isArray(data.changes)) {
          return 'gitlab';
        }
      } catch (e) {
        return 'unified';
      }
    }

    if (input.includes('@@') && (input.includes('\n+') || input.includes('\n-'))) {
      return 'unified';
    }

    return 'unified';
  }

  extractMetadata(diffText: string, format: DiffFormat): { commitHash?: string; author?: string; branch?: string; message?: string } {
    const metadata: { commitHash?: string; author?: string; branch?: string; message?: string } = {};

    if (format === 'git' || format === 'unified') {
      const commitMatch = diffText.match(/^From ([a-f0-9]{40})/m);
      if (commitMatch) {
        metadata.commitHash = commitMatch[1];
      }

      const authorMatch = diffText.match(/^From: (.+) <(.+)>/m);
      if (authorMatch) {
        metadata.author = `${authorMatch[1]} <${authorMatch[2]}>`;
      }

      const subjectMatch = diffText.match(/^Subject: \[PATCH\]?\s*(.+)$/m);
      if (subjectMatch) {
        metadata.message = subjectMatch[1];
      }
    }

    return metadata;
  }
}
