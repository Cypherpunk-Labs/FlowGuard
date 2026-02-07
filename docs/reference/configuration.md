# Configuration Reference

This reference document provides a comprehensive overview of all FlowGuard configuration options. These settings can be configured through VS Code settings or environment variables.

## Configuration Methods

### VS Code Settings

Access FlowGuard settings through:
1. VS Code Settings UI (`Ctrl+,` or `Cmd+,`)
2. Search for "FlowGuard"
3. Modify settings in the UI or in `settings.json`

### settings.json Example

```json
{
  "flowguard.llm.provider": "openai",
  "flowguard.codebase.maxFilesToScan": 1000,
  "flowguard.templates.defaultAgent": "cursor"
}
```

### Environment Variables

Configuration can also be set using environment variables:

```bash
export FLOWGUARD_LLM_PROVIDER=openai
export FLOWGUARD_API_KEY=your-api-key
export FLOWGUARD_MAX_FILES=1000
```

## LLM Provider Configuration

### flowguard.llm.provider
- **Type**: string
- **Default**: "openai"
- **Description**: The LLM provider to use for AI assistance
- **Options**: "openai", "anthropic", "local"
- **Environment Variable**: FLOWGUARD_LLM_PROVIDER

### flowguard.llm.model
- **Type**: string
- **Default**: "gpt-4" (for OpenAI), "claude-3-opus" (for Anthropic)
- **Description**: The specific model to use
- **Environment Variable**: FLOWGUARD_LLM_MODEL

### flowguard.llm.temperature
- **Type**: number
- **Default**: 0.7
- **Description**: Sampling temperature for LLM responses (0.0 to 1.0)
- **Environment Variable**: FLOWGUARD_LLM_TEMPERATURE

### flowguard.llm.maxTokens
- **Type**: number
- **Default**: 2048
- **Description**: Maximum tokens for LLM responses
- **Environment Variable**: FLOWGUARD_LLM_MAX_TOKENS

## Codebase Scanning Configuration

### flowguard.codebase.maxFilesToScan
- **Type**: number
- **Default**: 1000
- **Description**: Maximum number of files to scan during codebase analysis
- **Environment Variable**: FLOWGUARD_MAX_FILES

### flowguard.codebase.include
- **Type**: array of strings
- **Default**: ["src/**/*"]
- **Description**: File patterns to include in codebase scanning
- **Example**: ["src/**/*", "lib/**/*"]

### flowguard.codebase.exclude
- **Type**: array of strings
- **Default**: ["node_modules/**", "*.log", "dist/**"]
- **Description**: File patterns to exclude from codebase scanning
- **Example**: ["node_modules/**", "*.log", "dist/**", ".git/**"]

### flowguard.codebase.scanConcurrency
- **Type**: number
- **Default**: 4
- **Description**: Number of concurrent files to scan
- **Environment Variable**: FLOWGUARD_SCAN_CONCURRENCY

### flowguard.codebase.scanTimeout
- **Type**: number
- **Default**: 30000
- **Description**: Timeout for individual file scanning in milliseconds
- **Environment Variable**: FLOWGUARD_SCAN_TIMEOUT

## Template Configuration

### flowguard.templates.customPath
- **Type**: string
- **Default**: null
- **Description**: Path to custom template directory
- **Example**: "./flowguard-templates"

### flowguard.templates.defaultAgent
- **Type**: string
- **Default**: "cursor"
- **Description**: Default agent template for handoffs
- **Options**: "cursor", "claude", "windsurf", "cline", "aider"

### flowguard.templates.specDefault
- **Type**: string
- **Default**: "default"
- **Description**: Default template for new specifications

### flowguard.templates.ticketDefault
- **Type**: string
- **Default**: "default"
- **Description**: Default template for new tickets

## Editor Configuration

### flowguard.editor.autoSave
- **Type**: boolean
- **Default**: true
- **Description**: Automatically save FlowGuard artifacts
- **Environment Variable**: FLOWGUARD_AUTO_SAVE

### flowguard.editor.previewMode
- **Type**: boolean
- **Default**: true
- **Description**: Show preview panel in editors

### flowguard.editor.wordWrap
- **Type**: string
- **Default**: "on"
- **Description**: Word wrapping in editors
- **Options**: "on", "off", "wordWrapColumn", "bounded"

## Verification Configuration

### flowguard.verification.enabled
- **Type**: boolean
- **Default**: true
- **Description**: Enable verification features

### flowguard.verification.autoRun
- **Type**: boolean
- **Default**: false
- **Description**: Automatically run verification on file save

### flowguard.verification.failOn
- **Type**: string
- **Default**: "critical"
- **Description**: Severity level that causes verification to fail
- **Options**: "critical", "high", "medium", "low", "none"

