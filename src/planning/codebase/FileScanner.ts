import { ScanOptions } from './types';

export class FileScanner {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  async scanWorkspace(options?: ScanOptions): Promise<string[]> {
    try {
      const vscode = require('vscode');
      
      const includePatterns = options?.include ?? [
        '**/*.{ts,tsx,js,jsx,py,java,go,rs}',
      ];
      const excludePatterns = options?.exclude ?? [
        '**/node_modules/**',
        '**/dist/**',
        '**/out/**',
        '**/.git/**',
        '**/.flowguard/**',
        '**/*.min.js',
        '**/*.d.ts',
      ];
      const maxFiles = options?.maxFiles ?? 5000;

      const allFiles: string[] = [];
      
      for (const pattern of includePatterns) {
        const fileUris = await vscode.workspace.findFiles(
          pattern,
          `{${excludePatterns.join(',')}}`,
          maxFiles
        );
        for (const f of fileUris) {
          allFiles.push(f.fsPath);
        }
      }

      const uniqueFiles = [...new Set(allFiles)];
      return uniqueFiles.sort();
    } catch (error) {
      console.error('Error scanning workspace:', error);
      return [];
    }
  }

  async scanWithProgress(options?: ScanOptions): Promise<string[]> {
    try {
      const vscode = require('vscode');
      
      const files = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Scanning workspace',
          cancellable: true,
        },
        async (progress: { report: (data: { message?: string; increment?: number }) => void }, token: { isCancellationRequested: boolean }) => {
          const result = await this.scanWorkspace(options);
          return result;
        }
      );

      return files;
    } catch (error) {
      console.error('Error scanning with progress:', error);
      return [];
    }
  }
}
