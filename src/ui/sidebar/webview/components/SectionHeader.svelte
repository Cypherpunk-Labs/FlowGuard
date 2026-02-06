<script lang="ts">
  export let title: string;
  export let count: number;
  export let onAdd: (() => void) | null = null;
  export let expanded = true;

  function toggleExpanded() {
    expanded = !expanded;
  }
</script>

<div class="section-header">
  <button class="toggle-btn" on:click={toggleExpanded} aria-label={expanded ? 'Collapse' : 'Expand'}>
    <span class="arrow" class:expanded>▶</span>
  </button>
  <h3 class="title">{title} <span class="count">({count})</span></h3>
  {#if onAdd}
    <button class="add-btn" on:click={onAdd} aria-label="Add new">+</button>
  {/if}
</div>

<style>
  .section-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px;
    background: var(--vscode-sideBarSectionHeader-background);
    border-radius: 4px 4px 0 0;
  }

  .toggle-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 4px;
    color: var(--vscode-foreground);
    opacity: 0.7;
  }

  .toggle-btn:hover {
    opacity: 1;
  }

  .arrow {
    display: inline-block;
    transition: transform 0.2s;
    font-size: 10px;
  }

  .arrow.expanded {
    transform: rotate(90deg);
  }

  .title {
    flex: 1;
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .count {
    font-weight: normal;
    opacity: 0.7;
  }

  .add-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    font-size: 16px;
    font-weight: 300;
    color: var(--vscode-foreground);
    opacity: 0.7;
    transition: opacity 0.2s;
    line-height: 1;
  }

  .add-btn:hover {
    opacity: 1;
    background: var(--vscode-toolbar-hoverBackground);
    border-radius: 3px;
  }
</style>
