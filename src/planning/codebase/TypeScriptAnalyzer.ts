import * as ts from 'typescript';
import * as fs from 'fs';
import { FileSummary, CodeSymbol } from './types';

export class TypeScriptAnalyzer {
  private program: ts.Program | null = null;

  constructor() {}

  async analyzeFile(filePath: string): Promise<FileSummary> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      const symbols: CodeSymbol[] = [];
      const imports: string[] = [];
      const exports: string[] = [];

      this.visitNode(sourceFile, symbols, imports, exports, filePath);

      const loc = this.countLines(content);

      return {
        path: filePath,
        language: this.getLanguage(filePath),
        symbols,
        imports,
        exports,
        loc,
        content,
      };
    } catch (error) {
      console.error(`Error analyzing TypeScript file ${filePath}:`, error);
      return {
        path: filePath,
        language: 'typescript',
        symbols: [],
        imports: [],
        exports: [],
        loc: 0,
      };
    }
  }

  private visitNode(
    node: ts.Node,
    symbols: CodeSymbol[],
    imports: string[],
    exports: string[],
    filePath: string
  ): void {
    if (ts.isClassDeclaration(node)) {
      const classSymbol = this.extractClassSymbol(node, filePath);
      if (classSymbol) {
        symbols.push(classSymbol);
        this.visitClassMembers(node, symbols, filePath);
      }
    } else if (ts.isFunctionDeclaration(node)) {
      const funcSymbol = this.extractFunctionSymbol(node, filePath);
      if (funcSymbol) {
        symbols.push(funcSymbol);
      }
    } else if (ts.isInterfaceDeclaration(node)) {
      const interfaceSymbol = this.extractInterfaceSymbol(node, filePath);
      if (interfaceSymbol) {
        symbols.push(interfaceSymbol);
      }
    } else if (ts.isTypeAliasDeclaration(node)) {
      const typeSymbol = this.extractTypeSymbol(node, filePath);
      if (typeSymbol) {
        symbols.push(typeSymbol);
      }
    } else if (ts.isVariableStatement(node)) {
      this.extractVariableSymbols(node, symbols, filePath);
    } else if (ts.isEnumDeclaration(node)) {
      const enumSymbol = this.extractEnumSymbol(node, filePath);
      if (enumSymbol) {
        symbols.push(enumSymbol);
      }
    }

    ts.forEachChild(node, child =>
      this.visitNode(child, symbols, imports, exports, filePath)
    );
  }

  private visitClassMembers(node: ts.ClassDeclaration, symbols: CodeSymbol[], filePath: string): void {
    node.members.forEach(member => {
      if (ts.isMethodDeclaration(member) || ts.isPropertyDeclaration(member)) {
        const symbol = this.extractMemberSymbol(member, filePath);
        if (symbol) {
          symbols.push(symbol);
        }
      }
    });
  }

  private extractClassSymbol(node: ts.ClassDeclaration, filePath: string): CodeSymbol | null {
    const name = node.name?.getText();
    if (!name) return null;

    const documentation = this.extractDocumentation(node);

    return {
      name,
      kind: 'class',
      filePath,
      line: node.getStart(),
      documentation,
      visibility: this.getVisibility(node),
    };
  }

  private extractFunctionSymbol(node: ts.FunctionDeclaration, filePath: string): CodeSymbol | null {
    const name = node.name?.getText();
    if (!name) return null;

    const documentation = this.extractDocumentation(node);
    const signature = this.getFunctionSignature(node);

    return {
      name,
      kind: 'function',
      filePath,
      line: node.getStart(),
      documentation,
      signature,
      visibility: this.getVisibility(node),
    };
  }

  private extractInterfaceSymbol(node: ts.InterfaceDeclaration, filePath: string): CodeSymbol | null {
    const name = node.name.getText();
    const documentation = this.extractDocumentation(node);

    return {
      name,
      kind: 'interface',
      filePath,
      line: node.getStart(),
      documentation,
    };
  }

  private extractTypeSymbol(node: ts.TypeAliasDeclaration, filePath: string): CodeSymbol | null {
    const name = node.name.getText();
    const documentation = this.extractDocumentation(node);

    return {
      name,
      kind: 'type',
      filePath,
      line: node.getStart(),
      documentation,
    };
  }

  private extractVariableSymbols(node: ts.VariableStatement, symbols: CodeSymbol[], filePath: string): void {
    node.declarationList.declarations.forEach(declaration => {
      const name = declaration.name.getText();
      const documentation = this.extractDocumentation(declaration);
      const isConst = node.declarationList.flags & ts.NodeFlags.Const;

      symbols.push({
        name,
        kind: 'variable',
        filePath,
        line: declaration.getStart(),
        documentation,
        visibility: isConst ? 'public' : 'private',
      });
    });
  }

  private extractEnumSymbol(node: ts.EnumDeclaration, filePath: string): CodeSymbol | null {
    const name = node.name.getText();
    const documentation = this.extractDocumentation(node);

    return {
      name,
      kind: 'enum',
      filePath,
      line: node.getStart(),
      documentation,
    };
  }

  private extractMemberSymbol(node: ts.Node, filePath: string): CodeSymbol | null {
    const name = node.getFirstToken()?.getText();
    if (!name) return null;

    return {
      name,
      kind: ts.isMethodDeclaration(node) ? 'function' : 'variable',
      filePath,
      line: node.getStart(),
      visibility: this.getVisibility(node),
    };
  }

  private extractDocumentation(node: ts.Node): string {
    const fullText = node.getFullText();
    
    const commentRangesResult = (ts as unknown as { 
      getJSDocCommentRanges(node: ts.Node): ts.CommentRange[] | undefined 
    }).getJSDocCommentRanges(node);
    
    const commentRange = commentRangesResult?.[0];
    if (commentRange) {
      const comment = fullText.substring(
        commentRange.pos,
        commentRange.end
      );
      return comment.replace(/\/\*\*|\*\//g, '').trim();
    }
    
    return '';
  }

  private getFunctionSignature(node: ts.FunctionDeclaration): string {
    const params = node.parameters.map(p => 
      `${p.name.getText()}: ${p.type?.getText() || 'any'}`
    );
    const returnType = node.type?.getText() || 'void';
    return `(${params.join(', ')}): ${returnType}`;
  }

  private getVisibility(node: ts.Node): 'public' | 'private' | 'protected' {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    if (!modifiers) return 'public';
    
    for (const modifier of modifiers) {
      if (modifier.kind === ts.SyntaxKind.PrivateKeyword) return 'private';
      if (modifier.kind === ts.SyntaxKind.ProtectedKeyword) return 'protected';
    }
    return 'public';
  }

  private countLines(content: string): number {
    return content.split('\n').filter(line => line.trim().length > 0).length;
  }

  private getLanguage(filePath: string): string {
    if (filePath.endsWith('.tsx')) return 'typescriptreact';
    if (filePath.endsWith('.jsx')) return 'javascriptreact';
    if (filePath.endsWith('.ts')) return 'typescript';
    if (filePath.endsWith('.js')) return 'javascript';
    return 'unknown';
  }
}
