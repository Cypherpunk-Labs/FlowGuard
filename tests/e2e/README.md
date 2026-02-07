# E2E Tests

End-to-end tests use Playwright to validate critical user journeys through the VS Code UI.

## Structure

```
tests/e2e/
├── onboarding.test.ts           # First-time user experience
├── developmentCycle.test.ts     # Complete development workflow
├── utils/
│   └── vscodeDriver.ts         # VS Code automation helpers
└── fixtures/
    └── workspace.ts            # Test workspace utilities
```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

## VS Code Automation

The `VSCodeDriver` class provides helpers for automating VS Code:

```typescript
import { VSCodeDriver } from './utils/vscodeDriver';

const driver = new VSCodeDriver(page);

// Launch VS Code
await driver.launchVSCode();

// Execute a command
await driver.executeCommand('flowguard.createSpec');

// Wait for notifications
const notification = await driver.waitForNotification();

// Interact with sidebar
const sidebarContent = await driver.getSidebarContent();
```

## Writing E2E Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { VSCodeDriver } from './utils/vscodeDriver';
import { TestWorkspace } from './fixtures/workspace';

test.describe('Feature', () => {
  let driver: VSCodeDriver;
  let workspace: TestWorkspace;

  test.beforeEach(async ({ page }) => {
    driver = new VSCodeDriver(page);
    workspace = new TestWorkspace();
  });

  test.afterEach(async () => {
    await workspace.cleanupTestWorkspace();
  });

  test('should do something', async ({ page }) => {
    const workspacePath = await workspace.createTestWorkspace();
    await driver.launchVSCode();
    
    // Your test here
  });
});
```

### Test Workspace Fixtures

The `TestWorkspace` class helps create test workspaces:

```typescript
const workspace = new TestWorkspace();

// Create empty workspace
const path = await workspace.createTestWorkspace();

// Create workspace with artifacts
const path = await workspace.createTestWorkspace({
  epicId: 'test-epic',
  epicTitle: 'Test Epic',
  specs: [
    { id: 'spec-1', title: 'Spec 1', status: 'draft' }
  ],
  tickets: [
    { id: 'ticket-1', title: 'Ticket 1', specId: 'spec-1', status: 'todo' }
  ]
});

// Cleanup
await workspace.cleanupTestWorkspace();
```

## Common Patterns

### Waiting for Elements
```typescript
await page.waitForSelector('.monaco-workbench', { timeout: 30000 });
await page.waitForTimeout(1000); // Wait for animations
```

### Interacting with Command Palette
```typescript
await page.keyboard.press('F1');
await page.keyboard.type('flowguard.createSpec');
await page.keyboard.press('Enter');
```

### Taking Screenshots
```typescript
await page.screenshot({ path: 'test-results/screenshot.png' });
```

## Debugging E2E Tests

### Playwright Inspector
```bash
npx playwright test --debug
```

### Trace Viewer
```bash
npx playwright show-trace test-results/trace.zip
```

### Viewing HTML Report
```bash
npx playwright show-report
```

## Configuration

E2E tests are configured in `playwright.config.ts`:
- Test directory: `./tests/e2e`
- Workers: 1 (sequential execution)
- Timeout: 60 seconds
- Trace: captured on first retry
- Screenshots: captured on failure
- Video: retained on failure

## Best Practices

1. **Use page objects**: Create reusable page objects for common UI interactions
2. **Wait appropriately**: Use explicit waits rather than arbitrary timeouts
3. **Clean up**: Always clean up test workspaces in `afterEach`
4. **Independent tests**: Each test should be able to run independently
5. **Descriptive names**: Use clear, descriptive test names
