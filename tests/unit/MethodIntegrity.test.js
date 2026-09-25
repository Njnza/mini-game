import assert from 'assert';
import fs from 'fs';
import path from 'path';

export function runMethodIntegrityTests() {
  console.log('\n--- Running Method Integrity & Static Safety Tests ---');

  const gamesDir = path.resolve('games');
  const gameFolders = fs.readdirSync(gamesDir);

  const errors = [];

  gameFolders.forEach(folder => {
    const gameFilePath = path.join(gamesDir, folder, 'game.js');
    if (!fs.existsSync(gameFilePath)) return;

    const content = fs.readFileSync(gameFilePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;

      // 1. Must never call this.gameOver() - must be this.emitGameOver()
      if (line.includes('this.gameOver(')) {
        errors.push(`[${folder}/game.js:${lineNum}] Invalid call to 'this.gameOver()'. Must use 'this.emitGameOver()'`);
      }

      // 2. Prohibit unhandled infinite while(true) loops
      if (line.includes('while (true)') || line.includes('while(true)')) {
        errors.push(`[${folder}/game.js:${lineNum}] Hazardous while(true) loop detected`);
      }
    });
  });

  assert.strictEqual(errors.length, 0, `Method integrity violations found:\n${errors.join('\n')}`);
  console.log('✓ PASS: All 6 mini-games passed method integrity and lifecycle safety checks');
}
