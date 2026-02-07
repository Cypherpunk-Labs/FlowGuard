<script lang="ts">
  export let error: string | null = null;
  export let onRetry: (() => void) | null = null;
</script>

{#if error}
  <div class="error-message">
    <div class="error-icon">⚠</div>
    <div class="error-content">
      <span class="error-text">{error}</span>
      {#if onRetry}
        <button class="retry-btn" on:click={onRetry}>Retry</button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .error-message {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
    margin-bottom: 16px;
    background: var(--vscode-inputValidation-errorBackground);
    border: 1px solid var(--vscode-inputValidation-errorBorder);
    border-radius: 4px;
  }

  .error-icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  .error-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .error-text {
    font-size: 12px;
    color: var(--vscode-foreground);
  }

  .retry-btn {
    align-self: flex-start;
    padding: 4px 12px;
    font-size: 11px;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border: none;
    border-radius: 3px;
    cursor: pointer;
  }

  .retry-btn:hover {
    background: var(--vscode-button-secondaryHoverBackground);
  }
</style>
