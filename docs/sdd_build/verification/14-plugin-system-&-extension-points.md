I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
## Comment 1: Plugin contexts are created with empty pluginId so logging and contribution ownership tracking are lost

Update `PluginManager.loadPlugin` to call the context factory with the current plugin’s manifest ID, e.g., pass `manifest.id` into `PluginContextImpl`. Change the factory signature accordingly in `PluginManager.loadPlugins`, `extension.ts`, and `pluginCommands.ts` (reload/install/reloadAll) so each plugin receives its own ID and extensionPath. Ensure `PluginContextImpl` stores that ID and uses it for logger prefixes and registration calls.

### Referred Files
- {WORKSPACE}/src/plugins/PluginManager.ts
- {WORKSPACE}/src/extension.ts
- {WORKSPACE}/src/commands/pluginCommands.ts
---
## Comment 2: Plugin unload/reload does not remove registered contributions, leading to duplicate-ID errors on reload

Track contribution ownership by plugin ID (store pluginId alongside each registered rule/integration/template/diagram). Implement `removePluginContributions` to delete all entries registered by the target plugin. Call it from `unloadPlugin` before deleting the plugin. This clears the registry so `reloadPlugin` can re-register without duplicate-ID failures and ensures unload truly disables the plugin’s contributions.

### Referred Files
- {WORKSPACE}/src/plugins/PluginManager.ts
- {WORKSPACE}/src/commands/pluginCommands.ts
---
## Comment 3: Non-verification plugin contributions are not integrated, so agent integrations/templates/diagrams never take effect

Wire plugin registries into their consumers: extend `AgentTemplates` to merge `pluginManager.getAgentIntegrations()` into available templates, expose plugin templates to the template engine, and register plugin diagram types with the diagram generator. Ensure these are pulled from `PluginManager` during initialization and refreshed on plugin load/unload. Add minimal UI/command surface if needed to surface plugin-provided options.

### Referred Files
- {WORKSPACE}/src/plugins/PluginManager.ts
- {WORKSPACE}/src/handoff/AgentTemplates.ts
- {WORKSPACE}/src/handoff/TemplateEngine.ts
---