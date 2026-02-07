# Development Guide

This guide explains how to build, test, and debug the FlowGuard VS Code extension locally without publishing to the marketplace.

## Prerequisites

- **VS Code** (version 1.80.0 or higher)
- **Node.js** (version 16.0.0 or higher)
- **npm** or **yarn**

## Build Output Structure

After running `npm run compile`, the following artifacts are generated:

```text
out/
├── extension.js              # Main extension bundle (entry point)
├── extension.js.map          # Source map for debugging
├── webview/                  # Webview UI bundles
│   ├── sidebar.js
│   ├── specEditor.js
│   ├── ticketEditor.js
│   ├── verificationView.js
│   ├── executionView.js
│   └── sidebar.html
├── commands/                 # Compiled command modules
├── core/                     # Core modules
├── handoff/                  # Handoff system modules
├── llm/                      # LLM integration modules
├── planning/                 # Planning engine modules
├── ui/                       # UI modules
├── utils/                    # Utility modules
└── verification/             # Verification engine modules
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Compile the Extension

```bash
# Production build
npm run compile

# Development build with watch mode
npm run watch
```

### 3. Test the Extension

See the [Testing section](#testing) below for different testing methods.

## Local Testing Methods

### Method 1: Debug Mode (Recommended for Development)

The easiest way to test locally during development:

1. Open the project in VS Code
2. Press **F5** or go to Run → Start Debugging
3. A new **Extension Development Host** window opens with FlowGuard loaded

**How it works**: The `.vscode/launch.json` configuration uses `--extensionDevelopmentPath=${workspaceFolder}` which tells VS Code to load the extension directly from the source folder.

**Benefits**:

- No manual file copying required
- Changes are picked up on reload
- Full debugging support with breakpoints

**Reloading Changes**: Press `Cmd+R` (Mac) or `Ctrl+R` (Windows/Linux) in the Extension Development Host window to reload the extension after making changes.

### Method 2: VSIX Package Installation

For testing the packaged extension as users would install it:

**Build the VSIX package**:

```bash
npm run package
```

This creates `flowguard-0.1.0.vsix` in the project root.

**Install in VS Code**:

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Extensions: Install from VSIX"
3. Select the `flowguard-0.1.0.vsix` file
4. Restart VS Code when prompted

**Uninstall**:

- Go to Extensions view, find FlowGuard, and click Uninstall

### Method 3: Manual Extensions Directory

For CI/CD pipelines or automated testing:

**MacOS/Linux**:

```bash
# Copy to VS Code extensions directory
cp -r /path/to/flowguard ~/.vscode/extensions/mkemp.flowguard-0.1.0/
```

**Windows**:

```powershell
# Copy to %USERPROFILE%\.vscode\extensions\mkemp.flowguard-0.1.0\
```

**Required files**:

- `package.json` - Extension manifest
- `out/` directory - All compiled code
- `resources/` directory - Icons and assets
- `README.md`, `LICENSE` (optional but recommended)

## Testing

### Unit Tests

```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Integration Tests

```bash
# Compile test files first
npm run compile:tests

# Run integration tests
npm run test:integration
```

### End-to-End Tests

```bash
# Run E2E tests with Playwright
npm run test:e2e

# Run with UI for debugging
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

### Run All Tests

```bash
npm run test:all
```

## Development Workflow

### Watch Mode Development

For continuous development with automatic recompilation:

```bash
# Terminal 1: Start watch mode
npm run watch

# Terminal 2: Open VS Code and press F5 to debug
```

Make changes to source files → Extension recompiles automatically → Press `Cmd+R` in Extension Development Host to reload.

### Key Files VS Code Looks For

When loading the extension, VS Code reads:

1. `package.json` - Extension manifest defining:
   - Activation events (when the extension starts)
   - Commands, keybindings, and menus
   - Views and webview configurations
   - Settings and configuration schema

2. `package.json:main` - Entry point (set to `./out/extension.js`)

3. All referenced assets:
   - Icons from `resources/`
   - Webview files from `out/webview/`

### Extension Architecture

**Entry Point**: `out/extension.js` (compiled from `src/extension.ts`)

**Key Components**:

- **Commands** (`src/commands/`) - VS Code command implementations
- **Core** (`src/core/`) - Models, storage, configuration
- **Planning** (`src/planning/`) - Epic/spec/ticket management
- **Verification** (`src/verification/`) - Code analysis engine
- **Handoff** (`src/handoff/`) - Agent handoff generation
- **LLM** (`src/llm/`) - LLM provider integrations
- **UI** (`src/ui/`) - Webviews and custom editors

### Build Configuration

**Main Extension** (`webpack.config.js`):

- Target: Node.js (runs in VS Code extension host)
- Entry: `src/extension.ts`
- Output: `out/extension.js`
- Excludes `vscode` module (provided by VS Code)

**Webviews** (`webpack.webview.config.js`):

- Target: Web (runs in VS Code webview sandbox)
- Entries: sidebar, specEditor, ticketEditor, verificationView, executionView
- Output: `out/webview/[name].js`
- Includes Svelte compilation for UI components

## Debugging

### Using VS Code Debugger

1. Set breakpoints in source files (`src/`)
2. Press F5 to launch Extension Development Host
3. Trigger the code path you want to debug
4. VS Code debugger stops at breakpoints

### Extension Output Channel

View FlowGuard logs:

1. Open Output panel (`Cmd+Shift+U` or `Ctrl+Shift+U`)
2. Select "FlowGuard" from the dropdown
3. Adjust log level in settings: `flowguard.general.logLevel`

### Webview Developer Tools

Debug webview UI:

1. Open Command Palette (`Cmd+Shift+P`)
2. Type "Developer: Open Webview Developer Tools"
3. Select the FlowGuard webview to inspect

## Troubleshooting

### Extension Not Loading

- Check `package.json` for syntax errors
- Verify `out/extension.js` exists after compilation
- Check Output panel for extension host errors
- Ensure VS Code version meets minimum requirements (1.80.0+)

### Compilation Errors

```bash
# Clean and rebuild
rm -rf out/
npm run compile
```

### Webview Not Rendering

- Check `out/webview/` directory exists with compiled files
- Open Webview Developer Tools to see console errors
- Verify source maps are enabled for debugging

### Tests Failing

```bash
# Clean test output
rm -rf out/tests/

# Recompile tests
npm run compile:tests

# Run specific test suite
npm run test:unit
```

## Best Practices

1. **Always use Debug Mode (F5)** for development rather than installing the VSIX repeatedly
2. **Use watch mode** (`npm run watch`) to automatically recompile on changes
3. **Write tests** for new features (unit, integration, and/or E2E)
4. **Check the Output channel** for FlowGuard logs when debugging
5. **Reload the Extension Development Host** (`Cmd+R`) after making changes
6. **Use VS Code's debugger** with breakpoints instead of console.log

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Build production package: `npm run package`
4. Test the VSIX locally
5. Publish to marketplace (when ready)

## Related Documentation

- [Architecture Overview](reference/architecture.md)
- [API Reference](reference/api.md)
- [Testing Documentation](../tests/README.md)
- [Contributing Guide](CONTRIBUTING.md)
