import * as fs from 'fs';
import * as path from 'path';
import {
  FlowGuardPlugin,
  PluginManifest,
  LoadedPlugin,
  PluginStatus,
  VerificationRule,
  AgentIntegration,
  DiagramType,
  TemplateContribution,
} from './types';
import { PluginContextImpl } from './PluginContext';
import type { PluginContext } from './types';
import { log, error, warn, debug } from '../utils/logger';
import * as vscode from 'vscode';

interface PluginRegistry {
  verificationRules: Map<string, VerificationRule>;
  agentIntegrations: Map<string, AgentIntegration>;
  diagramTypes: Map<string, DiagramType>;
  templates: Map<string, TemplateContribution>;
}

interface ContributionOwnership {
  verificationRules: Map<string, string>; // ruleId -> pluginId
  agentIntegrations: Map<string, string>; // integrationId -> pluginId
  diagramTypes: Map<string, string>; // typeId -> pluginId
  templates: Map<string, string>; // templateId -> pluginId
}

/**
 * Manages plugin lifecycle, discovery, and registration
 */
export class PluginManager {
  private pluginsDir: string;
  private loadedPlugins: Map<string, LoadedPlugin> = new Map();
  private registry: PluginRegistry = {
    verificationRules: new Map(),
    agentIntegrations: new Map(),
    diagramTypes: new Map(),
    templates: new Map(),
  };
  private ownership: ContributionOwnership = {
    verificationRules: new Map(),
    agentIntegrations: new Map(),
    diagramTypes: new Map(),
    templates: new Map(),
  };
  private outputChannel: vscode.OutputChannel;

  constructor(pluginsDir: string) {
    this.pluginsDir = pluginsDir;
    this.outputChannel = vscode.window.createOutputChannel('FlowGuard Plugins');
  }

  /**
   * Discover and load all plugins from the plugins directory
   */
  async loadPlugins(
    pluginContextFactory: (manager: PluginManager, pluginId: string, extensionPath: string) => PluginContext,
    extensionPath: string
  ): Promise<void> {
    try {
      const exists = await fs.promises.access(this.pluginsDir).then(() => true).catch(() => false);
      if (!exists) {
        log('Plugins directory does not exist, skipping plugin loading');
        return;
      }

      const entries = await fs.promises.readdir(this.pluginsDir, { withFileTypes: true });
      const pluginDirs = entries.filter(entry => entry.isDirectory());

      log(`Found ${pluginDirs.length} potential plugin directories`);

      for (const dir of pluginDirs) {
        const pluginPath = path.join(this.pluginsDir, dir.name);
        await this.loadPlugin(pluginPath, pluginContextFactory, extensionPath);
      }

      log(`Loaded ${this.loadedPlugins.size} plugins successfully`);
      this.outputChannel.appendLine(`Loaded ${this.loadedPlugins.size} plugins:`);
      for (const [id, plugin] of this.loadedPlugins) {
        this.outputChannel.appendLine(`  - ${plugin.manifest.name} (${id}) v${plugin.manifest.version} - ${plugin.status}`);
      }
    } catch (err) {
      error(`Failed to load plugins: ${err instanceof Error ? err.message : String(err)}`);
      vscode.window.showErrorMessage('Failed to load FlowGuard plugins. Check the output channel for details.');
    }
  }

