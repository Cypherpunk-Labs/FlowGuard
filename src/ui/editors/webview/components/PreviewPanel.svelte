<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';

  export let markdown: string = '';
  export let diagrams: string[] = [];

  let renderedHtml: string = '';
  let previewContainer: HTMLElement;
  let mermaidLoaded = false;
  let mermaid: any = null;

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

  async function renderMermaidDiagrams() {
    if (!mermaidLoaded || !previewContainer) return;

    const mermaidBlocks = previewContainer.querySelectorAll('.mermaid');
    const ids: string[] = [];

    mermaidBlocks.forEach((block, index) => {
      const id = `mermaid-${Date.now()}-${index}`;
      (block as HTMLElement).id = id;
      ids.push(id);
    });

    if (ids.length > 0 && mermaid) {
      try {
        await mermaid.run({
          nodes: ids.map(id => document.getElementById(id))
        });
      } catch (e) {
        console.log('Mermaid render error:', e);
      }
    }
  }

  function renderMarkdown(text: string): string {
    let html = text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/```mermaid\n([\s\S]*?)```/gim, '<div class="mermaid">$1</div>')
      .replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/\n/gim, '<br>');

    return html;
  }

  $: {
    renderedHtml = renderMarkdown(markdown);
  }

  afterUpdate(() => {
    loadMermaid().then(() => {
      renderMermaidDiagrams();
    });
  });
</script>

<div class="preview-panel" bind:this={previewContainer}>
  <div class="preview-content">
    {@html renderedHtml}
  </div>
</div>

<style>
  .preview-panel {
    height: 100%;
    overflow-y: auto;
    background: var(--vscode-editor-background);
    border-left: 1px solid var(--vscode-panel-border);
  }

  .preview-content {
    padding: 16px;
    font-family: var(--vscode-font-family);
    font-size: 14px;
    line-height: 1.6;
    color: var(--vscode-foreground);
  }

  .preview-content :global(h1) {
    font-size: 24px;
    font-weight: 600;
    margin: 16px 0;
    color: var(--vscode-foreground);
  }

  .preview-content :global(h2) {
    font-size: 20px;
    font-weight: 600;
    margin: 14px 0;
    color: var(--vscode-foreground);
  }

  .preview-content :global(h3) {
    font-size: 16px;
    font-weight: 600;
    margin: 12px 0;
    color: var(--vscode-foreground);
  }

  .preview-content :global(p) {
    margin: 8px 0;
  }

  .preview-content :global(strong) {
    font-weight: 600;
  }

  .preview-content :global(em) {
    font-style: italic;
  }

  .preview-content :global(code) {
    background: var(--vscode-textCodeBlock-background);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 13px;
  }

  .preview-content :global(pre) {
    background: var(--vscode-textCodeBlock-background);
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 12px 0;
  }

  .preview-content :global(pre code) {
    background: transparent;
    padding: 0;
  }

  .preview-content :global(a) {
    color: var(--vscode-textLink-foreground);
    text-decoration: none;
  }

  .preview-content :global(a:hover) {
    text-decoration: underline;
  }

  .preview-content :global(li) {
    margin: 4px 0;
    padding-left: 4px;
  }

  .preview-content :global(.mermaid) {
    display: flex;
    justify-content: center;
    padding: 16px;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    margin: 12px 0;
  }

  .preview-content :global(.mermaid svg) {
    max-width: 100%;
    height: auto;
  }
</style>
