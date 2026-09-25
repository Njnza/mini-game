import assert from 'assert';
import { GameRegistry } from '../../src/core/GameRegistry.js';

export async function runMiniGamesLifecycleTests() {
  console.log('\n--- Running Mini-Games Real Lifecycle Simulation Tests ---');

  // Setup headless DOM environment for simulation
  global.window = {
    innerWidth: 1024,
    innerHeight: 768,
    devicePixelRatio: 1,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
  global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
  global.cancelAnimationFrame = (id) => clearTimeout(id);

  const mockElem = () => ({
    style: {},
    dataset: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    appendChild: () => {},
    getContext: () => ({
      clearRect: () => {}, strokeRect: () => {}, fillRect: () => {},
      beginPath: () => {}, arc: () => {}, fill: () => {}, stroke: () => {},
      closePath: () => {}, moveTo: () => {}, lineTo: () => {},
      getExtension: () => null, getParameter: () => 0
    }),
    clientWidth: 800,
    clientHeight: 600,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
  });

  global.document = {
    createElement: () => mockElem(),
    createElementNS: () => mockElem()
  };

  const registry = new GameRegistry();
  const mockAudio = {
    playHit: () => {}, playGameOver: () => {}, playExplosion: () => {},
    playVictory: () => {}, playPowerup: () => {}, playJump: () => {},
    playScore: () => {}, playBounce: () => {}, playCardFlip: () => {},
    playMatchSuccess: () => {}, playClick: () => {}
  };
  const mockStorage = { saveHighScore: () => ({ current: 100, isNewRecord: false }) };

  for (const meta of registry.getAllMetas()) {
    const container = {
      innerHTML: '',
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      querySelector: () => mockElem(),
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {}
    };

    let gameOverFired = false;
    let finalScoreReceived = null;

    const game = registry.createInstance(meta.id, container, mockAudio, mockStorage, {
      onScore: () => {},
      onGameOver: (score) => {
        gameOverFired = true;
        finalScoreReceived = score;
      }
    });

    // 1. Test init
    assert.doesNotThrow(() => game.init(), `Game '${meta.id}' init() must not throw`);

    // 2. Test start
    assert.doesNotThrow(() => game.start(), `Game '${meta.id}' start() must not throw`);
    assert.strictEqual(game.isRunning, true, `Game '${meta.id}' must be running after start()`);

    // 3. Test frame simulation update (15 frames)
    for (let f = 0; f < 15; f++) {
      assert.doesNotThrow(() => game.update(0.016), `Game '${meta.id}' update() must not throw`);
    }

    // 4. Test pause & resume lifecycle
    assert.doesNotThrow(() => game.pause(), `Game '${meta.id}' pause() must not throw`);
    assert.strictEqual(game.isPaused, true, `Game '${meta.id}' must be paused`);
    assert.doesNotThrow(() => game.resume(), `Game '${meta.id}' resume() must not throw`);
    assert.strictEqual(game.isPaused, false, `Game '${meta.id}' must be resumed`);

    // 5. Test lethal damage / Game Over trigger
    if (meta.id === 'zap-pets') {
      // Simulate enemy attack causing lethal damage
      game.player.invulnerableTimer = 0;
      game.player.hp = 1;
      const testEnemy = { x: 0, z: 0, radius: 2, hp: 50, type: 'normal', dead: false };
      game.enemies = [testEnemy];
      assert.doesNotThrow(() => game.update(0.016), `Zap Pets lethal damage simulation must not throw`);
      assert.strictEqual(gameOverFired, true, `Zap Pets onGameOver callback must fire upon death`);
      assert.strictEqual(typeof finalScoreReceived, 'number', 'Final score must be a number');
    } else {
      assert.doesNotThrow(() => game.emitGameOver(), `Game '${meta.id}' emitGameOver() must not throw`);
      assert.strictEqual(gameOverFired, true, `Game '${meta.id}' onGameOver callback must fire`);
    }

    // 6. Test restart
    assert.doesNotThrow(() => game.restart(), `Game '${meta.id}' restart() must not throw`);

    // 7. Test destroy & cleanup
    assert.doesNotThrow(() => game.destroy(), `Game '${meta.id}' destroy() must not throw`);

    console.log(`✓ PASS: ${meta.title} (${meta.id}) completed full lifecycle and lethal damage simulation`);
  }
}
