import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CommandContext, CommandHandler } from './types';
import { LoadedPlugin } from '../plugins/types';
import { PluginContextImpl } from '../plugins/PluginContext';
import { AgentTemplates } from '../handoff/AgentTemplates';
import { TemplateEngine } from '../handoff/TemplateEngine';
import { TicketTemplates } from '../planning/templates/TicketTemplates';
import { MermaidGenerator } from '../planning/diagrams/MermaidGenerator';

/**
 * List all loaded plugins with their status
 */
export const listPluginsCommand: CommandHandler = async (
  context: CommandContext
): Promise<void> => {
  const plugins = context.pluginManager.getLoadedPlugins();

  if (plugins.length === 0) {
    vscode.window.showInformationMessage('No plugins are currently loaded.');
    return;
  }

  const items = plugins.map((plugin: LoadedPlugin) => ({
    label: `${plugin.manifest.name} v${plugin.manifest.version}`,
    description: plugin.status,
    detail: plugin.manifest.description,
    plugin
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a plugin to view details',
    canPickMany: false
  });

  if (selected) {
    const plugin = selected.plugin;
    const details = [
      `ID: ${plugin.manifest.id}`,
      `Name: ${plugin.manifest.name}`,
      `Version: ${plugin.manifest.version}`,
      `Description: ${plugin.manifest.description}`,
      `Author: ${plugin.manifest.author || 'N/A'}`,
      `Status: ${plugin.status}`,
      `Path: ${plugin.path}`,
      `Loaded: ${plugin.loadedAt.toLocaleString()}`
    ].join('\n');

    vscode.window.showInformationMessage(details, { modal: true });
  }
};

/**
 * Reload a specific plugin
 */
export const reloadPluginCommand: CommandHandler = async (
  context: CommandContext
): Promise<void> => {
  const plugins = context.pluginManager.getLoadedPlugins();

  if (plugins.length === 0) {
    vscode.window.showInformationMessage('No plugins are currently loaded.');
    return;
  }

  const items = plugins.map((plugin: LoadedPlugin) => ({
    label: plugin.manifest.name,
    description: `v${plugin.manifest.version}`,
    detail: plugin.manifest.id,
    id: plugin.manifest.id
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a plugin to reload',
    canPickMany: false
  });

    if (selected) {
    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Reloading plugin: ${selected.label}`,
          cancellable: false
        },
        async () => {
          const extensionPath = vscode.extensions.getExtension('mkemp.flowguard')?.extensionPath || '';
          await context.pluginManager.reloadPlugin(
            selected.id,
            (manager, pluginId, extPath) => {
              return new PluginContextImpl(
                pluginId,
                context.storage,
                context.llmProvider,
                context.codebaseExplorer,
                context.workspaceRoot,
                extPath,
                manager
              );
            },
            extensionPath
          );
          
          // Refresh plugin contributions in consumers
          const agentIntegrations = context.pluginManager.getAgentIntegrations();
          AgentTemplates.setPluginIntegrations(agentIntegrations);
          
          const templates = context.pluginManager.getTemplates();
          TemplateEngine.setPluginTemplates(templates);
          TicketTemplates.setPluginTemplates(templates);
          
          const diagramTypes = context.pluginManager.getDiagramTypes();
          MermaidGenerator.setPluginDiagramTypes(diagramTypes);
        }
      );

      vscode.window.showInformationMessage(`Plugin ${selected.label} reloaded successfully.`);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to reload plugin: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
};

/**
 * Install a plugin from a directory
 */
export const installPluginCommand: CommandHandler = async (
  context: CommandContext
): Promise<void> => {
  const options: vscode.OpenDialogOptions = {
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: 'Select Plugin Directory',
    title: 'Install FlowGuard Plugin'
  };

  const selected = await vscode.window.showOpenDialog(options);

  if (!selected || selected.length === 0) {
    return;
  }

  const selectedUri = selected[0];
  if (!selectedUri) {
    return;
  }

  const sourceDir = selectedUri.fsPath;
  const manifestPath = path.join(sourceDir, 'plugin.json');

  // Validate plugin
  try {
    const manifestContent = await fs.promises.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    if (!manifest.id || !manifest.name || !manifest.version) {
      vscode.window.showErrorMessage('Invalid plugin: Missing required fields in plugin.json');
      return;
    }

    // Confirm installation
    const confirmation = await vscode.window.showWarningMessage(
      `Install plugin "${manifest.name}" v${manifest.version}?`,
      { modal: true },
      'Install',
      'Cancel'
    );

    if (confirmation !== 'Install') {
      return;
    }

    // Copy plugin to plugins directory
    const pluginsDir = context.pluginManager['pluginsDir'];
    const targetDir = path.join(pluginsDir, manifest.id);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Installing plugin: ${manifest.name}`,
        cancellable: false
      },
      async () => {
        // Create target directory
        await fs.promises.mkdir(targetDir, { recursive: true });

        // Copy files
        const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });
        for (const entry of entries) {
          const sourcePath = path.join(sourceDir, entry.name);
          const targetPath = path.join(targetDir, entry.name);

          if (entry.isDirectory()) {
            await fs.promises.cp(sourcePath, targetPath, { recursive: true });
          } else {
            await fs.promises.copyFile(sourcePath, targetPath);
          }
        }

        // Load the plugin
        const extensionPath = vscode.extensions.getExtension('mkemp.flowguard')?.extensionPath || '';
        await context.pluginManager.loadPlugin(
          targetDir,
          (manager, pluginId, extPath) => {
            return new PluginContextImpl(
              pluginId,
              context.storage,
              context.llmProvider,
              context.codebaseExplorer,
              context.workspaceRoot,
              extPath,
              manager
            );
          },
          extensionPath
        );
        
        // Refresh plugin contributions in consumers
        const agentIntegrations = context.pluginManager.getAgentIntegrations();
        AgentTemplates.setPluginIntegrations(agentIntegrations);
        
        const templates = context.pluginManager.getTemplates();
        TemplateEngine.setPluginTemplates(templates);
        TicketTemplates.setPluginTemplates(templates);
        
        const diagramTypes = context.pluginManager.getDiagramTypes();
        MermaidGenerator.setPluginDiagramTypes(diagramTypes);
      }
    );

    vscode.window.showInformationMessage(`Plugin "${manifest.name}" installed successfully.`);
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to install plugin: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Uninstall a plugin
 */
