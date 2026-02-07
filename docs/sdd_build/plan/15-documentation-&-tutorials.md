I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

## Observations

FlowGuard has a solid foundation with existing README files in subdirectories (`file:src/plugins/README.md`, `file:src/ui/editors/README.md`, `file:tests/README.md`). The `file:package.json` defines comprehensive configuration options, commands, and keybindings. The main `file:README.md` is minimal and needs expansion. The codebase has well-defined models (`file:src/core/models/Epic.ts`, `file:src/core/models/Spec.ts`) and a robust plugin system (`file:src/plugins/types.ts`). Documentation should leverage these existing patterns while filling gaps in user-facing guides, tutorials, and reference materials.

## Approach

Create a comprehensive documentation suite organized into four main categories: **Getting Started** (installation, first epic, configuration), **User Guides** (workflow-focused tutorials), **Reference** (technical specifications), and **Advanced** (plugin development, customization). Implement an interactive tutorial system in `file:src/tutorials/TutorialManager.ts` that guides users through key workflows step-by-step. Leverage existing README files as foundation and expand with practical examples, troubleshooting, and FAQ. Documentation will use Markdown with Mermaid diagrams for visual clarity and code examples from actual implementation.

## Implementation Steps

### 1. Getting Started Documentation

**Create `docs/getting-started/` directory structure:**

- **`docs/getting-started/installation.md`**: Installation guide covering VS Code Marketplace installation (future), VSIX installation, and prerequisites. Include screenshots of extension activation and initial setup wizard.

- **`docs/getting-started/first-epic.md`**: Step-by-step tutorial for creating first epic using `flowguard.createEpic` command. Cover epic initialization, `.flowguard/` folder structure, `epic.json` metadata, and basic navigation in sidebar.

- **`docs/getting-started/configuration.md`**: Configuration guide covering:
  - LLM provider setup (OpenAI, Anthropic, Local) via `flowguard.llm.provider`
  - API key storage using `FlowGuard: Enter API Key` command and `file:src/core/config/SecureStorage.ts`
  - Template customization via `flowguard.templates.defaultAgent`
  - Codebase scanning settings (`flowguard.codebase.maxFilesToScan`, exclude patterns)
  - Include configuration examples and validation tips

- **`docs/getting-started/quick-reference.md`**: One-page cheat sheet with:
  - Essential keyboard shortcuts (Cmd+Shift+D for new spec, Cmd+Shift+T for new ticket, etc.)
  - Common commands from `file:package.json` contributes.commands
  - Sidebar navigation overview
  - File structure reference (`.flowguard/specs/`, `.flowguard/tickets/`, `.flowguard/executions/`)

### 2. User Guides

**Create `docs/guides/` directory with workflow-focused tutorials:**

- **`docs/guides/creating-epics.md`**: Comprehensive guide covering:
  - Epic creation workflow using `file:src/commands/epicCommands.ts`
  - Epic metadata management (`file:src/core/storage/EpicMetadataManager.ts`)
  - Phase organization and deliverables
  - Epic status transitions (draft → planning → in_progress → completed)
  - Include Mermaid sequence diagram showing epic creation flow

- **`docs/guides/specs-and-tickets.md`**: Guide for spec/ticket lifecycle:
  - Creating specs via `flowguard.createSpec` command
  - Spec editor features (`file:src/ui/editors/SpecEditorProvider.ts`)
  - Frontmatter fields (title, status, tags, author) using `file:src/core/parsers/frontmatter.ts`
  - Ticket generation from specs using `file:src/planning/TicketGenerator.ts`
  - Ticket breakdown and acceptance criteria
  - Status workflows (Draft → Approved for specs, To Do → Done for tickets)
  - Reference resolution (`spec:`, `ticket:`, `file:`) via `file:src/core/references/ReferenceResolver.ts`

- **`docs/guides/handoff-workflow.md`**: Agent handoff guide:
  - Generating handoffs using `flowguard.generateHandoff` command
  - Agent template selection (Cursor, Claude, Windsurf, Cline, Aider) from `file:src/handoff/AgentTemplates.ts`
  - Template customization via `file:src/handoff/TemplateEngine.ts`
  - Preview mode and clipboard copy
  - Execution tracking (`file:src/handoff/ExecutionTracker.ts`)
  - Include example handoff markdown for each agent type

