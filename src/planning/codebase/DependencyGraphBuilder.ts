import {
  FileSummary,
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
  CodeSymbol,
} from './types';

export class DependencyGraphBuilder {
  buildGraph(files: FileSummary[]): DependencyGraph {
    const nodes: DependencyNode[] = [];
    const edges: DependencyEdge[] = [];

    const fileNodeMap = new Map<string, DependencyNode>();

    files.forEach(file => {
      const fileNode: DependencyNode = {
        id: file.path,
        type: 'file',
        label: this.getFileName(file.path),
        metadata: { language: file.language, loc: file.loc },
      };
      nodes.push(fileNode);
      fileNodeMap.set(file.path, fileNode);

      file.exports.forEach((exportName, idx) => {
        const exportNode: DependencyNode = {
          id: `${file.path}::${exportName}`,
          type: 'symbol',
          label: exportName,
          metadata: { filePath: file.path, kind: 'export', index: idx },
        };
        nodes.push(exportNode);
        edges.push({
          from: file.path,
          to: exportNode.id,
          type: 'imports',
        });
      });
    });

    files.forEach(file => {
      file.imports.forEach(importStatement => {
        const targetFiles = this.resolveImport(importStatement, file.path, files);
        targetFiles.forEach(targetPath => {
          const sourceNode = fileNodeMap.get(file.path);
          const targetNode = fileNodeMap.get(targetPath);
          
          if (sourceNode && targetNode) {
            edges.push({
              from: sourceNode.id,
              to: targetNode.id,
              type: 'imports',
            });
          }
        });
      });

      file.symbols.forEach(symbol => {
        const containingFile = file.path;
        const symbolNode: DependencyNode = {
          id: `${containingFile}::${symbol.name}`,
          type: 'symbol',
          label: symbol.name,
          metadata: { filePath: containingFile, kind: symbol.kind, line: symbol.line },
        };

        const fileNode = fileNodeMap.get(containingFile);
        if (fileNode) {
          const existingSymbol = nodes.find(n => n.id === symbolNode.id);
          if (!existingSymbol) {
            nodes.push(symbolNode);
            edges.push({
              from: fileNode.id,
              to: symbolNode.id,
              type: 'uses',
            });
          }
        }
      });
    });

    return { nodes, edges };
  }

  private getFileName(filePath: string): string {
    const parts = filePath.split('/');
    return parts[parts.length - 1] || filePath;
  }

  private resolveImport(
    importStatement: string,
    fromFile: string,
    allFiles: FileSummary[]
  ): string[] {
    const matches = importStatement.match(/['"]([^'"]+)['"]/g);
    if (!matches) return [];

    return matches.map(match => {
      const importPath = match.slice(1, -1);
      return this.resolveFilePath(importPath, fromFile, allFiles);
    }).filter((path): path is string => path !== null);
  }

  private resolveFilePath(
    importPath: string,
    fromFile: string,
    allFiles: FileSummary[]
  ): string | null {
    if (importPath.startsWith('.')) {
      const baseDir = fromFile.substring(0, fromFile.lastIndexOf('/'));
      const resolvedPath = `${baseDir}/${importPath}`;
      const withExt = this.addExtension(resolvedPath);
      
      const exactMatch = allFiles.find(f => f.path === withExt);
      if (exactMatch) return withExt;

      const withoutExt = allFiles.find(f => 
        f.path.startsWith(resolvedPath) && 
        !f.path.substring(resolvedPath.length).includes('/')
      );
      if (withoutExt) return withoutExt.path;
    }

    const packageMatch = allFiles.find(f => 
      f.path.includes(`node_modules/${importPath}`) ||
      f.path.includes(`/node_modules/${importPath.split('/')[0]}/`)
    );
    if (packageMatch) return packageMatch.path;

    return null;
  }

  private addExtension(filePath: string): string {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.d.ts'];
    for (const ext of extensions) {
      if (filePath.endsWith(ext)) return filePath;
    }
    return `${filePath}.ts`;
  }

  detectCircularDependencies(graph: DependencyGraph): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (nodeId: string): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const outgoingEdges = graph.edges.filter(e => e.from === nodeId);
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.to)) {
          dfs(edge.to);
        } else if (recursionStack.has(edge.to)) {
          const cycleStart = path.indexOf(edge.to);
          cycles.push([...path.slice(cycleStart), edge.to]);
        }
      }

      path.pop();
      recursionStack.delete(nodeId);
    };

    graph.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    });

    return cycles;
  }

  getTopLevelModules(graph: DependencyGraph): DependencyNode[] {
    const incomingEdges = new Set<string>();
    graph.edges.forEach(edge => incomingEdges.add(edge.to));

    return graph.nodes.filter(node => 
      node.type === 'file' && !incomingEdges.has(node.id)
    );
  }

  getModuleDependencies(graph: DependencyGraph, modulePath: string): DependencyEdge[] {
    return graph.edges.filter(edge => 
      edge.from === modulePath || edge.to === modulePath
    );
  }

  getSymbolDependencies(graph: DependencyGraph, symbolPath: string): DependencyEdge[] {
    return graph.edges.filter(edge => 
      edge.from.includes(symbolPath) || edge.to.includes(symbolPath)
    );
  }

  findSymbolsByKind(graph: DependencyGraph, kind: string): DependencyNode[] {
    return graph.nodes.filter(node => 
      node.type === 'symbol' && 
      node.metadata?.kind === kind
    );
  }

  findSymbolsByName(graph: DependencyGraph, name: string): DependencyNode[] {
    return graph.nodes.filter(node => 
      node.type === 'symbol' && 
      node.label === name
    );
  }

  getFileDependencyDepth(graph: DependencyGraph, filePath: string): number {
    const incomingEdges = graph.edges.filter(e => e.to === filePath);
    if (incomingEdges.length === 0) return 0;

    const depths = incomingEdges.map(edge => {
      const sourceFile = edge.from;
      if (sourceFile === filePath) return 0;
      return 1 + this.getFileDependencyDepth(graph, sourceFile);
    });

    return depths.length > 0 ? Math.max(...depths) : 0;
  }
}
