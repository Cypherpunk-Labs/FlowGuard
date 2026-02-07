import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { ArtifactStorage } from '../../core/storage/ArtifactStorage';
import { Spec, SpecStatus } from '../../core/models/Spec';
import { parseFrontmatter, serializeFrontmatter } from '../../core/parsers/frontmatter';
import { SpecEditorData, EditorRequestMessage, EditorResponseMessage } from './types';
import { validateSpec } from './utils/validation';

export class SpecEditorProvider implements vscode.CustomTextEditorProvider {
  private readonly _extensionUri: vscode.Uri;
  private readonly _storage: ArtifactStorage;
  private readonly _disposables: vscode.Disposable[] = [];

  constructor(
    extensionUri: vscode.Uri,
    storage: ArtifactStorage
  ) {
    this._extensionUri = extensionUri;
    this._storage = storage;
  }

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    const content = document.getText();
    const { data, content: markdownContent } = parseFrontmatter<Record<string, unknown>>(content);

    const specId = data.id as string;
    const spec = await this._storage.loadSpec(specId);

    const specEditorData: SpecEditorData = {
      ...spec,
      content: markdownContent,
      isDirty: false,
      isSaving: false,
      validationErrors: []
    };

    webviewPanel.webview.html = this._getHtmlForWebview(webviewPanel.webview);

    this._updateWebview(webviewPanel.webview, specEditorData);

    webviewPanel.webview.onDidReceiveMessage(async (message: EditorRequestMessage) => {
      await this._handleMessage(message, document, webviewPanel.webview);
    });

