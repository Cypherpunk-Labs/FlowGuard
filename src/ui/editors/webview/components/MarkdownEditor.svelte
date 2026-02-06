<script lang="ts">
  export let content: string = '';
  export let onChange: (content: string) => void = () => {};
  export let placeholder: string = 'Write your markdown here...';

  let textarea: HTMLTextAreaElement;
  let cursorPosition = 0;

  function handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    content = target.value;
    cursorPosition = target.selectionStart;
    onChange(content);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = '  ';
      content = content.substring(0, start) + spaces + content.substring(end);
      cursorPosition = start + spaces.length;
      onChange(content);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = cursorPosition;
      }, 0);
    }

    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'b') {
        e.preventDefault();
        wrapSelection('**', '**');
      } else if (e.key === 'i') {
        e.preventDefault();
        wrapSelection('*', '*');
      } else if (e.key === 'k') {
        e.preventDefault();
        insertLink();
      }
    }
  }

  function wrapSelection(prefix: string, suffix: string) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) {
      return;
    }
    const selection = content.substring(start, end);
    content = content.substring(0, start) + prefix + selection + suffix + content.substring(end);
    cursorPosition = end + prefix.length + suffix.length;
    onChange(content);
    setTimeout(() => {
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = end + prefix.length;
    }, 0);
  }

  function insertText(text: string, offset = 0) {
    const start = textarea.selectionStart;
    content = content.substring(0, start) + text + content.substring(start);
    cursorPosition = start + text.length + offset;
    onChange(content);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = cursorPosition;
    }, 0);
  }

  function insertLink() {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = content.substring(start, end);
    const text = selection || 'link text';
    const link = `[${text}](url)`;
    content = content.substring(0, start) + link + content.substring(end);
    cursorPosition = start + link.length;
    onChange(content);
    setTimeout(() => {
      textarea.selectionStart = start + text.length + 3;
      textarea.selectionEnd = start + text.length + 6;
    }, 0);
  }

  function handleSelectionChange() {
    cursorPosition = textarea.selectionStart;
  }
</script>

<div class="markdown-editor">
  <div class="toolbar">
    <button type="button" on:click={() => wrapSelection('**', '**')} title="Bold (Cmd+B)">
      <strong>B</strong>
    </button>
    <button type="button" on:click={() => wrapSelection('*', '*')} title="Italic (Cmd+I)">
      <em>I</em>
    </button>
    <button type="button" on:click={() => wrapSelection('`', '`')} title="Code">
      <code>&lt;/&gt;</code>
    </button>
    <button type="button" on:click={() => insertText('\n- ')} title="Bullet List">
      • List
    </button>
    <button type="button" on:click={() => insertText('\n1. ')} title="Numbered List">
      1. List
    </button>
    <button type="button" on:click={insertLink} title="Insert Link (Cmd+K)">
      🔗
    </button>
    <button type="button" on:click={() => wrapSelection('`', '`')} title="Inline Code">
      <code>code</code>
    </button>
    <button type="button" on:click={() => wrapSelection('> ', '')} title="Quote">
      "
    </button>
    <button type="button" on:click={() => insertText('\n---\n')} title="Horizontal Rule">
      ——
    </button>
  </div>
  <textarea
    bind:this={textarea}
    bind:value={content}
    on:input={handleInput}
    on:keydown={handleKeyDown}
    on:select={handleSelectionChange}
    on:click={handleSelectionChange}
    {placeholder}
    class="editor-textarea"
    spellcheck="false"
  ></textarea>
</div>

<style>
  .markdown-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    overflow: hidden;
  }

  .toolbar {
    display: flex;
    gap: 4px;
    padding: 8px;
    background: var(--vscode-toolbar-background);
    border-bottom: 1px solid var(--vscode-panel-border);
    flex-wrap: wrap;
  }

  .toolbar button {
    padding: 4px 8px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    color: var(--vscode-foreground);
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
    min-width: 28px;
  }

  .toolbar button:hover {
    background: var(--vscode-toolbar-hoverBackground);
    border-color: var(--vscode-toolbar-border);
  }

  .toolbar button:active {
    background: var(--vscode-toolbar-activeBackground);
  }

  .editor-textarea {
    flex: 1;
    padding: 12px;
    border: none;
    background: transparent;
    color: var(--vscode-editor-foreground);
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 14px;
    line-height: 1.6;
    resize: none;
    outline: none;
    tab-size: 2;
  }

  .editor-textarea::placeholder {
    color: var(--vscode-input-placeholderForeground);
  }
</style>
