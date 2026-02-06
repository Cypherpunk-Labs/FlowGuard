<script lang="ts">
  import type { DiffSource, DiffAnalysis } from '../types';

  export let diffSource: DiffSource;
  export let analysis: DiffAnalysis;

  function formatTimestamp(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }
</script>

<div class="diff-source-info">
  <div class="commit-info">
    <div class="commit-header">
      <span class="commit-icon">@</span>
      <span class="commit-hash">{diffSource.commitHash.substring(0, 7)}</span>
      <span class="branch-badge">{diffSource.branch}</span>
    </div>
    <p class="commit-message">{diffSource.message}</p>
    <div class="commit-meta">
      <span class="author">{diffSource.author}</span>
      <span class="separator">•</span>
      <span class="timestamp">{formatTimestamp(diffSource.timestamp)}</span>
    </div>
  </div>

  <div class="diff-stats">
    <div class="stat">
      <span class="stat-value">{analysis.totalFiles}</span>
      <span class="stat-label">Files</span>
    </div>
    <div class="stat additions">
      <span class="stat-value">+{analysis.additions}</span>
      <span class="stat-label">Added</span>
    </div>
    <div class="stat deletions">
      <span class="stat-value">-{analysis.deletions}</span>
      <span class="stat-label">Deleted</span>
    </div>
  </div>
</div>

<style>
  .diff-source-info {
    background: var(--vscode-sideBar-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    padding: 12px;
  }

  .commit-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .commit-icon {
    font-size: 14px;
    color: var(--vscode-descriptionForeground);
  }

  .commit-hash {
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 12px;
    font-weight: 600;
    color: var(--vscode-textLink-foreground);
    background: var(--vscode-editor-selectionBackground);
    padding: 2px 6px;
    border-radius: 3px;
  }

  .branch-badge {
    font-size: 11px;
    font-family: var(--vscode-editor-font-family, monospace);
    color: var(--vscode-foreground);
    background: var(--vscode-badge-background);
    padding: 2px 6px;
    border-radius: 3px;
  }

  .commit-message {
    margin: 0 0 8px;
    font-size: 12px;
    color: var(--vscode-foreground);
    line-height: 1.4;
  }

  .commit-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
  }

  .separator {
    opacity: 0.5;
  }

  .diff-stats {
    display: flex;
    gap: 16px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--vscode-panel-border);
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .stat-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .stat-label {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    text-transform: uppercase;
  }

  .stat.additions .stat-value {
    color: var(--vscode-testing-iconPassed);
  }

  .stat.deletions .stat-value {
    color: var(--vscode-editorError-foreground);
  }
</style>
