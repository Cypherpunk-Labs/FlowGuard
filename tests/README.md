# FlowGuard Testing Documentation

This directory contains the complete test suite for the FlowGuard VS Code extension.

## Test Structure

```
tests/
├── integration/           # Integration tests with real VS Code APIs
│   ├── workflows/        # Complete workflow tests
│   ├── storage/          # File system operations
│   ├── commands/         # VS Code command execution
│   └── ui/              # UI provider tests
├── e2e/                  # End-to-end tests with Playwright
│   ├── utils/           # VS Code automation helpers
│   └── fixtures/        # Test workspace utilities
├── performance/          # Performance benchmarks
├── unit/                # Unit tests (existing)
└── utils/               # Test utilities and mocks
```

## Running Tests

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
Integration tests use the VS Code Extension Test Runner to test against real VS Code APIs in a headless environment.

```bash
# Run all integration tests
npm run test:integration

# Watch mode
npm run test:integration:watch
```

### E2E Tests
E2E tests use Playwright to validate critical user journeys through the UI.

```bash
# Run all E2E tests
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

### Performance Tests
```bash
npm run test:performance
```

### All Tests
```bash
# Run all test suites
npm run test:all

# CI mode (unit + integration only)
npm run test:ci
```

## Test Coverage Targets

| Test Type | Coverage Target | Scope |
|-----------|----------------|-------|
| Unit Tests | 60% | Core models, storage, planning, verification |
| Integration Tests | 30% | Complete workflows, command execution, UI providers |
| E2E Tests | 10% | Critical user journeys (onboarding, development cycle) |

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Extension Activation | < 500ms | Time from activation event to `activate()` completion |
| Codebase Scan (1000 files) | < 5s | Time to scan and index 1000 source files |
| Spec Generation | < 10s | Time to generate spec from user goal (excluding LLM latency) |
| Verification Analysis | < 15s | Time to analyze diff and generate verification report |

## Test Workspace

The `test-workspace/` directory contains sample files used by integration and E2E tests:
- `.flowguard/epic.json` - Sample epic metadata
- `.flowguard/specs/` - Sample specs
- `.flowguard/tickets/` - Sample tickets
- `src/` - Sample source files

## Writing New Tests

### Integration Tests
Use real VS Code APIs for file operations and command execution. See `tests/integration/README.md` for detailed guidelines.

### E2E Tests
Use Playwright to interact with VS Code's UI. See `tests/e2e/README.md` for detailed guidelines.

### Performance Tests
Use the `performance.now()` API for high-resolution timing. See `tests/performance/` for examples.
