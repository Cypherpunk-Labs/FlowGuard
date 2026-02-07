<script lang="ts">
  export let status: string;
  export let type: 'spec' | 'ticket' | 'execution';

  function getStatusColor(status: string, type: string): string {
    const colors: Record<string, Record<string, string>> = {
      spec: {
        draft: '#808080',
        in_review: '#cca700',
        approved: '#388a34',
        archived: '#808080'
      },
      ticket: {
        todo: '#808080',
        in_progress: '#0078d4',
        in_review: '#cca700',
        done: '#388a34',
        blocked: '#f85149'
      },
      execution: {
        pending: '#808080',
        in_progress: '#0078d4',
        completed: '#388a34',
        failed: '#f85149'
      }
    };

    return colors[type]?.[status] || '#808080';
  }

  function formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
</script>

<span class="status-badge" style="background-color: {getStatusColor(status, type)}20; color: {getStatusColor(status, type)}; border: 1px solid {getStatusColor(status, type)}40;">
  {formatStatus(status)}
</span>

<style>
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    white-space: nowrap;
  }
</style>
