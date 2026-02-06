import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { ArtifactStorage } from '../../core/storage/ArtifactStorage';
import { Ticket, TicketStatus, Priority } from '../../core/models/Ticket';
import { parseFrontmatter, serializeFrontmatter } from '../../core/parsers/frontmatter';
import { TicketEditorData, EditorRequestMessage, EditorResponseMessage } from './types';
import { validateTicket } from './utils/validation';

export class TicketEditorProvider implements vscode.CustomTextEditorProvider {
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

    const ticketId = data.id as string;
    const ticket = await this._storage.loadTicket(ticketId);

    const ticketEditorData: TicketEditorData = {
      ...ticket,
      content: markdownContent,
      isDirty: false,
      isSaving: false,
      validationErrors: []
    };

    webviewPanel.webview.html = this._getHtmlForWebview(webviewPanel.webview);

    this._updateWebview(webviewPanel.webview, ticketEditorData);

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
    const scriptPath = vscode.Uri.joinPath(this._extensionUri, 'out/webview/ticketEditor.js');
    const scriptUri = webview.asWebviewUri(scriptPath);
    const nonce = crypto.randomBytes(16).toString('base64');

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:;">
        <title>FlowGuard Ticket Editor</title>
      </head>
      <body>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  private _updateWebview(webview: vscode.Webview, data: TicketEditorData): void {
    webview.postMessage({
      type: 'artifactData',
      data
    } as unknown as EditorResponseMessage);
  }

  private async _syncFromDocument(document: vscode.TextDocument, webview: vscode.Webview): Promise<void> {
    try {
      const content = document.getText();
      const { data, content: markdownContent } = parseFrontmatter<Record<string, unknown>>(content);

      const ticketId = data.id as string;
      if (!ticketId) {
        return;
      }

      const ticket = await this._storage.loadTicket(ticketId);

      const ticketEditorData: TicketEditorData = {
        ...ticket,
        content: markdownContent,
        isDirty: false,
        isSaving: false,
        validationErrors: []
      };

      this._updateWebview(webview, ticketEditorData);
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
          await this._saveTicket(document, message.content, message.metadata, webview);
          break;
        case 'updateStatus':
          await this._updateStatus(document, message.status, webview);
          break;
        case 'updatePriority':
          await this._updatePriority(document, message.priority, webview);
          break;
        case 'updateAssignee':
          await this._updateAssignee(document, message.assignee, webview);
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

  private async _saveTicket(
    document: vscode.TextDocument,
    content: string,
    metadata: Record<string, unknown>,
    webview: vscode.Webview
  ): Promise<void> {
    const ticketId = metadata.id as string;
    const ticket = await this._storage.loadTicket(ticketId);

    const updatedTicket: Ticket = {
      ...ticket,
      title: metadata.title as string,
      status: metadata.status as TicketStatus,
      priority: metadata.priority as Priority,
      assignee: metadata.assignee as string | undefined,
      estimatedEffort: metadata.estimatedEffort as string | undefined,
      tags: (metadata.tags as string[]) || [],
      content: content,
      updatedAt: new Date()
    };

    const validationErrors = validateTicket(updatedTicket);
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
        ...updatedTicket,
        content,
        isDirty: false,
        isSaving: true,
        validationErrors: []
      }
    } as unknown as EditorResponseMessage);

