<script lang="ts">
  import { afterUpdate } from 'svelte';

  export let onInsert: (diagram: string) => void = () => {};

  let selectedType: string = 'architecture';
  let diagramCode: string = '';
  let previewSvg: string = '';
  let previewContainer: HTMLElement;
  let mermaidLoaded = false;
  let mermaid: any = null;
  let renderError: string | null = null;

  const diagramTypes = [
    { id: 'architecture', label: 'Architecture', icon: '🏗️' },
    { id: 'sequence', label: 'Sequence', icon: '📊' },
    { id: 'flow', label: 'Flow', icon: '🔀' },
    { id: 'class', label: 'Class', icon: '📐' }
  ];

  const templates: Record<string, string> = {
    architecture: `graph TD
    A[Client] --> B[Load Balancer]
    B --> C[API Server]
    C --> D[(Database)]
    C --> E[Cache]
    
    classDef database fill:#f9ca24,stroke:#333
    class D database`,
    sequence: `sequenceDiagram
    participant Client
    participant Server
    participant Database
    
    Client->>Server: Request
    Server->>Database: Query
    Database-->>Server: Result
    Server-->>Client: Response`,
    flow: `flowchart TD
    A[Start] --> B{Is valid?}
    B -->|Yes| C[Process]
    B -->|No| D[Return Error]
    C --> E[End]`,
    class: `classDiagram
    class User {
        +String id
        +String name
        +login()
        +logout()
    }
    class Admin {
        +manageUsers()
    }
    User <|-- Admin`
  };

  async function loadMermaid() {
    if (mermaidLoaded) return;
    try {
      mermaid = await import('mermaid');
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose'
      });
      mermaidLoaded = true;
    } catch (e) {
      console.log('Mermaid not available:', e);
    }
  }

  async function renderPreview() {
    if (!mermaidLoaded || !previewContainer || !diagramCode.trim()) {
      previewSvg = '';
      renderError = null;
      return;
    }

    const id = `mermaid-preview-${Date.now()}`;
    try {
      const { svg } = await mermaid.render(id, diagramCode);
      previewSvg = svg;
      renderError = null;
    } catch (e) {
      renderError = 'Invalid diagram syntax';
      previewSvg = '';
    }
  }

  function selectType(type: string) {
    selectedType = type;
    diagramCode = templates[type] || '';
  }

  function insertDiagram() {
    if (diagramCode.trim()) {
      onInsert(diagramCode);
    }
  }

  afterUpdate(() => {
    loadMermaid().then(() => {
      renderPreview();
    });
  });
</script>

<div class="diagram-inserter">
  <div class="header">
    <h3>Insert Diagram</h3>
  </div>

  <div class="type-selector">
    <span class="label">Diagram Type:</span>
    <div class="types">
      {#each diagramTypes as type}
        <button
          type="button"
          class="type-btn"
          class:active={selectedType === type.id}
          on:click={() => selectType(type.id)}
        >
          <span class="icon">{type.icon}</span>
          <span>{type.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="template-section">
    <span class="label">Diagram Code:</span>
    <textarea
      bind:value={diagramCode}
      on:input={renderPreview}
      class="code-editor"
      rows="10"
      placeholder="Enter Mermaid diagram code..."
    ></textarea>
  </div>

  {#if mermaidLoaded}
    <div class="preview-section" bind:this={previewContainer}>
      <span class="label">Preview:</span>
      {#if renderError}
        <div class="preview-error">{renderError}</div>
      {:else if previewSvg}
        <div class="preview-container">
          {@html previewSvg}
        </div>
      {:else}
        <div class="preview-placeholder">Enter diagram code to see preview</div>
      {/if}
    </div>
  {/if}

  <div class="actions">
    <button type="button" class="insert-btn" on:click={insertDiagram} disabled={!diagramCode.trim()}>
      Insert Diagram
    </button>
  </div>
</div>

<style>
  .diagram-inserter {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
  }

  .header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .label {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: block;
    margin-bottom: 8px;
  }

  .type-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .types {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .type-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    background: transparent;
    color: var(--vscode-foreground);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .type-btn:hover {
    background: var(--vscode-toolbar-hoverBackground);
  }

  .type-btn.active {
    background: var(--vscode-button-background);
    border-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }

  .icon {
    font-size: 14px;
  }

  .template-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .code-editor {
    padding: 12px;
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 12px;
    resize: vertical;
    min-height: 150px;
  }

  .code-editor:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
  }

  .preview-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .preview-container {
    padding: 16px;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    min-height: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .preview-container :global(svg) {
    max-width: 100%;
    height: auto;
  }

  .preview-error {
    padding: 16px;
    background: var(--vscode-inputValidation-errorBackground);
    border: 1px solid var(--vscode-inputValidation-errorBorder);
    border-radius: 6px;
    color: var(--vscode-inputValidation-errorForeground);
    font-size: 12px;
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-placeholder {
    padding: 16px;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .insert-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .insert-btn:hover:not(:disabled) {
    background: var(--vscode-button-hoverBackground);
  }

  .insert-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
