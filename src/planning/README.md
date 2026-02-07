# Planning Module Documentation

The Planning module provides AI-powered specification generation, ticket breakdown, and workflow orchestration capabilities for FlowGuard.

## Overview

The planning workflow follows this sequence:

1. **Query → Clarification → Spec**: User provides a goal, the system asks clarifying questions, then generates a comprehensive specification
2. **Spec → Tickets**: Specifications are decomposed into actionable, granular tickets
3. **Workflow Orchestration**: Complete end-to-end workflow management with state persistence
4. **Codebase Analysis**: Automatic analysis of the codebase structure, dependencies, and key symbols
5. **Diagram Generation**: Automatic generation of architecture and flow diagrams using Mermaid syntax

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Planning Module                         │
├─────────────────────────────────────────────────────────────┤
│  ClarificationEngine → Generates clarifying questions       │
│  SpecGenerator        → Creates detailed specifications      │
│  TicketGenerator      → Breaks specs into actionable tickets │
│  WorkflowOrchestrator → Manages complete planning workflow   │
│  CodebaseExplorer     → Analyzes codebase structure          │
│  MermaidGenerator     → Generates architecture diagrams      │
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

### TicketGenerator

Generate actionable tickets from specifications:

```typescript
import { TicketGenerator, TicketGenerationInput } from './planning';

const generator = new TicketGenerator(llmProvider, storage, referenceResolver);

const input: TicketGenerationInput = {
  epicId: 'epic-123',
  specId: 'spec-456',
  maxTickets: 5,
  priorityDistribution: 'balanced'
};

const tickets = await generator.generateTickets(input);
// Returns: Array of Ticket objects with structured content
```

### TicketValidator

Validate tickets for completeness and alignment:

```typescript
import { TicketValidator, ValidationResult } from './planning';

const validator = new TicketValidator();

const completenessResult = validator.validateTicketCompleteness(ticket);
// Checks for required sections, actionable criteria, valid effort format

const alignmentResult = validator.validateTicketAlignment(ticket, spec);
// Validates spec references, file references, requirement mapping
```

### WorkflowOrchestrator

Execute complete planning workflow:

```typescript
import { WorkflowOrchestrator, WorkflowInput } from './planning';

const orchestrator = new WorkflowOrchestrator(
  llmProvider,
  codebaseExplorer,
  storage,
  referenceResolver
);

const input: WorkflowInput = {
  epicId: 'epic-123',
  goal: 'Add user authentication system',
  tags: ['authentication', 'security'],
  includeCodebaseContext: true,
  onProgress: (phase, progress) => {
    console.log(`${phase}: ${progress}%`);
  },
  onQuestionsGenerated: async (questions) => {
    // Handle user interaction for clarification questions
    return await getUserAnswers(questions);
  }
};

const result = await orchestrator.executeWorkflow(input);
// Returns: WorkflowResult with spec, tickets, and summary
```

### TicketTemplates

Reusable templates for different ticket types:

```typescript
import { TicketTemplates, TicketType } from './planning';

const templates = new TicketTemplates();

const featureTemplate = templates.getTemplate('feature');
const bugfixTemplate = templates.getTemplate('bugfix');
const refactorTemplate = templates.getTemplate('refactor');

const content = templates.applyTemplate(featureTemplate, {
  title: 'Feature Title',
  description: 'Feature description...',
  acceptanceCriteria: ['Criteria 1', 'Criteria 2'],
  implementationSteps: ['Step 1', 'Step 2'],
  filesToChange: [{ path: 'src/file.ts', description: 'Change description' }],
  estimatedEffort: '4h',
  priority: 'high',
  tags: ['feature'],
  specId: 'spec-456'
});
```

### WorkflowState

Persist and manage workflow state:

