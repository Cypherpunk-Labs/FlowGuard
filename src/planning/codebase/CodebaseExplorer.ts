import * as fs from 'fs';
import { FileScanner } from './FileScanner';
import { TypeScriptAnalyzer } from './TypeScriptAnalyzer';
import { TreeSitterAnalyzer } from './TreeSitterAnalyzer';
import { DependencyGraphBuilder } from './DependencyGraphBuilder';
import {
  CodebaseContext,
  FileSummary,
  CodeSymbol,
  CodebaseStats,
  ExploreOptions,
} from './types';

interface FileCacheEntry {
  summary: FileSummary;
  mtime: number;
}

export class CodebaseExplorer {
  private workspaceRoot: string;
  private fileScanner: FileScanner;
  private typeScriptAnalyzer: TypeScriptAnalyzer;
  private treeSitterAnalyzer: TreeSitterAnalyzer;
  private dependencyGraphBuilder: DependencyGraphBuilder;
  private fileCache: Map<string, FileCacheEntry> = new Map();

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.fileScanner = new FileScanner(workspaceRoot);
    this.typeScriptAnalyzer = new TypeScriptAnalyzer();
    this.treeSitterAnalyzer = new TreeSitterAnalyzer();
    this.dependencyGraphBuilder = new DependencyGraphBuilder();
  }

  async explore(options?: ExploreOptions): Promise<CodebaseContext> {
    try {
      const vscode = require('vscode');

      const files = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Analyzing codebase',
          cancellable: true,
        },
        async (progress: { report: (data: { message?: string; increment?: number }) => void }, _token: { isCancellationRequested: boolean }) => {
          return this.scanAndAnalyzeFiles(options, progress);
        }
      );

      const graph = this.dependencyGraphBuilder.buildGraph(files);
      const circularDeps = this.dependencyGraphBuilder.detectCircularDependencies(graph);

      if (circularDeps.length > 0) {
        console.warn('Circular dependencies detected:', circularDeps);
      }

      const allSymbols = this.collectAllSymbols(files);
      const stats = this.calculateStatistics(files, allSymbols);

      return {
        files,
        symbols: allSymbols,
        dependencies: graph,
        statistics: stats,
      };
    } catch (error) {
      console.error('Error exploring codebase:', error);
      return {
        files: [],
        symbols: [],
        dependencies: { nodes: [], edges: [] },
        statistics: {
          totalFiles: 0,
          totalLines: 0,
          languageBreakdown: {},
          topSymbols: [],
        },
      };
    }
  }

  private async scanAndAnalyzeFiles(
    options: ExploreOptions | undefined,
    progress: { report: (data: { message?: string; increment?: number }) => void }
  ): Promise<FileSummary[]> {
    const filePathsResult = await this.fileScanner.scanWorkspace(options);
    const fileSummaries: FileSummary[] = [];
    const totalFiles = filePathsResult.length;

    if (totalFiles === 0) {
      progress.report({ message: 'No files found', increment: 100 });
      return [];
    }

    await this.treeSitterAnalyzer.initialize();

    let processed = 0;
    for (const filePath of filePathsResult) {
      if (!filePath) continue;
      
      try {
        const cached = this.fileCache.get(filePath);
        const mtime = (await fs.promises.stat(filePath)).mtimeMs;

        if (cached && cached.mtime === mtime) {
          fileSummaries.push(cached.summary);
        } else {
          const summary = await this.performFileAnalysis(filePath);
          this.fileCache.set(filePath, { summary, mtime });
          fileSummaries.push(summary);
        }
      } catch (error) {
        console.warn(`Failed to analyze file ${filePath}:`, error);
      }

      processed++;
      const increment = (processed / totalFiles) * 100;
      progress.report({
        message: `Analyzing ${this.getFileName(filePath)} (${processed}/${totalFiles})`,
        increment: Math.round(increment),
      });
    }

    progress.report({ message: 'Analysis complete', increment: 100 });

    return fileSummaries;
  }

  private async performFileAnalysis(filePath: string): Promise<FileSummary> {
    const isTypeScript = filePath.endsWith('.ts') || 
                        filePath.endsWith('.tsx') || 
                        filePath.endsWith('.js') ||
                        filePath.endsWith('.jsx');

    if (isTypeScript) {
      return this.typeScriptAnalyzer.analyzeFile(filePath);
    } else {
      const language = this.detectLanguage(filePath);
      return this.treeSitterAnalyzer.analyzeFile(filePath, language);
    }
  }

  private detectLanguage(filePath: string): string {
    if (filePath.endsWith('.py')) return 'python';
    if (filePath.endsWith('.java')) return 'java';
    if (filePath.endsWith('.go')) return 'go';
    if (filePath.endsWith('.rs')) return 'rust';
    return 'unknown';
  }

  private getFileName(filePath: string): string {
    const parts = filePath.split('/');
    return parts[parts.length - 1] || filePath;
  }

  private collectAllSymbols(files: FileSummary[]): CodeSymbol[] {
    const symbolMap = new Map<string, CodeSymbol>();

    files.forEach(file => {
      file.symbols.forEach(symbol => {
        const key = `${file.path}::${symbol.name}`;
        if (!symbolMap.has(key)) {
          symbolMap.set(key, { ...symbol, filePath: file.path });
        }
      });
    });

    return Array.from(symbolMap.values());
  }

  private calculateStatistics(files: FileSummary[], symbols: CodeSymbol[]): CodebaseStats {
    const languageBreakdown: Record<string, number> = {};
    let totalLines = 0;

    files.forEach(file => {
      languageBreakdown[file.language] = (languageBreakdown[file.language] || 0) + 1;
      totalLines += file.loc;
    });

    const symbolCounts = new Map<string, number>();
    symbols.forEach(symbol => {
      symbolCounts.set(symbol.kind, (symbolCounts.get(symbol.kind) || 0) + 1);
    });

    const sortedSymbols = symbols
      .sort((a, b) => (symbolCounts.get(b.kind) || 0) - (symbolCounts.get(a.kind) || 0))
      .slice(0, 20);

    return {
      totalFiles: files.length,
      totalLines,
      languageBreakdown,
      topSymbols: sortedSymbols,
    };
  }

  clearCache(): void {
    this.fileCache.clear();
  }

  async analyzeSingleFile(filePath: string): Promise<FileSummary> {
    return this.performFileAnalysis(filePath);
  }

  async buildDependencyGraph(): Promise<ReturnType<DependencyGraphBuilder['buildGraph']>> {
    const filePaths = await this.fileScanner.scanWorkspace(undefined);
    const files: FileSummary[] = [];

    for (const filePath of filePaths) {
      const summary = await this.performFileAnalysis(filePath);
      files.push(summary);
    }

    return this.dependencyGraphBuilder.buildGraph(files);
  }
}
