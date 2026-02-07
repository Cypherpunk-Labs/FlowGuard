<script lang="ts">
  import type { TicketData, SpecData } from '../../types';
  import StatusBadge from './StatusBadge.svelte';
  import { openArtifact } from '../vscode';

  export let tickets: TicketData[] = [];
  export let specs: SpecData[] = [];

  function handleClick(ticketId: string) {
    openArtifact('ticket', ticketId);
  }

  function handleRelatedSpecClick(specId: string, e: Event) {
    e.stopPropagation();
    openArtifact('spec', specId);
  }

  function getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'low': return '↓';
      case 'medium': return '→';
      case 'high': return '↑';
      case 'critical': return '‼';
      default: return '→';
    }
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

  function getParentSpec(specId: string): SpecData | undefined {
    return specs.find(s => s.id === specId);
  }
</script>

<div class="ticket-list">
  {#if tickets.length === 0}
    <div class="empty-state">No tickets yet. Click + to create one.</div>
  {:else}
    {#each tickets as ticket (ticket.id)}
      <div 
        class="ticket-card"
        on:click={() => handleClick(ticket.id)}
        on:keypress={(e) => e.key === 'Enter' && handleClick(ticket.id)}
        role="button"
        tabindex="0"
      >
        <div class="ticket-header">
          <span class="priority-icon" title={`Priority: ${ticket.priority}`}>
            {getPriorityIcon(ticket.priority)}
          </span>
          <span class="ticket-title" title={ticket.title}>{ticket.title}</span>
          <StatusBadge status={ticket.status} type="ticket" />
        </div>
        
        <div class="ticket-meta">
          <span class="ticket-id">{ticket.id.slice(0, 8)}</span>
          <span class="meta-divider">•</span>
          <span class="epic-id">{ticket.epicId.slice(0, 8)}</span>
          {#if ticket.assignee}
            <span class="meta-divider">•</span>
            <span class="ticket-assignee">@{ticket.assignee}</span>
          {/if}
          {#if ticket.estimatedEffort}
            <span class="meta-divider">•</span>
            <span class="ticket-effort">{ticket.estimatedEffort}</span>
          {/if}
        </div>

        <div class="ticket-dates">
          <span class="date-item" title="Created {formatFullDate(ticket.createdAt)}">
            Created {formatDate(ticket.createdAt)}
          </span>
          <span class="meta-divider">•</span>
          <span class="date-item" title="Updated {formatFullDate(ticket.updatedAt)}">
            Updated {formatDate(ticket.updatedAt)}
          </span>
        </div>

        {#if ticket.tags && ticket.tags.length > 0}
          <div class="ticket-tags">
            {#each ticket.tags.slice(0, 3) as tag}
              <span class="tag">{tag}</span>
            {/each}
            {#if ticket.tags.length > 3}
              <span class="tag more">+{ticket.tags.length - 3}</span>
            {/if}
          </div>
        {/if}

        {#if ticket.specTitle}
          <div class="related-spec">
            <span class="related-label">Parent Spec:</span>
            <button 
              class="related-spec-link"
              on:click={(e) => handleRelatedSpecClick(ticket.specId, e)}
              title="Open spec: {ticket.specTitle}"
            >
              {ticket.specTitle}
            </button>
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>

<style>
  .ticket-list {
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

  .ticket-card {
    padding: 12px;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ticket-card:hover {
    background: var(--vscode-list-hoverBackground);
    border-color: var(--vscode-list-focusOutline);
  }

  .ticket-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }

  .priority-icon {
    font-size: 12px;
    opacity: 0.7;
  }

  .ticket-title {
    font-weight: 500;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .ticket-meta {
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

  .ticket-id, .epic-id {
    font-family: var(--vscode-editor-font-family);
    opacity: 0.7;
  }

  .ticket-assignee {
    color: var(--vscode-textLink-foreground);
  }

  .ticket-effort {
    opacity: 0.8;
  }

  .ticket-dates {
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

  .ticket-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 6px;
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

  .related-spec {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--vscode-panel-border);
  }

  .related-label {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
  }

  .related-spec-link {
    background: none;
    border: none;
    padding: 2px 6px;
    font-size: 11px;
    color: var(--vscode-textLink-foreground);
    cursor: pointer;
    border-radius: 3px;
  }

  .related-spec-link:hover {
    background: var(--vscode-list-hoverBackground);
    text-decoration: underline;
  }
</style>
