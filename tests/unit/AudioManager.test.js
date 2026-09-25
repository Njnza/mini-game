import assert from 'assert';
import { AudioManager } from '../../src/core/AudioManager.js';

export function runAudioManagerTests() {
  console.log('\n--- Running AudioManager Unit Tests ---');

  const audio = new AudioManager();

  // Test 1: Initial state
  assert.strictEqual(audio.isMuted, false, 'Default audio state should not be muted');
  assert.strictEqual(audio.volume, 0.3, 'Default volume should be 0.3');
  console.log('✓ PASS: AudioManager initializes with expected defaults');

  // Test 2: Toggle mute
  const muted1 = audio.toggleMute();
  assert.strictEqual(muted1, true, 'toggleMute should switch to true');
  assert.strictEqual(audio.isMuted, true);

  const muted2 = audio.toggleMute();
  assert.strictEqual(muted2, false, 'toggleMute should switch back to false');
  assert.strictEqual(audio.isMuted, false);
  console.log('✓ PASS: toggleMute successfully alternates mute state');

  // Test 3: Safe execution without browser AudioContext in headless/node test environment
  assert.doesNotThrow(() => {
    audio.playClick();
    audio.playScore();
    audio.playCombo(2);
    audio.playJump();
    audio.playHit();
    audio.playExplosion();
    audio.playGameOver();
    audio.playVictory();
  }, 'Audio trigger methods should safely no-op when AudioContext is unavailable');
  console.log('✓ PASS: Audio trigger methods are robust and graceful without AudioContext');
}
