# Configuration Guide

FlowGuard offers extensive configuration options to customize your development workflow. This guide covers the essential settings you'll need to configure for optimal use.

## LLM Provider Setup

FlowGuard supports multiple LLM providers for generating content and analysis. You can configure your preferred provider through settings.

### Supported Providers

1. **OpenAI** - GPT-4, GPT-3.5-turbo
2. **Anthropic** - Claude 3, Claude 2
3. **Local Models** - Ollama, LM Studio, and other local inference servers

### Setting Up Your Provider

1. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "FlowGuard"
3. Find the "LLM Provider" setting
4. Select your preferred provider from the dropdown
5. Use the "FlowGuard: Enter API Key" command to securely store your API key

### API Key Storage

API keys are stored securely using VS Code's SecretStorage API, ensuring they never appear in plain text in configuration files.

## Template Customization

FlowGuard uses templates to generate specifications, tickets, and agent handoffs. You can customize these templates to match your team's conventions.

### Default Agent Template

Configure which AI agent template to use by default:

1. Open VS Code Settings
2. Search for "FlowGuard Templates Default Agent"
3. Select from available templates (Cursor, Claude, Windsurf, Cline, Aider)

### Custom Templates

You can create custom templates by:

1. Setting a custom template directory in settings
2. Creating template files that follow the expected structure
3. Referencing your custom templates in the configuration

## Codebase Scanning Settings

FlowGuard can scan your codebase to provide context-aware suggestions and analysis.

### Max Files to Scan

Limit the number of files scanned to maintain performance:

```
flowguard.codebase.maxFilesToScan: 1000
```

### Exclude Patterns

Specify file patterns to exclude from scanning:

```
flowguard.codebase.exclude: ["node_modules/**", "*.log", "dist/**"]
```

## Configuration Examples

### Basic Configuration

```json
{
  "flowguard.llm.provider": "openai",
  "flowguard.codebase.maxFilesToScan": 500,
  "flowguard.templates.defaultAgent": "cursor"
}
```

### Advanced Configuration

```json
{
  "flowguard.llm.provider": "anthropic",
  "flowguard.codebase.maxFilesToScan": 2000,
  "flowguard.codebase.exclude": [
    "node_modules/**",
    "*.log",
    "dist/**",
    ".git/**"
  ],
  "flowguard.templates.customPath": "./flowguard-templates",
  "flowguard.templates.defaultAgent": "claude",
  "flowguard.editor.autoSave": true
}
```

## Configuration Validation

FlowGuard validates your configuration when the extension loads. If any settings are invalid, you'll see warnings in the Output panel.

## Environment Variables

You can also configure FlowGuard using environment variables:

- `FLOWGUARD_LLM_PROVIDER` - Sets the LLM provider
- `FLOWGUARD_API_KEY` - Sets the API key (not recommended for security)
- `FLOWGUARD_MAX_FILES` - Sets the maximum files to scan

For a complete reference of all configuration options, see the [Configuration Reference](../reference/configuration.md).