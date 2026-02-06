# FlowGuard Custom Editors

This document describes the architecture of the custom webview editors for specs and tickets in the FlowGuard VS Code extension.

## Overview

FlowGuard implements custom webview editors using VS Code's `CustomTextEditorProvider` API. These editors provide rich UI components for editing specifications and tickets with features like:

- Metadata editing panels
- Markdown content editors with toolbar
- Status workflow management
- Mermaid diagram insertion
- Live preview functionality
- Auto-save with debouncing

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Extension (extension.ts)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ SidebarProvider │  │ SpecEditorProvider│  │ TicketEditorProv.│  │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬────────┘  │
├───────────┼───────────────────┼───────────────────┼───────────┤
│           │                   │                   │           │
│      ArtifactStorage    ArtifactStorage    ArtifactStorage     │
│           │                   │                   │           │
│      VS Code CustomTextEditorProvider API                   │
└───────────┴───────────────────┴───────────────────┴───────────┘
```

## Editor Providers

### SpecEditorProvider (`src/ui/editors/SpecEditorProvider.ts`)

Implements `vscode.CustomTextEditorProvider` for spec editing:

- **File Pattern:** `**/specs/spec-*.md`
- **View Type:** `flowguard.specEditor`
- **Features:**
  - Load/save specs with frontmatter + markdown
  - Status workflow (Draft → In Review → Approved → Archived)
  - Approval workflow
  - Diagram insertion
  - Export to markdown/clipboard

### TicketEditorProvider (`src/ui/editors/TicketEditorProvider.ts`)

Implements `vscode.CustomTextEditorProvider` for ticket editing:

- **File Pattern:** `**/tickets/ticket-*.md`
- **View Type:** `flowguard.ticketEditor`
- **Features:**
  - Load/save tickets with frontmatter + markdown
  - Status workflow (To Do → In Progress → In Review → Done → Blocked)
  - Priority management (Low → Medium → High → Critical)
  - Assignee management
  - Estimated effort tracking
  - Diagram insertion

## Message Passing Protocol

Communication between editor providers and webviews uses JSON messages:

### Request Messages (Webview → Provider)

```typescript
interface LoadArtifactRequest { type: 'requestArtifactData' }
interface SaveArtifactRequest { type: 'saveArtifact'; content: string; metadata: Record<string, any> }
interface UpdateStatusRequest { type: 'updateStatus'; status: string; comment?: string }
interface InsertDiagramRequest { type: 'insertDiagram'; diagram: string; cursorPosition: number }
interface PreviewMarkdownRequest { type: 'previewMarkdown'; content: string }
interface ExportArtifactRequest { type: 'exportArtifact'; format: string }
interface ApproveArtifactRequest { type: 'approveArtifact'; approvedBy: string; comment?: string }
```

### Response Messages (Provider → Webview)

```typescript
interface ArtifactDataResponse { type: 'artifactData'; data: SpecEditorData | TicketEditorData }
interface SaveSuccessResponse { type: 'saveSuccess'; timestamp: string }
interface SaveErrorResponse { type: 'saveError'; message: string; canRetry: boolean }
interface StatusUpdateResponse { type: 'statusUpdated'; status: string; timestamp: string }
interface MarkdownPreviewResponse { type: 'markdownPreview'; html: string }
interface ExportResponse { type: 'exportComplete'; format: string; filePath?: string }
interface ApprovalResponse { type: 'approved'; specId: string; approvedBy: string; timestamp: string }
interface ErrorResponse { type: 'error'; message: string }
```

## Webview Components

### Shared Components (`src/ui/editors/webview/components/`)

| Component | Description |
|-----------|-------------|
| `MetadataPanel.svelte` | Form for editing artifact metadata fields |
| `MarkdownEditor.svelte` | Textarea with toolbar for markdown editing |
| `Toolbar.svelte` | Action buttons with loading states and shortcuts |
| `StatusWorkflow.svelte` | Visual status badges with transition buttons |
| `DiagramInserter.svelte` | Mermaid diagram template picker and editor |
| `PreviewPanel.svelte` | Markdown preview with diagram rendering |

### Editor Components

| Component | Description |
|-----------|-------------|
| `SpecEditor.svelte` | Main spec editor with metadata, status workflow, and markdown editor |
| `TicketEditor.svelte` | Main ticket editor with metadata, status workflow, and markdown editor |

## Auto-Save Behavior

Editors implement auto-save with debouncing:

- **Debounce Delay:** 30 seconds
- **Trigger:** Any content or metadata change
- **Behavior:**
  - Shows "Saving..." indicator during save
  - Displays "Saved at [timestamp]" on success
  - Shows error message on failure with retry option
  - Prevents navigation if unsaved changes exist

## Status Workflows

### Spec Status Flow

```
Draft → In Review → Approved → Archived
   ↓                      ↑
   └──────────────────────┘
```

### Ticket Status Flow

```
To Do → In Progress → In Review → Done
   ↑                        ↓
   └────── Blocked ←────────┘
```

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save | `Cmd+S` / `Ctrl+S` |
| Preview Toggle | `Cmd+Shift+P` |
| Export | `Cmd+Shift+E` |
| Approve (Spec) | `Cmd+Shift+A` |

## Diagram Insertion

The editors support inserting Mermaid diagrams:

1. Click "Insert Diagram" button in toolbar
2. Select diagram type (Architecture, Sequence, Flow, Class)
3. Choose a template or edit the code
4. Preview the rendered diagram
5. Click "Insert" to add to content

## Configuration Files

### Webpack (`webpack.webview.config.js`)

Configured to bundle multiple webview entry points:

```javascript
entry: {
  sidebar: './src/ui/sidebar/webview/main.ts',
  specEditor: './src/ui/editors/webview/specEditorMain.ts',
  ticketEditor: './src/ui/editors/webview/ticketEditorMain.ts'
}
```

### Package.json

Custom editor contributions:

```json
"customEditors": [
  {
    "viewType": "flowguard.specEditor",
    "displayName": "FlowGuard Spec Editor",
    "selector": [{ "filenamePattern": "**/specs/spec-*.md" }]
  },
  {
    "viewType": "flowguard.ticketEditor",
    "displayName": "FlowGuard Ticket Editor",
    "selector": [{ "filenamePattern": "**/tickets/ticket-*.md" }]
  }
]
```

## Extension Points

To customize or extend the editors:

1. **Add new actions** to the Toolbar component
2. **Extend metadata schemas** in the editor Svelte files
3. **Add new diagram templates** in DiagramInserter
4. **Customize status workflows** in StatusWorkflow component
5. **Add new validators** in `src/ui/editors/utils/validation.ts`

## Development

### Running the Extension

```bash
# Install dependencies
npm install

# Compile extension
npm run compile

# Watch mode (recompiles on changes)
npm run watch
```

### Debugging

1. Open the project in VS Code
2. Press `F5` to launch extension development host
3. Open FlowGuard sidebar
4. Create or open a spec/ticket to test the custom editor
