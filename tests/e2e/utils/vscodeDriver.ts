import { _electron as electron, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

export class VSCodeDriver {
  private electronApp?: ElectronApplication;
  private page?: Page;
  private extensionPath: string;
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.extensionPath = path.resolve(__dirname, '../../../');
    this.workspacePath = workspacePath;
  }

  async launchVSCode(): Promise<Page> {
    const vscodeExecutablePath = this.getVSCodeExecutablePath();
    
    this.electronApp = await electron.launch({
      executablePath: vscodeExecutablePath,
      args: [
        this.workspacePath,
        `--extensionDevelopmentPath=${this.extensionPath}`,
        '--disable-extensions',
        '--disable-gpu',
        '--disable-updates',
        '--skip-welcome',
        '--skip-release-notes',
        '--disable-workspace-trust',
        '--disable-telemetry',
        '--no-sandbox'
      ],
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });

    this.page = await this.electronApp.firstWindow();
    
    await this.waitForVSCodeLoaded();
    
    return this.page;
  }

  private getVSCodeExecutablePath(): string {
    const platform = process.platform;
    const isCI = process.env.CI;
    
    if (platform === 'darwin') {
      return '/Applications/Visual Studio Code.app/Contents/MacOS/Electron';
    } else if (platform === 'win32') {
      const windowsPath = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'Code.exe');
      if (fs.existsSync(windowsPath)) {
        return windowsPath;
      }
      return path.join(process.env.PROGRAMFILES || '', 'Microsoft VS Code', 'Code.exe');
    } else {
      return 'code';
    }
  }

  async waitForVSCodeLoaded(): Promise<void> {
    if (!this.page) {
      throw new Error('VS Code not launched');
    }
    
    await this.page.waitForSelector('.monaco-workbench', { timeout: 60000 });
    await this.page.waitForTimeout(3000);
  }

  async executeCommand(commandId: string): Promise<void> {
    if (!this.page) {
      throw new Error('VS Code not launched');
    }

    await this.page.keyboard.press('F1');
    await this.page.waitForTimeout(500);
    await this.page.keyboard.type(commandId);
    await this.page.waitForTimeout(500);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async waitForNotification(): Promise<string | null> {
    if (!this.page) {
      throw new Error('VS Code not launched');
    }

    try {
      const notification = await this.page.locator('.monaco-notification-toast').first();
      if (await notification.isVisible({ timeout: 5000 })) {
        return await notification.textContent();
      }
    } catch {
      return null;
    }
    return null;
  }

  async getSidebarContent(): Promise<string> {
    if (!this.page) {
      throw new Error('VS Code not launched');
    }

    const sidebar = await this.page.locator('.sidebar').first();
    return await sidebar.textContent() || '';
  }

  async refreshSidebar(): Promise<void> {
    await this.executeCommand('flowguard.refreshSidebar');
  }

  async takeScreenshot(name: string): Promise<void> {
    if (!this.page) {
      throw new Error('VS Code not launched');
    }

    await this.page.screenshot({ 
      path: path.join(__dirname, '../../../test-results', `${name}.png`)
    });
  }

  async close(): Promise<void> {
    if (this.electronApp) {
      await this.electronApp.close();
    }
  }

  getPage(): Page {
    if (!this.page) {
      throw new Error('VS Code not launched');
    }
    return this.page;
  }
}
