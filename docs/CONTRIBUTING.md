# Contributing to FlowGuard

Thank you for your interest in contributing to FlowGuard!

## Code Contributions

For setting up your development environment, building, testing, and debugging FlowGuard locally, see the [Development Guide](DEVELOPMENT.md).

## Documentation Contributions

This section will help you contribute to FlowGuard's documentation effectively while maintaining consistency across all documentation.

## Documentation Structure

Our documentation follows a hierarchical structure:

```
docs/
├── getting-started/     # Essential guides for new users
├── guides/              # Workflow-focused tutorials
├── reference/           # Technical specifications
├── advanced/            # Advanced topics for power users
├── tutorials/           # Interactive learning experiences
├── troubleshooting.md   # Solutions to common issues
├── faq.md              # Frequently asked questions
├── README.md           # Documentation index
└── SUMMARY.md          # GitBook/Docusaurus compatibility
```

## Style Guide

### Writing Style
- Use clear, concise language
- Write in second person ("you" rather than "the user")
- Use active voice when possible
- Include specific examples for complex concepts
- Define technical terms on first use

### Markdown Formatting
- Use ATX-style headers (`# Header` not `Header\n======`)
- Headers should be surrounded by blank lines
- Use consistent indentation (4 spaces for lists)
- Specify languages for fenced code blocks
- Wrap lines at 1000 characters
- Use tables with proper spacing around pipes

### Lists
- Use ordered lists for step-by-step instructions
- Use unordered lists for itemized content
- Separate lists from surrounding content with blank lines
- Maintain consistent indentation within lists

### Code Examples
- Always specify the language for fenced code blocks
- Use realistic, working examples
- Include comments for complex code snippets
- Format code according to language conventions

## Linking Guidelines

### Internal Links
- Link to other documentation pages using relative paths
- Link to sections using GitHub-style anchors (lowercase, spaces replaced with hyphens)
- Verify all links work correctly

### External Links
- Link to official documentation for external tools
- Use descriptive link text rather than URLs
- Open external links in new tabs when appropriate

## Visual Assets

### Diagrams
- Create diagrams in Mermaid format when possible
- Store diagrams in `docs/assets/diagrams/`
- Use descriptive filenames with `.mmd` extension
- Include titles and descriptions in diagrams

### Screenshots
- Capture screenshots at 1280x720 resolution when possible
- Store screenshots in `docs/assets/screenshots/`
- Use descriptive filenames
- Include alt text for accessibility

### GIFs
- Create animated GIFs for key workflows
- Store GIFs in `docs/assets/gifs/`
- Keep file sizes reasonable (<5MB)
- Include descriptive filenames

## Testing Documentation

Before submitting changes, please run:

```bash
npm run docs:test:all
```

This will:
1. Lint all documentation files
2. Validate internal links
3. Run comprehensive documentation tests

## Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run documentation tests
5. Commit your changes
6. Push to your fork
7. Create a pull request

## Questions?

If you have questions about contributing to documentation, please:
- Open an issue on GitHub
- Contact the documentation team
- Join our community Discord

Thank you for helping improve FlowGuard's documentation!
