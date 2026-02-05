export interface CodeSymbol {
  name: string;
  kind: 'class' | 'function' | 'interface' | 'variable' | 'type' | 'module' | 'constant' | 'enum';
  filePath: string;
  line: number;
  documentation?: string;
  signature?: string;
  visibility?: 'public' | 'private' | 'protected';
}

export interface FileSummary {
  path: string;
  language: string;
  symbols: CodeSymbol[];
  imports: string[];
  exports: string[];
  loc: number;
  content?: string;
}

export interface DependencyNode {
  id: string;
  type: 'file' | 'module' | 'symbol';
  label: string;
  metadata?: Record<string, unknown>;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'imports' | 'calls' | 'extends' | 'implements' | 'uses';
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface CodebaseContext {
  files: FileSummary[];
  symbols: CodeSymbol[];
  dependencies: DependencyGraph;
  statistics: CodebaseStats;
}

export interface CodebaseStats {
  totalFiles: number;
  totalLines: number;
  languageBreakdown: Record<string, number>;
  topSymbols: CodeSymbol[];
}

export interface ScanOptions {
  include?: string[];
  exclude?: string[];
  maxFiles?: number;
}

export interface ExploreOptions {
  include?: string[];
  exclude?: string[];
  maxFiles?: number;
  includeTests?: boolean;
}
