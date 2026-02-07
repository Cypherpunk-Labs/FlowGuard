<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import MetadataPanel from './components/MetadataPanel.svelte';
  import MarkdownEditor from './components/MarkdownEditor.svelte';
  import Toolbar from './components/Toolbar.svelte';
  import StatusWorkflow from './components/StatusWorkflow.svelte';
  import PreviewPanel from './components/PreviewPanel.svelte';
  import DiagramInserter from './components/DiagramInserter.svelte';
  import { debounce } from '../../../utils/debounce';
  import type { SpecEditorData, ToolbarAction, FieldSchema } from '../types';
  import type { SpecStatus } from '../../../core/models/Spec';

  let spec: SpecEditorData | null = null;
  let isDirty = false;
  let isSaving = false;
  let showPreview = false;
  let showDiagramInserter = false;
  let lastSavedAt: Date | null = null;
  let saveError: string | null = null;

  const statusTransitions: Record<string, string[]> = {
    draft: ['in_review'],
    in_review: ['draft', 'approved'],
    approved: ['archived'],
    archived: []
  };

  const metadataSchema: FieldSchema[] = [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { label: 'Draft', value: 'draft' },
      { label: 'In Review', value: 'in_review' },
      { label: 'Approved', value: 'approved' },
      { label: 'Archived', value: 'archived' }
    ]},
    { name: 'author', label: 'Author', type: 'text', required: true },
    { name: 'tags', label: 'Tags', type: 'tags', required: false },
    { name: 'createdAt', label: 'Created', type: 'text', required: false },
    { name: 'updatedAt', label: 'Updated', type: 'text', required: false }
  ];

  let toolbarActions: ToolbarAction[] = [
    { id: 'save', label: 'Save', icon: '💾', shortcut: '⌘S', variant: 'primary' },
    { id: 'preview', label: 'Preview', icon: '👁️', shortcut: '⌘P' },
    { id: 'diagram', label: 'Insert Diagram', icon: '📊' },
    { id: 'export', label: 'Export', icon: '📤', shortcut: '⌘⇧E' },
    { id: 'approve', label: 'Approve', icon: '✅', shortcut: '⌘⇧A', variant: 'secondary' }
  ];

  let vscodeApi: any = null;
  let isLoading = true;

  onMount(() => {
    vscodeApi = window.acquireVsCodeApi();
    setupMessageListener();
    setupKeyboardShortcuts();
    requestArtifactData();
  });

  function setupMessageListener() {
    window.addEventListener('message', (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case 'artifactData':
          spec = message.data;
          isDirty = false;
          isSaving = false;
          isLoading = false;
          break;
        case 'saveSuccess':
          isDirty = false;
          isSaving = false;
          lastSavedAt = new Date(message.timestamp);
          saveError = null;
          break;
        case 'saveError':
          saveError = message.message;
          isSaving = false;
          break;
        case 'statusUpdated':
          if (spec) {
            spec.status = message.status;
          }
          break;
        case 'approved':
          if (spec) {
            spec.status = 'approved';
          }
          break;
        case 'error':
          saveError = message.message;
          break;
      }
    });
  }

  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleSave();
        } else if (e.key === 'p' && e.shiftKey) {
          e.preventDefault();
          togglePreview();
        } else if (e.key === 'e' && e.shiftKey) {
          e.preventDefault();
          handleExport();
        } else if (e.key === 'a' && e.shiftKey) {
          e.preventDefault();
          handleApprove();
        }
      }
    });
  }

  function requestArtifactData() {
    vscodeApi.postMessage({ type: 'requestArtifactData' });
  }

  const debouncedSave = debounce(() => {
    handleSave();
  }, 30000);

  function handleSave() {
    if (!spec || isSaving) return;
    isSaving = true;
    saveError = null;
    vscodeApi.postMessage({
      type: 'saveArtifact',
      content: spec.content,
      metadata: {
        id: spec.id,
        epicId: spec.epicId,
        title: spec.title,
        status: spec.status,
        author: spec.author,
        tags: spec.tags,
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt
      }
    });
  }

  function handleContentChange(content: string) {
    if (!spec) return;
    spec.content = content;
    isDirty = true;
    debouncedSave();
  }

  function handleMetadataChange(field: string, value: any) {
    if (!spec) return;
    (spec as any)[field] = value;
    isDirty = true;
    debouncedSave();
  }

  function handleStatusChange(status: SpecStatus) {
    if (!spec) return;
    vscodeApi.postMessage({
      type: 'updateStatus',
      status: status
    });
  }

  function togglePreview() {
    showPreview = !showPreview;
  }

  function handleExport() {
    vscodeApi.postMessage({
      type: 'exportArtifact',
      format: 'clipboard'
    });
  }

  function handleApprove() {
    vscodeApi.postMessage({
      type: 'approveArtifact',
      approvedBy: spec?.author || 'Unknown'
    });
  }

  function handleToolbarAction(event: CustomEvent<string>) {
    const actionId = event.detail;
    switch (actionId) {
      case 'save':
        handleSave();
        break;
      case 'preview':
        togglePreview();
        break;
      case 'diagram':
        showDiagramInserter = true;
        break;
      case 'export':
        handleExport();
        break;
      case 'approve':
        handleApprove();
        break;
    }
  }

  function handleDiagramInsert(diagram: string) {
    if (!spec) return;
    showDiagramInserter = false;
    spec.content += `\n\`\`\`mermaid\n${diagram}\n\`\`\`\n`;
    isDirty = true;
    debouncedSave();
  }

  function getAllowedTransitions(): string[] {
    if (!spec) return [];
    return statusTransitions[spec.status] || [];
  }

  $: toolbarActions = [
    { id: 'save', label: isSaving ? 'Saving...' : (lastSavedAt ? 'Saved' : 'Save'), icon: isSaving ? '⏳' : '💾', shortcut: '⌘S', variant: 'primary', loading: isSaving, disabled: !isDirty || isSaving },
    { id: 'preview', label: showPreview ? 'Hide Preview' : 'Preview', icon: '👁️', shortcut: '⌘⇧P' },
    { id: 'diagram', label: 'Diagram', icon: '📊' },
    { id: 'export', label: 'Export', icon: '📤', shortcut: '⌘⇧E' },
    { id: 'approve', label: 'Approve', icon: '✅', shortcut: '⌘⇧A', variant: 'secondary', disabled: spec?.status === 'approved' }
  ];
