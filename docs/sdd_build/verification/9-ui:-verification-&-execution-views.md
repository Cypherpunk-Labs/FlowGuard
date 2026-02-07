I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
## Comment 1: Issue actions do not fire because IssueList/IssueItem dispatch via window instead of Svelte events

In `src/ui/views/webview/components/IssueItem.svelte`, replace the `window.dispatchEvent` calls with `createEventDispatcher` and dispatch `applyFix`, `ignore`, and `openFile` events. In `IssueList.svelte`, use `createEventDispatcher` to forward these events upward (or bind `on:applyFix`/`on:ignore`/`on:openFile` directly to the child). In `VerificationView.svelte`, keep listening with `on:applyFix` and `on:ignore`, and add `on:openFile` if needed so the events propagate correctly.

### Referred Files
- {WORKSPACE}/src/ui/views/webview/components/IssueItem.svelte
- {WORKSPACE}/src/ui/views/webview/components/IssueList.svelte
- {WORKSPACE}/src/ui/views/webview/VerificationView.svelte
---
## Comment 2: Open File action is unhandled; events not forwarded and provider lacks handler

Add an `openFile` event dispatch in `IssueList.svelte` and bubble it to `VerificationView.svelte`. Extend `src/ui/views/types.ts` and `src/ui/views/webview/vscode.ts` with an `openFile` request carrying `filePath` and optional `lineNumber`, and add a corresponding case in `VerificationViewProvider._handleMessage` that opens the file via `vscode.workspace.openTextDocument`/`showTextDocument` and reveals the line. Wire `VerificationView` to listen for `on:openFile` from `IssueList` and call the new vscode bridge function.

### Referred Files
- {WORKSPACE}/src/ui/views/webview/components/IssueItem.svelte
- {WORKSPACE}/src/ui/views/webview/components/IssueList.svelte
- {WORKSPACE}/src/ui/views/VerificationViewProvider.ts
- {WORKSPACE}/src/ui/views/types.ts
- {WORKSPACE}/src/ui/views/webview/vscode.ts
---
## Comment 3: DiffSourceInfo imports undefined types DiffSource/DiffAnalysis causing compile failure

Define and export `DiffSource` and `DiffAnalysis` interfaces in `src/ui/views/types.ts` (matching the shape of `verification.diffSource` and `verification.analysis`), or import them from the correct source model if they already exist elsewhere. Update the import in `DiffSourceInfo.svelte` to point to the file that actually exports these types.

### Referred Files
- {WORKSPACE}/src/ui/views/webview/components/DiffSourceInfo.svelte
- {WORKSPACE}/src/ui/views/types.ts
---
## Comment 4: Auto-fix replaces entire file content instead of scoped change, risking data loss

In `src/ui/views/VerificationViewProvider.ts`, compute a targeted `Range` using the issue’s line/column or a provided fix range, and replace only that span. If only a snippet is available, insert/replace locally rather than the entire document. Guard when `codeExample` is missing and avoid replacing the whole file.

### Referred Files
- {WORKSPACE}/src/ui/views/VerificationViewProvider.ts
---
## Comment 5: Execution view assumes Date objects; string timestamps will throw in duration/formatting

Normalize `startedAt`/`completedAt` to `Date` instances immediately after loading (e.g., `const startedAt = new Date(execution.startedAt)`). Use these `Date` objects for `toISOString`, duration, and formatting, and handle invalid dates gracefully before posting to the webview.

### Referred Files
- {WORKSPACE}/src/ui/views/ExecutionViewProvider.ts
---