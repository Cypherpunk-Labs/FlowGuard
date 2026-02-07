# Core Models

This directory contains the TypeScript interfaces defining the core data models for FlowGuard.

## Models

- **Epic**: Top-level initiative with phases, technical plans, and diagrams
- **Spec**: Technical specification artifact with YAML frontmatter
- **Ticket**: Implementation task with acceptance criteria and status tracking
- **Execution**: Tracks agent handoffs between different AI assistants
- **Verification**: Code analysis results with issues and severity levels
- **TechnicalPlan**: Technical planning details including file changes and dependencies
- **Diagram**: Mermaid diagram definitions for visualizations

## Relationships

```
Epic
├── Spec (many-to-one)
├── Ticket (many-to-one)
└── Execution (many-to-one)
    └── Verification (one-to-one)
```

## Usage

Import models from the index file:

```typescript
import { Epic, Spec, Ticket } from './core/models';
```

## model-app Pattern

All artifacts follow the model-app pattern:
- YAML frontmatter for structured metadata
- Markdown body for human-readable content
- UUID v4 for unique identification
