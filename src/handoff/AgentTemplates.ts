import { AgentTemplate, AgentType, TemplateSection } from './types';
import * as path from 'path';
import * as fs from 'fs/promises';
import { AgentIntegration, TemplateVariables } from '../plugins/types';

const CURSOR_TEMPLATE = `# Development Task - {{epicTitle}}

## Context
{{#specs}}
### Spec: {{title}}
{{content}}
{{/specs}}

## Tasks
{{#tickets}}
### {{title}} ({{priority}})
{{content}}
{{/tickets}}

## Codebase Context
{{codebaseContext}}

## Instructions
Implement the tasks above following the specifications. Focus on {{#tickets}}{{title}}{{/tickets}} in order of priority.
`;

const CLAUDE_TEMPLATE = `# Project: {{epicTitle}}

<specifications>
{{#specs}}
## {{title}}
{{content}}
{{/specs}}
</specifications>

<tasks>
{{#tickets}}
### Task: {{title}}
Priority: {{priority}}
Estimated Effort: {{estimatedEffort}}

{{content}}
{{/tickets}}
</tasks>

<codebase_context>
{{codebaseContext}}
</codebase_context>

Please implement these tasks following the specifications provided.
`;

const WINDSURF_TEMPLATE = `# Epic: {{epicTitle}}

## Specifications
{{#specs}}
### {{title}}
{{content}}
{{/specs}}

## Implementation Tickets
{{#tickets}}
**[{{priority}}] {{title}}** ({{estimatedEffort}})
{{content}}
{{/tickets}}

## Codebase Overview
{{codebaseContext}}
`;

const CLINE_TEMPLATE = `# Task: {{epicTitle}}

## Specifications
{{#specs}}
{{content}}
{{/specs}}

## Tickets to Implement
{{#tickets}}
- **{{title}}** ({{priority}}, {{estimatedEffort}})
  {{content}}
{{/tickets}}

## Codebase Context
{{codebaseContext}}

Implement the tickets above in priority order.
`;

const AIDER_TEMPLATE = `# {{epicTitle}}

## Specs
{{#specs}}
{{content}}
{{/specs}}

## Tasks
{{#tickets}}
{{title}} ({{estimatedEffort}})
{{content}}
{{/tickets}}

## Files
{{#codebaseFiles}}
- {{path}} ({{language}}, {{loc}} lines)
{{/codebaseFiles}}
`;

const BUILTIN_TEMPLATES: Record<AgentType, AgentTemplate> = {
  cursor: {
    name: 'Cursor',
    agentType: 'cursor',
    template: CURSOR_TEMPLATE,
    description: 'Template optimized for Cursor AI editor',
    sections: [
      { name: 'Context', required: true, content: '{{#specs}}...{{/specs}}', order: 1 },
      { name: 'Tasks', required: true, content: '{{#tickets}}...{{/tickets}}', order: 2 },
      { name: 'Codebase Context', required: false, content: '{{codebaseContext}}', order: 3 },
      { name: 'Instructions', required: true, content: 'Implementation instructions', order: 4 }
    ]
  },
  claude: {
    name: 'Claude Projects',
    agentType: 'claude',
    template: CLAUDE_TEMPLATE,
    description: 'Template optimized for Claude Projects',
    sections: [
      { name: 'Specifications', required: true, content: '<specifications>...</specifications>', order: 1 },
      { name: 'Tasks', required: true, content: '<tasks>...</tasks>', order: 2 },
      { name: 'Codebase Context', required: false, content: '<codebase_context>...</codebase_context>', order: 3 }
    ]
  },
  windsurf: {
    name: 'Windsurf',
    agentType: 'windsurf',
    template: WINDSURF_TEMPLATE,
    description: 'Template optimized for Windsurf IDE',
    sections: [
      { name: 'Specifications', required: true, content: '## Specifications...', order: 1 },
      { name: 'Implementation Tickets', required: true, content: '## Implementation Tickets...', order: 2 },
      { name: 'Codebase Overview', required: false, content: '## Codebase Overview...', order: 3 }
    ]
  },
  cline: {
    name: 'Cline',
    agentType: 'cline',
    template: CLINE_TEMPLATE,
    description: 'Template optimized for Cline VS Code extension',
    sections: [
      { name: 'Specifications', required: true, content: '## Specifications...', order: 1 },
      { name: 'Tickets', required: true, content: '## Tickets to Implement...', order: 2 },
      { name: 'Codebase Context', required: false, content: '## Codebase Context...', order: 3 }
    ]
  },
  aider: {
    name: 'Aider',
    agentType: 'aider',
    template: AIDER_TEMPLATE,
    description: 'Template optimized for Aider CLI tool',
    sections: [
      { name: 'Specs', required: true, content: '## Specs...', order: 1 },
      { name: 'Tasks', required: true, content: '## Tasks...', order: 2 },
      { name: 'Files', required: false, content: '## Files...', order: 3 }
    ]
  },
  custom: {
    name: 'Custom',
    agentType: 'custom',
    template: CURSOR_TEMPLATE,
    description: 'Custom user-defined template',
    sections: []
  }
};

