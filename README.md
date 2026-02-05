# FlowGuard - AI-Powered Development Workflow Manager

A VS Code extension for managing AI-assisted development workflows with epic/spec/ticket tracking.

## Features

- **Epic Management**: Organize large initiatives into epics with phases and deliverables
- **Spec Tracking**: Create and manage technical specifications with YAML frontmatter
- **Ticket System**: Track implementation tasks with priorities and assignments
- **Execution Handoffs**: Manage agent handoffs between different AI assistants
- **Verification Results**: Track code analysis and verification outcomes

## Installation

1. Open VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Extensions: Install from VSIX"
4. Select the compiled `.vsix` file

## Development

```bash
# Install dependencies
npm install

# Compile extension
npm run compile

# Watch mode for development
npm run watch

# Run tests
npm run test
```

## Architecture

See [docs/plan/1-foundation:-vs-code-extension-scaffold-&-core-models.md](docs/plan/1-foundation:-vs-code-extension-scaffold-&-core-models.md) for the full architecture documentation.

## License

MIT
