# Plugin Development Guide

This guide expands on the plugin development documentation, providing a comprehensive overview of how to create, test, and distribute FlowGuard plugins.

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

## Plugin Lifecycle

Understanding the plugin lifecycle is crucial for developing robust plugins.

### Activation

When a plugin is loaded, FlowGuard calls its `activate` method:

1. Plugin manifest is read and validated
2. Plugin entry point is loaded
3. `activate` method is called with a `PluginContext`
4. Plugin registers its contributions
5. Plugin is marked as active

### Deactivation

When a plugin is unloaded, FlowGuard calls its `deactivate` method:

1. Plugin is marked as inactive
2. `deactivate` method is called for cleanup
3. Plugin resources are released

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

## Plugin Manager Internals

Understanding how the plugin manager works can help you develop better plugins.

### Loading Process

1. Plugin directory is scanned
2. `plugin.json` is parsed and validated
3. Plugin entry point is loaded
4. Plugin is instantiated
5. Plugin is activated

### Security Validation

Plugins undergo security validation before loading:

1. Manifest validation
2. Entry point verification
3. Contribution validation
4. Sandbox restrictions (future feature)

## Testing Plugins

### Development Mode

1. Place your plugin in `.flowguard/plugins/`
2. Enable debug logging by setting `flowguard.general.logLevel` to `DEBUG`
3. Reload plugins using the `FlowGuard: Reload Plugin` command

### Unit Testing

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

### Integration Testing

1. Create test artifacts (specs, tickets)
2. Run plugin functionality against test data
3. Verify expected outcomes
4. Clean up test data

## Best Practices

### Error Handling

1. Wrap validation logic in try-catch blocks
2. Provide meaningful error messages
3. Log errors with appropriate detail
4. Fail gracefully when possible

### Performance

1. Keep validation fast; avoid expensive operations
2. Cache results when appropriate
3. Use streaming for large data processing
4. Limit memory usage

### Logging

1. Use `context.logger` for debugging
2. Log at appropriate levels (debug, info, warn, error)
3. Include contextual information in log messages
4. Avoid logging sensitive data

### Versioning

1. Follow semantic versioning
2. Document breaking changes
3. Maintain backward compatibility when possible
4. Test against multiple FlowGuard versions

### Documentation

1. Document your plugin's functionality
2. Provide usage examples
3. Document configuration options
4. Include troubleshooting information

## Security Considerations

### Plugin Security

1. Plugins have full access to the VS Code API
2. Review plugins before installing from external sources
3. Use the `trustedPlugins` configuration to whitelist known plugins
4. Consider code signing for production plugins

### Data Privacy

1. Minimize data collection
2. Clearly document data usage
3. Respect user privacy settings
4. Securely handle sensitive information

## Examples

See the `src/plugins/examples/` directory for complete examples:
- `security-plugin/` - Security vulnerability detection
- `minimal-plugin/` - Minimal plugin template
- `template-plugin/` - Custom template example

## Troubleshooting

### Plugin Not Loading

1. Check `plugin.json` syntax
2. Verify `main` entry point exists
3. Check FlowGuard output channel for errors
4. Ensure plugin ID is unique

### Registration Errors

1. Ensure IDs are unique
2. Check all required interface methods are implemented
3. Verify contribution types match expected interfaces
4. Check for typos in contribution declarations

### Rule Not Executing

1. Verify rule is enabled in settings
2. Check rule is registered during plugin activation
3. Ensure file types match rule filters
4. Check for errors in rule validation logic

## Publishing

To share your plugin:

1. Package your plugin directory
2. Share the archive or publish to a plugin registry (future feature)
3. Users install via `FlowGuard: Install Plugin` command
4. Document installation and usage instructions

## Advanced Topics

### Plugin Communication

Plugins can communicate with each other through:

1. Shared events using the event system
2. Shared storage using the storage API
3. Direct method calls (if plugins expose public APIs)

### Custom UI Components

Future versions of FlowGuard will support:

1. Custom sidebar views
2. Custom editor components
3. Custom webview panels
4. Custom command palettes

### Performance Optimization

1. Use web workers for CPU-intensive tasks
2. Implement lazy loading for large components
3. Cache expensive computations
4. Optimize memory usage patterns

## Next Steps

For detailed information about specific plugin features, see:

- [Custom Verification Rules Guide](custom-verification-rules.md)
- [LLM Integration Guide](llm-integration.md)
- [Custom Agents Guide](custom-agents.md)
- [Extending UI Guide](extending-ui.md)