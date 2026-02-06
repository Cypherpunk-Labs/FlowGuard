# Integration Tests

Integration tests use the VS Code Extension Test Runner (`@vscode/test-electron`) to test against real VS Code APIs in a headless environment.

## Structure

```
tests/integration/
├── runTest.ts           # Test runner entry point
├── index.ts             # Mocha test configuration
├── workflows/           # Complete workflow tests
│   ├── epicCreation.test.ts
│   └── planning.test.ts
├── storage/            # File system operations
│   └── artifactStorage.test.ts
├── commands/           # VS Code command execution
│   └── commands.test.ts
└── ui/                # UI provider tests
    └── sidebar.test.ts
```

## Running Tests

```bash
# Run all integration tests
npm run test:integration

# Watch mode
npm run test:integration:watch
```

## Writing Integration Tests

### Test Structure

Use Mocha's `suite` and `test` functions:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Feature Name', () => {
  test('should do something', async () => {
    // Arrange
    const input = ...;
    
    // Act
    const result = await someFunction(input);
    
    // Assert
    assert.strictEqual(result, expected);
  });
});
```

### Using Real VS Code APIs

#### File Operations
```typescript
const fs = vscode.workspace.fs;
const uri = vscode.Uri.file('/path/to/file');
await fs.writeFile(uri, Buffer.from('content'));
const content = await fs.readFile(uri);
```

#### Command Execution
```typescript
await vscode.commands.executeCommand('flowguard.refreshSidebar');
```

#### Workspace
```typescript
const workspaceFolders = vscode.workspace.workspaceFolders;
const config = vscode.workspace.getConfiguration('flowguard');
```

### Test Workspace

Integration tests use the `test-workspace/` directory at the project root. This directory contains sample files that tests can read and modify.

### Setup and Teardown

```typescript
suite('Test Suite', () => {
  setup(async () => {
    // Runs before each test
  });

  teardown(async () => {
    // Runs after each test
  });

  suiteSetup(async () => {
    // Runs once before all tests
  });

  suiteTeardown(async () => {
    // Runs once after all tests
  });
});
```

## Common Patterns

### Testing Commands
```typescript
test('should execute command', async () => {
  const allCommands = await vscode.commands.getCommands(true);
  assert.ok(allCommands.includes('flowguard.createSpec'));
  
  await vscode.commands.executeCommand('flowguard.createSpec');
});
```

### Testing File Operations
```typescript
test('should read and write files', async () => {
  const testFile = vscode.Uri.file(path.join(workspacePath, 'test.txt'));
  await vscode.workspace.fs.writeFile(testFile, Buffer.from('test'));
  
  const content = await vscode.workspace.fs.readFile(testFile);
  assert.strictEqual(content.toString(), 'test');
  
  await vscode.workspace.fs.delete(testFile);
});
```

## Debugging Integration Tests

1. Set breakpoints in your test files
2. Open the Debug panel in VS Code
3. Select the "Extension Tests" configuration
4. Press F5 to start debugging

## Best Practices

1. **Clean up resources**: Always clean up files and resources in `teardown` or `suiteTeardown`
2. **Use real APIs**: Don't mock VS Code APIs - that's what unit tests are for
3. **Test workspace**: Use the test workspace for file operations
4. **Timeouts**: Integration tests may need longer timeouts due to VS Code startup
5. **Isolation**: Each test should be independent and not rely on state from other tests