    const changeSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        this._syncFromDocument(document, webviewPanel.webview);
      }
    });

    webviewPanel.onDidDispose(() => {
      changeSubscription.dispose();
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptPath = vscode.Uri.joinPath(this._extensionUri, 'out/webview/specEditor.js');
    const scriptUri = webview.asWebviewUri(scriptPath);
    const nonce = crypto.randomBytes(16).toString('base64');

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:;">
        <title>FlowGuard Spec Editor</title>
      </head>
      <body>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  private _updateWebview(webview: vscode.Webview, data: SpecEditorData): void {
    webview.postMessage({
      type: 'artifactData',
      data
    } as unknown as EditorResponseMessage);
  }

  private async _syncFromDocument(document: vscode.TextDocument, webview: vscode.Webview): Promise<void> {
    try {
      const content = document.getText();
      const { data, content: markdownContent } = parseFrontmatter<Record<string, unknown>>(content);

      const specId = data.id as string;
      if (!specId) {
        return;
      }

      const spec = await this._storage.loadSpec(specId);

      const specEditorData: SpecEditorData = {
        ...spec,
        content: markdownContent,
        isDirty: false,
        isSaving: false,
        validationErrors: []
      };

      this._updateWebview(webview, specEditorData);
    } catch (error) {
      console.error('Failed to sync from document:', error);
    }
  }

  private async _handleMessage(
    message: EditorRequestMessage,
    document: vscode.TextDocument,
    webview: vscode.Webview
  ): Promise<void> {
    try {
      switch (message.type) {
        case 'saveArtifact':
          await this._saveSpec(document, message.content, message.metadata, webview);
          break;
        case 'updateStatus':
          await this._updateStatus(document, message.status, message.comment, webview);
          break;
        case 'insertDiagram':
          await this._insertDiagram(document, message.diagram, message.cursorPosition, webview);
          break;
        case 'previewMarkdown':
          await this._previewMarkdown(message.content, webview);
          break;
        case 'exportArtifact':
          await this._exportArtifact(message.format, document, webview);
          break;
        case 'approveArtifact':
          await this._approveArtifact(message.approvedBy, message.comment, document, webview);
          break;
        case 'requestArtifactData':
          await this._syncFromDocument(document, webview);
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      webview.postMessage({
        type: 'error',
        message: errorMessage
      } as unknown as EditorResponseMessage);
    }
  }

  private async _saveSpec(
    document: vscode.TextDocument,
    content: string,
    metadata: Record<string, unknown>,
    webview: vscode.Webview
  ): Promise<void> {
    const specId = metadata.id as string;
    const spec = await this._storage.loadSpec(specId);

    const updatedSpec: Spec = {
      ...spec,
      title: metadata.title as string,
      status: metadata.status as SpecStatus,
      tags: (metadata.tags as string[]) || [],
      content: content,
      updatedAt: new Date()
    };

    const validationErrors = validateSpec(updatedSpec);
    if (validationErrors.length > 0) {
      webview.postMessage({
        type: 'saveError',
        message: 'Validation failed',
        canRetry: true
      } as unknown as EditorResponseMessage);
      return;
    }

    webview.postMessage({
      type: 'artifactData',
      data: {
        ...updatedSpec,
        content,
        isDirty: false,
        isSaving: true,
        validationErrors: []
      }
    } as unknown as EditorResponseMessage);

    try {
      await this._storage.saveSpec(updatedSpec);

      const frontmatter = {
        id: updatedSpec.id,
        epicId: updatedSpec.epicId,
        title: updatedSpec.title,
        status: updatedSpec.status,
        createdAt: updatedSpec.createdAt.toISOString(),
        updatedAt: updatedSpec.updatedAt.toISOString(),
        author: updatedSpec.author,
        tags: updatedSpec.tags,
      };
      const markdown = serializeFrontmatter(frontmatter, content);
      const fullRange = new vscode.Range(0, 0, document.lineCount, 0);
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, fullRange, markdown);
      await vscode.workspace.applyEdit(edit);

      webview.postMessage({
        type: 'saveSuccess',
        timestamp: new Date().toISOString()
      } as unknown as EditorResponseMessage);

      webview.postMessage({
        type: 'artifactData',
        data: {
          ...updatedSpec,
          content,
          isDirty: false,
          isSaving: false,
          lastSavedAt: new Date(),
          validationErrors: []
        }
      } as unknown as EditorResponseMessage);
    } catch (error) {
      webview.postMessage({
        type: 'saveError',
        message: error instanceof Error ? error.message : 'Failed to save spec',
        canRetry: true
      } as unknown as EditorResponseMessage);
    }
  }

  private async _updateStatus(
    document: vscode.TextDocument,
    status: SpecStatus,
    comment: string | undefined,
    webview: vscode.Webview
  ): Promise<void> {
    try {
      const content = document.getText();
      const { data, content: markdownContent } = parseFrontmatter<Record<string, unknown>>(content);
      const specId = data.id as string;

      const spec = await this._storage.loadSpec(specId);
      spec.status = status;
      spec.updatedAt = new Date();

      await this._storage.saveSpec(spec);

      const frontmatter = {
        id: spec.id,
        epicId: spec.epicId,
        title: spec.title,
        status: spec.status,
        createdAt: spec.createdAt.toISOString(),
        updatedAt: spec.updatedAt.toISOString(),
        author: spec.author,
        tags: spec.tags,
      };
      const markdown = serializeFrontmatter(frontmatter, markdownContent);
      const fullRange = new vscode.Range(0, 0, document.lineCount, 0);
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, fullRange, markdown);
      await vscode.workspace.applyEdit(edit);

      webview.postMessage({
        type: 'statusUpdated',
        status: spec.status,
        timestamp: new Date().toISOString()
      } as unknown as EditorResponseMessage);
    } catch (error) {
      webview.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update status'
      } as unknown as EditorResponseMessage);
    }
  }

  private async _insertDiagram(
    document: vscode.TextDocument,
    diagram: string,
    cursorPosition: number,
    webview: vscode.Webview
  ): Promise<void> {
    const diagramBlock = `\`\`\`mermaid\n${diagram}\n\`\`\`\n`;
    const position = document.positionAt(cursorPosition);
    const edit = new vscode.WorkspaceEdit();
    edit.insert(document.uri, position, diagramBlock);
    await vscode.workspace.applyEdit(edit);
  }

  private async _previewMarkdown(content: string, webview: vscode.Webview): Promise<void> {
    webview.postMessage({
      type: 'markdownPreview',
      html: `<html><body>${this._renderMarkdown(content)}</body></html>`
    } as unknown as EditorResponseMessage);
  }

  private _renderMarkdown(content: string): string {
    return content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/```mermaid\n([\s\S]*?)```/gim, '<div class="mermaid">$1</div>')
      .replace(/\n/gim, '<br>');
  }

  private async _exportArtifact(
    format: string,
    document: vscode.TextDocument,
    webview: vscode.Webview
  ): Promise<void> {
    const content = document.getText();

    if (format === 'clipboard') {
      await vscode.env.clipboard.writeText(content);
      webview.postMessage({
        type: 'exportComplete',
        format: 'clipboard'
      } as unknown as EditorResponseMessage);
      return;
    }

    const exportPath = document.uri.fsPath.replace('.md', `.${format}.md`);
    const uri = vscode.Uri.file(exportPath);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content));

    webview.postMessage({
      type: 'exportComplete',
      format: format,
      filePath: exportPath
    } as unknown as EditorResponseMessage);
  }

  private async _approveArtifact(
    approvedBy: string,
    comment: string | undefined,
    document: vscode.TextDocument,
    webview: vscode.Webview
  ): Promise<void> {
    try {
      const content = document.getText();
      const { data, content: markdownContent } = parseFrontmatter<Record<string, unknown>>(content);
      const specId = data.id as string;

      const spec = await this._storage.loadSpec(specId);
      spec.status = 'approved';
      spec.updatedAt = new Date();

      await this._storage.saveSpec(spec);

      const frontmatter = {
        id: spec.id,
        epicId: spec.epicId,
        title: spec.title,
        status: spec.status,
        createdAt: spec.createdAt.toISOString(),
        updatedAt: spec.updatedAt.toISOString(),
        author: spec.author,
        tags: spec.tags,
        approvedBy: approvedBy,
        approvedAt: new Date().toISOString(),
        approvalComment: comment || ''
      };
      const markdown = serializeFrontmatter(frontmatter, markdownContent);
      const fullRange = new vscode.Range(0, 0, document.lineCount, 0);
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, fullRange, markdown);
      await vscode.workspace.applyEdit(edit);

      webview.postMessage({
        type: 'approved',
        specId: spec.id,
        approvedBy: approvedBy,
        timestamp: new Date().toISOString()
      } as unknown as EditorResponseMessage);
    } catch (error) {
      webview.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to approve spec'
      } as unknown as EditorResponseMessage);
    }
  }
}
