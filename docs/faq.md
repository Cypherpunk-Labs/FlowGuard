# Frequently Asked Questions

This document answers common questions about FlowGuard.

## General Questions

### What is FlowGuard?

FlowGuard is a VS Code extension that helps manage AI-assisted development workflows. It provides tools for organizing work into epics, specifications, and tickets, generating agent handoffs, and verifying code changes.

### How does FlowGuard differ from other project management tools?

FlowGuard is specifically designed for AI-assisted development workflows. Unlike traditional project management tools, FlowGuard:
- Integrates directly with VS Code
- Generates structured handoffs for AI agents
- Provides code-aware verification and analysis
- Supports bidirectional linking between artifacts and code
- Focuses on technical specifications and implementation details

### Which AI agents are supported?

FlowGuard supports several popular AI agents:
- Cursor
- Claude (Anthropic)
- Windsurf
- Cline
- Aider

Additional agents can be supported through custom templates.

### Can I use FlowGuard without an LLM provider?

Yes, but with limited functionality. You can:
- Create and manage epics, specifications, and tickets
- Generate handoffs (without AI enhancement)
- Use basic verification rules
- Navigate and organize your work

However, AI-enhanced features like specification generation and intelligent handoffs require an LLM provider.

### Is my code sent to external servers?

Only if you're using cloud-based LLM providers. When using:
- **Cloud LLM providers** (OpenAI, Anthropic): Code snippets may be sent for analysis
- **Local LLM providers**: All processing happens locally
- **Verification features**: Code is analyzed locally by default

You can configure FlowGuard to minimize data sent to external services.

## Usage Questions

### How do I organize large projects with multiple epics?

For large projects, consider:
1. **Hierarchical Epics**: Create parent epics for major initiatives with child epics for specific features
2. **Phased Approach**: Use epic phases to organize work into logical milestones
3. **Cross-referencing**: Link related specifications and tickets across epics
4. **Tagging**: Use tags to categorize and filter artifacts

### Can I customize spec/ticket templates?

Yes, FlowGuard supports extensive template customization:
- Set a custom template directory in settings
- Create templates for different artifact types
- Use template variables for dynamic content
- Override default templates with custom versions

See the [Template Customization Guide](guides/template-customization.md) for details.

### How do I share epics with team members?

FlowGuard uses a Git-based workflow for collaboration:
1. **Version Control**: All FlowGuard artifacts are stored as files in your repository
2. **Branching**: Create branches for feature development
3. **Pull Requests**: Use PRs to review and merge changes
4. **Conflict Resolution**: Handle merge conflicts like any other file

Team members can clone the repository and open it in VS Code to access all FlowGuard data.

### Can I import existing specs/tickets?

Manual migration is currently supported:
1. **File Copy**: Copy existing documentation into FlowGuard's format
2. **Template Conversion**: Use templates to convert existing formats
3. **Bulk Import**: Create multiple artifacts using scripts (future feature)

