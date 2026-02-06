<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let specIds: string[];
  export let specTitles: string[];
  export let ticketIds: string[];
  export let ticketTitles: string[];

  const dispatch = createEventDispatcher();

  function handleOpenSpec(specId: string) {
    dispatch('openSpec', { specId });
  }

  function handleOpenTicket(ticketId: string) {
    dispatch('openTicket', { ticketId });
  }
</script>

<div class="linked-artifacts">
  <h3>Linked Artifacts</h3>

  {#if specIds.length > 0}
    <div class="artifact-section">
      <span class="artifact-count">{specIds.length} Spec{specIds.length !== 1 ? 's' : ''}</span>
      <div class="artifact-list">
        {#each specIds as specId, index}
          <button
            class="artifact-link"
            on:click={() => handleOpenSpec(specId)}
            title={specTitles[index] || specId}
          >
            <span class="artifact-icon">📋</span>
            <span class="artifact-title">{specTitles[index] || specId}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  {#if ticketIds.length > 0}
    <div class="artifact-section">
      <span class="artifact-count">{ticketIds.length} Ticket{ticketIds.length !== 1 ? 's' : ''}</span>
      <div class="artifact-list">
        {#each ticketIds as ticketId, index}
          <button
            class="artifact-link"
            on:click={() => handleOpenTicket(ticketId)}
            title={ticketTitles[index] || ticketId}
          >
            <span class="artifact-icon">🎫</span>
            <span class="artifact-title">{ticketTitles[index] || ticketId}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  {#if specIds.length === 0 && ticketIds.length === 0}
    <p class="no-artifacts">No linked artifacts</p>
  {/if}
</div>

<style>
  .linked-artifacts {
    background: var(--vscode-sideBar-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    padding: 12px;
  }

  h3 {
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .artifact-section {
    margin-bottom: 10px;
  }

  .artifact-section:last-child {
    margin-bottom: 0;
  }

  .artifact-count {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 6px;
  }

  .artifact-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .artifact-link {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    background: none;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.2s;
  }

  .artifact-link:hover {
    background: var(--vscode-list-hoverBackground);
  }

  .artifact-icon {
    font-size: 12px;
    flex-shrink: 0;
  }

  .artifact-title {
    font-size: 12px;
    color: var(--vscode-foreground);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .no-artifacts {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
    margin: 0;
  }
</style>
