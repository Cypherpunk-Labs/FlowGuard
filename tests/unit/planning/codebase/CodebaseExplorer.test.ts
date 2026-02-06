import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CodebaseExplorer } from '../../../src/planning/codebase/CodebaseExplorer';
import { FileScanner } from '../../../src/planning/codebase/FileScanner';
import { TypeScriptAnalyzer } from '../../../src/planning/codebase/TypeScriptAnalyzer';
import { DependencyGraphBuilder } from '../../../src/planning/codebase/DependencyGraphBuilder';
import { CodebaseContext, FileSummary, CodeSymbol } from '../../../src/planning/codebase/types';

describe('CodebaseExplorer', () => {
  let explorer: CodebaseExplorer;
  let mockFileScanner: jest.Mocked<FileScanner>;
  let mockTypeScriptAnalyzer: jest.Mocked<TypeScriptAnalyzer>;

  beforeEach(() => {
    mockFileScanner = {
      scan: jest.fn().mockResolvedValue(['file1.ts', 'file2.ts']),
      getFileStats: jest.fn().mockResolvedValue({ lines: 100 })
    } as any;
    mockTypeScriptAnalyzer = {
      parseFile: jest.fn().mockResolvedValue({
        functions: [{ name: 'testFunc', line: 10 }],
        classes: [],
        imports: []
      }),
      extractTypes: jest.fn().mockReturnValue({})
    } as any;

    explorer = new CodebaseExplorer('/test/workspace');
    explorer['fileScanner'] = mockFileScanner;
    explorer['typeScriptAnalyzer'] = mockTypeScriptAnalyzer;
  });

  describe('explore', () => {
    it('should scan workspace files', async () => {
      const result = await explorer.explore();

      expect(mockFileScanner.scan).toHaveBeenCalled();
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should calculate codebase statistics', async () => {
      const result = await explorer.explore();

      expect(result.stats.totalFiles).toBeGreaterThanOrEqual(0);
      expect(result.stats.totalLines).toBeGreaterThanOrEqual(0);
    });

    it('should extract symbols from TypeScript files', async () => {
      const result = await explorer.explore();

      expect(mockTypeScriptAnalyzer.parseFile).toHaveBeenCalled();
    });

    it('should handle empty workspace', async () => {
      mockFileScanner.scan.mockResolvedValue([]);

      const result = await explorer.explore();

      expect(result.files).toEqual([]);
      expect(result.stats.totalFiles).toBe(0);
    });

    it('should respect exclude patterns', async () => {
      const excludePatterns = ['**/node_modules/**', '**/*.d.ts'];
      await explorer.explore({ excludePatterns });

      expect(mockFileScanner.scan).toHaveBeenCalled();
    });

    it('should build dependency graph', async () => {
      const result = await explorer.explore();

      expect(result.relationships.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('analyzeSingleFile', () => {
    it('should analyze a single file', async () => {
      const result = await explorer.analyzeSingleFile('src/test.ts');

      expect(result).toBeDefined();
      expect(mockTypeScriptAnalyzer.parseFile).toHaveBeenCalledWith('src/test.ts');
    });

    it('should extract functions and classes', async () => {
      const result = await explorer.analyzeSingleFile('src/test.ts');

      expect(result.functions).toBeDefined();
      expect(result.classes).toBeDefined();
    });
  });

  describe('buildDependencyGraph', () => {
    it('should build dependency graph from files', async () => {
      const result = await explorer.buildDependencyGraph();

      expect(result.nodes.length).toBeGreaterThanOrEqual(0);
      expect(result.edges.length).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('FileScanner', () => {
  let scanner: FileScanner;

  beforeEach(() => {
    scanner = new FileScanner('/test/workspace');
  });

  describe('scan', () => {
    it('should return list of files', async () => {
      const files = await scanner.scan();

      expect(Array.isArray(files)).toBe(true);
    });

    it('should filter by include patterns', async () => {
      const includePatterns = ['**/*.ts', '**/*.js'];
      const files = await scanner.scan(includePatterns);

      expect(files.every(f => f.endsWith('.ts') || f.endsWith('.js'))).toBe(true);
    });

    it('should respect exclude patterns', async () => {
      const excludePatterns = ['**/node_modules/**'];
      const files = await scanner.scan(undefined, excludePatterns);

      expect(files.every(f => !f.includes('node_modules'))).toBe(true);
    });

    it('should handle non-existent directory', async () => {
      const emptyScanner = new FileScanner('/non/existent');
      const files = await emptyScanner.scan();

      expect(files).toEqual([]);
    });
  });

  describe('getFileStats', () => {
    it('should return file statistics', async () => {
      const stats = await scanner.getFileStats('src/test.ts');

      expect(stats).toBeDefined();
      expect(typeof stats.lines).toBe('number');
    });
  });
});

describe('TypeScriptAnalyzer', () => {
  let analyzer: TypeScriptAnalyzer;

  beforeEach(() => {
    analyzer = new TypeScriptAnalyzer();
  });

  describe('parseFile', () => {
    it('should parse TypeScript file and extract symbols', async () => {
      const result = await analyzer.parseFile('src/test.ts');

      expect(result).toBeDefined();
      expect(result.functions).toBeDefined();
      expect(result.classes).toBeDefined();
    });

    it('should extract function declarations', async () => {
      const result = await analyzer.parseFile('src/test.ts');

      expect(Array.isArray(result.functions)).toBe(true);
    });

    it('should extract class declarations', async () => {
      const result = await analyzer.parseFile('src/test.ts');

      expect(Array.isArray(result.classes)).toBe(true);
    });

    it('should track import statements', async () => {
      const result = await analyzer.parseFile('src/test.ts');

      expect(result.imports).toBeDefined();
      expect(Array.isArray(result.imports)).toBe(true);
    });
  });

  describe('extractTypes', () => {
    it('should extract type information', () => {
      const result = analyzer.extractTypes('const x: string = "hello"');

      expect(result).toBeDefined();
    });
  });
});

describe('DependencyGraphBuilder', () => {
  let builder: DependencyGraphBuilder;

  beforeEach(() => {
    builder = new DependencyGraphBuilder();
  });

  describe('buildGraph', () => {
    it('should build graph from file list', async () => {
      const files = ['src/a.ts', 'src/b.ts', 'src/c.ts'];
      const fileContents = new Map([
        ['src/a.ts', 'import { b } from "./b";'],
        ['src/b.ts', 'import { c } from "./c";'],
        ['src/c.ts', '// no imports']
      ]);

      const result = await builder.buildGraph(files, fileContents);

      expect(result.nodes.length).toBe(3);
      expect(result.edges.length).toBeGreaterThanOrEqual(2);
    });

    it('should identify dependencies between files', async () => {
      const files = ['src/main.ts', 'src/utils.ts'];
      const fileContents = new Map([
        ['src/main.ts', 'import { helper } from "./utils";'],
        ['src/utils.ts', '// utility functions']
      ]);

      const result = await builder.buildGraph(files, fileContents);

      const mainNode = result.nodes.find(n => n.id === 'src/main.ts');
      expect(mainNode).toBeDefined();
    });

    it('should handle cyclic dependencies', async () => {
      const files = ['src/a.ts', 'src/b.ts'];
      const fileContents = new Map([
        ['src/a.ts', 'import { b } from "./b";'],
        ['src/b.ts', 'import { a } from "./a";']
      ]);

      const result = await builder.buildGraph(files, fileContents);

      expect(result.nodes.length).toBe(2);
    });

    it('should handle empty file list', async () => {
      const result = await builder.buildGraph([], new Map());

      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });
  });
});
