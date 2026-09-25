/**
 * run-all-tests.js
 * Master Automated Test Suite for Mini-Game Hub.
 * Executes all Unit and Integration tests. Exits with 0 if all pass, 1 if any fail.
 */

import { runBaseGameTests } from './unit/BaseGame.test.js';
import { runGameRegistryTests } from './unit/GameRegistry.test.js';
import { runStorageManagerTests } from './unit/StorageManager.test.js';
import { runAudioManagerTests } from './unit/AudioManager.test.js';
import { runMethodIntegrityTests } from './unit/MethodIntegrity.test.js';
import { runMiniGamesLifecycleTests } from './unit/MiniGamesLifecycle.test.js';
import { runSyntaxTests } from './integration/Syntax.test.js';
import { runEndpointsTests } from './integration/Endpoints.test.js';

async function main() {
  console.log('====================================================');
  console.log('🧪 NEO ARCADE - AUTOMATED TEST SUITE RUNNER');
  console.log('====================================================');

  const startTime = Date.now();
  const suites = [
    { name: 'BaseGame Lifecycle & Memory Management', fn: runBaseGameTests },
    { name: 'GameRegistry & Metadata Schema', fn: runGameRegistryTests },
    { name: 'StorageManager & High Scores', fn: runStorageManagerTests },
    { name: 'AudioManager & Audio Engine', fn: runAudioManagerTests },
    { name: 'Method Integrity & Static Safety', fn: runMethodIntegrityTests },
    { name: 'Mini-Games Real Lifecycle Simulation', fn: runMiniGamesLifecycleTests },
    { name: 'Syntax & ES Module Validation', fn: runSyntaxTests },
    { name: 'Server HTTP Endpoints Integration', fn: runEndpointsTests }
  ];

  let passedSuites = 0;

  for (const suite of suites) {
    try {
      await suite.fn();
      passedSuites++;
    } catch (err) {
      console.error(`\n❌ FAILED SUITE: ${suite.name}`);
      console.error(err);
      console.log('\n====================================================');
      console.log('🚨 TEST SUITE FAILED! CODE REJECTED.');
      console.log('====================================================\n');
      process.exit(1);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n====================================================');
  console.log(`🎉 ALL ${passedSuites}/${suites.length} TEST SUITES PASSED! (${duration}s)`);
  console.log('✅ CODE APPROVED FOR DEPLOYMENT.');
  console.log('====================================================\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal Test Runner Exception:', err);
  process.exit(1);
});
