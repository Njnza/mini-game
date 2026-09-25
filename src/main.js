import { App } from './core/App.js';

window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  window.__GAME_HUB_APP__ = app; // Expose to window for debugging if needed
});