- **`docs/guides/verification.md`**: Verification workflow guide:
  - Running verification via `flowguard.verifyChanges` command
  - Diff input formats (Git diff, GitHub PR, GitLab MR) using adapters in `file:src/verification/adapters/`
  - Understanding verification results (`file:src/ui/views/VerificationViewProvider.ts`)
  - Severity levels (Critical/High/Medium/Low) from `file:src/verification/SeverityRater.ts`
  - Applying auto-fixes and ignoring issues
  - Approval workflow (Approve with Conditions, Request Changes)
  - Include Mermaid flowchart showing verification process

- **`docs/guides/template-customization.md`**: Template customization guide:
  - Custom template directory setup (`flowguard.templates.customPath`)
  - Template variable syntax and substitution
  - Creating custom agent templates
  - Spec/ticket template customization
  - Template validation and testing

- **`docs/guides/codebase-exploration.md`**: Codebase scanning guide:
  - How `file:src/planning/codebase/CodebaseExplorer.ts` works
  - Include/exclude patterns configuration
  - Symbol extraction (TypeScript via `file:src/planning/codebase/TypeScriptAnalyzer.ts`, Tree-sitter for other languages)
  - Dependency graph visualization
  - Performance optimization tips

### 3. Reference Documentation

**Create `docs/reference/` directory with technical specifications:**

- **`docs/reference/configuration.md`**: Complete configuration reference:
  - Table of all configuration options from `file:package.json` contributes.configuration
  - Each option with: name, type, default value, description, example
  - Environment variable overrides (e.g., `FLOWGUARD_LLM_PROVIDER`)
  - Configuration migration guide using `file:src/core/config/migration.ts`
  - Configuration validation rules from `file:src/core/config/validators.ts`

- **`docs/reference/keyboard-shortcuts.md`**: Complete keyboard shortcut reference:
  - Table of all keybindings from `file:package.json` contributes.keybindings
  - Organized by category (Epic Management, Spec/Ticket, Verification, Navigation)
  - Platform-specific shortcuts (Mac vs Windows/Linux)
  - Customization instructions

- **`docs/reference/commands.md`**: Command palette reference:
  - All commands from `file:package.json` contributes.commands
  - Command descriptions, parameters, and usage examples
  - Context-aware command availability (when clauses)
  - Command implementation references to `file:src/commands/`

- **`docs/reference/api.md`**: Plugin API reference:
  - Core interfaces from `file:src/plugins/types.ts`
  - `FlowGuardPlugin`, `PluginContext`, `VerificationRule`, `AgentIntegration`, `DiagramType`, `TemplateContribution`
  - Method signatures with parameter descriptions
  - Return types and error handling
  - Code examples for each interface

- **`docs/reference/file-formats.md`**: Artifact file format reference:
  - Spec file format (YAML frontmatter + Markdown)
  - Ticket file format (YAML frontmatter + Markdown)
  - Execution file format
  - `epic.json` schema
  - Frontmatter field reference with validation rules from `file:src/core/models/validators.ts`

- **`docs/reference/architecture.md`**: System architecture documentation:
  - High-level architecture diagram (Mermaid)
  - Module breakdown (core, planning, verification, handoff, ui, plugins)
  - Data flow diagrams
  - Storage layer architecture (`file:src/core/storage/ArtifactStorage.ts`)
  - LLM provider abstraction (`file:src/llm/BaseProvider.ts`, `file:src/llm/ProviderFactory.ts`)

### 4. Advanced Guides

**Create `docs/advanced/` directory for advanced topics:**

- **`docs/advanced/plugin-development.md`**: Expand existing `file:src/plugins/README.md`:
  - Plugin lifecycle (loading, activation, deactivation)
  - Plugin manager internals (`file:src/plugins/PluginManager.ts`)
  - Plugin context API deep dive
  - Security considerations (`file:src/plugins/security/PluginValidator.ts`)
  - Plugin testing strategies
  - Publishing and distribution
  - Include complete example plugin walkthrough

- **`docs/advanced/custom-verification-rules.md`**: Verification rule development:
  - `VerificationRule` interface implementation
  - Validation context usage
  - Issue creation and severity assignment
  - Auto-fix implementation patterns
  - Testing verification rules
  - Integration with `file:src/verification/VerificationEngine.ts`
  - Example rules from `file:src/plugins/examples/security-plugin/rules/`

- **`docs/advanced/llm-integration.md`**: LLM provider integration:
  - LLM provider architecture (`file:src/llm/types.ts`)
  - Implementing custom providers (extend `file:src/llm/BaseProvider.ts`)
  - Provider configuration and API key management
  - Streaming responses and token management
  - Error handling and retry logic
  - Local LLM setup (`file:src/llm/providers/LocalLLMProvider.ts`)
  - Prompt engineering best practices

