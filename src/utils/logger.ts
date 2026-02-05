import * as vscode from 'vscode';

const outputChannel = vscode.window.createOutputChannel('FlowGuard');

export function log(message: string): void {
  outputChannel.appendLine(`[INFO] ${new Date().toISOString()} - ${message}`);
}

export function error(message: string): void {
  outputChannel.appendLine(`[ERROR] ${new Date().toISOString()} - ${message}`);
}

export function warn(message: string): void {
  outputChannel.appendLine(`[WARN] ${new Date().toISOString()} - ${message}`);
}
