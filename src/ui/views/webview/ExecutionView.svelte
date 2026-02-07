<script lang="ts">
  import './styles/global.css';
  import ExecutionHeader from './components/ExecutionHeader.svelte';
  import HandoffDetails from './components/HandoffDetails.svelte';
  import LinkedArtifacts from './components/LinkedArtifacts.svelte';
  import ExecutionResults from './components/ExecutionResults.svelte';
  import ExecutionTimeline from './components/ExecutionTimeline.svelte';
  import LoadingSpinner from './components/LoadingSpinner.svelte';
  import ErrorMessage from './components/ErrorMessage.svelte';
  import { getExecution, openSpec, openTicket, viewVerification, refresh, setupMessageListener } from './executionVscode';
  import type { ExecutionData } from '../types';

  export let execution: ExecutionData | null = null;
  export let loading = false;
  export let error: string | null = null;
  export let successMessage: string | null = null;

  function handleOpenSpec(event: CustomEvent<{ specId: string }>) {
    openSpec(event.detail.specId);
  }

  function handleOpenTicket(event: CustomEvent<{ ticketId: string }>) {
    openTicket(event.detail.ticketId);
  }

  function handleViewVerification(event: CustomEvent<{ verificationId: string }>) {
    viewVerification(event.detail.verificationId);
  }

  function handleRefresh() {
    loading = true;
    error = null;
    successMessage = null;
    refresh();
  }

  function handleRetry() {
    error = null;
    handleRefresh();
  }

  function handleExecutionData(data: ExecutionData) {
    execution = data;
    loading = false;
    error = null;
  }

  function handleSuccess(message: string) {
    successMessage = message;
    setTimeout(() => {
      successMessage = null;
    }, 3000);
  }

  function handleError(message: string) {
    error = message;
    loading = false;
  }
</script>

<div class="app">
  <div class="header">
    <h1>Execution Tracking</h1>
    <button class="refresh-btn" on:click={handleRefresh} disabled={loading} title="Refresh">
      {#if loading}
        <span class="spin">↻</span>
      {:else}
        ↻
      {/if}
    </button>
  </div>

  {#if error}
    <ErrorMessage {error} onRetry={handleRetry} />
  {/if}

  {#if successMessage}
    <div class="success-message">
      <span class="success-icon">✓</span>
      <span class="success-text">{successMessage}</span>
    </div>
  {/if}

  {#if loading && !execution}
    <LoadingSpinner message="Loading execution..." />
  {:else if execution}
    <div class="content">
      <ExecutionHeader
        execution={execution}
      />

      <ExecutionTimeline
        startedAt={new Date(execution.startedAt)}
        completedAt={execution.completedAt ? new Date(execution.completedAt) : undefined}
        status={execution.status}
      />

      <HandoffDetails
        handoffPrompt={execution.handoffPrompt}
        agentType={execution.agentType}
      />

      <LinkedArtifacts
        specIds={execution.specIds}
        specTitles={execution.specTitles || []}
        ticketIds={execution.ticketIds}
        ticketTitles={execution.ticketTitles || []}
        on:openSpec={handleOpenSpec}
        on:openTicket={handleOpenTicket}
      />

      {#if execution.results}
        <ExecutionResults
          results={execution.results}
          status={execution.status}
          verificationId={execution.results.verificationId}
          on:viewVerification={handleViewVerification}
        />
      {/if}

      {#if execution.duration}
        <div class="duration-info">
          <span class="duration-label">Duration:</span>
          <span class="duration-value">{execution.duration}</span>
        </div>
      {/if}
    </div>
  {:else}
    <div class="empty-state">
      <p>No execution selected</p>
    </div>
  {/if}
</div>

<style>
  .app {
    padding: 10px;
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
    background: var(--vscode-sideBar-background);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  h1 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .refresh-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    font-size: 14px;
    color: var(--vscode-foreground);
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .refresh-btn:hover {
    opacity: 1;
  }

  .refresh-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .spin {
    display: inline-block;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .success-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px;
    margin-bottom: 12px;
    background: var(--vscode-inputValidation-infoBackground);
    border: 1px solid var(--vscode-inputValidation-infoBorder);
    border-radius: 4px;
  }

  .success-icon {
    color: var(--vscode-testing-iconPassed);
  }

  .success-text {
    font-size: 12px;
    color: var(--vscode-foreground);
  }

  .duration-info {
    display: flex;
    gap: 8px;
    padding: 10px;
    background: var(--vscode-sideBar-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    font-size: 12px;
  }

  .duration-label {
    color: var(--vscode-descriptionForeground);
  }

  .duration-value {
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .empty-state {
    text-align: center;
    padding: 32px;
    color: var(--vscode-descriptionForeground);
  }
</style>
