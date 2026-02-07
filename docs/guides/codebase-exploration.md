# Codebase Exploration Guide

This guide covers how FlowGuard scans and analyzes your codebase to provide context-aware suggestions and insights. Codebase exploration helps FlowGuard understand your project structure, dependencies, and implementation patterns.

## How Codebase Exploration Works

FlowGuard's codebase explorer analyzes your project to:

- Identify project structure and organization
- Extract symbols and their relationships
- Understand dependencies between components
- Recognize implementation patterns and conventions
- Provide context for specifications and tickets

### Exploration Process

1. **File Discovery**: Scan workspace for relevant files
2. **Symbol Extraction**: Parse files to identify classes, functions, variables
3. **Dependency Analysis**: Map relationships between components
4. **Pattern Recognition**: Identify common implementation patterns
5. **Context Generation**: Create searchable context for AI assistance

## Supported Languages

FlowGuard supports codebase exploration for multiple languages:

### Primary Support
- **TypeScript/JavaScript**: Full AST parsing and symbol extraction
- **Python**: Comprehensive symbol extraction and dependency analysis

### Secondary Support
- **Java**: Basic symbol extraction and package analysis
- **Go**: Function and type extraction
- **Rust**: Module and function analysis

### Tree-sitter Integration
For languages without native parsers, FlowGuard uses Tree-sitter for:
- Syntax tree parsing
- Symbol identification
- Basic relationship mapping

## Configuration

### Max Files to Scan

Limit the number of files scanned to maintain performance:

```json
{
  "flowguard.codebase.maxFilesToScan": 1000
}
```

### Include/Exclude Patterns

Specify which files to include or exclude from scanning:

```json
{
  "flowguard.codebase.include": [
    "src/**/*",
    "lib/**/*"
  ],
  "flowguard.codebase.exclude": [
    "node_modules/**",
    "*.log",
    "dist/**",
    ".git/**"
  ]
}
```

### Language-Specific Settings

Configure language-specific analysis options:

```json
{
  "flowguard.codebase.typescript": {
    "analyzeDecorators": true,
    "extractInterfaces": true
  },
  "flowguard.codebase.python": {
    "analyzeDocstrings": true,
    "extractTypeHints": true
  }
}
```

## Symbol Extraction

FlowGuard extracts various symbols from your codebase:

### TypeScript/JavaScript Symbols
- Classes and interfaces
- Functions and methods
- Variables and constants
- Enums and types
- Module imports and exports

### Python Symbols
- Classes and methods
- Functions and variables
- Modules and packages
- Type hints and annotations

### Java Symbols
- Classes and interfaces
- Methods and fields
- Packages and imports

### Go Symbols
- Functions and methods
- Types and structs
- Packages and imports

### Rust Symbols
- Functions and methods
- Structs and enums
- Modules and imports

## Dependency Graph Visualization

FlowGuard can generate dependency graphs to visualize relationships between components:

### Graph Features
- Component relationships
- Dependency direction and strength
- Circular dependency detection
- Module hierarchy visualization

### Generating Dependency Graphs

1. Open the FlowGuard sidebar
2. Navigate to the Codebase view
3. Click "Generate Dependency Graph"
4. Select the scope (workspace, folder, or specific modules)
5. View the generated graph in the preview panel

### Graph Customization

Customize graph visualization:

```json
{
  "flowguard.codebase.graph.maxDepth": 3,
  "flowguard.codebase.graph.showExternal": false,
  "flowguard.codebase.graph.clusterBy": "module",
  "flowguard.codebase.graph.highlightPatterns": [
    "service",
    "controller",
    "repository"
  ]
}
```

## Performance Optimization

### Incremental Scanning

FlowGuard uses incremental scanning to improve performance:

- Only scan changed files
- Cache analysis results
- Update dependency graphs incrementally

### Resource Management

Configure resource usage:

```json
{
  "flowguard.codebase.scanConcurrency": 4,
  "flowguard.codebase.maxMemory": "512MB",
  "flowguard.codebase.scanTimeout": 30000
}
```

### Caching

FlowGuard caches analysis results to improve performance:

- Symbol cache for quick lookups
- Dependency cache for relationship mapping
- Context cache for AI assistance

Clear caches when needed:
```
FlowGuard: Clear Codebase Cache
```

## Context for AI Assistance

Codebase context enhances AI assistance in several ways:

### Specification Generation
- Suggest relevant existing components
- Identify similar implementation patterns
- Provide dependency information

### Ticket Creation
- Recommend implementation approaches
- Identify affected components
- Estimate complexity based on codebase patterns

### Agent Handoffs
- Include relevant file context
- Provide implementation examples
- Suggest integration points

## Example Codebase Analysis

For a typical TypeScript project, FlowGuard might extract:

```json
{
  "projectStructure": {
    "src/": {
      "controllers/": ["auth.controller.ts", "user.controller.ts"],
      "services/": ["auth.service.ts", "user.service.ts"],
      "models/": ["user.model.ts"],
      "utils/": ["jwt.util.ts", "validation.util.ts"]
    }
  },
  "symbols": {
    "classes": [
      {
        "name": "AuthController",
        "file": "src/controllers/auth.controller.ts",
        "methods": ["login", "register", "logout"]
      },
      {
        "name": "UserService",
        "file": "src/services/user.service.ts",
        "methods": ["createUser", "getUserById", "updateUser"]
      }
    ],
    "functions": [
      {
        "name": "generateToken",
        "file": "src/utils/jwt.util.ts",
        "parameters": ["payload", "expiresIn"]
      }
    ]
  },
  "dependencies": {
    "AuthController -> AuthService": "uses",
    "AuthService -> UserModel": "depends on",
    "AuthService -> jwt.util": "imports"
  }
}
```

## Integration with Other Features

### Specifications
- Auto-suggest related components
- Provide implementation context
- Identify integration points

### Tickets
- Estimate complexity based on codebase analysis
- Suggest affected files
- Recommend implementation approaches

### Verification
- Understand project conventions
- Identify pattern violations
- Suggest improvements based on existing code

## Best Practices

### Scanning Configuration

- Set appropriate file limits based on project size
- Exclude generated and third-party code
- Include only relevant source directories
- Configure language-specific options for accuracy

### Performance Tuning

- Adjust concurrency based on system resources
- Set appropriate timeouts for large projects
- Use incremental scanning for active development
- Clear caches periodically to free memory

### Context Usage

- Enable context for complex tasks
- Disable for simple, isolated changes
- Customize context depth for different scenarios
- Review suggested context for relevance

## Troubleshooting

### Slow Scanning

- Reduce `maxFilesToScan` setting
- Add more specific exclude patterns
- Increase scan timeout if needed
- Clear cache and rescan

### Missing Symbols

- Verify file is included in scan
- Check language support for file type
- Ensure proper syntax in source files
- Restart scanning process

### Dependency Issues

- Check for circular dependencies
- Verify import/export statements
- Review module resolution settings
- Update project configuration

### Memory Issues

- Reduce `maxFilesToScan` setting
- Lower `scanConcurrency` value
- Set appropriate `maxMemory` limit
- Clear cache regularly

## Next Steps

After configuring codebase exploration:

1. [Create specifications](specs-and-tickets.md) with enhanced context
2. [Generate tickets](specs-and-tickets.md) with complexity estimates
3. [Create agent handoffs](handoff-workflow.md) with relevant code context

For a guided walkthrough of codebase exploration, see the [Codebase Exploration Tutorial](../tutorials/codebase-exploration-tutorial.md) (coming soon).