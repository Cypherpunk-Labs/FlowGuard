import SpecEditor from './SpecEditor.svelte';

const app = new SpecEditor({
  target: document.body
});

window.addEventListener('beforeunload', () => {
  app.$destroy();
});

export default app;
