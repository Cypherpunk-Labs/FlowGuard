<script lang="ts">
  export let currentStatus: string = 'draft';
  export let allowedTransitions: string[] = [];
  export let onStatusChange: (status: string) => void = () => {};

  interface StatusConfig {
    label: string;
    color: string;
    icon: string;
  }

  const statusConfig: Record<string, StatusConfig> = {
    draft: { label: 'Draft', color: '#6c737e', icon: '📝' },
    in_review: { label: 'In Review', color: '#d29922', icon: '👀' },
    approved: { label: 'Approved', color: '#22c55e', icon: '✅' },
    archived: { label: 'Archived', color: '#6b7280', icon: '📦' },
    todo: { label: 'To Do', color: '#6c737e', icon: '📋' },
    in_progress: { label: 'In Progress', color: '#3b82f6', icon: '🔄' },
    done: { label: 'Done', color: '#22c55e', icon: '🎉' },
    blocked: { label: 'Blocked', color: '#ef4444', icon: '🚫' }
  };

  function getStatusInfo(status: string): StatusConfig {
    return statusConfig[status] || { label: status, color: '#6c737e', icon: '📌' };
  }

  function canTransitionTo(status: string): boolean {
    return allowedTransitions.includes(status);
  }

  function handleTransition(status: string) {
    if (canTransitionTo(status)) {
      onStatusChange(status);
    }
  }
</script>

<div class="status-workflow">
  <div class="current-status">
    <span class="status-badge" style="background-color: {getStatusInfo(currentStatus).color}">
      <span class="icon">{getStatusInfo(currentStatus).icon}</span>
      {getStatusInfo(currentStatus).label}
    </span>
  </div>

  {#if allowedTransitions.length > 0}
    <div class="transitions">
      <span class="label">Transition to:</span>
      <div class="transition-buttons">
        {#each allowedTransitions as status}
          <button
            type="button"
            class="transition-btn"
            disabled={!canTransitionTo(status)}
            on:click={() => handleTransition(status)}
            style="--status-color: {getStatusInfo(status).color}"
          >
            <span class="icon">{getStatusInfo(status).icon}</span>
            <span>{getStatusInfo(status).label}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .status-workflow {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
  }

  .current-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    color: white;
  }

  .icon {
    font-size: 12px;
  }

  .transitions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .label {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .transition-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .transition-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: 1px solid var(--status-color);
    border-radius: 4px;
    background: transparent;
    color: var(--vscode-foreground);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .transition-btn:hover:not(:disabled) {
    background: var(--status-color);
    color: white;
  }

  .transition-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
