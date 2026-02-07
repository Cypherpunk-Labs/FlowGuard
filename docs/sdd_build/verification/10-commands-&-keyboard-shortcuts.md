I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
## Comment 1: Keyboard shortcuts conflict and misalign with requested mappings

In `package.json` update the `flowguard.createSpec` keybinding to the requested `cmd+shift+f` (or confirm an alternative if avoiding VS Code defaults). Ensure no two commands share the same chord: pick distinct keys for `flowguard.createEpic`, `flowguard.showExecution`, `flowguard.verifyChanges`, and `flowguard.showVerification` so each has a unique binding. Test on macOS/Windows to confirm they appear in Keyboard Shortcuts with no conflicts.

### Referred Files
- {WORKSPACE}/package.json
---
## Comment 2: Handoff preview buttons don’t work (no VS Code API bridge)

In `handoffCommands.ts`, when creating the webview panel, set `enableScripts: true` (already done) and add a `panel.webview.onDidReceiveMessage` handler to process `{type:'copy'|'save', content}` messages. In the HTML, define `const vscode = acquireVsCodeApi();` before calling `vscode.postMessage`. For copy, call `vscode.env.clipboard.writeText` or reuse `copyHandoffToClipboardCommand`; for save, prompt with `showSaveDialog` and write the file. Confirm both buttons now function.

### Referred Files
- {WORKSPACE}/src/commands/handoffCommands.ts
---
## Comment 3: GitHub/GitLab verification paths are stubbed out

Implement PR/MR fetching or disable the options. For GitHub/GitLab selections, either integrate the appropriate adapter to fetch diffs and populate `diffContent`, or hide those choices until supported. Ensure the command proceeds to verification rather than early-returning with a placeholder message.

### Referred Files
- {WORKSPACE}/src/commands/verificationCommands.ts
---
## Comment 4: Epic creation does not run the planned workflow

Extend `createEpicCommand` to call `workflowOrchestrator.executeWorkflow` (or equivalent) after capturing the title/overview, surface progress via `withProgress`, and handle clarification prompts. Save produced specs/tickets via `ArtifactStorage` and refresh the sidebar once artifacts are created, matching the planned epic creation workflow.

### Referred Files
- {WORKSPACE}/src/commands/epicCommands.ts
---