import assert from 'assert';
import { BaseGame } from '../../src/core/BaseGame.js';

export function runBaseGameTests() {
  console.log('\n--- Running BaseGame Unit Tests ---');

  // Test 1: Cannot instantiate BaseGame directly
  assert.throws(() => {
    new BaseGame();
  }, /Cannot construct BaseGame directly/, 'Should throw TypeError when instantiated directly');
  console.log('✓ PASS: BaseGame prevents direct instantiation');

  // Test 2: Subclass must implement init()
  class DummyGame extends BaseGame {}
  const mockContainer = { innerHTML: '', addEventListener: () => {}, removeEventListener: () => {} };
  const mockAudio = { playScore: () => {}, playGameOver: () => {} };
  const mockStorage = {};
  let scoreReported = null;
  let gameOverReported = null;

  const game = new DummyGame(mockContainer, mockAudio, mockStorage, {
    onScore: (s) => { scoreReported = s; },
    onGameOver: (s) => { gameOverReported = s; }
  });

  assert.throws(() => {
    game.init();
  }, /Method 'init\(\)' must be implemented/, 'Subclass must implement init()');
  console.log('✓ PASS: Subclass requires init() implementation');

  // Test 3: Lifecycle start, score emission, pause, resume
  game.start();
  assert.strictEqual(game.isRunning, true, 'Game should be running');
  assert.strictEqual(game.isPaused, false, 'Game should not be paused');
  assert.strictEqual(game.score, 0, 'Initial score should be 0');
  assert.strictEqual(scoreReported, 0, 'onScore callback should receive 0');
  console.log('✓ PASS: game.start() initializes state correctly');

  game.emitScore(150);
  assert.strictEqual(game.score, 150, 'Score should update to 150');
  assert.strictEqual(scoreReported, 150, 'onScore callback should receive 150');
  console.log('✓ PASS: game.emitScore() updates and triggers callback');

  game.pause();
  assert.strictEqual(game.isPaused, true, 'Game should be paused');
  game.resume();
  assert.strictEqual(game.isPaused, false, 'Game should be resumed');
  console.log('✓ PASS: game.pause() and game.resume() manage pause state');

  // Test 4: Resource tracking and cleanup
  let removedListeners = 0;
  const dummyTarget = {
    addEventListener: () => {},
    removeEventListener: () => { removedListeners++; }
  };
  game.addTrackedEventListener(dummyTarget, 'click', () => {});
  game.addTrackedEventListener(dummyTarget, 'keydown', () => {});
  assert.strictEqual(game._eventListeners.length, 2, 'Should track 2 event listeners');

  const timeoutId = game.addTrackedTimeout(() => {}, 5000);
  const intervalId = game.addTrackedInterval(() => {}, 5000);
  assert.strictEqual(game._timers.length, 2, 'Should track 2 timers');

  // Test 5: Destroy removes listeners, stops timers, clears container
  game.destroy();
  assert.strictEqual(game.isRunning, false, 'Game should stop running');
  assert.strictEqual(removedListeners, 2, 'Should have removed 2 event listeners');
  assert.strictEqual(game._eventListeners.length, 0, 'Tracked listeners array should be empty');
  assert.strictEqual(game._timers.length, 0, 'Tracked timers array should be empty');
  console.log('✓ PASS: game.destroy() cleanly frees all tracked listeners, timers, and DOM');
}
