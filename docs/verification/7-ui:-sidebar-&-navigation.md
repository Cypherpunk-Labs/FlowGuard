I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
## Comment 1: Svelte store binding causes compile-time error for section expand/collapse controls

In `src/ui/sidebar/webview/App.svelte`, replace the `writable` stores for expand/collapse with assignable variables (e.g., `let specsExpanded = true`, etc.) or bind to store-backed variables via setters. Update `bind:expanded` usages to reference these writable variables so Svelte can generate two-way bindings without compile errors.

### Referred Files
- /Users/mkemp/repos/tmp-traycer-cp/src/ui/sidebar/webview/App.svelte
---
## Comment 2: Artifact metadata view omits required details and related links requested in plan

Augment `SpecList.svelte`, `TicketList.svelte`, and `ExecutionList.svelte` to render full metadata: display epic ID, created/updated timestamps, author/assignee, and clickable related artifacts (e.g., tickets for a spec, parent spec for a ticket, linked specs/tickets for an execution). Provide navigation by calling `openArtifact` when related items are clicked. Extend the data passed from `SidebarProvider` if needed (e.g., include related IDs) to populate these fields.

### Referred Files
- /Users/mkemp/repos/tmp-traycer-cp/src/ui/sidebar/webview/components/SpecList.svelte
- /Users/mkemp/repos/tmp-traycer-cp/src/ui/sidebar/webview/components/TicketList.svelte
- /Users/mkemp/repos/tmp-traycer-cp/src/ui/sidebar/webview/components/ExecutionList.svelte
- /Users/mkemp/repos/tmp-traycer-cp/src/ui/sidebar/SidebarProvider.ts
---