</script>

<div class="spec-editor">
  <Toolbar actions={toolbarActions} disabled={!spec} on:action={handleToolbarAction} />

  {#if saveError}
    <div class="error-banner">
      <span>{saveError}</span>
      <button on:click={() => saveError = null}>Dismiss</button>
    </div>
  {/if}

  {#if spec}
    <div class="editor-content" class:with-preview={showPreview}>
      <div class="left-panel">
        <div class="section">
          <h3>Metadata</h3>
          <MetadataPanel
            metadata={{
              title: spec.title,
              status: spec.status,
              author: spec.author,
              tags: spec.tags,
              createdAt: spec.createdAt?.toLocaleDateString() || '',
              updatedAt: spec.updatedAt?.toLocaleDateString() || ''
            }}
            schema={metadataSchema}
            onChange={handleMetadataChange}
          />
        </div>

        <div class="section">
          <h3>Status</h3>
          <StatusWorkflow
            currentStatus={spec.status}
            allowedTransitions={getAllowedTransitions()}
            onStatusChange={handleStatusChange}
          />
        </div>

        <div class="section content-section">
          <h3>Content</h3>
          <MarkdownEditor
            content={spec.content}
            onChange={handleContentChange}
            placeholder="# Specification Content..."
          />
        </div>
      </div>

      {#if showPreview}
        <div class="right-panel">
          <PreviewPanel markdown={spec.content} />
        </div>
      {/if}
    </div>

    {#if showDiagramInserter}
      <div class="modal-overlay">
        <div class="modal">
          <DiagramInserter onInsert={handleDiagramInsert} />
          <button class="close-btn" on:click={() => showDiagramInserter = false}>Close</button>
        </div>
      </div>
    {/if}
  {:else}
    <div class="loading">
      {#if isLoading}
        <span>Loading spec...</span>
      {:else}
        <span>No spec data available</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .spec-editor {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--vscode-editor-background);
  }

  .error-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: var(--vscode-inputValidation-errorBackground);
    border-bottom: 1px solid var(--vscode-inputValidation-errorBorder);
    color: var(--vscode-inputValidation-errorForeground);
  }

  .error-banner button {
    background: transparent;
    border: 1px solid var(--vscode-button-border);
    border-radius: 4px;
    color: inherit;
    cursor: pointer;
    padding: 4px 8px;
  }

  .editor-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .editor-content.with-preview {
    gap: 1px;
    background: var(--vscode-panel-border);
  }

  .left-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    background: var(--vscode-editor-background);
  }

  .right-panel {
    flex: 1;
    overflow: hidden;
    background: var(--vscode-editor-background);
  }

  .section {
    padding: 12px;
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .section h3 {
    margin: 0 0 12px 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--vscode-descriptionForeground);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .content-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 300px;
  }

  .content-section :global(.markdown-editor) {
    flex: 1;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: var(--vscode-descriptionForeground);
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal {
    background: var(--vscode-editor-background);
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
  }

  .close-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: transparent;
    border: none;
    color: var(--vscode-foreground);
    cursor: pointer;
    padding: 4px 8px;
  }
</style>
