import { test, expect } from '@playwright/test';
import { VSCodeDriver } from './utils/vscodeDriver';
import { TestWorkspace } from './fixtures/workspace';
import * as path from 'path';

test.describe('First-Time Onboarding', () => {
  let driver: VSCodeDriver;
  let workspace: TestWorkspace;

  test.beforeEach(async () => {
    workspace = new TestWorkspace();
    const workspacePath = await workspace.createTestWorkspace();
    driver = new VSCodeDriver(workspacePath);
  });

  test.afterEach(async () => {
    await driver.close();
    await workspace.cleanupTestWorkspace();
  });

  test('should display FlowGuard sidebar', async () => {
    await driver.launchVSCode();
    
    await driver.executeCommand('flowguard.refreshSidebar');
    await driver.getPage().waitForTimeout(1000);
    
    const sidebarContent = await driver.getSidebarContent();
    expect(sidebarContent).toBeTruthy();
  });

  test('should initialize epic via command palette', async () => {
    await driver.launchVSCode();
    
    await driver.executeCommand('flowguard.initializeEpic');
    await driver.getPage().waitForTimeout(2000);
    
    const notification = await driver.waitForNotification();
    expect(notification).toBeTruthy();
  });

  test('should have create spec command available', async () => {
    await driver.launchVSCode();
    
    await driver.executeCommand('flowguard.createSpec');
    await driver.getPage().waitForTimeout(2000);
    
    const notification = await driver.waitForNotification();
    expect(notification).toBeTruthy();
  });
});
