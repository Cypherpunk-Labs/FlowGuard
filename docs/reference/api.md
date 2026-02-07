# Plugin API Reference

This reference document provides detailed information about FlowGuard's plugin API, which allows developers to extend FlowGuard's functionality with custom plugins, verification rules, and integrations.

## Core Interfaces

### FlowGuardPlugin
The main interface that all FlowGuard plugins must implement.

```typescript
interface FlowGuardPlugin {
  // Unique identifier for the plugin
  id: string;
  
  // Human-readable name of the plugin
  name: string;
  
  // Plugin version
  version: string;
  
  // Brief description of the plugin's functionality
  description: string;
  
  // Called when the plugin is activated
  activate(context: PluginContext): Promise<void>;
  
  // Called when the plugin is deactivated
  deactivate(): Promise<void>;
  
  // Optional configuration schema
  configuration?: ConfigurationSchema;
}
```

### PluginContext
Provides context and services to plugins during activation.

```typescript
interface PluginContext {
  // Logger for the plugin
  logger: PluginLogger;
  
  // Configuration API
  config: ConfigurationAPI;
  
  // Storage API
  storage: StorageAPI;
  
  // Event system
  events: EventAPI;
  
  // Register verification rules
  registerVerificationRule(rule: VerificationRule): void;
  
  // Register agent templates
  registerAgentTemplate(template: AgentTemplate): void;
  
  // Register custom editors
  registerCustomEditor(editor: CustomEditor): void;
  
  // Register sidebar views
  registerSidebarView(view: SidebarView): void;
}
```

### VerificationRule
Interface for custom verification rules.

```typescript
interface VerificationRule {
  // Unique identifier for the rule
  id: string;
  
  // Human-readable name
  name: string;
  
  // Brief description of what the rule checks
  description: string;
  
  // Category of the rule (security, performance, style, etc.)
  category: string;
  
  // Default severity level
  defaultSeverity: 'critical' | 'high' | 'medium' | 'low';
  
  // Method to validate code against this rule
  validate(context: ValidationContext): Promise<ValidationResult[]>;
}
```

### AgentIntegration
Interface for integrating with external AI agents.

```typescript
interface AgentIntegration {
  // Unique identifier for the agent
  id: string;
  
  // Human-readable name
  name: string;
  
  // Supported file types
  supportedFileTypes: string[];
  
  // Method to send code to the agent
  sendRequest(request: AgentRequest): Promise<AgentResponse>;
  
  // Method to format code for this agent
  formatCode(code: string, options?: FormatOptions): string;
}
```

### DiagramType
Interface for custom diagram types.

```typescript
interface DiagramType {
  // Unique identifier for the diagram type
  id: string;
  
  // Human-readable name
  name: string;
  
  // File extensions this diagram supports
  extensions: string[];
  
  // Method to render the diagram
  render(data: DiagramData): Promise<string>;
  
  // Method to edit the diagram
  edit(data: DiagramData): Promise<DiagramData>;
}
```

### TemplateContribution
Interface for contributing custom templates.

```typescript
interface TemplateContribution {
  // Unique identifier for the template
  id: string;
  
  // Human-readable name
  name: string;
  
  // Template type (spec, ticket, handoff, etc.)
  type: string;
  
  // Template content
  content: string;
  
  // Variables used in the template
  variables: TemplateVariable[];
}
```

## Plugin Lifecycle

### Activation
When a plugin is loaded, FlowGuard calls its `activate` method:

```typescript
class MyPlugin implements FlowGuardPlugin {
  id = 'my-plugin';
  name = 'My Custom Plugin';
  version = '1.0.0';
  description = 'A custom plugin for FlowGuard';
  
  async activate(context: PluginContext): Promise<void> {
    // Register verification rules
    context.registerVerificationRule(new MyVerificationRule());
    
    // Register agent templates
    context.registerAgentTemplate(new MyAgentTemplate());
    
    // Subscribe to events
    context.events.on('spec:created', this.onSpecCreated.bind(this));
  }
  
  async deactivate(): Promise<void> {
    // Cleanup resources
  }
  
  private onSpecCreated(spec: Spec): void {
    // Handle spec creation event
  }
}
```

### Deactivation
When a plugin is unloaded, FlowGuard calls its `deactivate` method to allow for cleanup.

## Plugin Context APIs

### Logger
Provides logging capabilities for plugins:

```typescript
interface PluginLogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}
```

### Configuration API
Allows plugins to read and write configuration:

```typescript
interface ConfigurationAPI {
  // Get a configuration value
  get<T>(key: string, defaultValue?: T): T;
  
  // Set a configuration value
  set<T>(key: string, value: T): Promise<void>;
  
  // Watch for configuration changes
  watch<T>(key: string, callback: (newValue: T) => void): void;
}
```

### Storage API
Provides persistent storage for plugins:

