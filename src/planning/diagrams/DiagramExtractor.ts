import { CodebaseContext, DependencyGraph, CodeSymbol } from '../codebase/types';
import { Component, Relationship, Interaction, ClassInfo } from './MermaidGenerator';

export class DiagramExtractor {
  extractArchitectureDiagram(context: CodebaseContext): { components: Component[]; relationships: Relationship[] } {
    const components: Component[] = [];
    const relationships: Relationship[] = [];
    const componentMap = new Map<string, Component>();

    const entryPoints = this.identifyEntryPoints(context.dependencies);
    
    entryPoints.forEach(filePath => {
      const component: Component = {
        id: filePath,
        label: this.getFileName(filePath),
        type: this.inferComponentType(filePath),
      };
      componentMap.set(filePath, component);
      components.push(component);
    });

    const majorModules = this.identifyMajorModules(context.files);
    majorModules.forEach(module => {
      if (!componentMap.has(module.path)) {
        const component: Component = {
          id: module.path,
          label: module.name,
          type: 'module',
        };
        componentMap.set(module.path, component);
        components.push(component);
      }
    });

    context.dependencies.edges.forEach(edge => {
      const sourceComp = componentMap.get(edge.from);
      const targetComp = componentMap.get(edge.to);

      if (sourceComp && targetComp && sourceComp.id !== targetComp.id) {
        relationships.push({
          from: sourceComp.id,
          to: targetComp.id,
          type: this.edgeTypeToRelationshipType(edge.type),
        });
      }
    });

    return { components, relationships };
  }

  extractSequenceDiagram(context: CodebaseContext, entryPoint: string): Interaction[] {
    const interactions: Interaction[] = [];
    const callGraph = this.buildCallGraph(context.dependencies);

    const entryNode = callGraph.nodes.find(n => n.id === entryPoint);
    if (!entryNode) return [];

    const visited = new Set<string>();
    let order = 0;

    const traverseCalls = (nodeId: string, depth: number): void => {
      if (depth > 5 || visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = callGraph.nodes.find(n => n.id === nodeId);
      if (!node) return;

      if (node.type === 'symbol' && node.metadata?.kind === 'function') {
        const callers = callGraph.edges.filter(e => e.to === nodeId);
        callers.forEach(caller => {
          if (caller.from !== nodeId) {
            interactions.push({
              from: caller.from,
              to: nodeId,
              message: this.getFunctionCallMessage(node),
              order: order++,
              type: 'request',
            });
          }
        });

        const callees = callGraph.edges.filter(e => e.from === nodeId);
        callees.forEach(callee => {
          if (callee.to !== nodeId && !visited.has(callee.to)) {
            const calleeNode = callGraph.nodes.find(n => n.id === callee.to);
            if (calleeNode?.type === 'symbol') {
              interactions.push({
                from: nodeId,
                to: callee.to,
                message: this.getFunctionCallMessage(calleeNode),
                order: order++,
                type: 'request',
              });
              traverseCalls(callee.to, depth + 1);
            }
          }
        });
      }
    };

    traverseCalls(entryPoint, 0);

    return interactions;
  }

  extractClassDiagram(context: CodebaseContext, namespace?: string): ClassInfo[] {
    const classSymbols = context.symbols.filter(s => 
      s.kind === 'class' || s.kind === 'interface'
    );

    const classInfos: ClassInfo[] = classSymbols.map(symbol => {
      const fileSummary = context.files.find(f => f.path === symbol.filePath);
      const relatedSymbols = fileSummary?.symbols.filter(s => 
        s.name !== symbol.name && 
        this.isRelatedClassMember(symbol.name, s.name)
      ) || [];

      return {
        name: symbol.name,
        properties: this.extractProperties(symbol, relatedSymbols),
        methods: this.extractMethods(symbol, relatedSymbols),
      };
    });

    this.addInheritance(context.dependencies, classInfos);

    if (namespace) {
      return classInfos.filter(c => c.name.startsWith(namespace));
    }

    return classInfos;
  }

  private identifyEntryPoints(graph: DependencyGraph): string[] {
    const incomingEdges = new Set<string>();
    graph.edges.forEach(edge => incomingEdges.add(edge.to));

    return graph.nodes
      .filter(node => node.type === 'file' && !incomingEdges.has(node.id))
      .map(n => n.id);
  }

  private identifyMajorModules(files: { path: string; exports: string[] }[]): { path: string; name: string }[] {
    const modules: { path: string; name: string }[] = [];

    files.forEach(file => {
      if (file.exports.length > 3 || file.path.includes('/src/')) {
        modules.push({
          path: file.path,
          name: this.getFileName(file.path),
        });
      }
    });

    return modules;
  }

  private inferComponentType(filePath: string): Component['type'] {
    if (filePath.includes('/ui/') || filePath.includes('/components/')) return 'frontend';
    if (filePath.includes('/api/') || filePath.includes('/routes/')) return 'api';
    if (filePath.includes('/db/') || filePath.includes('/models/')) return 'database';
    if (filePath.includes('/services/') || filePath.includes('/core/')) return 'backend';
    if (filePath.includes('/cache/')) return 'cache';
    if (filePath.includes('/queue/') || filePath.includes('/jobs/')) return 'queue';
    return 'module';
  }

  private edgeTypeToRelationshipType(edgeType: string): Relationship['type'] {
    const mapping: Record<string, Relationship['type']> = {
      imports: 'imports',
      calls: 'sync',
      extends: 'depends',
      implements: 'depends',
      uses: 'sync',
    };
    return mapping[edgeType] || 'imports';
  }

  private buildCallGraph(dependencies: DependencyGraph) {
    return dependencies;
  }

  private getFunctionCallMessage(node: { label: string; metadata?: Record<string, unknown> }): string {
    const kind = node.metadata?.kind as string | undefined;
    return kind === 'function' ? node.label : node.label;
  }

  private isRelatedClassMember(className: string, symbolName: string): boolean {
    return symbolName.toLowerCase().includes(className.toLowerCase()) ||
           className.toLowerCase().includes(symbolName.toLowerCase());
  }

  private extractProperties(symbol: CodeSymbol, relatedSymbols: CodeSymbol[]): ClassInfo['properties'] {
    return relatedSymbols
      .filter(s => s.kind === 'variable' || s.kind === 'constant')
      .map(s => ({
        name: s.name,
        type: 'unknown',
        visibility: s.visibility || 'public',
      }));
  }

  private extractMethods(symbol: CodeSymbol, relatedSymbols: CodeSymbol[]): ClassInfo['methods'] {
    return relatedSymbols
      .filter(s => s.kind === 'function')
      .map(s => ({
        name: s.name,
        params: [],
        returnType: 'unknown',
        visibility: s.visibility || 'public',
      }));
  }

  private addInheritance(dependencies: DependencyGraph, classInfos: ClassInfo[]): void {
    classInfos.forEach(cls => {
      dependencies.edges.forEach(edge => {
        if (edge.to.includes(cls.name)) {
          if (edge.type === 'extends') {
            cls.extends = edge.from.split('::').pop();
          } else if (edge.type === 'implements') {
            cls.implements = cls.implements || [];
            cls.implements.push(edge.from.split('::').pop() || '');
          }
        }
      });
    });
  }

  private getFileName(filePath: string): string {
    const parts = filePath.split('/');
    return parts[parts.length - 1] || filePath;
  }
}
