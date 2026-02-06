import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { ArtifactStorage } from '../../core/storage/ArtifactStorage';
import { EpicMetadataManager } from '../../core/storage/EpicMetadataManager';
import {
  ViewRequestMessage,
  ViewResponseMessage,
  ExecutionData
} from './types';

export class ExecutionViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _storage: ArtifactStorage,
    private readonly _epicMetadataManager: EpicMetadataManager
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message: ViewRequestMessage) => {
      await this._handleMessage(message, webviewView.webview);
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptPath = vscode.Uri.joinPath(this._extensionUri, 'out/webview/executionView.js');
    const scriptUri = webview.asWebviewUri(scriptPath);
    const nonce = crypto.randomBytes(16).toString('base64');

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:;">
        <title>Execution Tracking</title>
      </head>
      <body>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  private async _handleMessage(
    message: ViewRequestMessage,
    webview: vscode.Webview
  ): Promise<void> {
    try {
      switch (message.type) {
        case 'getExecution':
          await this._sendExecutionData(webview, message.executionId);
          break;
        case 'openSpec':
          await this._openSpec(message.specId);
          break;
        case 'openTicket':
          await this._openTicket(message.ticketId);
          break;
        case 'viewVerification':
          await this._viewVerification(message.verificationId);
          break;
        case 'refresh':
          await this._refresh(webview);
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this._postMessage(webview, { type: 'actionError', message: errorMessage });
    }
  }

  private async _sendExecutionData(webview: vscode.Webview, executionId: string): Promise<void> {
    try {
      const execution = await this._storage.loadExecution(executionId);
      const enrichedData = await this._enrichExecutionWithReferences(execution);
      this._postMessage(webview, { type: 'executionDataResponse', data: enrichedData });
    } catch (error) {
      this._postMessage(webview, { type: 'actionError', message: `Failed to load execution: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  }

  private async _enrichExecutionWithReferences(execution: any): Promise<ExecutionData> {
    const specs = await this._storage.listSpecs();
    const tickets = await this._storage.listTickets();

    const linkedSpecs = specs.filter(s => execution.specIds.includes(s.id));
    const linkedTickets = tickets.filter(t => execution.ticketIds.includes(t.id));

    const startedAtDate = new Date(execution.startedAt);
    const completedAtDate = execution.completedAt ? new Date(execution.completedAt) : undefined;

    if (isNaN(startedAtDate.getTime())) {
      throw new Error('Invalid startedAt date');
    }

    if (completedAtDate && isNaN(completedAtDate.getTime())) {
      throw new Error('Invalid completedAt date');
    }

    const duration = this._calculateDuration(startedAtDate, completedAtDate);
    const formattedDates = this._formatDates(startedAtDate, completedAtDate);

    return {
      ...execution,
      startedAt: startedAtDate.toISOString(),
      completedAt: completedAtDate?.toISOString(),
      duration,
      formattedDates,
      specTitles: linkedSpecs.map(s => s.title),
      ticketTitles: linkedTickets.map(t => t.title)
    };
  }

  private _calculateDuration(startedAt: Date, completedAt?: Date): string {
    const start = startedAt.getTime();
    const end = completedAt ? completedAt.getTime() : Date.now();
    const durationMs = end - start;

    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private _formatDates(startedAt: Date, completedAt?: Date): { startedAt: string; completedAt?: string } {
    const formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    return {
      startedAt: startedAt.toLocaleDateString('en-US', formatOptions),
      completedAt: completedAt ? completedAt.toLocaleDateString('en-US', formatOptions) : undefined
    };
  }

  private async _openSpec(specId: string): Promise<void> {
    try {
      const artifactPath = this._storage.getArtifactPath('spec' as any, specId);
      const uri = vscode.Uri.file(artifactPath);
      await vscode.commands.executeCommand('vscode.openWith', uri, 'flowguard.specEditor');
    } catch (error) {
      throw new Error(`Failed to open spec: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async _openTicket(ticketId: string): Promise<void> {
    try {
      const artifactPath = this._storage.getArtifactPath('ticket' as any, ticketId);
      const uri = vscode.Uri.file(artifactPath);
      await vscode.commands.executeCommand('vscode.openWith', uri, 'flowguard.ticketEditor');
    } catch (error) {
      throw new Error(`Failed to open ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async _viewVerification(verificationId: string): Promise<void> {
    await vscode.commands.executeCommand('flowguard.showVerification', verificationId);
  }

  private async _refresh(webview: vscode.Webview): Promise<void> {
    this._postMessage(webview, { type: 'refresh' });
  }

  private _postMessage(webview: vscode.Webview, message: ViewResponseMessage): void {
    webview.postMessage(message);
  }

  public showExecution(executionId: string): void {
    if (this._view) {
      this._sendExecutionData(this._view.webview, executionId);
    }
  }

  public refresh(): void {
    if (this._view) {
      this._refresh(this._view.webview);
    }
  }
}