- **`docs/advanced/custom-agents.md`**: Custom agent integration:
  - Agent template structure
  - Template variable system (`file:src/handoff/TemplateEngine.ts`)
  - Preprocessor and postprocessor hooks
  - Agent-specific formatting requirements
  - Testing custom agents
  - Example templates from `file:src/handoff/AgentTemplates.ts`

- **`docs/advanced/extending-ui.md`**: UI extension guide:
  - Webview architecture overview
  - Svelte component development
  - Message passing protocol between extension and webviews
  - Custom editor development (extending `file:src/ui/editors/SpecEditorProvider.ts`)
  - Sidebar customization (`file:src/ui/sidebar/SidebarProvider.ts`)
  - Styling with VS Code theme variables

### 5. Interactive Tutorial System

**Implement `src/tutorials/TutorialManager.ts`:**

- **Tutorial Manager Class**:
  - `TutorialManager` singleton managing tutorial state
  - Tutorial step tracking (current step, completed steps, progress)
  - Integration with VS Code walkthrough API
  - Tutorial data persistence in workspace state

- **Tutorial Step Interface**:
  ```typescript
  interface TutorialStep {
    id: string;
    title: string;
    description: string;
    action: TutorialAction;
    validation: () => Promise<boolean>;
    hints: string[];
  }
  ```

- **Tutorial Actions**:
  - `CommandAction`: Execute VS Code command
  - `FileOpenAction`: Open specific file
  - `InputAction`: Wait for user input
  - `ValidationAction`: Check condition before proceeding

- **Built-in Tutorials**:
  - **First Epic Tutorial**: Guide through creating first epic, spec, and ticket
  - **Handoff Tutorial**: Generate and copy handoff to clipboard
  - **Verification Tutorial**: Run verification on sample changes
  - **Plugin Tutorial**: Install and configure example security plugin

- **Tutorial UI**:
  - Progress indicator in sidebar
  - Step-by-step instructions panel
  - "Next" and "Skip" buttons
  - Completion celebration and next steps

- **Tutorial Registration**:
  - Register tutorials in `file:src/extension.ts` activation
  - Command: `flowguard.startTutorial` with tutorial ID parameter
  - Welcome screen integration for first-time users

### 6. Troubleshooting Guide

**Create `docs/troubleshooting.md`:**

- **Common Issues Section**:
  - Extension not activating: Check VS Code version compatibility, output channel logs
  - LLM provider errors: API key validation, network connectivity, rate limits
  - Codebase scan timeout: Adjust `flowguard.codebase.maxFilesToScan`, exclude patterns
  - Plugin loading failures: Manifest validation, dependency issues
  - Verification not running: Check diff format, spec references
  - Auto-save not working: Check `flowguard.editor.autoSave` setting

- **Debugging Section**:
  - Enable debug logging: `flowguard.general.logLevel` = `DEBUG`
  - View output channel: "FlowGuard" in Output panel
  - Check extension logs: Developer Tools console
  - Git integration issues: Verify `simple-git` configuration

- **Performance Issues**:
  - Slow codebase scanning: Incremental scan settings, file exclusions
  - High memory usage: Reduce `maxFilesToScan`, clear cache
  - Webview rendering lag: Disable diagram preview, reduce artifact count

- **Error Messages Reference**:
  - Table of common error codes with explanations and solutions
  - Links to relevant documentation sections

### 7. FAQ

**Create `docs/faq.md`:**

- **General Questions**:
  - What is FlowGuard? How does it differ from other project management tools?
  - Which AI agents are supported? (Cursor, Claude, Windsurf, Cline, Aider)
  - Can I use FlowGuard without an LLM provider? (Limited functionality)
  - Is my code sent to external servers? (Only if using cloud LLM providers)

- **Usage Questions**:
  - How do I organize large projects with multiple epics?
  - Can I customize spec/ticket templates? (Yes, via custom templates)
  - How do I share epics with team members? (Git-based workflow)
  - Can I import existing specs/tickets? (Manual migration guide)

- **Technical Questions**:
  - Which programming languages are supported for codebase scanning? (TypeScript, JavaScript, Python, Java, Go, Rust via Tree-sitter)
  - Can I use multiple LLM providers? (Switch via configuration)
  - How are API keys stored? (VS Code SecretStorage API)
  - Can I run FlowGuard in remote workspaces? (Yes, with limitations)

