<script lang="ts">
  export let startedAt: Date;
  export let completedAt: Date | undefined;
  export let status: string;

  function formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  $: isInProgress = status === 'in_progress';
  $: isCompleted = status === 'completed' || status === 'failed';
  $: hasCompleted = completedAt !== undefined;
</script>

<div class="execution-timeline">
  <h3>Timeline</h3>

  <div class="timeline-container">
    <div class="timeline-track">
      <div class="timeline-progress" style="width: {isCompleted ? '100%' : isInProgress ? '60%' : '0%'}"></div>
    </div>

    <div class="timeline-markers">
      <div class="timeline-marker start">
        <div class="marker-dot"></div>
        <div class="marker-info">
          <span class="marker-label">Started</span>
          <span class="marker-time">{formatTime(startedAt)}</span>
        </div>
      </div>

      <div class="timeline-marker end">
        <div class="marker-dot {hasCompleted ? 'completed' : 'pending'}"></div>
        <div class="marker-info">
          <span class="marker-label">{isCompleted ? 'Completed' : 'In Progress'}</span>
          {#if hasCompleted}
            <span class="marker-time">{formatTime(completedAt!)}</span>
          {:else}
            <span class="marker-time">...</span>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .execution-timeline {
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

  .timeline-container {
    position: relative;
    padding-left: 20px;
  }

  .timeline-track {
    position: absolute;
    left: 6px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--vscode-panel-border);
  }

  .timeline-progress {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: var(--vscode-progressBar-background);
    transition: width 0.3s ease;
  }

  .timeline-markers {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .timeline-marker {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    position: relative;
  }

  .marker-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--vscode-sideBar-background);
    border: 2px solid var(--vscode-progressBar-background);
    flex-shrink: 0;
    z-index: 1;
  }

  .marker-dot.completed {
    background: var(--vscode-testing-iconPassed);
    border-color: var(--vscode-testing-iconPassed);
  }

  .marker-dot.pending {
    border-color: var(--vscode-disabledForeground);
  }

  .marker-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .marker-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--vscode-foreground);
  }

  .marker-time {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    font-family: var(--vscode-editor-font-family, monospace);
  }
</style>
