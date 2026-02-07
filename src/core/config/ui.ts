import * as vscode from 'vscode';
import { LLMProviderType, AgentType } from './types';
import { secureStorage } from './SecureStorage';

export async function promptForApiKey(provider: LLMProviderType): Promise<string | undefined> {
  const providerDisplay = provider.charAt(0).toUpperCase() + provider.slice(1);
  
  const apiKey = await vscode.window.showInputBox({
    prompt: `Enter your ${providerDisplay} API key`,
    placeHolder: `sk-... for OpenAI or sk-ant-api03-... for Anthropic`,
    password: true,
    ignoreFocusOut: true,
    validateInput: (value) => {
      if (!value || value.length === 0) {
        return 'API key is required';
      }
      if (value.length < 10) {
        return 'API key seems too short';
      }
      return null;
    }
  });

  if (apiKey && apiKey.length > 0) {
    await secureStorage.storeApiKey(provider, apiKey);
    return apiKey;
  }

  return undefined;
}

export async function promptForProvider(): Promise<LLMProviderType | undefined> {
  const providers: vscode.QuickPickItem[] = [
    { label: 'OpenAI', description: 'GPT-4, GPT-3.5 models', iconPath: undefined },
    { label: 'Anthropic', description: 'Claude models', iconPath: undefined },
    { label: 'Local', description: 'Self-hosted or local models', iconPath: undefined }
  ];

  const selected = await vscode.window.showQuickPick(providers, {
    placeHolder: 'Select an LLM provider',
    title: 'LLM Provider Selection',
    ignoreFocusOut: true
  });

  if (selected) {
    const providerMap: Record<string, LLMProviderType> = {
      'OpenAI': 'openai',
      'Anthropic': 'anthropic',
      'Local': 'local'
    };
    return providerMap[selected.label];
  }

  return undefined;
}

export async function promptForTemplate(): Promise<AgentType | undefined> {
  const templates: vscode.QuickPickItem[] = [
    { label: 'Cursor', description: 'Cursor AI IDE format', iconPath: undefined },
    { label: 'Claude', description: 'Claude AI format', iconPath: undefined },
    { label: 'Windsurf', description: 'Windsurf IDE format', iconPath: undefined },
    { label: 'Cline', description: 'Cline/Claude CLI format', iconPath: undefined },
    { label: 'Aider', description: 'Aider chat format', iconPath: undefined },
    { label: 'Custom', description: 'Use custom template path', iconPath: undefined }
  ];

  const selected = await vscode.window.showQuickPick(templates, {
    placeHolder: 'Select a template format',
    title: 'Template Selection',
    ignoreFocusOut: true
  });

  if (selected) {
    const templateMap: Record<string, AgentType> = {
      'Cursor': 'cursor',
      'Claude': 'claude',
      'Windsurf': 'windsurf',
      'Cline': 'cline',
      'Aider': 'aider',
      'Custom': 'custom'
    };
    return templateMap[selected.label];
  }

  return undefined;
}

export function showValidationErrors(errors: string[]): void {
  const message = errors.length === 1 
    ? `Configuration error: ${errors[0]}`
    : `Configuration errors:\n${errors.map(e => `• ${e}`).join('\n')}`;
  
  vscode.window.showErrorMessage(message);
}

export async function confirmConfigurationChange(message: string): Promise<boolean> {
  const response = await vscode.window.showWarningMessage(
    message,
    { modal: true },
    'Confirm',
    'Cancel'
  );
  return response === 'Confirm';
}

export function openSettings(section?: string): void {
  const settingsId = section ? `flowguard.${section}` : 'flowguard';
  vscode.commands.executeCommand('workbench.action.openSettings', settingsId);
}

export async function openSecretsManagement(): Promise<void> {
  const response = await vscode.window.showInformationMessage(
    'To manage API keys, open the FlowGuard settings and configure your provider settings.',
    'Open Settings',
    'Enter API Key Now'
  );

  if (response === 'Open Settings') {
    openSettings('llm');
  } else if (response === 'Enter API Key Now') {
    const provider = await promptForProvider();
    if (provider) {
      await promptForApiKey(provider);
    }
  }
}

export async function showConfigurationSummary(): Promise<void> {
  const panel = vscode.window.createWebviewPanel(
    'configurationSummary',
    'FlowGuard Configuration',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  const configHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
        h1 { font-size: 1.5em; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
        h2 { font-size: 1.2em; margin-top: 20px; color: #333; }
        .section { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
        .key { font-weight: bold; }
        .value { color: #0066cc; }
        .error { color: #cc0000; }
        button { margin-top: 10px; padding: 8px 16px; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>FlowGuard Configuration Summary</h1>
      <div id="config"></div>
      <button onclick="vscode.postMessage({command: 'openSettings'})">Open Settings</button>
    </body>
    </html>
  `;

  panel.webview.html = configHtml;

  panel.webview.onDidReceiveMessage((message) => {
    if (message.command === 'openSettings') {
      openSettings();
      panel.dispose();
    }
  });
}

export async function selectConfigurationFile(): Promise<vscode.Uri | undefined> {
  const filters: Record<string, string[]> = {
    'JSON Files': ['json'],
    'All Files': ['*']
  };

  const uri = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    openLabel: 'Select Configuration File',
    filters
  });

  return uri?.[0];
}

export async function exportConfiguration(): Promise<void> {
  const uri = await vscode.window.showSaveDialog({
    saveLabel: 'Export Configuration',
    filters: { 'JSON Files': ['json'] },
    defaultUri: vscode.Uri.file('flowguard-config.json')
  });

  if (uri) {
    const { workspace } = vscode;
    const config = workspace.getConfiguration('flowguard');
    const exportData: Record<string, any> = {};
    
    const sections = ['llm', 'templates', 'editor', 'codebase', 'verification', 'telemetry', 'general'];
    for (const section of sections) {
      exportData[section] = config.get(section);
    }

    const fs = require('fs');
    fs.writeFileSync(uri.fsPath, JSON.stringify(exportData, null, 2));
    
    vscode.window.showInformationMessage('Configuration exported successfully');
  }
}
