import * as vscode from 'vscode';
import { ArtifactStorage } from './core/storage/ArtifactStorage';
import { EpicMetadataManager } from './core/storage/EpicMetadataManager';
import { SidebarProvider } from './ui/sidebar/SidebarProvider';
import { SpecEditorProvider } from './ui/editors/SpecEditorProvider';
import { TicketEditorProvider } from './ui/editors/TicketEditorProvider';
import { createProvider } from './llm/ProviderFactory';
import { getLLMConfig } from './llm/config';
import { LLMProviderType } from './llm/types';
import { ClarificationEngine, SpecGenerator, CodebaseExplorer } from './planning';

let extensionPath: string;
let storage: ArtifactStorage | null = null;
let epicMetadataManager: EpicMetadataManager | null = null;
let sidebarProvider: SidebarProvider | null = null;
let specEditorProvider: SpecEditorProvider | null = null;
let ticketEditorProvider: TicketEditorProvider | null = null;
let clarificationEngine: ClarificationEngine | null = null;
let specGenerator: SpecGenerator | null = null;
let codebaseExplorer: CodebaseExplorer | null = null;

function getProviderType(): LLMProviderType {
  try {
    const config = vscode.workspace.getConfiguration('flowguard.llm');
    const provider: string | undefined = config.get('provider');
    if (provider && ['openai', 'anthropic', 'local'].includes(provider)) {
      return provider as LLMProviderType;
    }
  } catch {
    // Ignore
  }

  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  
  return 'openai';
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  extensionPath = context.extensionPath;
  console.log('FlowGuard extension activated');

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('FlowGuard requires an open workspace');
    return;
  }

  try {
    storage = new ArtifactStorage(workspaceRoot);
    await storage.initialize();

    epicMetadataManager = new EpicMetadataManager(workspaceRoot);

    const providerType = getProviderType();
    const llmConfig = getLLMConfig();
    const provider = createProvider(providerType, llmConfig);

    clarificationEngine = new ClarificationEngine(provider);
    codebaseExplorer = new CodebaseExplorer(workspaceRoot);
    specGenerator = new SpecGenerator(provider, codebaseExplorer);

    context.workspaceState.update('storage', storage);
    context.workspaceState.update('specGenerator', specGenerator);
    context.workspaceState.update('clarificationEngine', clarificationEngine);
    context.workspaceState.update('codebaseExplorer', codebaseExplorer);

    // Register sidebar provider
    sidebarProvider = new SidebarProvider(
      context.extensionUri,
      storage,
      epicMetadataManager
    );

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider('flowguard.sidebarView', sidebarProvider)
    );

    // Register custom editors
    specEditorProvider = new SpecEditorProvider(
      context.extensionUri,
      storage
    );

    ticketEditorProvider = new TicketEditorProvider(
      context.extensionUri,
      storage
    );

    context.subscriptions.push(
      vscode.window.registerCustomEditorProvider('flowguard.specEditor', specEditorProvider, {
        webviewOptions: { retainContextWhenHidden: true }
      })
    );

    context.subscriptions.push(
      vscode.window.registerCustomEditorProvider('flowguard.ticketEditor', ticketEditorProvider, {
        webviewOptions: { retainContextWhenHidden: true }
      })
    );

    // Register commands
    context.subscriptions.push(
      vscode.commands.registerCommand('flowguard.createSpec', async () => {
        try {
          await sidebarProvider?.createSpec();
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to create spec: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }),
      vscode.commands.registerCommand('flowguard.createTicket', async () => {
        try {
          await sidebarProvider?.createTicket();
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to create ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }),
      vscode.commands.registerCommand('flowguard.refreshSidebar', () => {
        sidebarProvider?.refresh();
      }),
      vscode.commands.registerCommand('flowguard.initializeEpic', async () => {
        vscode.window.showInformationMessage('Initialize Epic - Coming Soon');
      })
    );

    const outputChannel = vscode.window.createOutputChannel('FlowGuard');
    outputChannel.appendLine('FlowGuard initialized successfully');
    outputChannel.show();

  } catch (error) {
    console.error('Failed to initialize FlowGuard:', error);
    vscode.window.showErrorMessage(`FlowGuard initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const disposables: vscode.Disposable[] = [];

  context.subscriptions.push(...disposables);
}

export function deactivate(): void {
  console.log('FlowGuard extension deactivated');
}

export function getExtensionPath(): string {
  return extensionPath;
}

export function getStorage(): ArtifactStorage | null {
  return storage;
}

export function getClarificationEngine(): ClarificationEngine | null {
  return clarificationEngine;
}

export function getSpecGenerator(): SpecGenerator | null {
  return specGenerator;
}

export function getCodebaseExplorer(): CodebaseExplorer | null {
  return codebaseExplorer;
}

export function getSidebarProvider(): SidebarProvider | null {
  return sidebarProvider;
}

export function getSpecEditorProvider(): SpecEditorProvider | null {
  return specEditorProvider;
}

export function getTicketEditorProvider(): TicketEditorProvider | null {
  return ticketEditorProvider;
}
