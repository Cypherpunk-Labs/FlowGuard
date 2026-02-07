<script lang="ts">
  import type { SpecData, TicketData } from '../../types';
  import StatusBadge from './StatusBadge.svelte';
  import { openArtifact } from '../vscode';

  export let specs: SpecData[] = [];
  export let tickets: TicketData[] = [];

  function handleClick(specId: string) {
    openArtifact('spec', specId);
  }

  function handleRelatedTicketClick(ticketId: string, e: Event) {
    e.stopPropagation();
    openArtifact('ticket', ticketId);
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function formatFullDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getRelatedTickets(specId: string): TicketData[] {
    return tickets.filter(t => t.specId === specId);
  }
</script>

<div class="spec-list">
  {#if specs.length === 0}
    <div class="empty-state">No specs yet. Click + to create one.</div>
  {:else}
    {#each specs as spec (spec.id)}
      <div 
        class="spec-card"
        on:click={() => handleClick(spec.id)}
        on:keypress={(e) => e.key === 'Enter' && handleClick(spec.id)}
        role="button"
        tabindex="0"
      >
        <div class="spec-header">
          <span class="spec-title" title={spec.title}>{spec.title}</span>
          <StatusBadge status={spec.status} type="spec" />
        </div>
        
        <div class="spec-meta">
          <span class="spec-id">{spec.id.slice(0, 8)}</span>
          <span class="meta-divider">•</span>
          <span class="epic-id" title="Epic ID">{spec.epicId.slice(0, 8)}</span>
          {#if spec.author}
            <span class="meta-divider">•</span>
            <span class="spec-author">{spec.author}</span>
          {/if}
        </div>

        <div class="spec-dates">
          <span class="date-item" title="Created {formatFullDate(spec.createdAt)}">
            Created {formatDate(spec.createdAt)}
          </span>
          <span class="meta-divider">•</span>
          <span class="date-item" title="Updated {formatFullDate(spec.updatedAt)}">
            Updated {formatDate(spec.updatedAt)}
          </span>
        </div>

        {#if spec.tags && spec.tags.length > 0}
          <div class="spec-tags">
            {#each spec.tags.slice(0, 3) as tag}
              <span class="tag">{tag}</span>
            {/each}
            {#if spec.tags.length > 3}
              <span class="tag more">+{spec.tags.length - 3}</span>
            {/if}
          </div>
        {/if}

        {#if spec.ticketCount > 0}
          <div class="related-section">
            <span class="related-label">{spec.ticketCount} ticket{spec.ticketCount === 1 ? '' : 's'}</span>
            <div class="related-items">
              {#each getRelatedTickets(spec.id).slice(0, 3) as ticket}
                <button 
                  class="related-item"
                  on:click={(e) => handleRelatedTicketClick(ticket.id, e)}
                  title="Open ticket: {ticket.title}"
                >
                  <span class="related-status" data-status={ticket.status}></span>
                  <span class="related-title">{ticket.title}</span>
                </button>
              {/each}
              {#if spec.ticketCount > 3}
                <span class="more-related">+{spec.ticketCount - 3} more</span>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>

<style>
  .spec-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }

  .empty-state {
    padding: 16px;
    text-align: center;
    color: var(--vscode-descriptionForeground);
    font-style: italic;
  }

  .spec-card {
    padding: 12px;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .spec-card:hover {
    background: var(--vscode-list-hoverBackground);
    border-color: var(--vscode-list-focusOutline);
  }

  .spec-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 6px;
  }

  .spec-title {
    font-weight: 500;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .spec-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 4px;
  }

  .meta-divider {
    opacity: 0.5;
  }

  .spec-id, .epic-id {
    font-family: var(--vscode-editor-font-family);
    opacity: 0.7;
  }

  .epic-id {
    cursor: help;
  }

  .spec-author {
    color: var(--vscode-textLink-foreground);
  }

  .spec-dates {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    color: var(--vscode-disabledForeground);
    margin-bottom: 6px;
  }

  .date-item {
    cursor: help;
  }

  .spec-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
  }

  .tag {
    padding: 2px 6px;
    font-size: 10px;
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    border-radius: 3px;
  }

  .tag.more {
    opacity: 0.7;
  }

  .related-section {
    border-top: 1px solid var(--vscode-panel-border);
    padding-top: 8px;
    margin-top: 4px;
  }

  .related-label {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    display: block;
    margin-bottom: 4px;
  }

  .related-items {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .related-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    font-size: 11px;
    color: var(--vscode-foreground);
    border-radius: 3px;
  }

  .related-item:hover {
    background: var(--vscode-list-hoverBackground);
  }

  .related-status {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .related-status[data-status="todo"] { background: #808080; }
  .related-status[data-status="in_progress"] { background: #0078d4; }
  .related-status[data-status="in_review"] { background: #cca700; }
  .related-status[data-status="done"] { background: #388a34; }
  .related-status[data-status="blocked"] { background: #f85149; }

  .related-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .more-related {
    font-size: 10px;
    color: var(--vscode-textLink-foreground);
    padding: 2px 6px;
  }
</style>
