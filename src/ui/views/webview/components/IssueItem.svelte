<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import SeverityBadge from './SeverityBadge.svelte';
  import CategoryBadge from './CategoryBadge.svelte';
  import FileLink from './FileLink.svelte';
  import type { VerificationIssue } from '../types';

  export let issue: VerificationIssue;
  export let expanded = false;

  const dispatch = createEventDispatcher();

  function toggleExpand() {
    expanded = !expanded;
  }

  function handleApplyFix() {
    dispatch('applyFix', { issueId: issue.id });
  }

  function handleIgnore() {
    dispatch('ignore', { issueId: issue.id });
  }

  function handleOpenFile() {
    dispatch('openFile', { filePath: issue.file, lineNumber: issue.line });
  }

  $: hasAutoFix = issue.fixSuggestion?.automatedFix;
</script>

<div class="issue-item {expanded ? 'expanded' : ''}">
  <div class="issue-header" on:click={toggleExpand} role="button" tabindex="0" on:keypress={(e) => e.key === 'Enter' && toggleExpand()}>
    <div class="severity-category">
      <SeverityBadge severity={issue.severity} />
      <CategoryBadge category={issue.category} />
    </div>
    <div class="expand-icon">
      {expanded ? '▼' : '▶'}
    </div>
  </div>

  <div class="issue-content">
    <FileLink filePath={issue.file} lineNumber={issue.line} />

    <p class="issue-message">{issue.message}</p>

    {#if expanded}
      <div class="issue-details">
        {#if issue.suggestion}
          <div class="suggestion">
            <strong>Suggestion:</strong>
            <p>{issue.suggestion}</p>
          </div>
        {/if}

        {#if issue.fixSuggestion}
          <div class="fix-suggestion">
            <strong>Fix Steps:</strong>
            <ol>
              {#each issue.fixSuggestion.steps as step}
                <li>{step}</li>
              {/each}
            </ol>

            {#if issue.fixSuggestion.codeExample}
              <pre class="code-example"><code>{issue.fixSuggestion.codeExample}</code></pre>
            {/if}
          </div>
        {/if}

        <div class="issue-actions">
          {#if hasAutoFix}
            <button class="action-btn apply-fix" on:click={handleApplyFix}>
              Apply Auto-Fix
            </button>
          {/if}
          <button class="action-btn ignore" on:click={handleIgnore}>
            Ignore
          </button>
          <button class="action-btn open-file" on:click={handleOpenFile}>
            Open File
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .issue-item {
    background: var(--vscode-sideBar-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    overflow: hidden;
  }

  .issue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    cursor: pointer;
    background: var(--vscode-sideBar-background);
    transition: background-color 0.2s;
  }

  .issue-header:hover {
    background: var(--vscode-list-hoverBackground);
  }

  .severity-category {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .expand-icon {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
  }

  .issue-content {
    padding: 0 12px 12px;
  }

  .issue-message {
    margin: 8px 0;
    font-size: 12px;
    color: var(--vscode-foreground);
    line-height: 1.5;
  }

  .issue-details {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--vscode-panel-border);
  }

  .suggestion,
  .fix-suggestion {
    margin-bottom: 12px;
    font-size: 12px;
  }

  .suggestion strong,
  .fix-suggestion strong {
    display: block;
    margin-bottom: 4px;
    color: var(--vscode-descriptionForeground);
  }

  .suggestion p,
  .fix-suggestion p {
    margin: 0;
    color: var(--vscode-foreground);
  }

  .fix-suggestion ol {
    margin: 4px 0;
    padding-left: 20px;
    color: var(--vscode-foreground);
  }

  .fix-suggestion li {
    margin-bottom: 4px;
  }

  .code-example {
    margin: 8px 0;
    padding: 10px;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    overflow-x: auto;
    font-family: var(--vscode-editor-font-family);
    font-size: 11px;
    color: var(--vscode-editor-foreground);
  }

  .issue-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .action-btn {
    padding: 5px 12px;
    border: none;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .action-btn.apply-fix {
    background: var(--vscode-button-primaryBackground);
    color: var(--vscode-button-primaryForeground);
  }

  .action-btn.apply-fix:hover {
    background: var(--vscode-button-primaryHoverBackground);
  }

  .action-btn.ignore {
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
  }

  .action-btn.ignore:hover {
    background: var(--vscode-button-secondaryHoverBackground);
  }

  .action-btn.open-file {
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
  }

  .action-btn.open-file:hover {
    background: var(--vscode-button-secondaryHoverBackground);
  }
</style>