```typescript
import { WorkflowState, WorkflowStateData } from './planning';

const workflowState = new WorkflowState(storage);

await workflowState.saveWorkflowState({
  id: 'workflow-123',
  epicId: 'epic-123',
  currentPhase: 'ticket_generation',
  createdArtifacts: { specId: 'spec-456', ticketIds: ['ticket-1', 'ticket-2'] },
  userResponses: [{ question: 'Q1', answer: 'A1' }],
  startedAt: new Date(),
  lastUpdatedAt: new Date()
});

const state = await workflowState.loadWorkflowState('workflow-123');
const workflows = await workflowState.listWorkflows('epic-123');

// Cleanup old workflows
await workflowState.cleanupCompletedWorkflows(new Date('2024-01-01'));
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
  constructor(provider: LLMProvider, explorer: CodebaseExplorer, storage?: ArtifactStorage)
  
  generateSpec(input: SpecGenerationInput): Promise<Spec>
  setStorage(storage: ArtifactStorage): void
}
```

### TicketGenerator

```typescript
class TicketGenerator {
  constructor(provider: LLMProvider, storage: ArtifactStorage, referenceResolver?: ReferenceResolver)
  
  generateTickets(input: TicketGenerationInput): Promise<Ticket[]>
  setReferenceResolver(resolver: ReferenceResolver): void
}
```

### TicketValidator

```typescript
class TicketValidator {
  validateTicketAlignment(ticket: Ticket, spec: Spec): ValidationResult
  validateTicketCompleteness(ticket: Ticket): ValidationResult
}
```

### WorkflowOrchestrator

```typescript
class WorkflowOrchestrator {
  constructor(
    provider: LLMProvider,
    codebaseExplorer: CodebaseExplorer,
    storage: ArtifactStorage,
    referenceResolver: ReferenceResolver
  )
  
  executeWorkflow(input: WorkflowInput): Promise<WorkflowResult>
  resumeWorkflow(workflowId: string): Promise<WorkflowResult>
  cancelWorkflow(workflowId: string): Promise<void>
}
```

### TicketTemplates

```typescript
class TicketTemplates {
  getTemplate(type: TicketType): TicketTemplate
  applyTemplate(template: TicketTemplate, data: TicketData): string
  getAvailableTypes(): TicketType[]
}
```

### WorkflowState

```typescript
class WorkflowState {
  constructor(storage: ArtifactStorage)
  
  saveWorkflowState(state: WorkflowStateData): Promise<void>
  loadWorkflowState(id: string): Promise<WorkflowStateData>
  listWorkflows(epicId?: string): Promise<WorkflowStateData[]>
  cleanupCompletedWorkflows(olderThan: Date): Promise<void>
}
```

## Ticket Generation

### Ticket Granularity

Tickets generated by `TicketGenerator` are designed to be:
- **Actionable**: Each ticket has clear acceptance criteria
- **Sizable**: 2-8 hours of work per ticket
- **Independent**: Can be implemented independently
- **Testable**: Has clear testing requirements

### Ticket Content Structure

All tickets follow this structure:

```markdown
## Description
{Description of the ticket}

Related Spec: [spec:{specId}]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Implementation Steps
1. Step 1
2. Step 2

## Files to Change
- `{file path}` - {change description}

## Testing Checklist
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed
```

### Supported Ticket Types

- **feature**: New feature implementation
- **bugfix**: Bug fix with reproduction steps
- **refactor**: Code refactoring with before/after
- **test**: Test coverage improvement
- **documentation**: Documentation updates

## Workflow Orchestration

### Workflow Phases

1. **clarification**: Analyze goal and generate questions
2. **spec_generation**: Create detailed specification
3. **ticket_generation**: Break spec into actionable tickets
4. **validation**: Validate tickets against spec
5. **complete**: Workflow finished

### State Persistence

Workflow state is persisted to `.flowguard/workflows/workflow-{id}.json` and includes:
- Current phase
- Created artifacts (specId, ticketIds)
- User responses to clarification questions
- Timestamps
- Error information (if any)

### Error Handling

- Each phase is wrapped in try-catch
- Partial artifacts are cleaned up on failure
- Workflow can be resumed after interruption
- Progress callbacks provide real-time updates

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