### flowguard.verification.rules.disabled
- **Type**: array of strings
- **Default**: []
- **Description**: Verification rules to disable
- **Example**: ["style.line-length", "naming.variable-camel-case"]

## General Configuration

### flowguard.general.logLevel
- **Type**: string
- **Default**: "info"
- **Description**: Logging verbosity level
- **Options**: "error", "warn", "info", "debug"
- **Environment Variable**: FLOWGUARD_LOG_LEVEL

### flowguard.general.showWelcome
- **Type**: boolean
- **Default**: true
- **Description**: Show welcome screen on startup

### flowguard.general.autoCheckUpdates
- **Type**: boolean
- **Default**: true
- **Description**: Automatically check for updates

## Configuration Migration

FlowGuard automatically migrates configuration from older versions. Migration logs can be viewed in the Output panel under "FlowGuard".

### Manual Migration

To manually migrate configuration:

1. Open the Command Palette
2. Run "FlowGuard: Migrate Configuration"
3. Review the migration report in the Output panel

## Configuration Validation

FlowGuard validates configuration on startup and when settings change:

### Validation Rules

- Required fields must be present
- Values must be of correct type
- Enum values must be from allowed options
- File paths must be accessible

### Validation Errors

Validation errors are displayed in:
- VS Code notifications
- Output panel under "FlowGuard"
- Settings UI warnings

## Example Configuration Files

### Minimal Configuration
```json
{
  "flowguard.llm.provider": "openai",
  "flowguard.codebase.maxFilesToScan": 500
}
```

### Complete Configuration
```json
{
  "flowguard.llm.provider": "anthropic",
  "flowguard.llm.model": "claude-3-opus",
  "flowguard.llm.temperature": 0.7,
  "flowguard.llm.maxTokens": 2048,
  "flowguard.codebase.maxFilesToScan": 2000,
  "flowguard.codebase.include": [
    "src/**/*",
    "lib/**/*"
  ],
  "flowguard.codebase.exclude": [
    "node_modules/**",
    "*.log",
    "dist/**",
    ".git/**"
  ],
  "flowguard.codebase.scanConcurrency": 4,
  "flowguard.codebase.scanTimeout": 30000,
  "flowguard.templates.customPath": "./flowguard-templates",
  "flowguard.templates.defaultAgent": "claude",
  "flowguard.templates.specDefault": "feature",
  "flowguard.templates.ticketDefault": "feature",
  "flowguard.editor.autoSave": true,
  "flowguard.editor.previewMode": true,
  "flowguard.editor.wordWrap": "on",
  "flowguard.verification.enabled": true,
  "flowguard.verification.autoRun": false,
  "flowguard.verification.failOn": "high",
  "flowguard.verification.rules.disabled": [
    "style.line-length"
  ],
  "flowguard.general.logLevel": "info",
  "flowguard.general.showWelcome": true,
  "flowguard.general.autoCheckUpdates": true
}
```

## Environment Variable Mapping

| Configuration Key | Environment Variable |
|-------------------|---------------------|
| flowguard.llm.provider | FLOWGUARD_LLM_PROVIDER |
| flowguard.llm.model | FLOWGUARD_LLM_MODEL |
| flowguard.llm.temperature | FLOWGUARD_LLM_TEMPERATURE |
| flowguard.llm.maxTokens | FLOWGUARD_LLM_MAX_TOKENS |
| flowguard.codebase.maxFilesToScan | FLOWGUARD_MAX_FILES |
| flowguard.codebase.scanConcurrency | FLOWGUARD_SCAN_CONCURRENCY |
| flowguard.codebase.scanTimeout | FLOWGUARD_SCAN_TIMEOUT |
| flowguard.editor.autoSave | FLOWGUARD_AUTO_SAVE |
| flowguard.general.logLevel | FLOWGUARD_LOG_LEVEL |

## Troubleshooting Configuration

### Configuration Not Applied

- Restart VS Code after changing settings
- Check for syntax errors in settings.json
- Verify environment variables are set correctly
- Check the Output panel for configuration load errors

### Invalid Configuration Values

- Review validation error messages
- Check that values match expected types
- Verify enum values are from allowed options
- Ensure file paths are accessible

### Performance Issues

- Reduce maxFilesToScan for large projects
- Adjust scanConcurrency based on system resources
- Add more specific exclude patterns
- Increase scanTimeout if needed

## Next Steps

For detailed information about specific configuration areas, see:

- [LLM Integration Guide](../advanced/llm-integration.md) for LLM provider configuration
- [Codebase Exploration Guide](../guides/codebase-exploration.md) for scanning settings
- [Template Customization Guide](../guides/template-customization.md) for template settings
- [Verification Guide](../guides/verification.md) for verification settings