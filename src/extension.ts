import * as vscode from 'vscode';

let extensionPath: string;

export function activate(context: vscode.ExtensionContext): void {
  extensionPath = context.extensionPath;
  console.log('FlowGuard extension activated');

  const disposables: vscode.Disposable[] = [];

  context.subscriptions.push(...disposables);
}

export function deactivate(): void {
  console.log('FlowGuard extension deactivated');
}

export function getExtensionPath(): string {
  return extensionPath;
}
