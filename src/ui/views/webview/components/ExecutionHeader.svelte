<script lang="ts">
  export let execution: any;

  const agentConfig: Record<string, { color: string; label: string }> = {
    cursor: { color: '#0078d4', label: 'Cursor' },
    claude: { color: '#d4a574', label: 'Claude' },
    windsurf: { color: '#00bcd4', label: 'Windsurf' },
    cline: { color: '#4caf50', label: 'Cline' },
    aider: { color: '#ff9800', label: 'Aider' },
    custom: { color: '#9c27b0', label: 'Custom' }
  };

  const statusConfig: Record<string, { icon: string; label: string }> = {
    pending: { icon: '○', label: 'Pending' },
    in_progress: { icon: '◐', label: 'In Progress' },
    completed: { icon: '✓', label: 'Completed' },
    failed: { icon: '✗', label: 'Failed' }
  };

  $: agent = agentConfig[execution?.agentType] || agentConfig.custom;
  $: status = statusConfig[execution?.status] || statusConfig.pending;
</script>

<div class="execution-header">
  <div class="header-main">
    <div class="agent-badge" style="--agent-color: {agent.color}">
      {agent.label}
    </div>
    <div class="status-badge status-{execution?.status}">
      <span class="status-icon">{status.icon}</span>
      <span>{status.label}</span>
    </div>
  </div>

  {#if execution?.id}
    <div class="execution-meta">
      <span class="execution-id">ID: {execution.id.substring(0, 8)}...</span>
    </div>
  {/if}
</div>

<style>
  .execution-header {
    background: var(--vscode-sideBar-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    padding: 12px;
  }

  .header-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .agent-badge {
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    background: color-mix(in srgb, var(--agent-color) 20%, transparent);
    color: var(--agent-color);
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .status-icon {
    font-size: 12px;
  }

  .status-pending {
    background: var(--vscode-disabledForeground, #80808020);
    color: var(--vscode-disabledForeground, #808080);
  }

  .status-in_progress {
    background: var(--vscode-progressBar-background, #0078d420);
    color: var(--vscode-progressBar-background, #0078d4);
  }

  .status-completed {
    background: var(--vscode-testing-iconPassed, #388a3420);
    color: var(--vscode-testing-iconPassed, #388a34);
  }

  .status-failed {
    background: var(--vscode-editorError-background, #f8514920);
    color: var(--vscode-editorError-foreground, #f85149);
  }

  .execution-meta {
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
  }

  .execution-id {
    font-family: var(--vscode-editor-font-family, monospace);
  }
</style>
