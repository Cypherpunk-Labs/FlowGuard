import * as vscode from 'vscode';
import * as path from 'path';
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
import { HandoffGenerator, AgentTemplates } from './handoff';
import { TemplateEngine } from './handoff/TemplateEngine';
import { TicketTemplates } from './planning/templates/TicketTemplates';
import { MermaidGenerator } from './planning/diagrams/MermaidGenerator';
import { registerCommands, CommandContext } from './commands';
import { setLogLevel } from './utils/logger';
import { PluginManager } from './plugins/PluginManager';
import { PluginContextImpl } from './plugins/PluginContext';
import { TutorialManager } from './tutorials/TutorialManager';
import { FirstEpicTutorial } from './tutorials/tutorials/FirstEpicTutorial';
import { VerificationTutorial } from './tutorials/tutorials/VerificationTutorial';
import { HandoffTutorial } from './tutorials/tutorials/HandoffTutorial';

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
let pluginManager: PluginManager | null = null;

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
      const { log, show } = await import('./utils/logger');
      log('FlowGuard initialized successfully');
      show();
    }

    storage = new ArtifactStorage(workspaceRoot);
    await storage.initialize();

    epicMetadataManager = new EpicMetadataManager(workspaceRoot);

    codebaseExplorer = new CodebaseExplorer(workspaceRoot);
    gitHelper = new GitHelper(workspaceRoot);
    referenceResolver = new ReferenceResolver(storage, workspaceRoot);

    // Initialize LLM provider - allow activation without API key for basic functionality
    const llmConfig = await configurationManager.getLLMConfigAsync();
    const apiKey = await secureStorage.getApiKeyWithFallback(llmConfig.provider) || '';
    const providerConfig = { ...llmConfig, apiKey };
    const provider = createProvider(llmConfig.provider, providerConfig);

    clarificationEngine = new ClarificationEngine(provider);
    specGenerator = new SpecGenerator(provider, codebaseExplorer, storage);

    workflowOrchestrator = new WorkflowOrchestrator(
      provider,
      codebaseExplorer,
      storage,
      referenceResolver
    );
    // Initialize plugin manager
    const pluginsDir = path.join(workspaceRoot, '.flowguard', 'plugins');
    pluginManager = new PluginManager(pluginsDir);

    verificationEngine = new VerificationEngine(
      provider,
      storage,
      gitHelper,
      referenceResolver,
      codebaseExplorer,
      pluginManager
    );
    
    // Load plugins after core services are initialized but before handoffGenerator
    try {
      const autoLoad = vscode.workspace.getConfiguration('flowguard.plugins').get<boolean>('autoLoad', true);
      if (autoLoad) {
        await pluginManager.loadPlugins(
          (manager, pluginId, extensionPath) => {
            // Create context for each plugin with proper pluginId and extensionPath
            return new PluginContextImpl(
              pluginId,
              storage!,
              provider,
              codebaseExplorer!,
              workspaceRoot,
              extensionPath,
              manager
            );
          },
          context.extensionPath
        );
        console.log(`Loaded ${pluginManager.getLoadedPlugins().length} plugins`);
        
        // Wire up plugin agent integrations
        const agentIntegrations = pluginManager.getAgentIntegrations();
        if (agentIntegrations.length > 0) {
          AgentTemplates.setPluginIntegrations(agentIntegrations);
          console.log(`Registered ${agentIntegrations.length} plugin agent integrations`);
        }
        
        // Wire up plugin templates
        const templates = pluginManager.getTemplates();
        if (templates.length > 0) {
          TemplateEngine.setPluginTemplates(templates);
          TicketTemplates.setPluginTemplates(templates);
          console.log(`Registered ${templates.length} plugin templates`);
        }
        
        // Wire up plugin diagram types
        const diagramTypes = pluginManager.getDiagramTypes();
        if (diagramTypes.length > 0) {
          MermaidGenerator.setPluginDiagramTypes(diagramTypes);
          console.log(`Registered ${diagramTypes.length} plugin diagram types`);
        }
      }
    } catch (error) {
      console.error('Failed to load plugins:', error);
      vscode.window.showWarningMessage('Some plugins failed to load. Check the FlowGuard output channel for details.');
    }
    
    // Initialize and register tutorials
    const tutorialManager = TutorialManager.getInstance();
    tutorialManager.initialize(context);
    if (FirstEpicTutorial.setArtifactStorage) {
      FirstEpicTutorial.setArtifactStorage(storage!, epicMetadataManager!);
    }
    if (HandoffTutorial.setArtifactStorage) {
      HandoffTutorial.setArtifactStorage(storage!);
    }
    if (VerificationTutorial.setArtifactStorage) {
      VerificationTutorial.setArtifactStorage(storage!, gitHelper!);
    }
    tutorialManager.registerTutorial(FirstEpicTutorial);
    tutorialManager.registerTutorial(HandoffTutorial);
    tutorialManager.registerTutorial(VerificationTutorial);
    
    handoffGenerator = new HandoffGenerator(
      storage,
      codebaseExplorer,
      referenceResolver,
      epicMetadataManager,
      workspaceRoot,
      pluginManager
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
      pluginManager: pluginManager!,
    };

    registerCommands(context, commandContext);

  } catch (error) {
    console.error('Failed to initialize FlowGuard:', error);
    vscode.window.showErrorMessage(`FlowGuard initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  context.subscriptions.push(configurationManager);
  context.subscriptions.push(configurationWatcher);
}

export async function deactivate(): Promise<void> {
  console.log('FlowGuard extension deactivated');
  
  // Unload all plugins
  if (pluginManager) {
    try {
      await pluginManager.unloadAllPlugins();
      console.log('All plugins unloaded');
      // Clear plugin contributions from consumers
      AgentTemplates.setPluginIntegrations([]);
      TemplateEngine.setPluginTemplates([]);
      TicketTemplates.setPluginTemplates([]);
      MermaidGenerator.setPluginDiagramTypes([]);
    } catch (error) {
      console.error('Error unloading plugins:', error);
    }
  }
  
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
