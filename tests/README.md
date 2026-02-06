# FlowGuard Testing Infrastructure

This directory contains the test suite for the FlowGuard VS Code extension.

## Test Organization

```
tests/
├── setup.ts                 # Global test setup and VS Code API mocks
├── utils/
│   ├── mocks.ts            # Mock factories for VS Code, LLM, storage, etc.
│   └── fixtures.ts         # Test data factories (Epic, Spec, Ticket, etc.)
├── unit/
│   ├── models/
│   │   ├── models.test.ts       # Model interface tests
│   │   └── validators.test.ts   # Validation function tests
│   ├── storage/
│   │   └── fileSystem.test.ts   # File system utility tests
│   ├── planning/
│   │   ├── ClarificationEngine.test.ts
│   │   ├── TicketGenerator.test.ts
│   │   └── TicketValidator.test.ts
│   └── verification/
│       └── DiffAnalyzer.test.ts
└── integration/
    └── (future integration tests)
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### With UI
```bash
npm run test:ui
```

### Coverage Report
```bash
npm run test:coverage
npm run test:coverage:open  # Open HTML report in browser
```

### Unit Tests Only
```bash
npm run test:unit
```

## Test Configuration

Configuration is in `vitest.config.ts`:
- Test environment: Node.js (VS Code extension runtime)
- Coverage provider: v8
- Coverage threshold: 60%
- Test timeout: 10000ms (for LLM-related tests)

## Writing New Tests

### Test Structure
Follow the AAA pattern: Arrange, Act, Assert

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // Arrange
      const input = ...;
      const component = new Component();

      // Act
      const result = component.methodName(input);

      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

### Using Mocks
Import from `tests/utils/mocks.ts`:

```typescript
import { createMockLLMProvider, createMockStorage } from '../utils/mocks';

const mockLLM = createMockLLMProvider();
const mockStorage = createMockStorage();
```

### Using Fixtures
Import from `tests/utils/fixtures.ts`:

```typescript
import { createTestEpic, createTestSpec, createTestTicket } from '../utils/fixtures';

const epic = createTestEpic({ title: 'Custom Title' });
const ticket = createTestTicket({ priority: 'high' });
```

## Mock Patterns

### VS Code API
The `tests/setup.ts` file provides a global mock for the VS Code API. Common mocked APIs:
- `workspace.fs` - File system operations
- `window.showInformationMessage` - Notifications
- `commands.registerCommand` - Command registration
- `Uri` - URI construction

### LLM Provider
Use `createMockLLMProvider()` to mock LLM responses. The mock returns structured responses based on the schema provided.

### File System
Use `vi.mock('fs', ...)` for file system tests, or use the `fileExists`, `readFile`, etc. utilities from `src/core/storage/fileSystem`.

## Coverage Requirements

- Target: 60% code coverage
- Coverage is measured for: statements, branches, functions, lines
- Excluded from coverage:
  - `src/ui/**` (webview code)
  - `**/__tests__/**`
  - `**/*.d.ts`

## Best Practices

1. **Descriptive test names**: "should [expected behavior] when [condition]"
2. **Isolate tests**: Each test should be independent
3. **Clean up resources**: Use `afterEach` hooks for cleanup
4. **Mock external dependencies**: File system, LLM, VS Code API
5. **Test edge cases**: Empty values, null, undefined, invalid types
6. **Use fixtures**: Reusable test data for consistency
