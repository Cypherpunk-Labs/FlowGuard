import App from './App.svelte';
import { getSpecs, getTickets, getExecutions, setupMessageListener } from './vscode';

const app = new App({
  target: document.body
});

// Set up message listener
const cleanup = setupMessageListener(
  (data) => app.$set({ specs: data }),
  (data) => app.$set({ tickets: data }),
  (data) => app.$set({ executions: data }),
  (message) => app.$set({ error: message }),
  () => {
    // Refresh all data
    getSpecs();
    getTickets();
    getExecutions();
  }
);

// Load initial data
getSpecs();
getTickets();
getExecutions();

// Cleanup on unload
window.addEventListener('beforeunload', cleanup);

export default app;
