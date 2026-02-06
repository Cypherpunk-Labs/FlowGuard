<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import IssueItem from './IssueItem.svelte';
  import type { VerificationIssue } from '../types';

  export let issues: VerificationIssue[];

  const dispatch = createEventDispatcher();

  function handleApplyFix(event: CustomEvent<{ issueId: string }>) {
    dispatch('applyFix', event.detail);
  }

  function handleIgnore(event: CustomEvent<{ issueId: string }>) {
    dispatch('ignore', event.detail);
  }

  function handleOpenFile(event: CustomEvent<{ filePath: string; lineNumber?: number }>) {
    dispatch('openFile', event.detail);
  }
</script>

<div class="issue-list">
  {#if issues.length === 0}
    <div class="empty-issues">
      <p>No issues match the current filter</p>
    </div>
  {:else}
    {#each issues as issue (issue.id)}
      <IssueItem
        {issue}
        on:applyFix={handleApplyFix}
        on:ignore={handleIgnore}
        on:openFile={handleOpenFile}
      />
    {/each}
  {/if}
</div>

<style>
  .issue-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .empty-issues {
    text-align: center;
    padding: 24px;
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
  }
</style>
