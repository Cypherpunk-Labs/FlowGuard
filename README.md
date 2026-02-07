# FlowGuard - AI-Powered Development Workflow Manager

A VS Code extension for managing AI-assisted development workflows with epic/spec/ticket tracking.

## Features

- **Epic Management**: Organize large initiatives into epics with phases and deliverables
- **Spec Tracking**: Create and manage technical specifications with YAML frontmatter
- **Ticket System**: Track implementation tasks with priorities and assignments
- **Execution Handoffs**: Manage agent handoffs between different AI assistants
- **Verification Results**: Track code analysis and verification outcomes
- **Interactive Tutorials**: Learn FlowGuard through guided walkthroughs

## Quick Start

1. [Install FlowGuard](docs/getting-started/installation.md)
2. [Create your first epic](docs/getting-started/first-epic.md)
3. [Configure your preferences](docs/getting-started/configuration.md)
4. Follow the [interactive tutorial](docs/tutorials/)

## Documentation

Comprehensive documentation is available in the [docs](docs/) directory. Here's an overview of what you'll find:

### Getting Started
- [Installation Guide](docs/getting-started/installation.md) - How to install and set up FlowGuard
- [Creating Your First Epic](docs/getting-started/first-epic.md) - Step-by-step tutorial for your first epic
- [Configuration](docs/getting-started/configuration.md) - Configuring LLM providers, templates, and settings
- [Quick Reference](docs/getting-started/quick-reference.md) - Essential shortcuts and commands cheat sheet

### User Guides
Learn how to use FlowGuard's core features:
- [Creating Epics](docs/guides/creating-epics.md)
- [Specifications and Tickets](docs/guides/specs-and-tickets.md)
- [Agent Handoffs](docs/guides/handoff-workflow.md)
- [Verification Workflows](docs/guides/verification.md)
- [Template Customization](docs/guides/template-customization.md)
- [Codebase Exploration](docs/guides/codebase-exploration.md)

### Reference
Technical documentation for developers and advanced users:
- [Configuration Reference](docs/reference/configuration.md)
- [Keyboard Shortcuts](docs/reference/keyboard-shortcuts.md)
- [Command Reference](docs/reference/commands.md)
- [API Reference](docs/reference/api.md)
- [File Formats](docs/reference/file-formats.md)
- [Architecture](docs/reference/architecture.md)

### Advanced Topics
Extend FlowGuard with custom functionality:
- [Plugin Development](docs/advanced/plugin-development.md)
- [Custom Verification Rules](docs/advanced/custom-verification-rules.md)
- [LLM Integration](docs/advanced/llm-integration.md)
- [Custom Agents](docs/advanced/custom-agents.md)
- [Extending UI](docs/advanced/extending-ui.md)

### Tutorials
Interactive learning experiences:
- [First Epic Tutorial](docs/tutorials/) - Guided walkthrough for creating your first epic
- [Verification Tutorial](docs/tutorials/) - Learn the verification workflow

### Examples
Practical examples to get you started:
- [Epic Templates](docs/examples/epic-templates/)
- [Spec Templates](docs/examples/spec-templates/)
- [Ticket Templates](docs/examples/ticket-templates/)
- [Plugin Examples](docs/examples/plugin-examples/)
- [Handoff Examples](docs/examples/handoff-examples/)
- [Verification Examples](docs/examples/verification-examples/)

### Troubleshooting & Support
- [Troubleshooting Guide](docs/troubleshooting.md) - Solutions to common issues
- [FAQ](docs/faq.md) - Frequently asked questions
- [Testing Documentation](docs/testing.md) - How to test and validate documentation

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

## Contributing

We welcome contributions! See our [Contributing Guide](docs/CONTRIBUTING.md) for details on how to get started.

## Documentation Implementation

For details on the comprehensive documentation implementation, see our [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md).

## License

MIT
