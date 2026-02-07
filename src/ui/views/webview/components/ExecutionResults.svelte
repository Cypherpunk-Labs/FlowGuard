<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let results: any;
  export let status: string;
  export let verificationId: string | undefined = undefined;

  const dispatch = createEventDispatcher();

  function handleViewVerification() {
    if (verificationId) {
      dispatch('viewVerification', { verificationId });
    }
  }
</script>

<div class="execution-results">
  <h3>Results</h3>

  {#if status === 'pending' || status === 'in_progress'}
    <div class="pending-results">
      <p>Results will be available when execution completes</p>
    </div>
  {:else if results}
    <div class="results-content">
      {#if results.diffSummary}
        <div class="diff-summary">
          <h4>Diff Summary</h4>
          <pre class="summary-text">{results.diffSummary}</pre>
        </div>
      {/if}

      {#if results.agentNotes}
        <div class="agent-notes">
          <h4>Agent Notes</h4>
          <pre class="notes-text">{results.agentNotes}</pre>
        </div>
      {/if}

      {#if results.filesChanged && results.filesChanged.length > 0}
        <div class="files-changed">
          <h4>Files Changed ({results.filesChanged.length})</h4>
          <ul class="file-list">
            {#each results.filesChanged as file}
              <li class="file-item">{file}</li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if verificationId}
        <button class="view-verification-btn" on:click={handleViewVerification}>
          View Verification Results
        </button>
      {/if}
    </div>
  {:else}
    <p class="no-results">No results available</p>
  {/if}
</div>

<style>
  .execution-results {
    background: var(--vscode-sideBar-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    padding: 12px;
  }

  h3 {
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  h4 {
    margin: 0 0 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--vscode-descriptionForeground);
  }

  .pending-results {
    text-align: center;
    padding: 16px;
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
  }

  .results-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .diff-summary,
  .agent-notes {
    padding: 10px;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
  }

  .summary-text,
  .notes-text {
    margin: 0;
    padding: 8px;
    background: var(--vscode-sideBar-background);
    border-radius: 3px;
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 11px;
    color: var(--vscode-editor-foreground);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .files-changed {
    padding: 10px;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
  }

  .file-list {
    margin: 6px 0 0;
    padding-left: 20px;
    list-style: none;
  }

  .file-item {
    padding: 3px 0;
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 11px;
    color: var(--vscode-foreground);
  }

  .view-verification-btn {
    width: 100%;
    padding: 8px 12px;
    background: var(--vscode-button-primaryBackground);
    color: var(--vscode-button-primaryForeground);
    border: none;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .view-verification-btn:hover {
    background: var(--vscode-button-primaryHoverBackground);
  }

  .no-results {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
    margin: 0;
    text-align: center;
  }
</style>
