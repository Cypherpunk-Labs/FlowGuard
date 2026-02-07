<script lang="ts">
  export let filePath: string;
  export let lineNumber: number | undefined = undefined;

  function handleClick() {
    const event = new CustomEvent('openFile', { detail: { filePath, lineNumber } });
    window.dispatchEvent(event);
  }
</script>

<button class="file-link" on:click={handleClick}>
  <span class="file-icon">📄</span>
  <span class="file-path">{filePath}</span>
  {#if lineNumber}
    <span class="line-number">:{lineNumber}</span>
  {/if}
</button>

<style>
  .file-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 11px;
    color: var(--vscode-textLink-foreground);
    border-radius: 3px;
    transition: background-color 0.2s;
  }

  .file-link:hover {
    background: var(--vscode-list-hoverBackground);
  }

  .file-icon {
    font-size: 12px;
    opacity: 0.7;
  }

  .file-path {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .line-number {
    color: var(--vscode-descriptionForeground);
    font-weight: 500;
  }
</style>
