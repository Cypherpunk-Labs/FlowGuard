<script lang="ts">
  import './styles/global.css';
  import SummaryCard from './components/SummaryCard.svelte';
  import IssueList from './components/IssueList.svelte';
  import ApprovalWorkflow from './components/ApprovalWorkflow.svelte';
  import DiffSourceInfo from './components/DiffSourceInfo.svelte';
  import LoadingSpinner from './components/LoadingSpinner.svelte';
  import ErrorMessage from './components/ErrorMessage.svelte';
  import { getVerification, applyAutoFix, ignoreIssue, approveVerification, requestChanges, openFile, refresh, setupMessageListener } from './vscode';
  import type { VerificationData, Severity } from '../types';

  export let verification: VerificationData | null = null;
  export let loading = false;
  export let error: string | null = null;
  export let successMessage: string | null = null;

  let selectedSeverity: Severity | 'All' = 'All';
  let searchQuery = '';

  $: filteredIssues = verification?.issues.filter(issue => {
    const matchesSeverity = selectedSeverity === 'All' || issue.severity === selectedSeverity;
    const matchesSearch = !searchQuery ||
      issue.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.file.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  }) || [];

  function handleApplyFix(event: CustomEvent<{ issueId: string }>) {
    if (verification) {
      applyAutoFix(verification.id, event.detail.issueId);
    }
  }

  function handleIgnoreIssue(event: CustomEvent<{ issueId: string }>) {
    if (verification) {
      ignoreIssue(verification.id, event.detail.issueId);
    }
  }

  function handleOpenFile(event: CustomEvent<{ filePath: string; lineNumber?: number }>) {
    openFile(event.detail.filePath, event.detail.lineNumber);
  }

  function handleApprove(status: 'approved' | 'approved_with_conditions', comment?: string) {
    if (verification) {
      approveVerification(verification.id, status, comment);
    }
  }

  function handleRequestChanges(comment: string) {
    if (verification) {
      requestChanges(verification.id, comment);
    }
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

  function handleRefreshComplete() {
    loading = false;
  }

  function handleVerificationData(data: VerificationData) {
    verification = data;
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
    <h1>Verification Results</h1>
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

  {#if loading && !verification}
    <LoadingSpinner message="Loading verification..." />
  {:else if verification}
    <div class="content">
      <DiffSourceInfo
        diffSource={verification.diffSource}
        analysis={verification.analysis}
      />

      <div class="filters">
        <select bind:value={selectedSeverity} class="severity-filter">
          <option value="All">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search issues..."
          class="search-input"
        />
      </div>

      <SummaryCard
        summary={verification.summary}
        issueCount={verification.issues.length}
      />

      <IssueList
        issues={filteredIssues}
        on:applyFix={handleApplyFix}
        on:ignore={handleIgnoreIssue}
        on:openFile={handleOpenFile}
      />

      <ApprovalWorkflow
        summary={verification.summary}
        onApprove={handleApprove}
        onRequestChanges={handleRequestChanges}
      />
    </div>
  {:else}
    <div class="empty-state">
      <p>No verification selected</p>
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

  .filters {
    display: flex;
    gap: 8px;
  }

  .severity-filter {
    flex: 1;
    padding: 6px 8px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    font-size: 12px;
  }

  .search-input {
    flex: 2;
    padding: 6px 8px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    font-size: 12px;
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

  .empty-state {
    text-align: center;
    padding: 32px;
    color: var(--vscode-descriptionForeground);
  }
</style>
