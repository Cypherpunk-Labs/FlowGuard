<script lang="ts">
  import type { ToolbarAction } from '../../types';
  import { createEventDispatcher } from 'svelte';

  export let actions: ToolbarAction[] = [];
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{ action: string }>();

  function handleAction(action: ToolbarAction) {
    if (action.disabled || action.loading) {
      return;
    }
    dispatch('action', action.id);
  }
</script>

<div class="toolbar" class:disabled>
  {#each actions as action}
    <button
      type="button"
      class="action-btn"
      class:primary={action.variant === 'primary'}
      class:secondary={action.variant === 'secondary'}
      class:danger={action.variant === 'danger'}
      disabled={disabled || action.disabled}
      title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
      on:click={() => handleAction(action)}
    >
      {#if action.loading}
        <span class="spinner"></span>
      {:else if action.icon}
        <span class="icon">{action.icon}</span>
      {/if}
      <span class="label">{action.label}</span>
      {#if action.shortcut}
        <span class="shortcut">{action.shortcut}</span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--vscode-toolbar-background);
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .toolbar.disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: var(--vscode-foreground);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover:not(:disabled) {
    background: var(--vscode-toolbar-hoverBackground);
    border-color: var(--vscode-toolbar-border);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-btn.primary {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border-color: var(--vscode-button-border);
  }

  .action-btn.primary:hover:not(:disabled) {
    background: var(--vscode-button-hoverBackground);
  }

  .action-btn.secondary {
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border-color: var(--vscode-button-secondaryBorder);
  }

  .action-btn.secondary:hover:not(:disabled) {
    background: var(--vscode-button-secondaryHoverBackground);
  }

  .action-btn.danger {
    color: var(--vscode-errorForeground);
  }

  .action-btn.danger:hover:not(:disabled) {
    background: var(--vscode-inputValidation-errorBackground);
  }

  .icon {
    font-size: 14px;
  }

  .label {
    font-weight: 500;
  }

  .shortcut {
    font-size: 10px;
    opacity: 0.7;
    padding: 2px 4px;
    background: var(--vscode-toolbar-hoverBackground);
    border-radius: 3px;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--vscode-activityBar-inactiveForeground);
    border-top-color: var(--vscode-activityBar-activeForeground);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
