<script lang="ts">
  export let message: string | null = null;
</script>

<div class="loading-spinner">
  <div class="spinner"></div>
  {#if message}
    <span class="message">{message}</span>
  {/if}
</div>

<style>
  .loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    gap: 12px;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--vscode-panel-border);
    border-top-color: var(--vscode-textLink-foreground);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .message {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
  }
</style>
