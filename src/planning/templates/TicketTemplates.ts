import { Priority } from '../../core/models/Ticket';
import { TemplateContribution } from '../../plugins/types';

export type TicketType = 'feature' | 'bugfix' | 'refactor' | 'test' | 'documentation';

export interface TicketTemplateSection {
  name: string;
  required: boolean;
  placeholder: string;
  format: 'markdown' | 'checklist' | 'code' | 'numbered';
}

export interface TicketTemplate {
  type: TicketType;
  sections: TicketTemplateSection[];
  // Plugin template reference
  pluginTemplate?: TemplateContribution;
}

export interface TicketData {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  implementationSteps: string[];
  filesToChange: Array<{ path: string; description: string }>;
  estimatedEffort: string;
  priority: Priority;
  tags: string[];
  specId?: string;
  additionalContext?: Record<string, unknown>;
}

export class TicketTemplates {
  private templates: Map<TicketType, TicketTemplate>;
  private static pluginTemplates: Map<string, TemplateContribution> = new Map();

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  /**
   * Register plugin templates for tickets
   */
  static setPluginTemplates(templates: TemplateContribution[]): void {
    this.pluginTemplates.clear();
    // Filter templates for ticket type
    const ticketTemplates = templates.filter(t => t.type === 'ticket');
    
    for (const template of ticketTemplates) {
      // Validate no ID conflicts
      if (this.pluginTemplates.has(template.id)) {
        console.warn(`Duplicate plugin ticket template ID detected: ${template.id}`);
      }
      this.pluginTemplates.set(template.id, template);
    }
  }

  /**
   * Get all plugin ticket templates
   */
  static getPluginTemplates(): TemplateContribution[] {
    return Array.from(this.pluginTemplates.values());
  }

  private initializeTemplates(): void {
    this.templates.set('feature', {
      type: 'feature',
      sections: [
        {
          name: 'Description',
          required: true,
          placeholder: 'Describe the feature to be implemented...',
          format: 'markdown',
        },
        {
          name: 'Related Spec',
          required: true,
          placeholder: 'spec:{specId}',
          format: 'markdown',
        },
        {
          name: 'Acceptance Criteria',
          required: true,
          placeholder: '- [ ] User can...',
          format: 'checklist',
        },
        {
          name: 'Implementation Steps',
          required: true,
          placeholder: '1. Set up...\n2. Implement...\n3. Test...',
          format: 'numbered',
        },
        {
          name: 'Files to Change',
          required: true,
          placeholder: '`- `path/to/file` - description`',
          format: 'code',
        },
        {
          name: 'Testing Checklist',
          required: true,
          placeholder: '- [ ] Unit tests added/updated',
          format: 'checklist',
        },
      ],
    });

    this.templates.set('bugfix', {
      type: 'bugfix',
      sections: [
        {
          name: 'Description',
          required: true,
          placeholder: 'Describe the bug that needs to be fixed...',
          format: 'markdown',
        },
        {
          name: 'Related Spec',
          required: false,
          placeholder: 'spec:{specId}',
          format: 'markdown',
        },
        {
          name: 'Reproduction Steps',
          required: true,
          placeholder: '1. Navigate to...\n2. Click on...\n3. Observe error...',
          format: 'numbered',
        },
        {
          name: 'Expected Behavior',
          required: true,
          placeholder: 'Describe what should happen...',
          format: 'markdown',
        },
        {
          name: 'Actual Behavior',
          required: true,
          placeholder: 'Describe what actually happens...',
          format: 'markdown',
        },
        {
          name: 'Root Cause',
          required: false,
          placeholder: 'Analysis of why the bug occurs...',
          format: 'markdown',
        },
        {
          name: 'Fix Strategy',
          required: true,
          placeholder: 'Describe how the bug will be fixed...',
          format: 'markdown',
        },
        {
          name: 'Files to Change',
          required: true,
          placeholder: '`- `path/to/file` - description`',
          format: 'code',
        },
        {
          name: 'Testing Checklist',
          required: true,
          placeholder: '- [ ] Reproduction steps no longer trigger bug',
          format: 'checklist',
        },
      ],
    });

    this.templates.set('refactor', {
      type: 'refactor',
      sections: [
        {
          name: 'Description',
          required: true,
          placeholder: 'Describe the refactoring to be done...',
          format: 'markdown',
        },
        {
          name: 'Related Spec',
          required: false,
          placeholder: 'spec:{specId}',
          format: 'markdown',
        },
        {
          name: 'Motivation',
          required: true,
          placeholder: 'Why is this refactor needed? (performance, readability, etc.)',
          format: 'markdown',
        },
        {
          name: 'Before',
          required: true,
          placeholder: '```\nCode before refactor\n```',
          format: 'code',
        },
        {
          name: 'After',
          required: true,
          placeholder: '```\nCode after refactor\n```',
          format: 'code',
        },
        {
          name: 'Implementation Steps',
          required: true,
          placeholder: '1. Identify code to refactor\n2. Make changes\n3. Update tests',
          format: 'numbered',
        },
        {
          name: 'Files to Change',
          required: true,
          placeholder: '`- `path/to/file` - description`',
          format: 'code',
        },
        {
          name: 'Testing Checklist',
          required: true,
          placeholder: '- [ ] All existing tests pass',
          format: 'checklist',
        },
      ],
    });

    this.templates.set('test', {
      type: 'test',
      sections: [
        {
          name: 'Description',
          required: true,
          placeholder: 'Describe the test coverage to add/improve...',
          format: 'markdown',
        },
        {
          name: 'Related Spec',
          required: false,
          placeholder: 'spec:{specId}',
          format: 'markdown',
        },
        {
          name: 'Test Coverage Gap',
          required: true,
          placeholder: 'Describe what is currently not tested...',
          format: 'markdown',
        },
        {
          name: 'Test Cases',
          required: true,
          placeholder: '1. Test case 1\n2. Test case 2',
          format: 'numbered',
        },
        {
          name: 'Files to Change',
          required: true,
          placeholder: '`- `path/to/test` - description`',
          format: 'code',
        },
        {
          name: 'Testing Checklist',
          required: true,
          placeholder: '- [ ] New tests added\n- [ ] All tests pass',
          format: 'checklist',
        },
      ],
    });

    this.templates.set('documentation', {
      type: 'documentation',
      sections: [
        {
          name: 'Description',
          required: true,
          placeholder: 'Describe the documentation to update...',
          format: 'markdown',
        },
        {
          name: 'Related Spec',
          required: false,
          placeholder: 'spec:{specId}',
          format: 'markdown',
        },
        {
          name: 'Sections to Update',
          required: true,
          placeholder: 'List documentation sections that need updates...',
          format: 'markdown',
        },
        {
          name: 'Files to Change',
          required: true,
          placeholder: '`- `path/to/docs` - description`',
          format: 'code',
        },
        {
          name: 'Testing Checklist',
          required: true,
          placeholder: '- [ ] Documentation reviewed\n- [ ] Examples verified',
          format: 'checklist',
        },
      ],
    });
  }

