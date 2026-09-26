import assert from 'assert';
import { GameRegistry } from '../../src/core/GameRegistry.js';
import { BaseGame } from '../../src/core/BaseGame.js';

export function runGameRegistryTests() {
  console.log('\n--- Running GameRegistry Unit Tests ---');

  const registry = new GameRegistry();
  const metas = registry.getAllMetas();

  // Test 1: Exactly 7 games registered
  assert.strictEqual(metas.length, 7, 'Should have exactly 7 registered games');
  console.log('✓ PASS: GameRegistry contains 7 mini-games');

  // Test 2: Check required metadata schema for every game
  const expectedIds = ['target-hunter', 'neon-snake', 'cyber-flappy', 'brick-breaker', 'memory-matrix', 'zap-pets', 'tower-defense'];
  expectedIds.forEach(id => {
    const meta = registry.getMeta(id);
    assert.ok(meta, `Game metadata for '${id}' should exist`);
    assert.strictEqual(meta.id, id, `ID should match '${id}'`);
    assert.ok(typeof meta.title === 'string' && meta.title.length > 0, `Title for '${id}' must be non-empty string`);
    assert.ok(typeof meta.category === 'string' && meta.category.length > 0, `Category for '${id}' must be non-empty string`);
    assert.ok(typeof meta.icon === 'string' && meta.icon.length > 0, `Icon for '${id}' must be non-empty string`);
    assert.ok(typeof meta.description === 'string' && meta.description.length > 0, `Description for '${id}' must be non-empty string`);
    assert.ok(Array.isArray(meta.controls) && meta.controls.length > 0, `Controls for '${id}' must be non-empty array`);
  });
  console.log('✓ PASS: All registered games have valid metadata schema (id, title, category, icon, description, controls)');

  // Test 3: Factory creates valid BaseGame instance
  const mockContainer = { innerHTML: '', addEventListener: () => {}, removeEventListener: () => {} };
  const mockAudio = { playScore: () => {}, playGameOver: () => {} };
  const mockStorage = {};

  const snakeInstance = registry.createInstance('neon-snake', mockContainer, mockAudio, mockStorage, {});
  assert.ok(snakeInstance instanceof BaseGame, 'Created instance must inherit from BaseGame');
  console.log('✓ PASS: Factory creates instances inheriting from BaseGame');

  // Test 4: Throws error for non-existent game ID
  assert.throws(() => {
    registry.createInstance('non-existent-game-id', mockContainer, mockAudio, mockStorage, {});
  }, /not found in registry/, 'Should throw error when game ID is invalid');
  console.log('✓ PASS: Factory safely throws error on unknown game ID');
}
