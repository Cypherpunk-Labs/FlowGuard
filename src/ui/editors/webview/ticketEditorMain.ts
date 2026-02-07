import TicketEditor from './TicketEditor.svelte';

const app = new TicketEditor({
  target: document.body
});

window.addEventListener('beforeunload', () => {
  app.$destroy();
});

export default app;
