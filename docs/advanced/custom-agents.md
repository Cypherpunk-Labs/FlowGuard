# Custom Agents Guide

This guide explains how to create custom agent integrations for FlowGuard.

## Overview

FlowGuard supports integration with various AI agents through customizable templates and integration points.

## Agent Integration Interface

```typescript
interface AgentIntegration {
  id: string;
  name: string;
  agentType: string;
  template: string;
  async preprocessor(data: TemplateVariables): Promise<TemplateVariables>;
  async postprocessor(markdown: string): Promise<string>;
}
```

## Creating Custom Agents

### 1. Define Agent Template

```typescript
const myAgentTemplate = `
# {{task.title}}

## Description
{{task.description}}

## Requirements
{{#each task.requirements}}
- {{this}}
{{/each}}

## Acceptance Criteria
{{task.acceptanceCriteria}}

## Codebase Context
{{codebase.context}}

## Implementation Notes
- Focus on clean, maintainable code
- Follow existing patterns in the codebase
- Include comprehensive error handling
`;
```

### 2. Implement Integration

```typescript
import { AgentIntegration, TemplateVariables } from 'flowguard/plugins/types';

const myAgentIntegration: AgentIntegration = {
  id: 'my-custom-agent',
  name: 'My Custom Agent',
  agentType: 'custom',
  template: myAgentTemplate,
  async preprocessor(data: TemplateVariables): Promise<TemplateVariables> {
    // Modify data before template rendering
    return {
      ...data,
      customField: 'custom value'
    };
  },
  async postprocessor(markdown: string): Promise<string> {
    // Modify output after template rendering
    return markdown.replace(/\[PLACEHOLDER\]/g, 'actual value');
  }
};
```

## Template Variables

Available template variables include:

- `task.title` - Task title
- `task.description` - Task description
- `task.requirements` - Task requirements array
- `task.acceptanceCriteria` - Acceptance criteria
- `codebase.context` - Relevant codebase context
- `references.specs` - Related specifications
- `references.tickets` - Related tickets

## Registering Agents

Register custom agents in your plugin:

```typescript
import { FlowGuardPlugin, PluginContext } from 'flowguard/plugins/types';

export default class MyAgentPlugin implements FlowGuardPlugin {
  id = 'my-agent-plugin';
  name = 'My Agent Plugin';
  version = '1.0.0';
  description = 'Custom agent integration for FlowGuard';

  async activate(context: PluginContext): Promise<void> {
    context.registerAgentIntegration(myAgentIntegration);
  }

  async deactivate(): Promise<void> {
    // Cleanup if needed
  }
}
```

## Best Practices

1. Provide clear, actionable instructions in templates
2. Include relevant context to reduce hallucination
3. Structure templates for the specific agent's strengths
4. Test templates with actual agent interactions

## Next Steps

- [Plugin Development Guide](plugin-development.md)
- [LLM Integration Guide](llm-integration.md)
