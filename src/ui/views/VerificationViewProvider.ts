import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { ArtifactStorage } from '../../core/storage/ArtifactStorage';
import { EpicMetadataManager } from '../../core/storage/EpicMetadataManager';
import {
  ViewRequestMessage,
  ViewResponseMessage,
  VerificationData
} from './types';
import { Verification, VerificationIssue } from '../../core/models/Verification';

export class VerificationViewProvider implements vscode.WebviewViewProvider {
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
    const scriptPath = vscode.Uri.joinPath(this._extensionUri, 'out/webview/verificationView.js');
    const scriptUri = webview.asWebviewUri(scriptPath);
    const nonce = crypto.randomBytes(16).toString('base64');

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:;">
        <title>Verification Results</title>
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
        case 'getVerification':
          await this._sendVerificationData(webview, message.verificationId);
          break;
        case 'applyAutoFix':
          await this._applyAutoFix(webview, message.verificationId, message.issueId);
          break;
        case 'ignoreIssue':
          await this._ignoreIssue(webview, message.verificationId, message.issueId);
          break;
        case 'approveVerification':
          await this._approveVerification(webview, message.verificationId, message.status, message.comment);
          break;
        case 'requestChanges':
          await this._requestChanges(webview, message.verificationId, message.comment);
          break;
        case 'openFile':
          await this._openFile(message.filePath, message.lineNumber);
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

