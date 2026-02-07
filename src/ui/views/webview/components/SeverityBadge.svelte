<script lang="ts">
  export let severity: 'Critical' | 'High' | 'Medium' | 'Low';

  const severityConfig = {
    Critical: { color: '#f85149', icon: 'alert' },
    High: { color: '#ff8c00', icon: 'warning' },
    Medium: { color: '#cca700', icon: 'info' },
    Low: { color: '#808080', icon: 'note' }
  };

  $: config = severityConfig[severity];
</script>

<span class="severity-badge" style="--severity-color: {config.color}">
  {severity}
</span>

<style>
  .severity-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    background: color-mix(in srgb, var(--severity-color) 20%, transparent);
    color: var(--severity-color);
  }
</style>
