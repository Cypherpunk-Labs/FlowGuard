export interface Component {
  id: string;
  label: string;
  type: 'service' | 'database' | 'api' | 'frontend' | 'backend' | 'module' | 'cache' | 'queue';
  description?: string;
}

export interface Relationship {
  from: string;
  to: string;
  label?: string;
  type: 'sync' | 'async' | 'depends' | 'imports';
}

export interface Interaction {
  from: string;
  to: string;
  message: string;
  order: number;
  type?: 'request' | 'response' | 'notification';
  note?: string;
}

export interface FlowStep {
  id: string;
  label: string;
  type: 'process' | 'decision' | 'input' | 'output' | 'storage' | 'start' | 'end';
  nextSteps?: string[];
  condition?: string;
}

export interface ClassInfo {
  name: string;
  properties: Array<{ name: string; type: string; visibility: 'public' | 'private' | 'protected' }>;
  methods: Array<{ name: string; params: string[]; returnType: string; visibility: 'public' | 'private' | 'protected' }>;
  extends?: string;
  implements?: string[];
}

export interface DiagramContext {
  files: string[];
  context?: any;
}

export class MermaidGenerator {
  private static pluginDiagramTypes: Map<string, any> = new Map();

  /**
   * Register plugin diagram types
   */
  static setPluginDiagramTypes(types: any[]): void {
    this.pluginDiagramTypes.clear();
    for (const type of types) {
      this.pluginDiagramTypes.set(type.id, type);
    }
  }

  /**
   * Get all plugin diagram types
   */
  static getPluginDiagramTypes(): any[] {
    return Array.from(this.pluginDiagramTypes.values());
  }

  /**
   * Get supported diagram types (built-in + plugin)
   */
  static getSupportedDiagramTypes(): string[] {
    const builtInTypes = ['architecture', 'sequence', 'flow', 'class'];
    const pluginTypes = Array.from(this.pluginDiagramTypes.keys());
    return [...builtInTypes, ...pluginTypes];
  }

  /**
   * Generate diagram based on type
   */
  static async generateDiagram(type: string, context: DiagramContext): Promise<string> {
    // Check for plugin diagram type first
    const pluginType = this.pluginDiagramTypes.get(type);
    if (pluginType && pluginType.generate) {
      return await pluginType.generate(context);
    }

    // Fallback to built-in types
    switch (type) {
      case 'architecture':
        // This would need to be implemented based on the context
        return 'graph TD\n  A[Not Implemented] --> B[For Plugin Diagrams]';
      case 'sequence':
        // This would need to be implemented based on the context
        return 'sequenceDiagram\n  participant A\n  A->>B: Not Implemented';
      case 'flow':
        // This would need to be implemented based on the context
        return 'flowchart TD\n  A[Not Implemented] --> B[For Plugin Diagrams]';
      case 'class':
        // This would need to be implemented based on the context
        return 'classDiagram\n  class A';
      default:
        throw new Error(`Unsupported diagram type: ${type}`);
    }
  }
  
  generateArchitectureDiagram(components: Component[], relationships: Relationship[]): string {
    const lines: string[] = ['graph TD'];
    
    const classDefs: Record<string, { fill: string; stroke: string }> = {};

    components.forEach(comp => {
      const nodeDecl = this.getNodeDeclaration(comp.id, comp.label, comp.type);
      lines.push(`    ${nodeDecl}`);
      
      const className = this.getClassForType(comp.type);
      classDefs[className] = this.getStyleForType(comp.type);
    });

    lines.push('');

    relationships.forEach(rel => {
      const arrow = this.getArrowForType(rel.type);
      const label = rel.label ? `|${rel.label}|` : '';
      lines.push(`    ${this.escapeId(rel.from)}${arrow}${this.escapeId(rel.to)}${label}`);
    });

    lines.push('');

    Object.entries(classDefs).forEach(([className, style]) => {
      lines.push(`    classDef ${className} fill:${style.fill},stroke:${style.stroke}`);
    });

    lines.push('');

    components.forEach(comp => {
      const className = this.getClassForType(comp.type);
      lines.push(`    class ${this.escapeId(comp.id)} ${className}`);
    });

    return lines.join('\n');
  }

  private getNodeDeclaration(id: string, label: string, type: Component['type']): string {
    const escapedLabel = this.escapeLabel(label);
    const escapedId = this.escapeId(id);
    
    switch (type) {
      case 'database':
        return `${escapedId}[${escapedLabel}]`;
      case 'frontend':
        return `${escapedId}((${escapedLabel}))`;
      case 'backend':
        return `${escapedId}[[${escapedLabel}]]`;
      case 'api':
        return `${escapedId}[/${escapedLabel}/]`;
      case 'service':
        return `${escapedId}[(${escapedLabel})]`;
      case 'cache':
        return `${escapedId}{${escapedLabel}}`;
      case 'queue':
        return `${escapedId}>${escapedLabel}]`;
      default:
        return `${escapedId}[${escapedLabel}]`;
    }
  }