const customTemplates: Map<string, AgentTemplate> = new Map();
let pluginIntegrations: Map<string, AgentIntegration> = new Map();

export class AgentTemplates {
  static getTemplate(agentType: AgentType, workspaceRoot?: string): AgentTemplate {
    // Check for plugin integration first
    const pluginIntegration = pluginIntegrations.get(agentType);
    if (pluginIntegration) {
      return this.convertIntegrationToTemplate(pluginIntegration);
    }

    if (workspaceRoot) {
      const customTemplate = this.loadCustomTemplateSync(agentType, workspaceRoot);
      if (customTemplate) {
        return customTemplate;
      }
    }

    const template = BUILTIN_TEMPLATES[agentType];
    if (!template) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }
    return template;
  }

  static getAllTemplates(): AgentTemplate[] {
    const pluginTemplates = Array.from(pluginIntegrations.values()).map(integration =>
      this.convertIntegrationToTemplate(integration)
    );
    return [
      ...Object.values(BUILTIN_TEMPLATES),
      ...Array.from(customTemplates.values()),
      ...pluginTemplates
    ];
  }

  static registerCustomTemplate(template: AgentTemplate): void {
    if (!template.agentType) {
      throw new Error('Template must have an agentType');
    }
    if (!template.template) {
      throw new Error('Template must have a template string');
    }
    customTemplates.set(template.agentType, template);
  }

  static async saveCustomTemplate(agentType: AgentType, template: string, workspaceRoot: string): Promise<void> {
    const templatesDir = path.join(workspaceRoot, '.flowguard', 'templates');
    await fs.mkdir(templatesDir, { recursive: true });
    
    const templatePath = path.join(templatesDir, `${agentType}.md`);
    await fs.writeFile(templatePath, template, 'utf-8');
  }

  static async loadCustomTemplate(agentType: AgentType, workspaceRoot: string): Promise<string | null> {
    const templatePath = path.join(workspaceRoot, '.flowguard', 'templates', `${agentType}.md`);
    
    try {
      const content = await fs.readFile(templatePath, 'utf-8');
      return content;
    } catch (error) {
      return null;
    }
  }

  private static loadCustomTemplateSync(agentType: AgentType, workspaceRoot: string): AgentTemplate | null {
    const templatePath = path.join(workspaceRoot, '.flowguard', 'templates', `${agentType}.md`);
    
    try {
      const content = require('fs').readFileSync(templatePath, 'utf-8');
      return {
        name: `Custom ${agentType}`,
        agentType,
        template: content,
        description: `Custom template for ${agentType}`,
        sections: []
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Register plugin agent integrations
   */
  static setPluginIntegrations(integrations: AgentIntegration[]): void {
    pluginIntegrations.clear();
    for (const integration of integrations) {
      pluginIntegrations.set(integration.agentType, integration);
    }
  }

  /**
   * Get a plugin agent integration by type
   */
  static getPluginIntegration(agentType: string): AgentIntegration | undefined {
    return pluginIntegrations.get(agentType);
  }

  /**
   * Get all available agent types including plugin integrations
   */
  static getAllAgentTypes(): string[] {
    const builtinTypes = Object.keys(BUILTIN_TEMPLATES);
    const pluginTypes = Array.from(pluginIntegrations.keys());
    return [...builtinTypes, ...pluginTypes];
  }

  /**
   * Convert AgentIntegration to AgentTemplate
   */
  static convertIntegrationToTemplate(integration: AgentIntegration): AgentTemplate {
    return {
      name: integration.name,
      agentType: integration.agentType as AgentType,
      template: integration.template,
      description: `Plugin-provided template for ${integration.name}`,
      sections: [],
      preprocessor: integration.preprocessor as unknown as ((data: import('./types').TemplateVariables) => Promise<import('./types').TemplateVariables>) | undefined,
      postprocessor: integration.postprocessor
    };
  }
}
