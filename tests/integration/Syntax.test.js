import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export function runSyntaxTests() {
  console.log('\n--- Running Syntax & ES Module Validation Tests ---');

  const rootDir = process.cwd();
  const dirs = [path.join(rootDir, 'src'), path.join(rootDir, 'games')];
  const jsFiles = [path.join(rootDir, 'server.js')];

  function collectFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectFiles(full);
      } else if (entry.name.endsWith('.js')) {
        jsFiles.push(full);
      }
    }
  }

  dirs.forEach(collectFiles);

  assert.ok(jsFiles.length >= 15, `Found ${jsFiles.length} JS files to check`);

  let passedCount = 0;
  for (const file of jsFiles) {
    try {
      execSync(`node --check "${file}"`, { stdio: 'pipe' });
      passedCount++;
    } catch (err) {
      assert.fail(`Syntax error detected in file '${file}':\n${err.message}`);
    }
  }

  console.log(`✓ PASS: All ${passedCount}/${jsFiles.length} JavaScript files passed node syntax verification`);
}
