I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
## Comment 1: Plugin templates and diagram types registered but not integrated into consumers.

Fully resolve non-verification plugin contribution integration by wiring `TemplateContribution`s and `DiagramType`s into their consumers, building on the successful `AgentIntegration` and `VerificationRule` integrations.

**Full Context from Review Thread:**
Original concern: PluginManager collects but no consumers (AgentTemplates, TemplateEngine, diagram generators) use agent integrations/templates/diagrams, leaving them non-functional (only verification rules worked). Current status: Agent integrations merged via `AgentTemplates.setPluginIntegrations()` and used; verification rules executed in `VerificationEngine`. Remaining: templates/diagrams.

**Root Cause:** Missing consumer-side integration and post-load wiring in `extension.ts`.

**Concrete Steps:**
1. **Template Integration (`src/handoff/TemplateEngine.ts` & `src/planning/templates/TicketTemplates.ts`):**
   - Add static `pluginTemplates: Map<string, TemplateContribution>`.
   - Implement `static setPluginTemplates(templates: TemplateContribution[])`: clear map, populate by `type` ('spec'|'ticket'|'handoff'|'verification'), validate no ID conflicts.
   - Update template selection/retrieval methods (e.g., `getTemplates(type?: string)`) to merge built-in + pluginTemplates.
   - Expose `getPluginTemplates()` for debugging.

2. **Diagram Integration (`src/planning/diagrams/MermaidGenerator.ts` or new `DiagramRegistry`):**
   - Add static `pluginDiagramTypes: DiagramType[]`.
   - Implement `static setPluginDiagramTypes(types: DiagramType[])`: store, validate.
   - Extend `generateDiagram()` to select type via config/UI, dispatch to `type.generate(context)`.
   - Add `getSupportedDiagramTypes()` merging built-in + plugins.

3. **Wiring in `src/extension.ts`:**
   - After `pluginManager.loadPlugins(...)`, add:
     ```ts
     const templates = pluginManager.getTemplates();
     TemplateEngine.setPluginTemplates(templates);
     const diagramTypes = pluginManager.getDiagramTypes();
     MermaidGenerator.setPluginDiagramTypes(diagramTypes);
     ```
   - For refresh: in plugin reload/unload, re-call set methods.

4. **Bigger Picture:** Ensure `PluginManager.unloadPlugin()` triggers consumer refresh (call removePluginContributions then notify consumers). Add config `flowguard.plugins.templates.enabled`, etc. Update UI (`SidebarProvider`) to list plugin templates/diagrams.

5. **Testing:** Add unit tests for merging, duplicate handling, refresh on unload/reload. Integration test with example plugin providing template/diagram.

**Concise Fix Instructions:**
In `src/handoff/TemplateEngine.ts`, add `static pluginTemplates = new Map<string, TemplateContribution>(); static setPluginTemplates(templates: TemplateContribution[]) { /* clear & populate */ }`; update getters to merge.
In `src/planning/templates/TicketTemplates.ts`, mirror integration for ticket-type templates.
In `src/planning/diagrams/MermaidGenerator.ts`, add `static setPluginDiagramTypes(types: DiagramType[])`; extend generation dispatch.
In `src/extension.ts` ~line 134 after agent integrations: `TemplateEngine.setPluginTemplates(pluginManager.getTemplates()); MermaidGenerator.setPluginDiagramTypes(pluginManager.getDiagramTypes());`.

### Referred Files
- {WORKSPACE}/src/extension.ts
- {WORKSPACE}/src/handoff/TemplateEngine.ts
- {WORKSPACE}/src/planning/templates/TicketTemplates.ts
- {WORKSPACE}/src/planning/diagrams/MermaidGenerator.ts
- {WORKSPACE}/src/plugins/PluginManager.ts
---