  private getStyleForType(type: Component['type']): { fill: string; stroke: string } {
    const styles: Record<Component['type'], { fill: string; stroke: string }> = {
      service: { fill: '#e1f5fe', stroke: '#0288d1' },
      database: { fill: '#fff3e0', stroke: '#f57c00' },
      api: { fill: '#f3e5f5', stroke: '#7b1fa2' },
      frontend: { fill: '#e8f5e9', stroke: '#388e3c' },
      backend: { fill: '#fff8e1', stroke: '#ffa000' },
      module: { fill: '#f5f5f5', stroke: '#757575' },
      cache: { fill: '#ffebee', stroke: '#d32f2f' },
      queue: { fill: '#fce4ec', stroke: '#c2185b' },
    };
    return styles[type] || { fill: '#ffffff', stroke: '#000000' };
  }

  generateSequenceDiagram(interactions: Interaction[]): string {
    const lines: string[] = ['sequenceDiagram'];

    const participants = new Set<string>();
    interactions.forEach(i => {
      participants.add(i.from);
      participants.add(i.to);
    });

    participants.forEach(p => {
      lines.push(`    participant ${p}`);
    });

    lines.push('');

    interactions.sort((a, b) => a.order - b.order).forEach(interaction => {
      const arrow = this.getSequenceArrow(interaction.type);
      const note = interaction.note ? ` Note: ${interaction.note}` : '';
      lines.push(`    ${interaction.from}${arrow}${interaction.to}: ${interaction.message}${note}`);
    });

    return lines.join('\n');
  }

  generateFlowDiagram(steps: FlowStep[]): string {
    const lines: string[] = ['flowchart TD'];

    steps.forEach(step => {
      const shape = this.getFlowShapeForType(step.type);
      const id = this.escapeId(step.id);
      const label = this.escapeLabel(step.label);
      lines.push(`    ${id}${shape}${label}`);
    });

    lines.push('');

    steps.forEach(step => {
      if (step.nextSteps) {
        step.nextSteps.forEach(nextStepId => {
          const condition = step.type === 'decision' ? `|${step.condition}|` : '';
          lines.push(`    ${this.escapeId(step.id)} -->${condition} ${this.escapeId(nextStepId)}`);
        });
      }
    });

    return lines.join('\n');
  }

  generateClassDiagram(classes: ClassInfo[]): string {
    const lines: string[] = ['classDiagram'];

    classes.forEach(cls => {
      lines.push(`    class ${cls.name} {`);
      cls.properties.forEach(prop => {
        lines.push(`      +${prop.visibility === 'public' ? '+' : prop.visibility === 'private' ? '-' : '#'} ${prop.name}: ${prop.type}`);
      });
      cls.methods.forEach(method => {
        const vis = method.visibility === 'public' ? '+' : method.visibility === 'private' ? '-' : '#';
        lines.push(`      ${vis} ${method.name}(${method.params.join(', ')}): ${method.returnType}`);
      });
      lines.push(`    }`);
    });

    lines.push('');

    classes.forEach(cls => {
      if (cls.extends) {
        lines.push(`    ${cls.extends} <|-- ${cls.name}`);
      }
      if (cls.implements && cls.implements.length > 0) {
        cls.implements.forEach(iface => {
          lines.push(`    ${iface} <|.. ${cls.name}`);
        });
      }
    });

    return lines.join('\n');
  }

  private getShapeForType(type: Component['type']): string {
    return '';
  }

  private getClassForType(type: Component['type']): string {
    const classNames: Record<Component['type'], string> = {
      service: 'service',
      database: 'database',
      api: 'api',
      frontend: 'frontend',
      backend: 'backend',
      module: 'module',
      cache: 'cache',
      queue: 'queue',
    };
    return classNames[type] || 'default';
  }

  private getArrowForType(type: Relationship['type']): string {
    const arrows: Record<Relationship['type'], string> = {
      sync: ' --> ',
      async: ' -.-> ',
      depends: ' ..> ',
      imports: ' --> ',
    };
    return arrows[type] || ' --> ';
  }

  private getSequenceArrow(type?: Interaction['type']): string {
    if (type === 'response') return '->>';
    if (type === 'notification') return '->';
    return '>>-';
  }

  private getFlowShapeForType(type: FlowStep['type']): string {
    const shapes: Record<FlowStep['type'], string> = {
      process: '[',
      decision: '{',
      input: '([',
      output: '])',
      storage: '[(]',
      start: '((',
      end: '))',
    };
    return shapes[type] || '[';
  }

  private escapeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9]/g, '_');
  }

  private escapeLabel(label: string): string {
    return `"${label.replace(/"/g, '\\"')}"`;
  }
}
