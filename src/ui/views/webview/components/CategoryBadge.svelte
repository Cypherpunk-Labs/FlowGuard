<script lang="ts">
  export let category: string;

  const categoryConfig = {
    security: { icon: 'shield', label: 'Security' },
    performance: { icon: 'zap', label: 'Performance' },
    style: { icon: 'paintbrush', label: 'Style' },
    logic: { icon: 'bug', label: 'Logic' },
    documentation: { icon: 'file-text', label: 'Documentation' },
    testing: { icon: 'checklist', label: 'Testing' },
    architecture: { icon: 'beaker', label: 'Architecture' }
  };

  $: config = categoryConfig[category as keyof typeof categoryConfig] || { icon: 'tag', label: category };
</script>

<span class="category-badge">
  {config.label}
</span>

<style>
  .category-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 500;
    text-transform: capitalize;
    background: var(--vscode-sideBar-background);
    color: var(--vscode-descriptionForeground);
    border: 1px solid var(--vscode-panel-border);
  }
</style>
