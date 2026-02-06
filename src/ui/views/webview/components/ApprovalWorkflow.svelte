<script lang="ts">
  import type { VerificationSummary } from '../types';

  export let summary: VerificationSummary;
  export let onApprove: (status: 'approved' | 'approved_with_conditions', comment?: string) => void;
  export let onRequestChanges: (comment: string) => void;

  let showComment = false;
  let comment = '';
  let approvalMode: 'approve' | 'approveConditions' | 'requestChanges' | null = null;

  $: hasCriticalOrHighIssues = summary.issueCounts.Critical > 0 || summary.issueCounts.High > 0;

  function handleApprove() {
    approvalMode = 'approve';
    if (!hasCriticalOrHighIssues) {
      onApprove('approved');
      showComment = false;
      comment = '';
    }
  }

  function handleApproveWithConditions() {
    approvalMode = 'approveConditions';
    showComment = true;
  }

  function handleRequestChanges() {
    approvalMode = 'requestChanges';
    showComment = true;
  }

  function submitApproval() {
    if (approvalMode === 'approveConditions') {
      onApprove('approved_with_conditions', comment);
    } else if (approvalMode === 'requestChanges') {
      onRequestChanges(comment);
    }
    showComment = false;
    comment = '';
    approvalMode = null;
  }

  function cancelApproval() {
    showComment = false;
    comment = '';
    approvalMode = null;
  }
</script>

<div class="approval-workflow">
  <h3 class="section-title">Approval Workflow</h3>

  <div class="current-status">
    <span class="status-label">Current Status:</span>
    <span class="status-value approval-{summary.approvalStatus}">
      {summary.approvalStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  </div>

  {#if summary.approvalStatus === 'pending'}
    <div class="approval-actions">
      <button
        class="action-btn approve"
        on:click={handleApprove}
        disabled={hasCriticalOrHighIssues}
        title={hasCriticalOrHighIssues ? 'Cannot approve when critical or high severity issues exist' : ''}
      >
        Approve
      </button>
      <button
        class="action-btn approve-conditions"
        on:click={handleApproveWithConditions}
      >
        Approve with Conditions
      </button>
      <button
        class="action-btn request-changes"
        on:click={handleRequestChanges}
      >
        Request Changes
      </button>
    </div>

    {#if showComment}
      <div class="comment-section">
        <textarea
          bind:value={comment}
          placeholder="Add a comment for your decision..."
          rows="3"
        ></textarea>
        <div class="comment-actions">
          <button class="submit-btn" on:click={submitApproval} disabled={!comment.trim()}>
            Submit
          </button>
          <button class="cancel-btn" on:click={cancelApproval}>
            Cancel
          </button>
        </div>
      </div>
    {/if}
  {:else}
    <p class="already-reviewed">This verification has already been reviewed</p>
  {/if}
</div>

<style>
  .approval-workflow {
    background: var(--vscode-sideBar-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    padding: 12px;
  }

  .section-title {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .current-status {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding: 8px;
    background: var(--vscode-sideBar-background);
    border-radius: 4px;
  }

  .status-label {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
  }

  .status-value {
    padding: 2px 8px;
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

  .approval-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    flex: 1;
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .action-btn.approve {
    background: var(--vscode-testing-iconPassed, #388a3420);
    color: var(--vscode-testing-iconPassed, #388a34);
  }

  .action-btn.approve:hover:not(:disabled) {
    background: var(--vscode-testing-iconPassed, #388a3440);
  }

  .action-btn.approve:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-btn.approve-conditions {
    background: var(--vscode-editorWarning-background, #cca70020);
    color: var(--vscode-editorWarning-foreground, #cca700);
  }

  .action-btn.approve-conditions:hover {
    background: var(--vscode-editorWarning-background, #cca70030);
  }

  .action-btn.request-changes {
    background: var(--vscode-editorError-background, #f8514920);
    color: var(--vscode-editorError-foreground, #f85149);
  }

  .action-btn.request-changes:hover {
    background: var(--vscode-editorError-background, #f8514930);
  }

  .comment-section {
    margin-top: 12px;
  }

  .comment-section textarea {
    width: 100%;
    padding: 8px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    font-family: var(--vscode-font-family);
    font-size: 12px;
    resize: vertical;
  }

  .comment-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .submit-btn {
    padding: 6px 16px;
    background: var(--vscode-button-primaryBackground);
    color: var(--vscode-button-primaryForeground);
    border: none;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--vscode-button-primaryHoverBackground);
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .cancel-btn {
    padding: 6px 16px;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border: none;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
  }

  .cancel-btn:hover {
    background: var(--vscode-button-secondaryHoverBackground);
  }

  .already-reviewed {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
    text-align: center;
  }
</style>