- **Plugin Questions**:
  - How do I install third-party plugins? (`flowguard.installPlugin` command)
  - Are plugins sandboxed? (No, full VS Code API access)
  - Can I disable specific verification rules? (Yes, via `flowguard.plugins.verificationRules`)

### 8. Documentation Infrastructure

**Update main `README.md`:**

- Expand overview with feature highlights and screenshots
- Add "Quick Start" section linking to `docs/getting-started/installation.md`
- Add "Documentation" section with links to all doc categories
- Add "Contributing" section (future)
- Add badges (version, license, build status)

**Create `docs/README.md` (documentation index):**

- Overview of documentation structure
- Quick links to most common guides
- Search tips and navigation guide
- Contribution guidelines for documentation

**Create `docs/SUMMARY.md` (GitBook/Docusaurus compatible):**

- Hierarchical table of contents
- Organized by category (Getting Started, Guides, Reference, Advanced)
- Links to all documentation files

**Add documentation scripts to `package.json`:**

```json
"scripts": {
  "docs:serve": "docsify serve docs",
  "docs:build": "vuepress build docs",
  "docs:dev": "vuepress dev docs"
}
```

### 9. Code Examples and Snippets

**Create `docs/examples/` directory:**

- **`docs/examples/epic-templates/`**: Sample epic structures for common project types (web app, API, library)
- **`docs/examples/spec-templates/`**: Sample specs (feature spec, architecture spec, API spec)
- **`docs/examples/ticket-templates/`**: Sample tickets (bug fix, feature implementation, refactoring)
- **`docs/examples/plugin-examples/`**: Complete plugin examples (expand on `file:src/plugins/examples/`)
- **`docs/examples/handoff-examples/`**: Sample handoff documents for each agent type
- **`docs/examples/verification-examples/`**: Sample verification reports with different severity levels

### 10. Visual Assets

**Create `docs/assets/` directory:**

- **Screenshots**: Capture key UI elements (sidebar, spec editor, ticket editor, verification view, execution view)
- **Diagrams**: Create Mermaid diagrams for workflows (epic creation, handoff generation, verification)
- **Icons**: FlowGuard logo and icon variations
- **GIFs**: Animated demonstrations of key workflows (creating epic, generating handoff, running verification)

### 11. Tutorial Implementation Details

**File: `src/tutorials/TutorialManager.ts`**

- Import dependencies: `vscode`, `file:src/core/storage/ArtifactStorage.ts`, `file:src/utils/logger.ts`
- Implement `TutorialManager` class with methods:
  - `registerTutorial(tutorial: Tutorial): void`
  - `startTutorial(tutorialId: string): Promise<void>`
  - `nextStep(): Promise<void>`
  - `previousStep(): Promise<void>`
  - `skipTutorial(): void`
  - `completeTutorial(): void`
  - `getTutorialProgress(tutorialId: string): TutorialProgress`
- Implement tutorial step validation logic
- Create tutorial webview panel for step-by-step UI
- Persist tutorial progress in workspace state
- Emit events for tutorial lifecycle (started, step completed, finished)

**File: `src/tutorials/tutorials/FirstEpicTutorial.ts`**

- Define tutorial steps for creating first epic
- Step 1: Initialize epic (`flowguard.initializeEpic`)
- Step 2: Create spec (`flowguard.createSpec`)
- Step 3: Edit spec metadata
- Step 4: Create ticket from spec
- Step 5: Generate handoff
- Include validation for each step

**File: `src/tutorials/tutorials/VerificationTutorial.ts`**

- Define tutorial steps for verification workflow
- Step 1: Make code changes
- Step 2: Run verification (`flowguard.verifyChanges`)
- Step 3: Review verification results
- Step 4: Apply auto-fix
- Step 5: Approve changes

**Register tutorials in `src/extension.ts`:**

- Import `TutorialManager`
- Register tutorials during activation
- Add command `flowguard.startTutorial`
- Show welcome screen with tutorial links on first activation

### 12. Documentation Testing

**Create `docs/testing.md`:**

- Documentation review checklist
- Link validation (ensure all internal links work)
- Code example validation (ensure examples compile/run)
- Screenshot update process
- Documentation versioning strategy

**Add documentation linting:**

- Install `markdownlint` for Markdown linting
- Create `.markdownlint.json` configuration
- Add npm script: `"docs:lint": "markdownlint docs/**/*.md"`