  /**
   * Load a single plugin from a directory
   */
  async loadPlugin(
    pluginPath: string,
    pluginContextFactory: (manager: PluginManager, pluginId: string, extensionPath: string) => PluginContext,
    extensionPath: string
  ): Promise<void> {
    const manifestPath = path.join(pluginPath, 'plugin.json');

    try {
      // Check if manifest exists
      const manifestExists = await fs.promises.access(manifestPath).then(() => true).catch(() => false);
      if (!manifestExists) {
        warn(`No plugin.json found in ${pluginPath}, skipping`);
        return;
      }

      // Read and parse manifest
      const manifestContent = await fs.promises.readFile(manifestPath, 'utf-8');
      const manifest: PluginManifest = JSON.parse(manifestContent);

      // Validate manifest
      this.validateManifest(manifest);

      // Check if already loaded
      if (this.loadedPlugins.has(manifest.id)) {
        warn(`Plugin ${manifest.id} is already loaded, skipping`);
        return;
      }

      // Check FlowGuard version compatibility
      if (!this.checkVersionCompatibility(manifest)) {
        warn(`Plugin ${manifest.id} requires incompatible FlowGuard version: ${manifest.engines?.flowguard}`);
        return;
      }

      // Create loaded plugin entry
      const loadedPlugin: LoadedPlugin = {
        manifest,
        instance: null as any, // Will be set after loading
        status: 'loading',
        path: pluginPath,
        loadedAt: new Date(),
      };

      this.loadedPlugins.set(manifest.id, loadedPlugin);

      // Load plugin entry point
      const entryPoint = path.join(pluginPath, manifest.main);
      const entryExists = await fs.promises.access(entryPoint).then(() => true).catch(() => false);

      if (!entryExists) {
        throw new Error(`Plugin entry point not found: ${manifest.main}`);
      }

      // Load plugin module
      const pluginModule = require(entryPoint);
      const pluginConstructor = pluginModule.default || pluginModule;

      if (typeof pluginConstructor !== 'function') {
        throw new Error('Plugin must export a class or function as default');
      }

      // Instantiate plugin
      const pluginInstance: FlowGuardPlugin = new pluginConstructor();

      // Validate plugin interface
      this.validatePluginInterface(pluginInstance, manifest.id);

      loadedPlugin.instance = pluginInstance;

      // Create plugin context with proper pluginId and extensionPath
      const context = pluginContextFactory(this, manifest.id, extensionPath);

      // Activate plugin
      log(`Activating plugin: ${manifest.id}`);
      await pluginInstance.activate(context);

      loadedPlugin.status = 'active';
      log(`Plugin ${manifest.id} activated successfully`);
      this.outputChannel.appendLine(`Activated plugin: ${manifest.name} v${manifest.version}`);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      error(`Failed to load plugin from ${pluginPath}: ${errorMsg}`);

      // Find and update plugin status if it was registered
      for (const [id, plugin] of this.loadedPlugins) {
        if (plugin.path === pluginPath) {
          plugin.status = 'error';
          plugin.error = errorMsg;
          break;
        }
      }

      vscode.window.showWarningMessage(`Failed to load plugin: ${errorMsg}`);
    }
  }

  /**
   * Unload a plugin by ID
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      warn(`Plugin ${pluginId} not found, cannot unload`);
      return;
    }

    try {
      // Deactivate plugin
      if (plugin.status === 'active' && plugin.instance) {
        log(`Deactivating plugin: ${pluginId}`);
        await plugin.instance.deactivate();
      }

      // Remove contributions
      this.removePluginContributions(pluginId);

      // Remove from registry
      this.loadedPlugins.delete(pluginId);

      log(`Plugin ${pluginId} unloaded successfully`);
      this.outputChannel.appendLine(`Unloaded plugin: ${plugin.manifest.name}`);
    } catch (err) {
      error(`Error unloading plugin ${pluginId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Reload a plugin by ID
   */
  async reloadPlugin(
    pluginId: string,
    pluginContextFactory: (manager: PluginManager, pluginId: string, extensionPath: string) => PluginContext,
    extensionPath: string
  ): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    const pluginPath = plugin.path;
    await this.unloadPlugin(pluginId);

    // Clear require cache
    const entryPoint = path.join(pluginPath, plugin.manifest.main);
    delete require.cache[require.resolve(entryPoint)];

