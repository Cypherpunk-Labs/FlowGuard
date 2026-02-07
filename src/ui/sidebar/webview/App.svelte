<script lang="ts">
  import './styles/global.css';
  import SpecList from './components/SpecList.svelte';
  import TicketList from './components/TicketList.svelte';
  import ExecutionList from './components/ExecutionList.svelte';
  import SectionHeader from './components/SectionHeader.svelte';
  import LoadingSpinner from './components/LoadingSpinner.svelte';
  import ErrorMessage from './components/ErrorMessage.svelte';
  import { createSpec, createTicket, refresh } from './vscode';
  import type { SpecData, TicketData, ExecutionData } from '../types';

  export let specs: SpecData[] = [];
  export let tickets: TicketData[] = [];
  export let executions: ExecutionData[] = [];
  export let loading = false;
  export let error: string | null = null;

  let specsExpanded = true;
  let ticketsExpanded = true;
  let executionsExpanded = true;

  function handleCreateSpec() {
    createSpec();
  }

  function handleCreateTicket() {
    createTicket();
  }

  function handleRefresh() {
    loading = true;
    error = null;
    refresh();
  }

  function handleRetry() {
    error = null;
    handleRefresh();
  }

  function handleRefreshComplete() {
    loading = false;
  }
</script>

<div class="app">
  <div class="header">
    <h1>FlowGuard</h1>
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

  {#if loading && specs.length === 0 && tickets.length === 0 && executions.length === 0}
    <LoadingSpinner message="Loading..." />
  {:else}
    <div class="sections">
      <div class="section">
        <SectionHeader 
          title="Specs" 
          count={specs.length}
          onAdd={handleCreateSpec}
          bind:expanded={specsExpanded}
        />
        {#if specsExpanded}
          <SpecList {specs} {tickets} />
        {/if}
      </div>

      <div class="section">
        <SectionHeader 
          title="Tickets" 
          count={tickets.length}
          onAdd={handleCreateTicket}
          bind:expanded={ticketsExpanded}
        />
        {#if ticketsExpanded}
          <TicketList {tickets} {specs} />
        {/if}
      </div>

      <div class="section">
        <SectionHeader 
          title="Executions" 
          count={executions.length}
          onAdd={null}
          bind:expanded={executionsExpanded}
        />
        {#if executionsExpanded}
          <ExecutionList {executions} {specs} {tickets} />
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .app {
    padding: 10px;
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
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

  .sections {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section {
    background: var(--vscode-sideBar-background);
    border-radius: 4px;
  }
</style>
