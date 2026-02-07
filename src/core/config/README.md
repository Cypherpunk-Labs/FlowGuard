# FlowGuard Configuration System

FlowGuard provides a comprehensive configuration system for managing all extension settings through VS Code's configuration API and secure storage for sensitive data like API keys.

## Architecture

The configuration system consists of the following components:

- **ConfigurationManager** - Centralized management of all configuration values with type safety, caching, and validation
- **SecureStorage** - Secure storage for API keys using VS Code's SecretStorage API
- **ConfigurationWatcher** - Automatic notification when configuration values change
- **Validators** - Validation functions for configuration values
- **UI Helpers** - Convenience functions for configuration-related UI interactions

## Configuration Schema

### LLM Settings (`flowguard.llm`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `provider` | `openai`, `anthropic`, `local` | `openai` | LLM provider to use |
| `model` | string | `gpt-4-turbo-preview` | Model name |
| `temperature` | number (0-2) | `0.7` | Temperature for LLM generation |
| `baseUrl` | string | - | Base URL for local LLM provider |
| `maxTokens` | number (100-128000) | `4096` | Maximum tokens for responses |
| `timeout` | number (5000-300000) | `60000` | Request timeout in milliseconds |
| `retryAttempts` | number (0-10) | `3` | Number of retry attempts |
| `streamResponses` | boolean | `false` | Enable streaming responses |

### Template Settings (`flowguard.templates`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `defaultAgent` | `cursor`, `claude`, `windsurf`, `cline`, `aider`, `custom` | `cursor` | Default agent template |
| `customPath` | string | - | Path to custom template directory |
| `includeCodebaseContext` | boolean | `true` | Include codebase context in templates |
| `maxCodebaseFiles` | number (10-500) | `50` | Maximum files in context |

### Editor Settings (`flowguard.editor`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `autoSave` | boolean | `true` | Auto-save edits in FlowGuard editors |
| `autoSaveDelay` | number (1000-300000) | `30000` | Delay before auto-saving |
| `enableDiagramPreview` | boolean | `true` | Enable diagram previews |

### Codebase Settings (`flowguard.codebase`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxFilesToScan` | number (100-10000) | `1000` | Maximum files to scan |
| `excludePatterns` | string[] | `['node_modules', 'dist', 'build', '.git', '.flowguard']` | Exclude glob patterns |
| `includePatterns` | string[] | `['**/*.ts', '**/*.js', '**/*.py', ...]` | Include glob patterns |
| `enableIncrementalScan` | boolean | `true` | Enable incremental scanning |

### Verification Settings (`flowguard.verification`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `autoVerifyOnSave` | boolean | `false` | Auto-verify on file save |
| `minimumSeverity` | `Critical`, `High`, `Medium`, `Low` | `Medium` | Minimum severity to report |
| `enableAutoFix` | boolean | `false` | Enable automatic fixing |

### Telemetry Settings (`flowguard.telemetry`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable anonymous telemetry |
| `includeErrorReports` | boolean | `false` | Include error stack traces |

### General Settings (`flowguard.general`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `logLevel` | `DEBUG`, `INFO`, `WARN`, `ERROR` | `INFO` | Log level |
| `showWelcomeOnStartup` | boolean | `true` | Show welcome message |

## Usage

### Getting Configuration Values

```typescript
import { configurationManager } from './core/config/ConfigurationManager';

// Get specific configuration section
const llmConfig = configurationManager.getLLMConfig();
const editorConfig = configurationManager.getEditorConfig();

// Get individual values
const logLevel = configurationManager.get<string>('general', 'logLevel');
const maxTokens = configurationManager.get<number>('llm', 'maxTokens');

// Get all configuration
const allConfig = configurationManager.getAll();
```

### Setting Configuration Values

```typescript
// Set individual values
await configurationManager.set('llm', 'maxTokens', 8192);
await configurationManager.set('general', 'logLevel', 'DEBUG');
```

### Listening for Changes

```typescript
const disposable = configurationManager.onDidChangeConfiguration(
  (event) => {
    console.log(`Section ${event.section} changed`);
  },
  'llm' // Optional: filter by section
);
```

### Validating Configuration

```typescript
const result = configurationManager.validate({
  llm: {
    maxTokens: 200000, // Invalid: exceeds maximum
    timeout: 5000000   // Invalid: exceeds maximum
  }
});

if (!result.valid) {
  console.log('Errors:', result.errors);
}
```

### Secure Storage for API Keys

```typescript
import { secureStorage } from './core/config/SecureStorage';

// Store API key
await secureStorage.storeApiKey('openai', 'sk-...');

// Retrieve API key
const apiKey = await secureStorage.getApiKey('openai');

// Check if key exists
const hasKey = await secureStorage.hasApiKey('openai');

// Delete API key
await secureStorage.deleteApiKey('openai');
```

### Configuration Watchers

```typescript
import { configurationWatcher } from './core/config/ConfigurationWatcher';

// Register a watcher for configuration changes
configurationWatcher.registerWatcher(
  'general',
  'logLevel',
  (newValue, oldValue) => {
    console.log(`Log level changed from ${oldValue} to ${newValue}`);
  }
);
```

### Environment Variable Overrides

The following environment variables can be used to override configuration settings:

| Environment Variable | Description |
|----------------------|-------------|
| `FLOWGUARD_LLM_PROVIDER` | Override LLM provider |
| `OPENAI_API_KEY` | OpenAI API key (auto-detected) |
| `ANTHROPIC_API_KEY` | Anthropic API key (auto-detected) |

## Migration

When upgrading from older versions, configuration migrations are automatically applied:

- Legacy `flowguard.apiKey` is migrated to provider-specific keys
- Old template paths are converted to new format
- Log levels are normalized to new format

## Best Practices

1. **Use ConfigurationManager instead of direct `vscode.workspace.getConfiguration()`** - Provides type safety and caching
2. **Store API keys in SecureStorage** - Never store in workspace settings
3. **Subscribe to configuration changes** - Use ConfigurationWatcher to react to changes
4. **Validate before setting** - Use validation functions to catch errors early
5. **Use appropriate scopes** - Use workspace settings for team settings, user settings for personal preferences
