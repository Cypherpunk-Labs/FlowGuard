<script lang="ts">
  import SeverityBadge from './SeverityBadge.svelte';
  import type { VerificationSummary, Severity } from '../types';

  export let summary: VerificationSummary;
  export let issueCount: number;

  $: criticalCount = summary.issueCounts.Critical;
  $: highCount = summary.issueCounts.High;
  $: mediumCount = summary.issueCounts.Medium;
  $: lowCount = summary.issueCounts.Low;
</script>

<div class="summary-card">
  <div class="status-section">
    <div class="status-badge {summary.passed ? 'status-passed' : 'status-failed'}">
      {#if summary.passed}
        <span class="icon">✓</span>
        <span>Passed</span>
      {:else}
        <span class="icon">✗</span>
        <span>Failed</span>
      {/if}
    </div>
    <div class="approval-badge approval-{summary.approvalStatus}">
      {summary.approvalStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </div>
  </div>

  <div class="issue-counts">
    <div class="count-item critical">
      <SeverityBadge severity="Critical" />
      <span class="count">{criticalCount}</span>
    </div>
    <div class="count-item high">
      <SeverityBadge severity="High" />
      <span class="count">{highCount}</span>
    </div>
    <div class="count-item medium">
      <SeverityBadge severity="Medium" />
      <span class="count">{mediumCount}</span>
    </div>
    <div class="count-item low">
      <SeverityBadge severity="Low" />
      <span class="count">{lowCount}</span>
    </div>
    <div class="count-item total">
      <span class="label">Total</span>
      <span class="count">{issueCount}</span>
    </div>
  </div>

  <div class="recommendation">
    <span class="recommendation-label">Recommendation:</span>
    <span class="recommendation-text">{summary.recommendation}</span>
  </div>
</div>

<style>
  .summary-card {
    background: var(--vscode-sideBar-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    padding: 12px;
  }

  .status-section {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
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

  .status-passed {
    background: var(--vscode-testing-iconPassed, #388a3420);
    color: var(--vscode-testing-iconPassed, #388a34);
  }

  .status-failed {
    background: var(--vscode-editorError-background, #f8514920);
    color: var(--vscode-editorError-foreground, #f85149);
  }

  .icon {
    font-weight: bold;
  }

  .approval-badge {
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    text-transform: capitalize;
  }

  .approval-approved {
    background: var(--vscode-testing-iconPassed, #388a3420);
    color: var(--vscode-testing-iconPassed, #388a34);
  }

  .approval-approved_with_conditions {
    background: var(--vscode-editorWarning-background, #cca70020);
    color: var(--vscode-editorWarning-foreground, #cca700);
  }

  .approval-changes_requested {
    background: var(--vscode-editorError-background, #f8514920);
    color: var(--vscode-editorError-foreground, #f85149);
  }

  .approval-pending {
    background: var(--vscode-disabledForeground, #80808020);
    color: var(--vscode-disabledForeground, #808080);
  }

  .issue-counts {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }

  .count-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    background: var(--vscode-sideBar-background);
    border-radius: 4px;
    font-size: 11px;
  }

  .count {
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .total {
    background: var(--vscode-badge-background);
  }

  .total .label {
    color: var(--vscode-badge-foreground);
  }

  .total .count {
    color: var(--vscode-badge-foreground);
  }

  .recommendation {
    display: flex;
    gap: 6px;
    padding: 8px;
    background: var(--vscode-sideBar-background);
    border-radius: 4px;
    font-size: 11px;
  }

  .recommendation-label {
    color: var(--vscode-descriptionForeground);
    font-weight: 500;
  }

  .recommendation-text {
    color: var(--vscode-foreground);
  }
</style>
