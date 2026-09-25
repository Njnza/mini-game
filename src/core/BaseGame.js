/**
 * BaseGame.js
 * Abstract Base Class applying the Template Method Pattern.
 * Every mini-game extends BaseGame to guarantee a standardized lifecycle,
 * robust memory leak prevention, and seamless integration with the Game Hub.
 */
export class BaseGame {
  /**
   * @param {HTMLElement} container - DOM container element where the game renders
   * @param {import('./AudioManager.js').AudioManager} audio - Audio manager instance
   * @param {import('./StorageManager.js').StorageManager} storage - Storage manager class/instance
   * @param {Object} callbacks - Communication callbacks to the Game Hub
   * @param {Function} callbacks.onScore - Score change callback
   * @param {Function} callbacks.onGameOver - Game termination callback
   */
  constructor(container, audio, storage, callbacks = {}) {
    if (new.target === BaseGame) {
      throw new TypeError('Cannot construct BaseGame directly. Extend it instead.');
    }

    this.container = container;
    this.audio = audio;
    this.storage = storage;
    this.callbacks = callbacks;

    this.score = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;

    // Game loop timing (Delta-Time standard)
    this.animationFrameId = null;
    this.lastTime = 0;

    // Trackers for complete garbage collection on destroy
    this._eventListeners = [];
    this._timers = [];
  }

  /**
   * Initialize DOM elements, canvas, and event listeners.
   * Called once when the game is mounted.
   */
  init() {
    throw new Error("Method 'init()' must be implemented.");
  }

  /**
   * Start a new gameplay session.
   */
  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.score = 0;
    this.emitScore(0);
    this.lastTime = performance.now();
  }

  /**
   * Pause the active game.
   */
  pause() {
    if (!this.isRunning || this.isGameOver) return;
    this.isPaused = true;
  }

  /**
   * Resume the paused game.
   */
  resume() {
    if (!this.isRunning || this.isGameOver) return;
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  /**
   * Reset and restart the current game session.
   */
  restart() {
    this.cleanupLoopAndTimers();
    this.start();
  }

  /**
   * Logic update tick with delta time (in seconds).
   * @param {number} dt 
   */
  update(dt) {
    // Override in subclass
  }

  /**
   * Render frame to canvas context.
   * @param {CanvasRenderingContext2D} ctx 
   */
  render(ctx) {
    // Override in subclass
  }

  /**
   * Starts standardized 60FPS Delta-Time Game Loop
   */
  startLoop(ctx = null) {
    const loop = (currentTime) => {
      if (!this.isRunning) return;

      const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap dt to avoid large jumps
      this.lastTime = currentTime;

      if (!this.isPaused && !this.isGameOver) {
        this.update(dt);
        if (ctx) {
          this.render(ctx);
        }
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Notify the Hub controller of score changes
   * @param {number} newScore 
   */
  emitScore(newScore) {
    this.score = newScore;
    if (typeof this.callbacks.onScore === 'function') {
      this.callbacks.onScore(this.score);
    }
  }

  /**
   * Terminate game session and report final score
   */
  emitGameOver() {
    this.isGameOver = true;
    this.isRunning = false;
    this.cleanupLoopAndTimers();
    if (this.audio) {
      this.audio.playGameOver();
    }
    if (typeof this.callbacks.onGameOver === 'function') {
      this.callbacks.onGameOver(this.score);
    }
  }

  /**
   * Register event listener with automatic cleanup tracking
   */
  addTrackedEventListener(target, event, handler, options = false) {
    target.addEventListener(event, handler, options);
    this._eventListeners.push({ target, event, handler, options });
  }

  /**
   * Register tracked setTimeout
   */
  addTrackedTimeout(callback, delay) {
    const id = setTimeout(() => {
      callback();
      const idx = this._timers.indexOf(id);
      if (idx !== -1) this._timers.splice(idx, 1);
    }, delay);
    this._timers.push(id);
    return id;
  }

  /**
   * Register tracked setInterval
   */
  addTrackedInterval(callback, delay) {
    const id = setInterval(callback, delay);
    this._timers.push(id);
    return id;
  }

  /**
   * Cancel animation loop and all active timers
   */
  cleanupLoopAndTimers() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this._timers.forEach(id => {
      clearTimeout(id);
      clearInterval(id);
    });
    this._timers = [];
  }

  /**
   * Destroy and clean up 100% of resources when exiting to Hub.
   * Completely avoids memory leaks.
   */
  destroy() {
    this.isRunning = false;
    this.cleanupLoopAndTimers();

    // Detach all tracked event listeners
    this._eventListeners.forEach(({ target, event, handler, options }) => {
      target.removeEventListener(event, handler, options);
    });
    this._eventListeners = [];

    // Clear DOM container
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  /**
   * Window resize callback
   */
  onResize() {
    // Override in subclass if needed
  }
}
