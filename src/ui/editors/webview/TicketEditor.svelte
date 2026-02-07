<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import MetadataPanel from './components/MetadataPanel.svelte';
  import MarkdownEditor from './components/MarkdownEditor.svelte';
  import Toolbar from './components/Toolbar.svelte';
  import StatusWorkflow from './components/StatusWorkflow.svelte';
  import PreviewPanel from './components/PreviewPanel.svelte';
  import DiagramInserter from './components/DiagramInserter.svelte';
  import AcceptanceCriteriaEditor from './components/AcceptanceCriteriaEditor.svelte';
  import ImplementationStepsEditor from './components/ImplementationStepsEditor.svelte';
  import TestingChecklist from './components/TestingChecklist.svelte';
  import { debounce } from '../../../utils/debounce';
  import type { TicketEditorData, ToolbarAction, FieldSchema } from '../types';
  import type { TicketStatus, Priority } from '../../../core/models/Ticket';

  let ticket: TicketEditorData | null = null;
  let isDirty = false;
  let isSaving = false;
  let showPreview = false;
  let showDiagramInserter = false;
  let lastSavedAt: Date | null = null;
  let saveError: string | null = null;

  let acceptanceCriteria: string[] = [];
  let implementationSteps: string[] = [];
  let testingChecklist: { text: string; checked: boolean }[] = [];

  const statusTransitions: Record<string, string[]> = {
    todo: ['in_progress', 'blocked'],
    in_progress: ['todo', 'in_review', 'blocked'],
    in_review: ['in_progress', 'done'],
    done: ['todo'],
    blocked: ['todo']
  };

  const priorityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Critical', value: 'critical' }
  ];

  const statusOptions = [
    { label: 'To Do', value: 'todo' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'In Review', value: 'in_review' },
    { label: 'Done', value: 'done' },
    { label: 'Blocked', value: 'blocked' }
  ];

  const metadataSchema: FieldSchema[] = [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: statusOptions },
    { name: 'priority', label: 'Priority', type: 'select', required: true, options: priorityOptions },
    { name: 'assignee', label: 'Assignee', type: 'text', required: false },
    { name: 'estimatedEffort', label: 'Estimated Effort', type: 'text', required: false, placeholder: 'e.g., 2 days' },
    { name: 'tags', label: 'Tags', type: 'tags', required: false }
  ];

  let toolbarActions: ToolbarAction[] = [
    { id: 'save', label: 'Save', icon: '💾', shortcut: '⌘S', variant: 'primary' },
    { id: 'preview', label: 'Preview', icon: '👁️', shortcut: '⌘P' },
    { id: 'diagram', label: 'Insert Diagram', icon: '📊' },
    { id: 'export', label: 'Export', icon: '📤', shortcut: '⌘⇧E' }
  ];

  let vscodeApi: any = null;

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
          ticket = message.data;
          isDirty = false;
          isSaving = false;
          parseTicketContent();
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
          if (ticket) {
            ticket.status = message.status;
          }
          break;
        case 'error':
          saveError = message.message;
          break;
      }
    });
  }

  function parseTicketContent() {
    if (!ticket) return;
    const content = ticket.content || '';
    const criteriaMatch = content.match(/## Acceptance Criteria\n([\s\S]*?)(?=\n## |\n#|$)/i);
    if (criteriaMatch) {
      acceptanceCriteria = criteriaMatch[1].split('\n- ').filter(Boolean).map(c => c.replace(/^-/, '').trim());
    }

    const stepsMatch = content.match(/## Implementation Steps\n([\s\S]*?)(?=\n## |\n#|$)/i);
    if (stepsMatch) {
      implementationSteps = stepsMatch[1].split('\n1. ').filter(Boolean).map(s => s.replace(/^\d+\.\s*/, '').trim());
    }

    const checklistMatch = content.match(/## Testing Checklist\n([\s\S]*?)(?=\n## |\n#|$)/i);
    if (checklistMatch) {
      testingChecklist = checklistMatch[1].split('\n- ').filter(Boolean).map(c => {
        const match = c.match(/^\[([ x])\]\s*(.+)$/);
        return {
          text: match ? match[2].trim() : c.replace(/^-/, '').replace(/^\[([ x])\]\s*/, '').trim(),
          checked: match ? match[1] === 'x' : false
        };
      });
    }
  }

  function buildTicketContent(): string {
    let content = ticket?.content || '';
    const criteriaSection = acceptanceCriteria.length > 0
      ? `\n\n## Acceptance Criteria\n${acceptanceCriteria.map(c => `- ${c}`).join('\n')}`
      : '';
    const stepsSection = implementationSteps.length > 0
      ? `\n\n## Implementation Steps\n${implementationSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : '';
    const checklistSection = testingChecklist.length > 0
      ? `\n\n## Testing Checklist\n${testingChecklist.map(c => `- [${c.checked ? 'x' : ' '}] ${c.text}`).join('\n')}`
      : '';

    return `${content}${criteriaSection}${stepsSection}${checklistSection}`;
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
    if (!ticket || isSaving) return;
    isSaving = true;
    saveError = null;

    const fullContent = buildTicketContent();

    vscodeApi.postMessage({
      type: 'saveArtifact',
      content: fullContent,
      metadata: {
        id: ticket.id,
        epicId: ticket.epicId,
        specId: ticket.specId,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        assignee: ticket.assignee,
        estimatedEffort: ticket.estimatedEffort,
        tags: ticket.tags,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt
      }
    });
  }

  function handleContentChange(content: string) {
    if (!ticket) return;
    ticket.content = content;
    isDirty = true;
    debouncedSave();
  }

  function handleMetadataChange(field: string, value: any) {
    if (!ticket) return;
    (ticket as any)[field] = value;
    isDirty = true;
    debouncedSave();
  }

  function handleStatusChange(status: TicketStatus) {
    if (!ticket) return;
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
    }
  }

  function handleDiagramInsert(diagram: string) {
    if (!ticket) return;
    showDiagramInserter = false;
    ticket.content += `\n\`\`\`mermaid\n${diagram}\n\`\`\`\n`;
    isDirty = true;
    debouncedSave();
  }

  function handleAcceptanceCriteriaChange(criteria: string[]) {
    acceptanceCriteria = criteria;
    isDirty = true;
    debouncedSave();
  }

  function handleImplementationStepsChange(steps: string[]) {
    implementationSteps = steps;
    isDirty = true;
    debouncedSave();
  }

  function handleTestingChecklistChange(checklist: { text: string; checked: boolean }[]) {
    testingChecklist = checklist;
    isDirty = true;
    debouncedSave();
  }

  function getAllowedTransitions(): string[] {
    if (!ticket) return [];
    return statusTransitions[ticket.status] || [];
  }

  $: toolbarActions = [
    { id: 'save', label: isSaving ? 'Saving...' : (lastSavedAt ? 'Saved' : 'Save'), icon: isSaving ? '⏳' : '💾', shortcut: '⌘S', variant: 'primary', loading: isSaving, disabled: !isDirty || isSaving },
    { id: 'preview', label: showPreview ? 'Hide Preview' : 'Preview', icon: '👁️', shortcut: '⌘⇧P' },
    { id: 'diagram', label: 'Diagram', icon: '📊' },
    { id: 'export', label: 'Export', icon: '📤', shortcut: '⌘⇧E' }
  ];
</script>

<div class="ticket-editor">
  <Toolbar actions={toolbarActions} disabled={!ticket} on:action={handleToolbarAction} />

  {#if saveError}
    <div class="error-banner">
      <span>{saveError}</span>
      <button on:click={() => saveError = null}>Dismiss</button>
    </div>
  {/if}

  {#if ticket}
    <div class="editor-content" class:with-preview={showPreview}>
      <div class="left-panel">
        <div class="section">
          <h3>Metadata</h3>
          <MetadataPanel
            metadata={{
              title: ticket.title,
              status: ticket.status,
              priority: ticket.priority,
              assignee: ticket.assignee || '',
              estimatedEffort: ticket.estimatedEffort || '',
              tags: ticket.tags,
              createdAt: ticket.createdAt?.toLocaleDateString() || '',
              updatedAt: ticket.updatedAt?.toLocaleDateString() || ''
            }}
            schema={metadataSchema}
            onChange={handleMetadataChange}
          />
        </div>

        <div class="section">
          <h3>Status</h3>
          <StatusWorkflow
            currentStatus={ticket.status}
            allowedTransitions={getAllowedTransitions()}
            onStatusChange={handleStatusChange}
          />
        </div>

        <div class="section content-section">
          <h3>Content</h3>
          <MarkdownEditor
            content={ticket.content}
            onChange={handleContentChange}
            placeholder="# Ticket Content..."
          />
        </div>

        <AcceptanceCriteriaEditor
          criteria={acceptanceCriteria}
          onChange={handleAcceptanceCriteriaChange}
        />

        <ImplementationStepsEditor
          steps={implementationSteps}
          onChange={handleImplementationStepsChange}
        />

        <TestingChecklist
          checklist={testingChecklist}
          onChange={handleTestingChecklistChange}
        />
      </div>

      {#if showPreview}
        <div class="right-panel">
          <PreviewPanel markdown={ticket.content} />
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
      <span>Loading ticket...</span>
    </div>
  {/if}
</div>

<style>
  .ticket-editor {
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
