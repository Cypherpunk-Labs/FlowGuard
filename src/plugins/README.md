# FlowGuard Plugin Development Guide

## Overview

FlowGuard's plugin system allows developers to extend the extension's functionality through custom verification rules, agent integrations, diagram types, and templates.

## Plugin Architecture

```
.flowguard/plugins/
├── my-plugin/
│   ├── plugin.json          # Plugin manifest
│   ├── index.js             # Entry point (compiled from TypeScript)
│   └── rules/
│       └── MyRule.js        # Custom rules
```

## Creating a Plugin

### 1. Plugin Structure

A FlowGuard plugin requires:

1. **plugin.json** - Manifest file defining plugin metadata
2. **index.js** (or index.ts) - Main entry point implementing the `FlowGuardPlugin` interface
3. Optional directories for rules, templates, etc.

### 2. Plugin Manifest (plugin.json)

```json
{
  "id": "mycompany.myplugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Description of what my plugin does",
  "author": "Your Name",
  "main": "index.js",
  "contributes": {
    "verificationRules": ["rule-id-1", "rule-id-2"],
    "agentIntegrations": ["my-agent"],
    "diagramTypes": ["my-diagram"],
    "templates": ["my-template"]
  },
  "engines": {
    "flowguard": "^0.1.0"
  }
}
```

**Required Fields:**
- `id` - Unique plugin identifier (alphanumeric, dots, hyphens)
- `name` - Display name
- `version` - Semantic version (x.x.x format)
- `description` - Plugin description
- `main` - Entry point file path

**Optional Fields:**
- `author` - Plugin author name
- `contributes` - Declares what the plugin provides
- `engines.flowguard` - Required FlowGuard version

### 3. Plugin Entry Point

```typescript
import { FlowGuardPlugin, PluginContext, VerificationRule } from 'flowguard/plugins/types';

export default class MyPlugin implements FlowGuardPlugin {
  id = 'mycompany.myplugin';
  name = 'My Plugin';
  version = '1.0.0';
  description = 'My custom plugin';

  async activate(context: PluginContext): Promise<void> {
    context.logger.info('MyPlugin activated');

    // Register a custom verification rule
    context.registerVerificationRule(new MyCustomRule());
  }

  async deactivate(): Promise<void> {
    // Cleanup if needed
  }
}
```

## Contribution Types

### Verification Rules

Create custom code analysis rules:

```typescript
import { VerificationRule, ValidationContext, VerificationIssue } from 'flowguard/plugins/types';
import { VerificationIssue } from 'flowguard/core/models/Verification';

class MyCustomRule implements VerificationRule {
  id = 'my-custom-rule';
  name = 'My Custom Rule';
  category = 'security';
  severity = 'High';
  enabled = true;

  async validate(context: ValidationContext): Promise<VerificationIssue[]> {
    const issues: VerificationIssue[] = [];
    const content = context.fileContent;

    // Your validation logic
    if (content.includes('bad-pattern')) {
      issues.push({
        id: 'issue-id',
        severity: this.severity,
        category: this.category,
        file: context.filePath,
        line: 1,
        message: 'Found bad pattern',
        suggestion: 'Use good-pattern instead'
      });
    }

    return issues;
  }
}
```

### Agent Integrations

Create custom handoff templates:

```typescript
import { AgentIntegration, TemplateVariables } from 'flowguard/plugins/types';

const myIntegration: AgentIntegration = {
  id: 'my-agent',
  name: 'My Agent',
  agentType: 'custom',
  template: `# Handoff to {{agentType}}

## Context
{{codebaseContext}}

## Tasks
{{tasks}}
`,
  async preprocessor(data: TemplateVariables): Promise<TemplateVariables> {
    // Modify data before template rendering
    return data;
  },
  async postprocessor(markdown: string): Promise<string> {
    // Modify output after template rendering
    return markdown;
  }
};
```

### Diagram Types

Create custom diagram generators:

```typescript
import { DiagramType, DiagramContext } from 'flowguard/plugins/types';

const myDiagramType: DiagramType = {
  id: 'my-diagram',
  name: 'My Diagram',
  fileExtension: 'txt',
  async generate(context: DiagramContext): Promise<string> {
    // Generate diagram content
    return `Diagram content for ${context.files.join(', ')}`;
  },
  async validate(diagram: string): Promise<boolean> {
    // Validate diagram syntax
    return diagram.length > 0;
  }
};
```

### Templates

Register custom templates:

```typescript
import { TemplateContribution } from 'flowguard/plugins/types';

const myTemplate: TemplateContribution = {
  id: 'my-template',
  name: 'My Template',
  type: 'spec',
  template: `# {{title}}

## Description
{{description}}
`,
  variables: [
    { name: 'title', description: 'Spec title', required: true },
    { name: 'description', description: 'Spec description', required: false }
  ]
};
```

## Plugin Context API

The `PluginContext` interface provides access to core services:

```typescript
interface PluginContext {
  // Core services
  storage: ArtifactStorage;
  llmProvider: LLMProvider;
  codebaseExplorer: CodebaseExplorer;
  
  // Paths
  workspaceRoot: string;
  extensionPath: string;
  
  // Registration methods
  registerVerificationRule(rule: VerificationRule): void;
  registerAgentIntegration(integration: AgentIntegration): void;
  registerDiagramType(type: DiagramType): void;
  registerTemplate(template: TemplateContribution): void;
  
  // Logging
  logger: PluginLogger;
}
```

## Testing Plugins

1. **Development Mode**: Place your plugin in `.flowguard/plugins/`
2. **Enable Debug Logging**: Set `flowguard.general.logLevel` to `DEBUG`
3. **Reload Plugin**: Use `FlowGuard: Reload Plugin` command

### Example Test

```typescript
// test/MyPlugin.test.ts
import { MyPlugin } from '../index';
import { PluginContext } from 'flowguard/plugins/types';

describe('MyPlugin', () => {
  it('should activate successfully', async () => {
    const plugin = new MyPlugin();
    const mockContext = createMockPluginContext();
    
    await expect(plugin.activate(mockContext)).resolves.not.toThrow();
  });
});
```

## Best Practices

1. **Error Handling**: Wrap validation logic in try-catch blocks
2. **Performance**: Keep validation fast; avoid expensive operations
3. **Logging**: Use `context.logger` for debugging
4. **Versioning**: Follow semantic versioning
5. **Documentation**: Document your plugin's functionality

## Security Considerations

- Plugins have full access to the VS Code API
- Review plugins before installing from external sources
- Use the `trustedPlugins` configuration to whitelist known plugins
- Consider code signing for production plugins

## Examples

See the `src/plugins/examples/` directory for complete examples:
- `security-plugin/` - Security vulnerability detection
- `minimal-plugin/` - Minimal plugin template
- `template-plugin/` - Custom template example

## Troubleshooting

**Plugin not loading:**
- Check `plugin.json` syntax
- Verify `main` entry point exists
- Check FlowGuard output channel for errors

**Registration errors:**
- Ensure IDs are unique
- Check all required interface methods are implemented

**Rule not executing:**
- Verify rule is enabled in settings
- Check rule is registered during plugin activation

## Publishing

To share your plugin:

1. Package your plugin directory
2. Share the archive or publish to a plugin registry (future feature)
3. Users install via `FlowGuard: Install Plugin` command

---

For more information, visit the FlowGuard documentation or submit issues on GitHub.
