import * as fs from 'fs';
import { FileSummary, CodeSymbol } from './types';

interface TreeSitterParser {
  parse(content: string): { rootNode: TreeSitterNode };
}

interface TreeSitterNode {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  children: TreeSitterNode[];
  namedChildren: TreeSitterNode[];
  childByFieldName(name: string): TreeSitterNode | undefined;
}

export class TreeSitterAnalyzer {
  private parsers: Map<string, TreeSitterParser> = new Map();
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const treeSitter = await import('tree-sitter');
      const treeSitterAny = treeSitter as unknown as { 
        default: { 
          new: () => { setLanguage: (g: unknown) => void } ;
          prototype: { setLanguage: (g: unknown) => void };
        } 
      };
      const ParserClass = treeSitterAny.default;
      
      const loadLanguage = async (langName: string, grammarExport: string): Promise<void> => {
        try {
          const langModule = await import(`tree-sitter-${langName}`);
          const grammar = (langModule as Record<string, unknown>)[grammarExport];
          if (!grammar) {
            throw new Error(`Grammar export '${grammarExport}' not found in tree-sitter-${langName}`);
          }
          const parser = Object.create(ParserClass.prototype);
          parser.setLanguage(grammar);
          this.parsers.set(langName, parser as unknown as TreeSitterParser);
        } catch (error) {
          console.warn(`Failed to load tree-sitter language ${langName}:`, error);
        }
      };

      await Promise.all([
        loadLanguage('typescript', 'typescript'),
        loadLanguage('javascript', 'default'),
        loadLanguage('python', 'default'),
      ]);

      this.initialized = true;
    } catch (error) {
      console.warn('Tree-sitter initialization failed, falling back to regex:', error);
    }
  }

  async analyzeFile(filePath: string, language?: string): Promise<FileSummary> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const detectedLanguage = language || this.detectLanguage(filePath);

      const symbols: CodeSymbol[] = [];
      const imports: string[] = [];
      const exports: string[] = [];

      if (this.initialized && this.parsers.has(detectedLanguage)) {
        const parser = this.parsers.get(detectedLanguage)!;
        const tree = parser.parse(content);
        this.extractSymbols(tree.rootNode, symbols, imports, exports, filePath);
      } else {
        this.extractSymbolsWithRegex(content, symbols, imports, exports, filePath);
      }

      const loc = this.countLines(content);

      return {
        path: filePath,
        language: detectedLanguage,
        symbols,
        imports,
        exports,
        loc,
        content,
      };
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error);
      return {
        path: filePath,
        language: language || 'unknown',
        symbols: [],
        imports: [],
        exports: [],
        loc: 0,
      };
    }
  }

  private extractSymbols(
    node: TreeSitterNode,
    symbols: CodeSymbol[],
    imports: string[],
    exports: string[],
    filePath: string
  ): void {
    if (node.type === 'function_declaration' || node.type === 'function_definition') {
      const funcName = this.getChildText(node, 'name');
      if (funcName) {
        symbols.push({
          name: funcName,
          kind: 'function',
          filePath,
          line: node.startPosition.row,
        });
      }
    } else if (node.type === 'class_declaration' || node.type === 'class_definition') {
      const className = this.getChildText(node, 'name');
      if (className) {
        symbols.push({
          name: className,
          kind: 'class',
          filePath,
          line: node.startPosition.row,
        });
      }
    } else if (node.type === 'import_statement') {
      const importText = node.text;
      if (importText) {
        imports.push(importText);
      }
    } else if (node.type === 'export_statement' || node.type === 'export_declaration') {
      const exportText = node.text;
      if (exportText) {
        exports.push(exportText);
      }
    }

    if (node.children) {
      for (const child of node.children) {
        this.extractSymbols(child, symbols, imports, exports, filePath);
      }
    }
  }

  private extractSymbolsWithRegex(
    content: string,
    symbols: CodeSymbol[],
    imports: string[],
    exports: string[],
    filePath: string
  ): void {
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      const functionMatch = trimmedLine.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
      if (functionMatch && functionMatch[1]) {
        symbols.push({ name: functionMatch[1], kind: 'function', filePath, line: index });
      }

      const arrowFunctionMatch = trimmedLine.match(/^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/);
      if (arrowFunctionMatch && arrowFunctionMatch[1]) {
        symbols.push({ name: arrowFunctionMatch[1], kind: 'function', filePath, line: index });
      }

      const classMatch = trimmedLine.match(/^(?:export\s+)?class\s+(\w+)/);
      if (classMatch && classMatch[1]) {
        symbols.push({ name: classMatch[1], kind: 'class', filePath, line: index });
      }

      const importMatch = trimmedLine.match(/^import\s+.+?from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        imports.push(trimmedLine);
      }

      const exportMatch = trimmedLine.match(/^export\s+(?:const|let|class|function|interface|type)\s+(\w+)/);
      if (exportMatch) {
        exports.push(trimmedLine);
      }
    });
  }

  private getChildText(node: TreeSitterNode, fieldName: string): string | undefined {
    const child = node.childByFieldName(fieldName);
    return child?.text;
  }

  private detectLanguage(filePath: string): string {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'typescript';
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) return 'javascript';
    if (filePath.endsWith('.py')) return 'python';
    if (filePath.endsWith('.java')) return 'java';
    if (filePath.endsWith('.go')) return 'go';
    if (filePath.endsWith('.rs')) return 'rust';
    return '';
  }

  private countLines(content: string): number {
    return content.split('\n').filter(line => line.trim().length > 0).length;
  }
}
