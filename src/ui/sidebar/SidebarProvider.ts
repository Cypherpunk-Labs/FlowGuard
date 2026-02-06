import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { ArtifactStorage } from '../../core/storage/ArtifactStorage';
import { EpicMetadataManager } from '../../core/storage/EpicMetadataManager';
import { EpicMetadata } from '../../core/storage/types';
import {
  RequestMessage,
  ResponseMessage,
  SpecData,
  TicketData,
  ExecutionData
} from './types';
import { Spec, SpecStatus } from '../../core/models/Spec';
import { Ticket, TicketStatus, Priority } from '../../core/models/Ticket';
import { v4 as uuidv4 } from 'uuid';

export class SidebarProvider implements vscode.WebviewViewProvider {
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

    webviewView.webview.onDidReceiveMessage(async (message: RequestMessage) => {
      await this._handleMessage(message, webviewView.webview);
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptPath = vscode.Uri.joinPath(this._extensionUri, 'out/webview/sidebar.js');
    const scriptUri = webview.asWebviewUri(scriptPath);
    const nonce = crypto.randomBytes(16).toString('base64');

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:;">
        <title>FlowGuard Sidebar</title>
      </head>
      <body>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  private async _handleMessage(
    message: RequestMessage,
    webview: vscode.Webview
  ): Promise<void> {
    try {
      switch (message.type) {
        case 'getSpecs':
          await this._sendSpecs(webview);
          break;
        case 'getTickets':
          await this._sendTickets(webview, message.specId);
          break;
        case 'getExecutions':
          await this._sendExecutions(webview);
          break;
        case 'openArtifact':
          await this._openArtifact(message.artifactType, message.id);
          break;
        case 'createSpec':
          await this.createSpec();
          break;
        case 'createTicket':
          await this.createTicket(message.specId);
          break;
        case 'refresh':
          await this._refresh(webview);
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this._postMessage(webview, { type: 'error', message: errorMessage });
    }
  }

  private async _sendSpecs(webview: vscode.Webview): Promise<void> {
    const specs = await this._storage.listSpecs();
    const tickets = await this._storage.listTickets();

    const specsData: SpecData[] = specs.map(spec => {
      const specTickets = tickets.filter(t => t.specId === spec.id);
      return {
        id: spec.id,
        epicId: spec.epicId,
        title: spec.title,
        status: spec.status,
        createdAt: spec.createdAt.toISOString(),
        updatedAt: spec.updatedAt.toISOString(),
        author: spec.author,
        tags: spec.tags,
        ticketCount: specTickets.length,
        ticketIds: specTickets.map(t => t.id)
      };
    });

    this._postMessage(webview, { type: 'specsResponse', data: specsData });
  }

  private async _sendTickets(webview: vscode.Webview, specId?: string): Promise<void> {
    const tickets = await this._storage.listTickets(undefined, specId);
    const specs = await this._storage.listSpecs();

    const ticketsData: TicketData[] = tickets.map(ticket => {
      const parentSpec = specs.find(s => s.id === ticket.specId);
      return {
        id: ticket.id,
        epicId: ticket.epicId,
        specId: ticket.specId,
        specTitle: parentSpec?.title,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        assignee: ticket.assignee,
        estimatedEffort: ticket.estimatedEffort,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        tags: ticket.tags
      };
    });

    this._postMessage(webview, { type: 'ticketsResponse', data: ticketsData });
  }

  private async _sendExecutions(webview: vscode.Webview): Promise<void> {
    const executions = await this._storage.listExecutions();
    const specs = await this._storage.listSpecs();
    const tickets = await this._storage.listTickets();

    const executionsData: ExecutionData[] = executions.map(execution => {
      const linkedSpecs = specs.filter(s => execution.specIds.includes(s.id));
      const linkedTickets = tickets.filter(t => execution.ticketIds.includes(t.id));

      return {
        id: execution.id,
        epicId: execution.epicId,
        agentType: execution.agentType,
        status: execution.status,
        startedAt: execution.startedAt.toISOString(),
        completedAt: execution.completedAt?.toISOString(),
        specCount: linkedSpecs.length,
        specIds: linkedSpecs.map(s => s.id),
        specTitles: linkedSpecs.map(s => s.title),
        ticketCount: linkedTickets.length,
        ticketIds: linkedTickets.map(t => t.id)
      };
    });

    this._postMessage(webview, { type: 'executionsResponse', data: executionsData });
  }

  private async _openArtifact(type: string, id: string): Promise<void> {
    const artifactPath = this._storage.getArtifactPath(type as any, id);
    const uri = vscode.Uri.file(artifactPath);

    if (type === 'spec') {
      await vscode.commands.executeCommand('vscode.openWith', uri, 'flowguard.specEditor');
    } else if (type === 'ticket') {
      await vscode.commands.executeCommand('vscode.openWith', uri, 'flowguard.ticketEditor');
    } else {
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document, { preview: false });
    }
  }

  public async createSpec(): Promise<void> {
    const webview = this._view?.webview;
    if (!webview) {
      throw new Error('Sidebar view is not ready');
    }

    const epicMetadata = await this._epicMetadataManager.loadEpicMetadata();
    if (!epicMetadata) {
      throw new Error('No epic initialized. Please initialize an epic first.');
    }

    const now = new Date();
    const spec: Spec = {
      id: uuidv4(),
      epicId: epicMetadata.epicId,
      title: 'New Spec',
      status: 'draft' as SpecStatus,
      createdAt: now,
      updatedAt: now,
      author: 'FlowGuard',
      tags: [],
      content: '# New Spec\n\nDescribe your specification here.'
    };

    await this._storage.saveSpec(spec);
    await this._epicMetadataManager.registerArtifact('spec', spec.id);
    await this._openArtifact('spec', spec.id);
    await this._refresh(webview);
  }

  public async createTicket(specId?: string): Promise<void> {
    const webview = this._view?.webview;
    if (!webview) {
      throw new Error('Sidebar view is not ready');
    }

    const epicMetadata: EpicMetadata | null = await this._epicMetadataManager.loadEpicMetadata();
    if (!epicMetadata) {
      throw new Error('No epic initialized. Please initialize an epic first.');
    }

    let targetSpecId: string;
    if (specId) {
      targetSpecId = specId;
    } else {
      const specs = await this._storage.listSpecs();
      const firstSpec = specs[0];
      if (!firstSpec) {
        throw new Error('No specs found. Please create a spec first.');
      }
      targetSpecId = firstSpec.id;
    }

    const now = new Date();
    const ticket: Ticket = {
      id: uuidv4(),
      epicId: epicMetadata.epicId,
      specId: targetSpecId,
      title: 'New Ticket',
      status: 'todo' as TicketStatus,
      priority: 'medium' as Priority,
      createdAt: now,
      updatedAt: now,
      tags: [],
      content: '# New Ticket\n\nDescribe your ticket here.'
    };

    await this._storage.saveTicket(ticket);
    await this._epicMetadataManager.registerArtifact('ticket', ticket.id);
    await this._openArtifact('ticket', ticket.id);
    await this._refresh(webview);
  }

  private async _refresh(webview: vscode.Webview): Promise<void> {
    await this._sendSpecs(webview);
    await this._sendTickets(webview);
    await this._sendExecutions(webview);
    this._postMessage(webview, { type: 'refresh' });
  }

  private _postMessage(webview: vscode.Webview, message: ResponseMessage): void {
    webview.postMessage(message);
  }

  public refresh(): void {
    if (this._view) {
      this._refresh(this._view.webview);
    }
  }
}
