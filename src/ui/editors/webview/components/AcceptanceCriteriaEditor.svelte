<script lang="ts">
  export let criteria: string[] = [];
  export let onChange: (criteria: string[]) => void = () => {};

  let newCriterion = '';

  function addCriterion() {
    if (newCriterion.trim()) {
      criteria = [...criteria, newCriterion.trim()];
      newCriterion = '';
      onChange(criteria);
    }
  }

  function removeCriterion(index: number) {
    criteria = criteria.filter((_, i) => i !== index);
    onChange(criteria);
  }

  function toggleCriterion(index: number) {
    onChange(criteria);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCriterion();
    }
  }
</script>

<div class="acceptance-criteria">
  <h4>Acceptance Criteria</h4>

  <ul class="criteria-list">
    {#each criteria as criterion, index}
      <li class="criterion-item">
        <button
          type="button"
          class="toggle-btn"
          on:click={() => toggleCriterion(index)}
        >
          ⬜
        </button>
        <span class="criterion-text">{criterion}</span>
        <button
          type="button"
          class="remove-btn"
          on:click={() => removeCriterion(index)}
        >
          ×
        </button>
      </li>
    {/each}
  </ul>

  <div class="add-criterion">
    <input
      type="text"
      bind:value={newCriterion}
      on:keydown={handleKeydown}
      placeholder="Add acceptance criterion..."
      class="criterion-input"
    />
    <button type="button" on:click={addCriterion} class="add-btn">Add</button>
  </div>
</div>

<style>
  .acceptance-criteria {
    padding: 12px;
    border-top: 1px solid var(--vscode-panel-border);
  }

  h4 {
    margin: 0 0 12px 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--vscode-descriptionForeground);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .criteria-list {
    list-style: none;
    padding: 0;
    margin: 0 0 12px 0;
  }

  .criterion-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .criterion-item:last-child {
    border-bottom: none;
  }

  .toggle-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .toggle-btn:hover {
    opacity: 1;
  }

  .criterion-text {
    flex: 1;
    font-size: 13px;
  }

  .remove-btn {
    background: transparent;
    border: none;
    color: var(--vscode-errorForeground);
    cursor: pointer;
    font-size: 16px;
    padding: 0 4px;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .remove-btn:hover {
    opacity: 1;
  }

  .add-criterion {
    display: flex;
    gap: 8px;
  }

  .criterion-input {
    flex: 1;
    padding: 8px;
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-size: 13px;
  }

  .criterion-input:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
  }

  .add-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    font-size: 12px;
    cursor: pointer;
  }

  .add-btn:hover {
    background: var(--vscode-button-hoverBackground);
  }
</style>
