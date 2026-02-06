<script lang="ts">
  import type { ExecutionData, SpecData, TicketData } from '../../types';
  import StatusBadge from './StatusBadge.svelte';
  import { openArtifact } from '../vscode';

  export let executions: ExecutionData[] = [];
  export let specs: SpecData[] = [];
  export let tickets: TicketData[] = [];

  function handleClick(executionId: string) {
    openArtifact('execution', executionId);
  }

  function handleRelatedSpecClick(specId: string, e: Event) {
    e.stopPropagation();
    openArtifact('spec', specId);
  }

  function handleRelatedTicketClick(ticketId: string, e: Event) {
    e.stopPropagation();
    openArtifact('ticket', ticketId);
  }

  function getAgentIcon(agentType: string): string {
    switch (agentType.toLowerCase()) {
      case 'cursor': return '📝';
      case 'claude': return '🤖';
      case 'windsurf': return '🏄';
      case 'cline': return '📎';
      case 'aider': return '🦆';
      default: return '🤖';
    }
  }

  function formatDuration(startedAt: string, completedAt?: string): string {
    if (!completedAt) return 'In progress';
    
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
    if (diffMins > 0) return `${diffMins}m`;
    return '< 1m';
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

  function getRelatedTickets(executionId: string): TicketData[] {
    const execution = executions.find(e => e.id === executionId);
    if (!execution) return [];
    return tickets.filter(t => execution.ticketIds.includes(t.id));
  }
</script>

<div class="execution-list">
  {#if executions.length === 0}
    <div class="empty-state">No executions yet.</div>
  {:else}
    {#each executions as execution (execution.id)}
      <div 
        class="execution-card"
        on:click={() => handleClick(execution.id)}
        on:keypress={(e) => e.key === 'Enter' && handleClick(execution.id)}
        role="button"
        tabindex="0"
      >
        <div class="execution-header">
          <span class="agent-icon" title={`Agent: ${execution.agentType}`}>
            {getAgentIcon(execution.agentType)}
          </span>
          <span class="execution-id">{execution.id.slice(0, 8)}</span>
          <StatusBadge status={execution.status} type="execution" />
        </div>
        
        <div class="execution-meta">
          <span class="epic-id">{execution.epicId.slice(0, 8)}</span>
          <span class="meta-divider">•</span>
          <span class="execution-date" title="Started {formatFullDate(execution.startedAt)}">
            {formatDate(execution.startedAt)}
          </span>
          {#if execution.completedAt}
            <span class="meta-divider">•</span>
            <span class="execution-duration">
              {formatDuration(execution.startedAt, execution.completedAt)}
            </span>
          {/if}
        </div>

        {#if execution.specCount > 0 || execution.ticketCount > 0}
          <div class="related-section">
            {#if execution.specCount > 0 && execution.specTitles && execution.specTitles.length > 0}
              <div class="related-group">
                <span class="related-label">{execution.specCount} spec{execution.specCount === 1 ? '' : 's'}</span>
                <div class="related-items">
                  {#each execution.specIds.slice(0, 2) as specId, i}
                    <button 
                      class="related-item"
                      on:click={(e) => handleRelatedSpecClick(specId, e)}
                      title="Open spec: {execution.specTitles[i]}"
                    >
                      {execution.specTitles[i]}
                    </button>
                  {/each}
                  {#if execution.specCount > 2}
                    <span class="more-related">+{execution.specCount - 2} more</span>
                  {/if}
                </div>
              </div>
            {/if}

            {#if execution.ticketCount > 0}
              {@const relatedTickets = getRelatedTickets(execution.id)}
              <div class="related-group">
                <span class="related-label">{execution.ticketCount} ticket{execution.ticketCount === 1 ? '' : 's'}</span>
                <div class="related-items">
                  {#each relatedTickets.slice(0, 2) as ticket}
                    <button 
                      class="related-item"
                      on:click={(e) => handleRelatedTicketClick(ticket.id, e)}
                      title="Open ticket: {ticket.title}"
                    >
                      <span class="related-status" data-status={ticket.status}></span>
                      <span class="related-title">{ticket.title}</span>
                    </button>
                  {/each}
                  {#if execution.ticketCount > 2}
                    <span class="more-related">+{execution.ticketCount - 2} more</span>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>

<style>
  .execution-list {
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

  .execution-card {
    padding: 12px;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .execution-card:hover {
    background: var(--vscode-list-hoverBackground);
    border-color: var(--vscode-list-focusOutline);
  }

  .execution-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }

  .agent-icon {
    font-size: 14px;
  }

  .execution-id {
    font-family: var(--vscode-editor-font-family);
    font-size: 12px;
    opacity: 0.7;
    flex: 1;
  }

  .execution-meta {
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

  .epic-id {
    font-family: var(--vscode-editor-font-family);
    opacity: 0.7;
    cursor: help;
  }

  .execution-duration {
    color: var(--vscode-textLink-foreground);
  }

  .related-section {
    border-top: 1px solid var(--vscode-panel-border);
    padding-top: 8px;
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .related-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .related-label {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
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
