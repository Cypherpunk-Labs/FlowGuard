<script lang="ts">
  import type { FieldSchema, ValidationError } from '../../types';

  export let metadata: Record<string, unknown> = {};
  export let schema: FieldSchema[] = [];
  export let onChange: (field: string, value: unknown) => void = () => {};

  let errors: Record<string, ValidationError[]> = {};

  function handleInput(field: string, value: unknown, fieldSchema: FieldSchema) {
    if (fieldSchema.validation) {
      const error = fieldSchema.validation(value);
      if (error) {
        errors[field] = [error];
      } else {
        delete errors[field];
        errors = errors;
      }
    }
    onChange(field, value);
  }

  function getFieldErrors(field: string): ValidationError[] {
    return errors[field] || [];
  }

  function getValue(field: string): string {
    const val = metadata[field];
    if (Array.isArray(val)) {
      return val.join(', ');
    }
    return String(val ?? '');
  }
</script>

<div class="metadata-panel">
  {#each schema as fieldSchema}
    <div class="field" class:has-error={getFieldErrors(fieldSchema.name).length > 0}>
      <label for={fieldSchema.name}>
        {fieldSchema.label}
        {#if fieldSchema.required}<span class="required">*</span>{/if}
      </label>

      {#if fieldSchema.type === 'text'}
        <input
          type="text"
          id={fieldSchema.name}
          placeholder={fieldSchema.placeholder || ''}
          value={getValue(fieldSchema.name)}
          on:input={(e) => handleInput(fieldSchema.name, e.currentTarget.value, fieldSchema)}
          class="field-input"
        />
      {:else if fieldSchema.type === 'textarea'}
        <textarea
          id={fieldSchema.name}
          placeholder={fieldSchema.placeholder || ''}
          value={getValue(fieldSchema.name)}
          on:input={(e) => handleInput(fieldSchema.name, e.currentTarget.value, fieldSchema)}
          class="field-input"
          rows="3"
        ></textarea>
      {:else if fieldSchema.type === 'select'}
        <select
          id={fieldSchema.name}
          value={getValue(fieldSchema.name)}
          on:change={(e) => handleInput(fieldSchema.name, e.currentTarget.value, fieldSchema)}
          class="field-input"
        >
          {#if fieldSchema.options}
            {#each fieldSchema.options as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          {/if}
        </select>
      {:else if fieldSchema.type === 'date'}
        <input
          type="date"
          id={fieldSchema.name}
          value={getValue(fieldSchema.name)}
          on:input={(e) => handleInput(fieldSchema.name, e.currentTarget.value, fieldSchema)}
          class="field-input"
        />
      {:else if fieldSchema.type === 'tags'}
        <input
          type="text"
          id={fieldSchema.name}
          placeholder={fieldSchema.placeholder || 'tag1, tag2, tag3'}
          value={getValue(fieldSchema.name)}
          on:input={(e) => {
            const tags = e.currentTarget.value.split(',').map(t => t.trim()).filter(Boolean);
            handleInput(fieldSchema.name, tags, fieldSchema);
          }}
          class="field-input"
        />
      {:else if fieldSchema.type === 'number'}
        <input
          type="number"
          id={fieldSchema.name}
          value={getValue(fieldSchema.name)}
          on:input={(e) => handleInput(fieldSchema.name, e.currentTarget.value, fieldSchema)}
          class="field-input"
        />
      {/if}

      {#each getFieldErrors(fieldSchema.name) as error}
        <span class="error-message">{error.message}</span>
      {/each}
    </div>
  {/each}
</div>

<style>
  .metadata-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    background: var(--vscode-editor-background);
    border-right: 1px solid var(--vscode-panel-border);
    height: 100%;
    overflow-y: auto;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .field.has-error .field-input {
    border-color: var(--vscode-errorForeground);
  }

  label {
    font-size: 12px;
    font-weight: 500;
    color: var(--vscode-foreground);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .required {
    color: var(--vscode-errorForeground);
  }

  .field-input {
    padding: 6px 8px;
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
  }

  .field-input:focus {
    border-color: var(--vscode-focusBorder);
  }

  textarea.field-input {
    resize: vertical;
    min-height: 60px;
  }

  select.field-input {
    cursor: pointer;
  }

  .error-message {
    font-size: 11px;
    color: var(--vscode-errorForeground);
  }
</style>
