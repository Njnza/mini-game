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

    // 5. Test lethal damage / Game Over trigger & long distance movement
    if (meta.id === 'zap-pets') {
      // Simulate multi-directional long distance travel
      game.keys['w'] = true;
      for (let f = 0; f < 50; f++) game.update(0.016);
      delete game.keys['w'];

      game.keys['d'] = true;
      for (let f = 0; f < 50; f++) game.update(0.016);
      delete game.keys['d'];

      assert.strictEqual(Number.isFinite(game.player.x), true, 'Player X must remain a finite number');
      assert.strictEqual(Number.isFinite(game.player.z), true, 'Player Z must remain a finite number');

      // Test skills
      assert.doesNotThrow(() => game.triggerSkill1(), 'Skill 1 trigger must not throw');
      assert.doesNotThrow(() => game.triggerSkill2(), 'Skill 2 trigger must not throw');

      // Test hero switcher
      assert.doesNotThrow(() => game.switchHero('bear'), 'Hero switch to Bear must not throw');
      assert.doesNotThrow(() => game.switchHero('bunny'), 'Hero switch to Bunny must not throw');
      assert.doesNotThrow(() => game.switchHero('fox'), 'Hero switch to Fox must not throw');

      // Simulate enemy attack causing lethal damage
      game.player.invulnerableTimer = 0;
      game.player.hp = 1;
      const testEnemy = { x: game.player.x, z: game.player.z, radius: 2, hp: 50, type: 'normal', dead: false };
      game.enemies = [testEnemy];
      assert.doesNotThrow(() => game.update(0.016), `Zap Pets lethal damage simulation must not throw`);
      assert.strictEqual(gameOverFired, true, `Zap Pets onGameOver callback must fire upon death`);
      assert.strictEqual(typeof finalScoreReceived, 'number', 'Final score must be a number');
    } else if (meta.id === 'tower-defense') {
      // 1. Build tower
      const buildRes = game.towers.buildTower('cannon', 2, 2, game.gold);
      assert.strictEqual(buildRes.success, true, 'Tower build must succeed on open tile');

      // 2. Upgrade tower
      const upRes = game.towers.upgradeTower(buildRes.tower, null, game.gold);
      assert.strictEqual(upRes.success, true, 'Tower upgrade must succeed');

      // 3. Hero actions
      assert.doesNotThrow(() => game.hero.commandMove(150, 150), 'Hero command move must not throw');
      assert.doesNotThrow(() => game.hero.triggerSkill1(200, 200), 'Hero EMP skill must not throw');
      assert.doesNotThrow(() => game.hero.triggerSkill2(game.towers.towers), 'Hero Overdrive skill must not throw');

      // 4. Commander Powers
      assert.doesNotThrow(() => game.abilities.triggerAbility('airstrike', null, 200, game.enemies.enemies, game.towers.towers), 'Airstrike must not throw');

      // 5. Simulate lethal breach
      game.lives = 1;
      const testBreachEnemy = { livesTaken: 1, type: 'trooper', x: 700, y: 300, dead: false };
      game.enemies.handleEnemyBreach(testBreachEnemy);
      assert.strictEqual(gameOverFired, true, 'Tower Defense game over callback must fire when lives reach 0');
    } else if (meta.id === 'trung-thu-chaos') {
      // 1. Test thrust action
      game.player.isThrusting = true;
      for (let f = 0; f < 5; f++) game.update(0.016);
      game.player.isThrusting = false;
      for (let f = 0; f < 5; f++) game.update(0.016);

      // 2. Test Mid-Autumn power-ups
      assert.doesNotThrow(() => game.triggerTurboPower(), 'Turbo Power trigger must not throw');
      assert.doesNotThrow(() => game.triggerDecoyPower(), 'Decoy Power trigger must not throw');
      assert.doesNotThrow(() => game.triggerLiePower(), 'Lie Charm trigger must not throw');

      // 3. Test Boss Battle trigger & damage
      assert.doesNotThrow(() => game.triggerBossBattle(), 'Boss battle trigger must not throw');
      assert.strictEqual(game.boss.isActive, true, 'Boss must be active after trigger');
      assert.doesNotThrow(() => game.boss.damageBoss(4, game.fx), 'Boss damage calculation must not throw');

      // 4. Test Game Over trigger
      game.lives = 1;
      assert.doesNotThrow(() => game.handleGameOver(), 'Handle game over must not throw');
      assert.strictEqual(gameOverFired, true, 'Trung Thu Chaos onGameOver callback must fire');
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
