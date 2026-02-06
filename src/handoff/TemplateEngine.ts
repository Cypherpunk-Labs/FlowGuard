import { TemplateVariables, TemplateNode } from './types';

export class TemplateEngine {
  render(template: string, variables: TemplateVariables): string {
    const nodes = this.parseTemplate(template);
    return nodes.map(node => this.evaluateNode(node, variables)).join('');
  }

  private parseTemplate(template: string): TemplateNode[] {
    const nodes: TemplateNode[] = [];
    // Match: {{#name}}, {{/name}}, {{name}}, {{#if condition}}
    const regex = /\{\{(#|\/)?([^}]*)\}\}/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(template)) !== null) {
      if (match.index > lastIndex) {
        nodes.push({
          type: 'text',
          content: template.slice(lastIndex, match.index)
        });
      }

      const tagType = match[1]; // '#' for section open, '/' for close, undefined for variable
      const tagContent = (match[2] || '').trim();

      if (!tagContent) {
        lastIndex = regex.lastIndex;
        continue;
      }

      if (tagType === '/') {
        // Closing tag - handled by parent parsing
        lastIndex = regex.lastIndex;
        continue;
      }

      if (tagType === '#') {
        // Section or conditional tag
        if (tagContent.startsWith('if ')) {
          // Conditional: {{#if condition}}
          const condition = tagContent.slice(3).trim();
          const endTag = '{{/if}}';
          const endIndex = template.indexOf(endTag, regex.lastIndex);
          
          if (endIndex === -1) {
            nodes.push({
              type: 'text',
              content: match[0]
            });
          } else {
            const innerContent = template.slice(regex.lastIndex, endIndex);
            const children = this.parseTemplate(innerContent);
            
            nodes.push({
              type: 'conditional',
              content: '',
              condition,
              children
            });
            
            regex.lastIndex = endIndex + endTag.length;
          }
        } else {
          // Section: {{#name}}
          const sectionName = tagContent;
          const endTag = `{{/${sectionName}}}`;
          const endIndex = template.indexOf(endTag, regex.lastIndex);
          
          if (endIndex === -1) {
            nodes.push({
              type: 'text',
              content: match[0]
            });
          } else {
            const innerContent = template.slice(regex.lastIndex, endIndex);
            const children = this.parseTemplate(innerContent);
            
            nodes.push({
              type: 'section',
              content: '',
              name: sectionName,
              children
            });
            
            regex.lastIndex = endIndex + endTag.length;
          }
        }
      } else {
        // Variable: {{name}}
        nodes.push({
          type: 'variable',
          content: '',
          name: tagContent
        });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < template.length) {
      nodes.push({
        type: 'text',
        content: template.slice(lastIndex)
      });
    }

    return nodes;
  }

  private evaluateNode(node: TemplateNode, context: any): string {
    switch (node.type) {
      case 'text':
        return node.content;

      case 'variable':
        if (!node.name) return '';
        const value = this.getValue(context, node.name);
        return value !== undefined ? String(value) : '';

      case 'section':
        if (!node.name || !node.children) return '';
        const sectionValue = this.getValue(context, node.name);
        
        if (Array.isArray(sectionValue)) {
          // Array iteration - each item gets full context + item properties
          return sectionValue.map(item => {
            const itemContext = { ...context, ...item };
            return node.children!.map(child => this.evaluateNode(child, itemContext)).join('');
          }).join('');
        } else if (sectionValue && typeof sectionValue === 'object') {
          // Object context switch
          const itemContext = { ...context, ...sectionValue };
          return node.children.map(child => this.evaluateNode(child, itemContext)).join('');
        } else if (sectionValue) {
          // Truthy value - render once with original context
          return node.children.map(child => this.evaluateNode(child, context)).join('');
        }
        // Falsy value - skip
        return '';

      case 'conditional':
        if (!node.condition || !node.children) return '';
        const conditionValue = this.getValue(context, node.condition);
        // Check if truthy (handles booleans, strings, numbers, objects, arrays)
        if (conditionValue && 
            (typeof conditionValue !== 'string' || conditionValue.length > 0)) {
          return node.children.map(child => this.evaluateNode(child, context)).join('');
        }
        return '';

      default:
        return '';
    }
  }

  private getValue(context: any, path: string): any {
    const parts = path.split('.');
    let value = context;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }

  validateTemplate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const openTags: { name: string; index: number; isIf: boolean }[] = [];
    // Match: {{#name}}, {{/name}}, {{name}}, {{#if condition}}
    const regex = /\{\{(#|\/)?([^}]*)\}\}/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(template)) !== null) {
      const tagType = match[1];
      const tagContent = (match[2] || '').trim();

      if (!tagContent) {
        continue;
      }

      if (tagType === '/') {
        // Closing tag
        const lastOpen = openTags.pop();
        const closeName = tagContent;
        
        if (!lastOpen) {
          errors.push(`Unmatched closing tag: ${match[0]} at position ${match.index}`);
        } else if (lastOpen.isIf && closeName !== 'if') {
          errors.push(`Expected {{/if}} but found ${match[0]} at position ${match.index}`);
        } else if (!lastOpen.isIf && lastOpen.name !== closeName) {
          errors.push(`Expected {{/${lastOpen.name}}} but found ${match[0]} at position ${match.index}`);
        }
      } else if (tagType === '#') {
        // Opening section or conditional
        if (tagContent.startsWith('if ')) {
          openTags.push({ 
            name: 'if', 
            index: match.index,
            isIf: true 
          });
        } else {
          openTags.push({ 
            name: tagContent, 
            index: match.index,
            isIf: false 
          });
        }
      }
      // Variable tags don't need validation for matching
    }

    while (openTags.length > 0) {
      const open = openTags.pop()!;
      if (open.isIf) {
        errors.push(`Unclosed tag: {{#if ...}} at position ${open.index}`);
      } else {
        errors.push(`Unclosed tag: {{#${open.name}}} at position ${open.index}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
