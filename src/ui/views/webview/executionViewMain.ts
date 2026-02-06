import App from './ExecutionView.svelte';
import { getExecution, openSpec, openTicket, viewVerification, setupMessageListener } from './vscode';

const app = new App({
  target: document.body,
  props: {
    execution: null,
    loading: true,
    error: null,
    successMessage: null
  }
});

const cleanup = setupMessageListener(
  (data) => app.$set({ execution: data }),
  (_action, message) => {
    if (message) {
      app.$set({ successMessage: message });
      setTimeout(() => {
        app.$set({ successMessage: null });
      }, 3000);
    }
  },
  (message) => app.$set({ error: message }),
  (message) => app.$set({ error: message }),
  () => {
    if (app.$$.ctx && app.$$.ctx[0]) {
      app.$set({ loading: true, error: null });
    }
  }
);

window.addEventListener('message', (event) => {
  const message = event.data;
  if (message.type === 'executionDataResponse') {
    app.$set({ execution: message.data, loading: false, error: null });
  } else if (message.type === 'actionSuccess') {
    app.$set({ successMessage: message.message, loading: false });
  } else if (message.type === 'actionError' || message.type === 'error') {
    app.$set({ error: message.message, loading: false });
  } else if (message.type === 'refresh') {
    app.$set({ loading: true, error: null, successMessage: null });
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const executionId = params.get('executionId');
  if (executionId) {
    getExecution(executionId);
  } else {
    app.$set({ loading: false, error: 'No execution ID provided' });
  }
});

window.addEventListener('beforeunload', cleanup);

export default app;
