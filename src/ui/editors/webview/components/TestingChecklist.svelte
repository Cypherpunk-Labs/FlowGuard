<script lang="ts">
  export let checklist: { text: string; checked: boolean }[] = [];
  export let onChange: (checklist: { text: string; checked: boolean }[]) => void = () => {};

  let newItem = '';

  function addItem() {
    if (newItem.trim()) {
      checklist = [...checklist, { text: newItem.trim(), checked: false }];
      newItem = '';
      onChange(checklist);
    }
  }

  function removeItem(index: number) {
    checklist = checklist.filter((_, i) => i !== index);
    onChange(checklist);
  }

  function toggleItem(index: number) {
    checklist[index].checked = !checklist[index].checked;
    checklist = checklist;
    onChange(checklist);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  }
</script>

<div class="testing-checklist">
  <h4>Testing Checklist</h4>

  <ul class="checklist">
    {#each checklist as item, index}
      <li class="checklist-item" class:checked={item.checked}>
        <button
          type="button"
          class="checkbox"
          on:click={() => toggleItem(index)}
        >
          {item.checked ? '☑️' : '⬜'}
        </button>
        <span class="item-text">{item.text}</span>
        <button
          type="button"
          class="remove-btn"
          on:click={() => removeItem(index)}
        >
          ×
        </button>
      </li>
    {/each}
  </ul>

  <div class="add-item">
    <input
      type="text"
      bind:value={newItem}
      on:keydown={handleKeydown}
      placeholder="Add test item..."
      class="item-input"
    />
    <button type="button" on:click={addItem} class="add-btn">Add</button>
  </div>
</div>

<style>
  .testing-checklist {
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

  .checklist {
    list-style: none;
    padding: 0;
    margin: 0 0 12px 0;
  }

  .checklist-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .checklist-item:last-child {
    border-bottom: none;
  }

  .checklist-item.checked .item-text {
    text-decoration: line-through;
    opacity: 0.6;
  }

  .checkbox {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
  }

  .item-text {
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

  .add-item {
    display: flex;
    gap: 8px;
  }

  .item-input {
    flex: 1;
    padding: 8px;
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-size: 13px;
  }

  .item-input:focus {
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