  private async _sendVerificationData(webview: vscode.Webview, verificationId: string): Promise<void> {
    try {
      const verification = await this._storage.loadVerification(verificationId);
      const enrichedData = await this._enrichVerificationWithReferences(verification);
      this._postMessage(webview, { type: 'verificationDataResponse', data: enrichedData });
    } catch (error) {
      this._postMessage(webview, { type: 'actionError', message: `Failed to load verification: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  }

  private async _enrichVerificationWithReferences(verification: Verification): Promise<VerificationData> {
    const specs = await this._storage.listSpecs();
    const tickets = await this._storage.listTickets();

    const enrichedIssues: VerificationIssue[] = verification.issues.map(issue => {
      const enrichedIssue = { ...issue };
      if (issue.specRequirementId) {
        const matchingSpec = specs.find(s => s.id === issue.specRequirementId);
        if (matchingSpec) {
          enrichedIssue.suggestion = `Related to spec: ${matchingSpec.title}\n${enrichedIssue.suggestion || ''}`;
        }
      }
      return enrichedIssue;
    });

    return {
      ...verification,
      issues: enrichedIssues,
      isExpanded: false,
      selectedIssueId: null,
      filterSeverity: 'All'
    };
  }

  private async _applyAutoFix(webview: vscode.Webview, verificationId: string, issueId: string): Promise<void> {
    try {
      const verification = await this._storage.loadVerification(verificationId);
      const issue = verification.issues.find(i => i.id === issueId);

      if (!issue) {
        throw new Error(`Issue ${issueId} not found`);
      }

      if (!issue.fixSuggestion?.automatedFix) {
        throw new Error('This issue does not support auto-fix');
      }

      if (!issue.line) {
        throw new Error('Issue is missing line number');
      }

      const workspaceEdit = new vscode.WorkspaceEdit();
      const fileUri = vscode.Uri.file(issue.file);
      const document = await vscode.workspace.openTextDocument(fileUri);

      if (issue.fixSuggestion.codeExample) {
        const line = Math.max(0, issue.line - 1);
        const lineLength = document.lineAt(line).text.length;
        const targetRange = new vscode.Range(line, 0, line, lineLength);
        workspaceEdit.replace(fileUri, targetRange, issue.fixSuggestion.codeExample);
      } else if (issue.code) {
        const line = Math.max(0, issue.line - 1);
        const lineLength = document.lineAt(line).text.length;
        const targetRange = new vscode.Range(line, 0, line, lineLength);
        workspaceEdit.replace(fileUri, targetRange, issue.code);
      } else {
        throw new Error('No fix code available for this issue');
      }

      await vscode.workspace.applyEdit(workspaceEdit);

      const updatedIssues = verification.issues.map(i => {
        if (i.id === issueId) {
          return { ...i, message: `[FIXED] ${i.message}` };
        }
        return i;
      });

      const updatedVerification: Verification = {
        ...verification,
        issues: updatedIssues
      };

      await this._storage.saveVerification(updatedVerification);

      this._postMessage(webview, { type: 'actionSuccess', action: 'applyAutoFix', message: 'Auto-fix applied successfully' });
      await this._sendVerificationData(webview, verificationId);
    } catch (error) {
      this._postMessage(webview, { type: 'actionError', message: `Failed to apply auto-fix: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  }

  private async _ignoreIssue(webview: vscode.Webview, verificationId: string, issueId: string): Promise<void> {
    try {
      const verification = await this._storage.loadVerification(verificationId);
      const issue = verification.issues.find(i => i.id === issueId);

      if (!issue) {
        throw new Error(`Issue ${issueId} not found`);
      }

      const updatedIssues = verification.issues.map(i => {
        if (i.id === issueId) {
          return { ...i, message: `[IGNORED] ${i.message}` };
        }
        return i;
      });

      const updatedVerification: Verification = {
        ...verification,
        issues: updatedIssues
      };

      await this._storage.saveVerification(updatedVerification);

      this._postMessage(webview, { type: 'actionSuccess', action: 'ignoreIssue', message: 'Issue ignored' });
      await this._sendVerificationData(webview, verificationId);
    } catch (error) {
      this._postMessage(webview, { type: 'actionError', message: `Failed to ignore issue: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  }

  private async _approveVerification(
    webview: vscode.Webview,
    verificationId: string,
    status: 'approved' | 'approved_with_conditions',
    comment?: string
  ): Promise<void> {
    try {
      const verification = await this._storage.loadVerification(verificationId);

      const updatedVerification: Verification = {
        ...verification,
        summary: {
          ...verification.summary,
          approvalStatus: status
        }
      };

      if (status === 'approved_with_conditions' && comment) {
        updatedVerification.summary.recommendation += `\n\nConditions: ${comment}`;
      }

      await this._storage.saveVerification(updatedVerification);

      this._postMessage(webview, { type: 'actionSuccess', action: 'approveVerification', message: 'Verification approved' });
      await this._sendVerificationData(webview, verificationId);
    } catch (error) {
      this._postMessage(webview, { type: 'actionError', message: `Failed to approve verification: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  }

  private async _requestChanges(webview: vscode.Webview, verificationId: string, comment: string): Promise<void> {
    try {
      const verification = await this._storage.loadVerification(verificationId);

      const updatedVerification: Verification = {
        ...verification,
        summary: {
          ...verification.summary,
          approvalStatus: 'changes_requested',
          recommendation: `Changes requested: ${comment}`
        }
      };

      await this._storage.saveVerification(updatedVerification);

      this._postMessage(webview, { type: 'actionSuccess', action: 'requestChanges', message: 'Changes requested' });
      await this._sendVerificationData(webview, verificationId);
    } catch (error) {
      this._postMessage(webview, { type: 'actionError', message: `Failed to request changes: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  }

  private async _openFile(filePath: string, lineNumber?: number): Promise<void> {
    try {
      const fileUri = vscode.Uri.file(filePath);
      const document = await vscode.workspace.openTextDocument(fileUri);
      const editor = await vscode.window.showTextDocument(document, { preview: false });

      if (lineNumber) {
        const line = Math.max(0, lineNumber - 1);
        const position = new vscode.Position(line, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position));
      }
    } catch (error) {
      throw new Error(`Failed to open file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async _refresh(webview: vscode.Webview): Promise<void> {
    this._postMessage(webview, { type: 'refresh' });
  }

  private _postMessage(webview: vscode.Webview, message: ViewResponseMessage): void {
    webview.postMessage(message);
  }

  public showVerification(verificationId: string): void {
    if (this._view) {
      this._sendVerificationData(this._view.webview, verificationId);
    }
  }

  public refresh(): void {
    if (this._view) {
      this._refresh(this._view.webview);
    }
  }
}
