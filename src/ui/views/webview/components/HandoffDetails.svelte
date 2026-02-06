<script lang="ts">
  export let handoffPrompt: string;
  export let agentType: string;

  let expanded = false;
  let copied = false;

  function toggleExpand() {
    expanded = !expanded;
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(handoffPrompt);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
</script>

<div class="handoff-details">
  <div class="section-header" on:click={toggleExpand} role="button" tabindex="0" on:keypress={(e) => e.key === 'Enter' && toggleExpand()}>
    <h3>Handoff Details</h3>
    <span class="expand-icon">{expanded ? '▼' : '▶'}</span>
  </div>

  {#if expanded}
    <div class="section-content">
      <div class="agent-info">
        <span class="agent-label">Agent:</span>
        <span class="agent-value">{agentType}</span>
      </div>

      <div class="prompt-container">
        <pre class="handoff-prompt"><code>{handoffPrompt}</code></pre>
      </div>

      <button class="copy-btn" on:click={copyToClipboard}>
        {copied ? '✓ Copied!' : 'Copy to Clipboard'}
      </button>
    </div>
  {/if}
</div>

<style>
  .handoff-details {
    background: var(--vscode-sideBar-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    overflow: hidden;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    cursor: pointer;
    background: var(--vscode-sideBar-background);
    transition: background-color 0.2s;
  }

  .section-header:hover {
    background: var(--vscode-list-hoverBackground);
  }

  h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .expand-icon {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
  }

  .section-content {
    padding: 0 12px 12px;
  }

  .agent-info {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
    font-size: 12px;
  }

  .agent-label {
    color: var(--vscode-descriptionForeground);
  }

  .agent-value {
    font-weight: 500;
    color: var(--vscode-foreground);
    text-transform: capitalize;
  }

  .prompt-container {
    margin-bottom: 10px;
  }

  .handoff-prompt {
    margin: 0;
    padding: 10px;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    overflow-x: auto;
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 11px;
    color: var(--vscode-editor-foreground);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .copy-btn {
    width: 100%;
    padding: 6px 12px;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border: none;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .copy-btn:hover {
    background: var(--vscode-button-secondaryHoverBackground);
  }
</style>
