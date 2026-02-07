<script lang="ts">
  export let steps: string[] = [];
  export let onChange: (steps: string[]) => void = () => {};

  let newStep = '';

  function addStep() {
    if (newStep.trim()) {
      steps = [...steps, newStep.trim()];
      newStep = '';
      onChange(steps);
    }
  }

  function removeStep(index: number) {
    steps = steps.filter((_, i) => i !== index);
    onChange(steps);
  }

  function moveStepUp(index: number) {
    if (index > 0) {
      const newSteps = [...steps];
      [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
      steps = newSteps;
      onChange(steps);
    }
  }

  function moveStepDown(index: number) {
    if (index < steps.length - 1) {
      const newSteps = [...steps];
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
      steps = newSteps;
      onChange(steps);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addStep();
    }
  }
</script>

<div class="implementation-steps">
  <h4>Implementation Steps</h4>

  <ol class="steps-list">
    {#each steps as step, index}
      <li class="step-item">
        <div class="step-number">{index + 1}</div>
        <span class="step-text">{step}</span>
        <div class="step-actions">
          <button
            type="button"
            class="move-btn"
            on:click={() => moveStepUp(index)}
            disabled={index === 0}
          >
            ↑
          </button>
          <button
            type="button"
            class="move-btn"
            on:click={() => moveStepDown(index)}
            disabled={index === steps.length - 1}
          >
            ↓
          </button>
          <button
            type="button"
            class="remove-btn"
            on:click={() => removeStep(index)}
          >
            ×
          </button>
        </div>
      </li>
    {/each}
  </ol>

  <div class="add-step">
    <input
      type="text"
      bind:value={newStep}
      on:keydown={handleKeydown}
      placeholder="Add implementation step..."
      class="step-input"
    />
    <button type="button" on:click={addStep} class="add-btn">Add</button>
  </div>
</div>

<style>
  .implementation-steps {
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

  .steps-list {
    list-style: none;
    padding: 0;
    margin: 0 0 12px 0;
    counter-reset: step-counter;
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .step-item:last-child {
    border-bottom: none;
  }

  .step-number {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border-radius: 50%;
    font-size: 11px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .step-text {
    flex: 1;
    font-size: 13px;
  }

  .step-actions {
    display: flex;
    gap: 4px;
  }

  .move-btn {
    background: transparent;
    border: none;
    color: var(--vscode-foreground);
    cursor: pointer;
    font-size: 12px;
    padding: 2px 6px;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .move-btn:hover:not(:disabled) {
    opacity: 1;
  }

  .move-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .remove-btn {
    background: transparent;
    border: none;
    color: var(--vscode-errorForeground);
    cursor: pointer;
    font-size: 16px;
    padding: 2px 6px;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .remove-btn:hover {
    opacity: 1;
  }

  .add-step {
    display: flex;
    gap: 8px;
  }

  .step-input {
    flex: 1;
    padding: 8px;
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-size: 13px;
  }

  .step-input:focus {
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
