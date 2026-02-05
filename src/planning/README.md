# Planning Module Documentation

The Planning module provides AI-powered specification generation and codebase analysis capabilities for FlowGuard.

## Overview

The planning workflow follows this sequence:

1. **Query → Clarification → Spec**: User provides a goal, the system asks clarifying questions, then generates a comprehensive specification
2. **Codebase Analysis**: Automatic analysis of the codebase structure, dependencies, and key symbols
3. **Diagram Generation**: Automatic generation of architecture and flow diagrams using Mermaid syntax

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Planning Module                         │
├─────────────────────────────────────────────────────────────┤
│  ClarificationEngine → Generates clarifying questions       │
│  CodebaseExplorer  → Analyzes codebase structure            │
│  SpecGenerator     → Creates detailed specifications         │
│  MermaidGenerator  → Generates architecture diagrams         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    LLM Provider Layer                      │
├─────────────────────────────────────────────────────────────┤
│  OpenAIProvider    → GPT-4 and GPT-3.5 Turbo models        │
│  AnthropicProvider → Claude 3 models                        │
│  LocalLLMProvider  → OpenAI-compatible local models         │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### ClarificationEngine

Generate clarifying questions for user goals:

```typescript
import { ClarificationEngine, ClarificationContext } from './planning';

const engine = new ClarificationEngine(llmProvider);

const questions = await engine.analyzeGoal('Add user authentication');
// Returns: ["What authentication method should be used?", ...]

const context = engine.parseResponsesWithGoal(
  'Add user authentication',
  questions,
  ['OAuth 2.0 with Google']
);
// Returns: ClarificationContext with Q&A pairs
```

### CodebaseExplorer

Analyze the current workspace:

```typescript
import { CodebaseExplorer } from './planning';

const explorer = new CodebaseExplorer(workspaceRoot);

const context = await explorer.explore({
  include: ['**/*.ts'],
  exclude: ['**/node_modules/**'],
  maxFiles: 1000
});

// Returns: CodebaseContext with files, symbols, dependencies, statistics
```

### SpecGenerator

Generate comprehensive specifications:

```typescript
import { SpecGenerator, SpecGenerationInput } from './planning';

const generator = new SpecGenerator(llmProvider, explorer);

const input: SpecGenerationInput = {
  epicId: 'epic-123',
  goal: 'Add user authentication',
  clarifications: context,
  tags: ['authentication', 'security'],
  includeCodebaseContext: true
};

const spec = await generator.generateSpec(input);
// Returns: Spec object with detailed markdown content
```

## Configuration

### LLM Provider Settings

Configure LLM providers via VS Code settings:

```json
{
  "flowguard.llm.provider": "openai",
  "flowguard.llm.model": "gpt-4-turbo-preview",
  "flowguard.llm.temperature": 0.7,
  "flowguard.llm.baseUrl": "http://localhost:1234/v1"
}
```

Or via environment variables:
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `FLOWGUARD_LLM_PROVIDER` - Provider type (openai, anthropic, local)

### Supported Languages

Codebase analysis supports:
- TypeScript/JavaScript (via TypeScript Compiler API)
- Python (via Tree-sitter)
- Java (via Tree-sitter)
- Go (via Tree-sitter)
- Rust (via Tree-sitter)

## API Reference

### ClarificationEngine

```typescript
class ClarificationEngine {
  constructor(provider: LLMProvider)
  
  analyzeGoal(userGoal: string): Promise<string[]>
  parseResponsesWithGoal(
    goal: string,
    questions: string[],
    responses: string[]
  ): ClarificationContext
}
```

### CodebaseExplorer

```typescript
class CodebaseExplorer {
  constructor(workspaceRoot: string)
  
  explore(options?: ExploreOptions): Promise<CodebaseContext>
  clearCache(): void
}
```

### SpecGenerator

```typescript
class SpecGenerator {
  constructor(provider: LLMProvider, explorer: CodebaseExplorer)
  
  generateSpec(input: SpecGenerationInput): Promise<Spec>
}
```

## Error Handling

Common error messages and solutions:

- **"API key required"**: Configure your API key in settings or environment variables
- **"Rate limit exceeded"**: Wait a moment and retry
- **"Network error"**: Check your internet connection
- **"No workspace open"**: Open a folder before using FlowGuard

## Troubleshooting

### Codebase Analysis Fails

1. Ensure workspace is open
2. Check file patterns in settings
3. Clear cache: `explorer.clearCache()`

### LLM Requests Fail

1. Verify API keys are configured
2. Check network connectivity
3. Review output channel for detailed errors
4. Try a different model or provider

### Diagrams Not Rendering

1. Verify Mermaid syntax is valid
2. Check diagram data extraction
3. Review diagram configuration options
