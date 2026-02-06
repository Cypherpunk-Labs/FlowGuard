import { test, expect } from '@playwright/test';
import { VSCodeDriver } from './utils/vscodeDriver';
import { TestWorkspace } from './fixtures/workspace';
import * as path from 'path';

test.describe('Complete Development Cycle', () => {
  let driver: VSCodeDriver;
  let workspace: TestWorkspace;

  test.beforeEach(async () => {
    workspace = new TestWorkspace();
  });

  test.afterEach(async () => {
    await driver.close();
    await workspace.cleanupTestWorkspace();
  });

  test('full workflow: generate handoff', async () => {
    const workspacePath = await workspace.createTestWorkspace({
      epicId: 'e2e-test-epic',
      epicTitle: 'E2E Test Epic',
      specs: [
        { id: 'spec-e2e-001', title: 'E2E Test Spec', status: 'draft' }
      ],
      tickets: [
        { id: 'ticket-e2e-001', title: 'E2E Test Ticket', specId: 'spec-e2e-001', status: 'todo' }
      ]
    });

    driver = new VSCodeDriver(workspacePath);
    await driver.launchVSCode();
    
    await driver.executeCommand('flowguard.refreshSidebar');
    await driver.getPage().waitForTimeout(1000);
    
    await driver.executeCommand('flowguard.generateHandoff');
    await driver.getPage().waitForTimeout(2000);
    
    const notification = await driver.waitForNotification();
    expect(notification).toBeTruthy();
  });

  test('should execute verification workflow', async () => {
    const workspacePath = await workspace.createTestWorkspace({
      epicId: 'verify-test-epic',
      epicTitle: 'Verification Test Epic',
      specs: [
        { id: 'spec-verify-001', title: 'Verification Test Spec', status: 'draft' }
      ]
    });

    driver = new VSCodeDriver(workspacePath);
    await driver.launchVSCode();
    
    await driver.executeCommand('flowguard.verifyChanges');
    await driver.getPage().waitForTimeout(2000);
    
    const notification = await driver.waitForNotification();
    expect(notification).toBeTruthy();
  });

  test('should execute create spec command', async () => {
    const workspacePath = await workspace.createTestWorkspace({
      epicId: 'spec-test-epic',
      epicTitle: 'Spec Test Epic'
    });

    driver = new VSCodeDriver(workspacePath);
    await driver.launchVSCode();
    
    await driver.executeCommand('flowguard.createSpec');
    await driver.getPage().waitForTimeout(2000);
    
    const notification = await driver.waitForNotification();
    expect(notification).toBeTruthy();
  });

  test('should execute create ticket command', async () => {
    const workspacePath = await workspace.createTestWorkspace({
      epicId: 'ticket-test-epic',
      epicTitle: 'Ticket Test Epic',
      specs: [
        { id: 'spec-ticket-001', title: 'Ticket Test Spec', status: 'draft' }
      ]
    });

    driver = new VSCodeDriver(workspacePath);
    await driver.launchVSCode();
    
    await driver.executeCommand('flowguard.createTicket');
    await driver.getPage().waitForTimeout(2000);
    
    const notification = await driver.waitForNotification();
    expect(notification).toBeTruthy();
  });
});