export const uninstallPluginCommand: CommandHandler = async (
  context: CommandContext
): Promise<void> => {
  const plugins = context.pluginManager.getLoadedPlugins();

  if (plugins.length === 0) {
    vscode.window.showInformationMessage('No plugins are currently loaded.');
    return;
  }

  const items = plugins.map((plugin: LoadedPlugin) => ({
    label: plugin.manifest.name,
    description: `v${plugin.manifest.version}`,
    detail: plugin.manifest.id,
    id: plugin.manifest.id
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a plugin to uninstall',
    canPickMany: false
  });

  if (!selected) {
    return;
  }

  // Confirm uninstallation
  const confirmation = await vscode.window.showWarningMessage(
    `Are you sure you want to uninstall "${selected.label}"? This cannot be undone.`,
    { modal: true },
    'Uninstall',
    'Cancel'
  );

  if (confirmation !== 'Uninstall') {
    return;
  }

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Uninstalling plugin: ${selected.label}`,
        cancellable: false
      },
      async () => {
await context.pluginManager.unloadPlugin(selected.id);

          // Delete plugin directory
          const pluginsDir = context.pluginManager['pluginsDir'];
          const pluginDir = path.join(pluginsDir, selected.id);
          await fs.promises.rm(pluginDir, { recursive: true, force: true });
          
          // Refresh plugin contributions in consumers
          const agentIntegrations = context.pluginManager.getAgentIntegrations();
          AgentTemplates.setPluginIntegrations(agentIntegrations);
          
          const templates = context.pluginManager.getTemplates();
          TemplateEngine.setPluginTemplates(templates);
          TicketTemplates.setPluginTemplates(templates);
          
          const diagramTypes = context.pluginManager.getDiagramTypes();
          MermaidGenerator.setPluginDiagramTypes(diagramTypes);
      }
    );

    vscode.window.showInformationMessage(`Plugin "${selected.label}" uninstalled successfully.`);
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to uninstall plugin: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Reload all plugins
 */
export const reloadAllPluginsCommand: CommandHandler = async (
  context: CommandContext
): Promise<void> => {
  const plugins = context.pluginManager.getLoadedPlugins();

  if (plugins.length === 0) {
    vscode.window.showInformationMessage('No plugins are currently loaded.');
    return;
  }

  const confirmation = await vscode.window.showWarningMessage(
    `Reload all ${plugins.length} plugins?`,
    { modal: true },
    'Reload All',
    'Cancel'
  );

  if (confirmation !== 'Reload All') {
    return;
  }

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Reloading all plugins',
        cancellable: false
      },
      async () => {
        // Unload all plugins
        await context.pluginManager.unloadAllPlugins();

// Reload all plugins
         const extensionPath = vscode.extensions.getExtension('mkemp.flowguard')?.extensionPath || '';
         await context.pluginManager.loadPlugins(
           (manager, pluginId, extPath) => {
             return new PluginContextImpl(
               pluginId,
               context.storage,
               context.llmProvider,
               context.codebaseExplorer,
               context.workspaceRoot,
               extPath,
               manager
             );
           },
           extensionPath
         );
         
         // Refresh plugin contributions in consumers
         const agentIntegrations = context.pluginManager.getAgentIntegrations();
         AgentTemplates.setPluginIntegrations(agentIntegrations);
         
         const templates = context.pluginManager.getTemplates();
         TemplateEngine.setPluginTemplates(templates);
         TicketTemplates.setPluginTemplates(templates);
         
         const diagramTypes = context.pluginManager.getDiagramTypes();
         MermaidGenerator.setPluginDiagramTypes(diagramTypes);
      }
    );

    const loadedCount = context.pluginManager.getLoadedPlugins().length;
    vscode.window.showInformationMessage(`Reloaded ${loadedCount} plugins successfully.`);
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to reload plugins: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