    await this.loadPlugin(pluginPath, pluginContextFactory, extensionPath);
  }

  /**
   * Unload all plugins
   */
  async unloadAllPlugins(): Promise<void> {
    const pluginIds = Array.from(this.loadedPlugins.keys());
    for (const pluginId of pluginIds) {
      await this.unloadPlugin(pluginId);
    }
    log('All plugins unloaded');
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): LoadedPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Get a plugin by ID
   */
  getPluginById(id: string): LoadedPlugin | undefined {
    return this.loadedPlugins.get(id);
  }

  /**
   * Register a verification rule
   */
  registerVerificationRule(rule: VerificationRule, pluginId?: string): void {
    if (this.registry.verificationRules.has(rule.id)) {
      throw new Error(`Verification rule ${rule.id} is already registered`);
    }

    this.registry.verificationRules.set(rule.id, rule);
    if (pluginId) {
      this.ownership.verificationRules.set(rule.id, pluginId);
    }
    debug(`Registered verification rule: ${rule.id}${pluginId ? ` (from ${pluginId})` : ''}`);
  }

  /**
   * Register an agent integration
   */
  registerAgentIntegration(integration: AgentIntegration, pluginId?: string): void {
    if (this.registry.agentIntegrations.has(integration.id)) {
      throw new Error(`Agent integration ${integration.id} is already registered`);
    }

    this.registry.agentIntegrations.set(integration.id, integration);
    if (pluginId) {
      this.ownership.agentIntegrations.set(integration.id, pluginId);
    }
    debug(`Registered agent integration: ${integration.id}${pluginId ? ` (from ${pluginId})` : ''}`);
  }

  /**
   * Register a diagram type
   */
  registerDiagramType(type: DiagramType, pluginId?: string): void {
    if (this.registry.diagramTypes.has(type.id)) {
      throw new Error(`Diagram type ${type.id} is already registered`);
    }

    this.registry.diagramTypes.set(type.id, type);
    if (pluginId) {
      this.ownership.diagramTypes.set(type.id, pluginId);
    }
    debug(`Registered diagram type: ${type.id}${pluginId ? ` (from ${pluginId})` : ''}`);
  }

  /**
   * Register a template contribution
   */
  registerTemplate(template: TemplateContribution, pluginId?: string): void {
    if (this.registry.templates.has(template.id)) {
      throw new Error(`Template ${template.id} is already registered`);
    }

    this.registry.templates.set(template.id, template);
    if (pluginId) {
      this.ownership.templates.set(template.id, pluginId);
    }
    debug(`Registered template: ${template.id}${pluginId ? ` (from ${pluginId})` : ''}`);
  }

  /**
   * Get all registered verification rules
   */
  getVerificationRules(): VerificationRule[] {
    return Array.from(this.registry.verificationRules.values());
  }

  /**
   * Get all registered agent integrations
   */
  getAgentIntegrations(): AgentIntegration[] {
    return Array.from(this.registry.agentIntegrations.values());
  }

  /**
   * Get all registered diagram types
   */
  getDiagramTypes(): DiagramType[] {
    return Array.from(this.registry.diagramTypes.values());
  }

  /**
   * Get all registered templates
   */
  getTemplates(): TemplateContribution[] {
    return Array.from(this.registry.templates.values());
  }

  /**
   * Get a specific verification rule by ID
   */
  getVerificationRule(id: string): VerificationRule | undefined {
    return this.registry.verificationRules.get(id);
  }

  /**
   * Get a specific agent integration by ID
   */
  getAgentIntegration(id: string): AgentIntegration | undefined {
    return this.registry.agentIntegrations.get(id);
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: PluginManifest): void {
    const requiredFields = ['id', 'name', 'version', 'description', 'main'];

    for (const field of requiredFields) {
      if (!(field in manifest)) {
        throw new Error(`Plugin manifest missing required field: ${field}`);
      }
    }

    // Validate semantic version format (simplified)
    const versionRegex = /^\d+\.\d+\.\d+/;
    if (!versionRegex.test(manifest.version)) {
      throw new Error(`Invalid version format: ${manifest.version}. Expected: x.x.x`);
    }

    // Validate ID format (alphanumeric, hyphens, dots)
    const idRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
    if (!idRegex.test(manifest.id)) {
      throw new Error(`Invalid plugin ID format: ${manifest.id}`);
    }
  }

  /**
   * Validate plugin implements required interface
   */
  private validatePluginInterface(plugin: FlowGuardPlugin, pluginId: string): void {
    const requiredMethods = ['activate', 'deactivate'];
    const requiredProps = ['id', 'name', 'version', 'description'];

    for (const method of requiredMethods) {
      if (typeof (plugin as any)[method] !== 'function') {
        throw new Error(`Plugin ${pluginId} missing required method: ${method}`);
      }
    }

    for (const prop of requiredProps) {
      if (!(prop in plugin)) {
        throw new Error(`Plugin ${pluginId} missing required property: ${prop}`);
      }
    }

    // Verify plugin ID matches manifest
    if (plugin.id !== pluginId) {
      throw new Error(`Plugin ID mismatch: manifest says ${pluginId}, plugin says ${plugin.id}`);
    }
  }

  /**
   * Check FlowGuard version compatibility
   */
  private checkVersionCompatibility(manifest: PluginManifest): boolean {
    if (!manifest.engines?.flowguard) {
      return true; // No version requirement specified
    }

    // Simplified version check - just check major version compatibility
    // In a real implementation, you'd use a proper semver library
    const requiredVersion = manifest.engines.flowguard;
    const currentVersion = '0.1.0'; // TODO: Get from package.json

    const requiredMajor = parseInt((requiredVersion || '0').replace(/[^0-9]/g, '').substring(0, 1));
    const currentMajor = parseInt(currentVersion.split('.')[0] || '0');

    // For now, just require major version match if using ^ or ~
    if (requiredVersion?.startsWith('^') || requiredVersion?.startsWith('~')) {
      return currentMajor >= requiredMajor;
    }

    return true;
  }

  /**
   * Remove all contributions from a plugin
   */
  private removePluginContributions(pluginId: string): void {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) return;

    // Remove verification rules registered by this plugin
    for (const [ruleId, ownerId] of this.ownership.verificationRules) {
      if (ownerId === pluginId) {
        this.registry.verificationRules.delete(ruleId);
        this.ownership.verificationRules.delete(ruleId);
        debug(`Removed verification rule ${ruleId} from plugin ${pluginId}`);
      }
    }

    // Remove agent integrations registered by this plugin
    for (const [integrationId, ownerId] of this.ownership.agentIntegrations) {
      if (ownerId === pluginId) {
        this.registry.agentIntegrations.delete(integrationId);
        this.ownership.agentIntegrations.delete(integrationId);
        debug(`Removed agent integration ${integrationId} from plugin ${pluginId}`);
      }
    }

    // Remove diagram types registered by this plugin
    for (const [typeId, ownerId] of this.ownership.diagramTypes) {
      if (ownerId === pluginId) {
        this.registry.diagramTypes.delete(typeId);
        this.ownership.diagramTypes.delete(typeId);
        debug(`Removed diagram type ${typeId} from plugin ${pluginId}`);
      }
    }

    // Remove templates registered by this plugin
    for (const [templateId, ownerId] of this.ownership.templates) {
      if (ownerId === pluginId) {
        this.registry.templates.delete(templateId);
        this.ownership.templates.delete(templateId);
        debug(`Removed template ${templateId} from plugin ${pluginId}`);
      }
    }
  }

  /**
   * Get plugin health status
   */
  getPluginHealth(): { id: string; status: PluginStatus; error?: string }[] {
    return Array.from(this.loadedPlugins.entries()).map(([id, plugin]) => ({
      id,
      status: plugin.status,
      error: plugin.error,
    }));
  }
}