```typescript
interface StorageAPI {
  // Get a value from storage
  get<T>(key: string): Promise<T | undefined>;
  
  // Set a value in storage
  set<T>(key: string, value: T): Promise<void>;
  
  // Delete a value from storage
  delete(key: string): Promise<void>;
}
```

### Event API
Allows plugins to subscribe to and emit events:

```typescript
interface EventAPI {
  // Subscribe to an event
  on(event: string, listener: Function): void;
  
  // Emit an event
  emit(event: string, ...args: any[]): void;
  
  // Remove an event listener
  off(event: string, listener: Function): void;
}
```

## Verification Rule Implementation

### ValidationContext
Provides context for validation rules:

```typescript
interface ValidationContext {
  // The code to validate
  code: string;
  
  // File path
  filePath: string;
  
  // File extension
  fileExtension: string;
  
  // Current configuration
  config: any;
  
  // Codebase context
  codebaseContext: CodebaseContext;
}
```

### ValidationResult
Represents the result of a validation:

```typescript
interface ValidationResult {
  // Unique identifier for this result
  id: string;
  
  // Location of the issue
  location: {
    startLine: number;
    endLine: number;
    startColumn?: number;
    endColumn?: number;
  };
  
  // Severity level
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  // Description of the issue
  message: string;
  
  // Suggested fix
  fix?: {
    description: string;
    code: string;
  };
  
  // Additional metadata
  metadata?: any;
}
```

## Example Plugin Implementation

```typescript
import { FlowGuardPlugin, PluginContext, VerificationRule, ValidationContext, ValidationResult } from 'flowguard-plugin-api';

class SecurityPlugin implements FlowGuardPlugin {
  id = 'security-plugin';
  name = 'Security Analysis Plugin';
  version = '1.0.0';
  description = 'Analyzes code for security vulnerabilities';
  
  async activate(context: PluginContext): Promise<void> {
    // Register verification rules
    context.registerVerificationRule(new HardcodedApiKeyRule());
    context.registerVerificationRule(new SqlInjectionRule());
    
    // Log activation
    context.logger.info('Security plugin activated');
  }
  
  async deactivate(): Promise<void> {
    // Cleanup if needed
  }
}

class HardcodedApiKeyRule implements VerificationRule {
  id = 'security.hardcoded-api-key';
  name = 'Hardcoded API Key Detection';
  description = 'Detects hardcoded API keys in source code';
  category = 'security';
  defaultSeverity = 'critical';
  
  async validate(context: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const apiKeyPattern = /['"](api_key|apikey|secret|password)['"]\s*[:=]\s*['"][^'"]+['"]/gi;
    let match;
    
    while ((match = apiKeyPattern.exec(context.code)) !== null) {
      results.push({
        id: `hardcoded-api-key-${match.index}`,
        location: {
          startLine: this.getLineNumber(context.code, match.index),
          endLine: this.getLineNumber(context.code, match.index + match[0].length)
        },
        severity: this.defaultSeverity,
        message: 'Hardcoded API key detected. Use environment variables instead.',
        fix: {
          description: 'Replace hardcoded value with environment variable',
          code: this.suggestFix(match[0])
        }
      });
    }
    
    return results;
  }
  
  private getLineNumber(code: string, index: number): number {
    return code.substring(0, index).split('\n').length;
  }
  
  private suggestFix(original: string): string {
    // Implementation for suggesting a fix
    return original.replace(/['"][^'"]+['"]$/, 'process.env.API_KEY');
  }
}

// Export the plugin
export default new SecurityPlugin();
```

## Plugin Registration

Plugins are registered by creating a `flowguard-plugin.json` file in the plugin's root directory:

```json
{
  "id": "security-plugin",
  "name": "Security Analysis Plugin",
  "version": "1.0.0",
  "description": "Analyzes code for security vulnerabilities",
  "main": "dist/index.js",
  "contributes": {
    "verificationRules": [
      "HardcodedApiKeyRule",
      "SqlInjectionRule"
    ],
    "agentTemplates": [
      "SecurityReviewTemplate"
    ]
  }
}
```

## Best Practices

### Plugin Development
- Keep plugins focused on a single purpose
- Handle errors gracefully
- Use the provided logging API
- Clean up resources in the deactivate method
- Follow TypeScript best practices

### Verification Rules
- Make rules configurable when possible
- Provide clear error messages
- Include suggested fixes when feasible
- Test rules with various code samples
- Document rule behavior and configuration

### Performance Considerations
- Avoid blocking operations in validation rules
- Use caching when appropriate
- Limit the scope of analysis when possible
- Provide progress feedback for long-running operations

## Next Steps

For detailed information about specific aspects of plugin development, see:

- [Plugin Development Guide](../advanced/plugin-development.md)
- [Custom Verification Rules Guide](../advanced/custom-verification-rules.md)
- [LLM Integration Guide](../advanced/llm-integration.md)
- [Custom Agents Guide](../advanced/custom-agents.md)