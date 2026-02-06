import * as vscode from 'vscode';
import { ArtifactStorage } from './core/storage/ArtifactStorage';
import { EpicMetadataManager } from './core/storage/EpicMetadataManager';
import { configurationManager } from './core/config/ConfigurationManager';
import { secureStorage } from './core/config/SecureStorage';
import { configurationWatcher } from './core/config/ConfigurationWatcher';
import { configurationMigration } from './core/config/migration';
import { SidebarProvider } from './ui/sidebar/SidebarProvider';
import { SpecEditorProvider } from './ui/editors/SpecEditorProvider';
import { TicketEditorProvider } from './ui/editors/TicketEditorProvider';
import { VerificationViewProvider } from './ui/views/VerificationViewProvider';
import { ExecutionViewProvider } from './ui/views/ExecutionViewProvider';
import { createProvider } from './llm/ProviderFactory';
import { getLLMConfig } from './llm/config';
import { LLMProviderType } from './llm/types';
import { ClarificationEngine, SpecGenerator, CodebaseExplorer, WorkflowOrchestrator } from './planning';
import { GitHelper } from './core/git/GitHelper';
import { ReferenceResolver } from './core/references/ReferenceResolver';
import { VerificationEngine } from './verification/VerificationEngine';
import { HandoffGenerator } from './handoff';
import { registerCommands, CommandContext } from './commands';
import { setLogLevel } from './utils/logger';

let extensionPath: string;
let storage: ArtifactStorage | null = null;
let epicMetadataManager: EpicMetadataManager | null = null;
let sidebarProvider: SidebarProvider | null = null;
let specEditorProvider: SpecEditorProvider | null = null;
let ticketEditorProvider: TicketEditorProvider | null = null;
let verificationViewProvider: VerificationViewProvider | null = null;
let executionViewProvider: ExecutionViewProvider | null = null;
let clarificationEngine: ClarificationEngine | null = null;
let specGenerator: SpecGenerator | null = null;
let codebaseExplorer: CodebaseExplorer | null = null;
let workflowOrchestrator: WorkflowOrchestrator | null = null;
let verificationEngine: VerificationEngine | null = null;
let handoffGenerator: HandoffGenerator | null = null;
let gitHelper: GitHelper | null = null;
let referenceResolver: ReferenceResolver | null = null;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  extensionPath = context.extensionPath;
  console.log('FlowGuard extension activated');

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('FlowGuard requires an open workspace');
    return;
  }

  try {
    configurationManager.initialize(context);
    secureStorage.initialize(context);
    configurationMigration.initialize(context.globalState);
    
    const migrationResult = await configurationMigration.runMigrations();
    if (migrationResult.migratedItems.length > 0) {
      console.log('Configuration migration completed:', migrationResult.migratedItems.join(', '));
    }
    if (!migrationResult.success) {
      console.error('Configuration migration errors:', migrationResult.errors.join(', '));
    }

    configurationWatcher.initialize();

    const generalConfig = configurationManager.getGeneralConfig();
    setLogLevel(generalConfig.logLevel);
    if (generalConfig.showWelcomeOnStartup) {
      const outputChannel = vscode.window.createOutputChannel('FlowGuard');
      outputChannel.appendLine('FlowGuard initialized successfully');
      outputChannel.show();
    }

    storage = new ArtifactStorage(workspaceRoot);
    await storage.initialize();

    epicMetadataManager = new EpicMetadataManager(workspaceRoot);

    const llmConfig = configurationManager.getLLMConfig();
    const apiKey = await secureStorage.getApiKeyWithFallback(llmConfig.provider) || '';
    const providerConfig = { ...llmConfig, apiKey };
    const provider = createProvider(llmConfig.provider, providerConfig);

    clarificationEngine = new ClarificationEngine(provider);
    codebaseExplorer = new CodebaseExplorer(workspaceRoot);
    specGenerator = new SpecGenerator(provider, codebaseExplorer, storage);
    gitHelper = new GitHelper(workspaceRoot);
    referenceResolver = new ReferenceResolver(storage, workspaceRoot);
    workflowOrchestrator = new WorkflowOrchestrator(
      provider,
      codebaseExplorer,
      storage,
      referenceResolver
    );
    verificationEngine = new VerificationEngine(
      provider,
      storage,
      gitHelper,
      referenceResolver,
      codebaseExplorer
    );
    handoffGenerator = new HandoffGenerator(
      storage,
      codebaseExplorer,
      referenceResolver,
      epicMetadataManager,
      workspaceRoot
    );

    context.workspaceState.update('storage', storage);
    context.workspaceState.update('specGenerator', specGenerator);
    context.workspaceState.update('clarificationEngine', clarificationEngine);
    context.workspaceState.update('codebaseExplorer', codebaseExplorer);

    sidebarProvider = new SidebarProvider(
      context.extensionUri,
      storage,
      epicMetadataManager
    );

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider('flowguard.sidebarView', sidebarProvider)
    );

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

    verificationViewProvider = new VerificationViewProvider(
      context.extensionUri,
      storage!,
      epicMetadataManager!
    );

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider('flowguard.verificationView', verificationViewProvider)
    );

    executionViewProvider = new ExecutionViewProvider(
      context.extensionUri,
      storage!,
      epicMetadataManager!
    );

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider('flowguard.executionView', executionViewProvider)
    );

    const commandContext: CommandContext = {
      storage: storage!,
      epicMetadataManager: epicMetadataManager!,
      workflowOrchestrator: workflowOrchestrator!,
      verificationEngine: verificationEngine!,
      handoffGenerator: handoffGenerator!,
      sidebarProvider: sidebarProvider!,
      verificationViewProvider: verificationViewProvider!,
      executionViewProvider: executionViewProvider!,
      gitHelper: gitHelper!,
      referenceResolver: referenceResolver!,
      codebaseExplorer: codebaseExplorer!,
      llmProvider: provider,
      workspaceRoot,
    };

    registerCommands(context, commandContext);

  } catch (error) {
    console.error('Failed to initialize FlowGuard:', error);
    vscode.window.showErrorMessage(`FlowGuard initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  context.subscriptions.push(configurationManager);
  context.subscriptions.push(configurationWatcher);
}

export function deactivate(): void {
  console.log('FlowGuard extension deactivated');
  configurationManager.dispose();
  configurationWatcher.dispose();
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

export function getVerificationViewProvider(): VerificationViewProvider | null {
  return verificationViewProvider;
}

export function getExecutionViewProvider(): ExecutionViewProvider | null {
  return executionViewProvider;
}
