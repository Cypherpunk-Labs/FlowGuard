I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
## Comment 1: Spec and ticket providers call non-existent `document.edit`, causing compilation/runtime failure when saving or updating

Replace each `document.edit` call in `src/ui/editors/SpecEditorProvider.ts` and `src/ui/editors/TicketEditorProvider.ts` with a `vscode.WorkspaceEdit` applied via `vscode.workspace.applyEdit`. Construct the full-range `WorkspaceEdit.replace` using the document URI and `new vscode.Range(0, 0, document.lineCount, 0)`, then apply it. Ensure subsequent webview messages are preserved.

### Referred Files
- /Users/mkemp/repos/tmp-traycer-cp/src/ui/editors/SpecEditorProvider.ts
- /Users/mkemp/repos/tmp-traycer-cp/src/ui/editors/TicketEditorProvider.ts
---
## Comment 2: Status/priority/assignee updates overwrite body markdown with empty content, losing user data

Capture the `content` returned by `parseFrontmatter` (e.g., `const { data, content: markdownContent } = parseFrontmatter(...)`) and pass that `markdownContent` to `serializeFrontmatter` instead of `(data.content as string)`. Apply the same fix in `_updateStatus`, `_updatePriority`, and `_updateAssignee` for tickets.

### Referred Files
- /Users/mkemp/repos/tmp-traycer-cp/src/ui/editors/SpecEditorProvider.ts
- /Users/mkemp/repos/tmp-traycer-cp/src/ui/editors/TicketEditorProvider.ts
---
## Comment 3: Toolbar buttons are inert; save/preview/export/approve/diagram actions never fire from UI

Emit a custom event from `Toolbar.svelte` (e.g., `dispatch('action', action.id)`) and listen in `SpecEditor.svelte`/`TicketEditor.svelte` to call `handleSave`, `togglePreview`, `set showDiagramInserter = true`, `handleExport`, and `handleApprove`. Also wire Diagram action to open the inserter modal.

### Referred Files
- /Users/mkemp/repos/tmp-traycer-cp/src/ui/editors/webview/components/Toolbar.svelte
- /Users/mkemp/repos/tmp-traycer-cp/src/ui/editors/webview/SpecEditor.svelte
- /Users/mkemp/repos/tmp-traycer-cp/src/ui/editors/webview/TicketEditor.svelte
---
## Comment 4: Ticket editor omits acceptance criteria, implementation steps, and testing checklist sections requested in the plan

Add dedicated components/sections in `TicketEditor.svelte` for acceptance criteria, implementation steps, and a testing checklist; bind them to ticket state, render editable lists with add/remove/reorder/check, and include them in the payload saved to the provider.

### Referred Files
- /Users/mkemp/repos/tmp-traycer-cp/src/ui/editors/webview/TicketEditor.svelte
---
## Comment 5: Mermaid diagram preview is missing; preview panels render plain HTML without diagram rendering

Integrate Mermaid rendering in `PreviewPanel.svelte` (load mermaid, call `mermaid.init` on rendered content) and/or in provider preview responses. Add live diagram preview to `DiagramInserter.svelte` using Mermaid on the textarea content. Ensure CSP allows the script or bundle Mermaid with the webview.

### Referred Files
- /Users/mkemp/repos/tmp-traycer-cp/src/ui/editors/webview/components/PreviewPanel.svelte
- /Users/mkemp/repos/tmp-traycer-cp/src/ui/editors/webview/components/DiagramInserter.svelte
- /Users/mkemp/repos/tmp-traycer-cp/src/ui/editors/SpecEditorProvider.ts
- /Users/mkemp/repos/tmp-traycer-cp/src/ui/editors/TicketEditorProvider.ts
---