  getTemplate(type: TicketType): TicketTemplate {
    // Check for plugin template first
    const pluginTemplate = TicketTemplates.pluginTemplates.get(type);
    if (pluginTemplate) {
      return {
        type,
        sections: [], // Plugin templates define their own structure
        pluginTemplate
      };
    }
    
    const template = this.templates.get(type);
    if (!template) {
      throw new Error(`Unknown ticket type: ${type}`);
    }
    return { ...template, sections: [...template.sections] };
  }

  applyTemplate(template: TicketTemplate, data: TicketData): string {
    // If this is a plugin template, use the plugin template content
    if (template.pluginTemplate) {
      // For now, we'll return a placeholder - in a real implementation,
      // we would need to render the plugin template with the provided data
      return `Plugin Template: ${template.pluginTemplate.name}\n\nTemplate content would be rendered here with the provided data.`;
    }
    
    let content = '';

    for (const section of template.sections) {
      content += `## ${section.name}\n\n`;

      switch (section.name) {
        case 'Description':
          content += `${data.description}\n\n`;
          break;

        case 'Related Spec':
          if (data.specId) {
            content += `Related Spec: [spec:${data.specId}]\n\n`;
          } else if (section.placeholder) {
            content += `${section.placeholder}\n\n`;
          }
          break;

        case 'Acceptance Criteria':
          if (data.acceptanceCriteria.length > 0) {
            data.acceptanceCriteria.forEach(criterion => {
              content += `- [ ] ${criterion}\n`;
            });
          } else {
            content += `${section.placeholder}\n`;
          }
          content += '\n';
          break;

        case 'Implementation Steps':
        case 'Reproduction Steps':
          if (data.implementationSteps.length > 0) {
            data.implementationSteps.forEach((step, index) => {
              content += `${index + 1}. ${step}\n`;
            });
          } else {
            content += `${section.placeholder}\n`;
          }
          content += '\n';
          break;

        case 'Files to Change':
          if (data.filesToChange.length > 0) {
            data.filesToChange.forEach(file => {
              content += `- \`${file.path}\` - ${file.description}\n`;
            });
          } else {
            content += `${section.placeholder}\n`;
          }
          content += '\n';
          break;

        case 'Testing Checklist':
          content += '- [ ] Unit tests added/updated\n';
          content += '- [ ] Integration tests pass\n';
          content += '- [ ] Manual testing completed\n\n';
          break;

        case 'Expected Behavior':
        case 'Actual Behavior':
        case 'Root Cause':
        case 'Fix Strategy':
        case 'Motivation':
        case 'Before':
        case 'After':
        case 'Test Coverage Gap':
        case 'Test Cases':
        case 'Sections to Update':
          content += `${section.placeholder}\n\n`;
          break;
      }
    }

    return content;
  }

  getAvailableTypes(): TicketType[] {
    const builtInTypes = Array.from(this.templates.keys());
    const pluginTypes = Array.from(TicketTemplates.pluginTemplates.keys()) as TicketType[];
    return [...builtInTypes, ...pluginTypes];
  }
}
