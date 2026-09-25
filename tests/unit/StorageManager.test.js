import assert from 'assert';
import { StorageManager } from '../../src/core/StorageManager.js';

export function runStorageManagerTests() {
  console.log('\n--- Running StorageManager Unit Tests ---');

  // Mock localStorage for Node.js test environment if not defined
  if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => store.get(k) || null,
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear()
    };
  }

  const testGameId = 'test-game';

  // Test 1: Initial high score should be 0
  assert.strictEqual(StorageManager.getHighScore(testGameId), 0, 'Default high score must be 0');
  console.log('✓ PASS: Initial high score returns 0');

  // Test 2: Save new record
  const res1 = StorageManager.saveHighScore(testGameId, 100);
  assert.strictEqual(res1.isNewRecord, true, 'Score 100 should be marked as new record');
  assert.strictEqual(res1.current, 100);
  assert.strictEqual(StorageManager.getHighScore(testGameId), 100, 'Saved score must persist in localStorage');
  console.log('✓ PASS: saveHighScore accurately sets new record');

  // Test 3: Save lower score (should not be new record)
  const res2 = StorageManager.saveHighScore(testGameId, 50);
  assert.strictEqual(res2.isNewRecord, false, 'Score 50 should not overwrite high score of 100');
  assert.strictEqual(StorageManager.getHighScore(testGameId), 100);
  console.log('✓ PASS: saveHighScore prevents overwriting record with lower score');

  // Test 4: Save & get settings
  StorageManager.saveSetting('test_theme', 'dark-arcade');
  assert.strictEqual(StorageManager.getSetting('test_theme'), 'dark-arcade');
  assert.strictEqual(StorageManager.getSetting('non_existent', 'default-val'), 'default-val');
  console.log('✓ PASS: Settings storage and default fallbacks work correctly');

  // Test 5: Increment play count
  const count1 = StorageManager.incrementPlayCount(testGameId);
  const count2 = StorageManager.incrementPlayCount(testGameId);
  assert.strictEqual(count2, count1 + 1, 'Play count should increment sequentially');
  console.log('✓ PASS: incrementPlayCount tracks game sessions');
}