See the [Migration Guide](#) (coming soon) for detailed instructions.

## Technical Questions

### Which programming languages are supported for codebase scanning?

FlowGuard supports multiple languages with varying levels of analysis:
- **Primary Support**: TypeScript, JavaScript, Python
- **Secondary Support**: Java, Go, Rust
- **Basic Support**: Any language through Tree-sitter parsing

Language support affects:
- Symbol extraction accuracy
- Dependency analysis quality
- Context generation for AI assistance

### Can I use multiple LLM providers?

Yes, you can switch between providers:
1. **Configuration**: Change `flowguard.llm.provider` in settings
2. **API Keys**: Store multiple keys using the secure storage system
3. **Per-Project**: Use different providers for different projects
4. **Fallback**: Configure fallback providers for reliability

### How are API keys stored?

API keys are stored securely using VS Code's SecretStorage API:
- **Encryption**: Keys are encrypted at rest
- **Isolation**: Keys are stored per workspace/user
- **Access Control**: Only FlowGuard can access stored keys
- **Cross-Platform**: Works on Windows, macOS, and Linux

### Can I run FlowGuard in remote workspaces?

Yes, with some limitations:
- **VS Code Remote**: Fully supported in SSH, Dev Container, and WSL
- **Performance**: May be slower due to network latency
- **File Access**: Requires proper file system permissions
- **LLM Integration**: Cloud providers work normally, local models need special configuration

## Plugin Questions

### How do I install third-party plugins?

Use the plugin management commands:
1. `FlowGuard: Install Plugin` - Install from a package or URL
2. `FlowGuard: List Plugins` - View installed plugins
3. `FlowGuard: Reload Plugin` - Reload a specific plugin
4. `FlowGuard: Uninstall Plugin` - Remove a plugin

Plugins are installed to the `.flowguard/plugins/` directory in your workspace.

### Are plugins sandboxed?

No, FlowGuard plugins have full access to:
- VS Code's extension API
- File system operations
- Network requests
- Workspace data

**Security Recommendations:**
- Only install plugins from trusted sources
- Review plugin code before installation
- Use the `trustedPlugins` configuration for known plugins
- Keep plugins updated

### Can I disable specific verification rules?

Yes, you can control verification rules:
1. **Global Disable**: Use `flowguard.verification.rules.disabled` setting
2. **Rule Configuration**: Adjust individual rule settings
3. **Plugin Management**: Disable entire plugins that contribute rules
4. **Severity Filtering**: Set `flowguard.verification.failOn` to control which issues block workflows

### How do I create custom verification rules?

Developers can create custom verification plugins:
1. **Plugin Structure**: Create a plugin with verification rules
2. **Rule Interface**: Implement the `VerificationRule` interface
3. **Registration**: Register rules during plugin activation
4. **Distribution**: Share plugins with your team

See the [Custom Verification Rules Guide](advanced/custom-verification-rules.md) for implementation details.

## Troubleshooting Questions

### Where can I find logs?

FlowGuard logs are available in:
1. **Output Panel**: Select "FlowGuard" from the output channel dropdown
2. **Log Files**: Check VS Code's log directory
3. **Developer Tools**: Access through `Help > Toggle Developer Tools`

### How do I report bugs?

To report bugs effectively:
1. **Check Issues**: Search existing issues on GitHub
2. **Gather Information**: Collect logs, error messages, and reproduction steps
3. **Create Issue**: Submit a detailed bug report with:
   - FlowGuard version
   - VS Code version
   - Operating system
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant logs

### How do I request features?

Feature requests are welcome:
1. **GitHub Issues**: Create an issue with the "enhancement" label
2. **Community Discord**: Discuss ideas with other users
3. **Email**: Contact the development team directly

Include:
- Clear description of the feature
- Use cases and benefits
- Any implementation ideas
- Priority level

## Performance Questions

### How can I improve FlowGuard's performance?

To optimize performance:
1. **Codebase Scanning**: Adjust scan limits and exclude patterns
2. **Caching**: Enable caching for repeated operations
3. **Workspace Organization**: Use smaller, focused workspaces
4. **Hardware**: Ensure adequate RAM and CPU for analysis
5. **Extensions**: Disable unused VS Code extensions

### What are the system requirements?

Minimum requirements:
- VS Code 1.70.0 or higher
- Node.js 16.0.0 or higher (for development)
- 4GB RAM minimum (8GB recommended)
- 100MB free disk space

Recommended specifications:
- VS Code 1.80.0 or higher
- Node.js 18.0.0 or higher
- 8GB RAM or more
- SSD storage for better performance

## Security Questions

### How does FlowGuard handle sensitive data?

Security measures include:
- **API Key Storage**: Encrypted storage using VS Code's SecretStorage
- **Data Minimization**: Only sends necessary data to external services
- **Local Processing**: Most analysis happens locally
- **Access Controls**: File system permissions and user authentication

### Can I audit FlowGuard's security?

Yes, FlowGuard is open source:
- **Source Code**: Available on GitHub for review
- **Dependency Scanning**: Regular security audits of dependencies
- **Third-party Plugins**: Review plugins before installation
- **Security Updates**: Regular updates for security patches

## Integration Questions

### Does FlowGuard integrate with CI/CD?

FlowGuard supports CI/CD integration:
- **GitHub Actions**: Use the FlowGuard verification action
- **GitLab CI**: Integrate verification into pipelines
- **Custom Scripts**: Use CLI tools for verification
- **Status Reporting**: Report verification status to CI systems

### Can FlowGuard work with issue trackers?

Integration with external issue trackers:
- **GitHub Issues**: Native integration through Git workflows
- **Jira**: Import/export through scripts (future feature)
- **Linear**: API integration (future feature)
- **Custom**: Build custom integrations using FlowGuard's API

## Future Development

### What features are planned?

Upcoming features include:
- **Enhanced Collaboration**: Real-time collaboration features
- **Advanced Analytics**: Project metrics and insights
- **Mobile App**: Companion app for progress tracking
- **AI Assistant**: Integrated AI assistant for FlowGuard
- **Enterprise Features**: Advanced security and administration

### How can I contribute?

Contributions are welcome:
1. **Code**: Submit pull requests for bug fixes and features
2. **Documentation**: Improve guides and tutorials
3. **Testing**: Report bugs and test new features
4. **Translation**: Help translate FlowGuard to other languages
5. **Community**: Answer questions and help other users

See the [Contributing Guide](CONTRIBUTING.md) for details.