    try {
      await this._storage.saveTicket(updatedTicket);

      const frontmatter = {
        id: updatedTicket.id,
        epicId: updatedTicket.epicId,
        specId: updatedTicket.specId,
        title: updatedTicket.title,
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        assignee: updatedTicket.assignee,
        estimatedEffort: updatedTicket.estimatedEffort,
        createdAt: updatedTicket.createdAt.toISOString(),
        updatedAt: updatedTicket.updatedAt.toISOString(),
        tags: updatedTicket.tags,
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
          ...updatedTicket,
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
        message: error instanceof Error ? error.message : 'Failed to save ticket',
        canRetry: true
      } as unknown as EditorResponseMessage);
    }
  }

  private async _updateStatus(
    document: vscode.TextDocument,
    status: TicketStatus,
    webview: vscode.Webview
  ): Promise<void> {
    try {
      const content = document.getText();
      const { data, content: markdownContent } = parseFrontmatter<Record<string, unknown>>(content);
      const ticketId = data.id as string;

      const ticket = await this._storage.loadTicket(ticketId);
      ticket.status = status;
      ticket.updatedAt = new Date();

      await this._storage.saveTicket(ticket);

      const frontmatter = {
        id: ticket.id,
        epicId: ticket.epicId,
        specId: ticket.specId,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        assignee: ticket.assignee,
        estimatedEffort: ticket.estimatedEffort,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        tags: ticket.tags,
      };
      const markdown = serializeFrontmatter(frontmatter, markdownContent);
      const fullRange = new vscode.Range(0, 0, document.lineCount, 0);
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, fullRange, markdown);
      await vscode.workspace.applyEdit(edit);

      webview.postMessage({
        type: 'statusUpdated',
        status: ticket.status,
        timestamp: new Date().toISOString()
      } as unknown as EditorResponseMessage);
    } catch (error) {
      webview.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update status'
      } as unknown as EditorResponseMessage);
    }
  }

  private async _updatePriority(
    document: vscode.TextDocument,
    priority: Priority,
    webview: vscode.Webview
  ): Promise<void> {
    try {
      const content = document.getText();
      const { data, content: markdownContent } = parseFrontmatter<Record<string, unknown>>(content);
      const ticketId = data.id as string;

      const ticket = await this._storage.loadTicket(ticketId);
      ticket.priority = priority;
      ticket.updatedAt = new Date();

      await this._storage.saveTicket(ticket);

      const frontmatter = {
        id: ticket.id,
        epicId: ticket.epicId,
        specId: ticket.specId,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        assignee: ticket.assignee,
        estimatedEffort: ticket.estimatedEffort,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        tags: ticket.tags,
      };
      const markdown = serializeFrontmatter(frontmatter, markdownContent);
      const fullRange = new vscode.Range(0, 0, document.lineCount, 0);
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, fullRange, markdown);
      await vscode.workspace.applyEdit(edit);

      webview.postMessage({
        type: 'artifactData',
        data: {
          ...ticket,
          content: markdownContent,
          isDirty: false,
          isSaving: false,
          lastSavedAt: new Date(),
          validationErrors: []
        }
      } as unknown as EditorResponseMessage);
    } catch (error) {
      webview.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update priority'
      } as unknown as EditorResponseMessage);
    }
  }

  private async _updateAssignee(
    document: vscode.TextDocument,
    assignee: string,
    webview: vscode.Webview
  ): Promise<void> {
    try {
      const content = document.getText();
      const { data, content: markdownContent } = parseFrontmatter<Record<string, unknown>>(content);
      const ticketId = data.id as string;

      const ticket = await this._storage.loadTicket(ticketId);
      ticket.assignee = assignee;
      ticket.updatedAt = new Date();

      await this._storage.saveTicket(ticket);

      const frontmatter = {
        id: ticket.id,
        epicId: ticket.epicId,
        specId: ticket.specId,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        assignee: ticket.assignee,
        estimatedEffort: ticket.estimatedEffort,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        tags: ticket.tags,
      };
      const markdown = serializeFrontmatter(frontmatter, markdownContent);
      const fullRange = new vscode.Range(0, 0, document.lineCount, 0);
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, fullRange, markdown);
      await vscode.workspace.applyEdit(edit);

      webview.postMessage({
        type: 'artifactData',
        data: {
          ...ticket,
          content: markdownContent,
          isDirty: false,
          isSaving: false,
          lastSavedAt: new Date(),
          validationErrors: []
        }
      } as unknown as EditorResponseMessage);
    } catch (error) {
      webview.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update assignee'
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
}
