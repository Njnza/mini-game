import assert from 'assert';
import http from 'http';
import fs from 'fs';
import path from 'path';

export async function runEndpointsTests() {
  console.log('\n--- Running Server Endpoints Integration Tests ---');

  const rootDir = process.cwd();
  const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
  };

  // Launch test server on dynamic free port (port 0)
  const testServer = http.createServer((req, res) => {
    let parsedUrl = req.url.split('?')[0];
    if (parsedUrl === '/' || parsedUrl === '') parsedUrl = '/index.html';

    const safePath = path.normalize(parsedUrl).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(rootDir, safePath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
  });

  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;

  const endpoints = [
    '/',
    '/style.css',
    '/src/main.js',
    '/src/core/App.js',
    '/src/core/AudioManager.js',
    '/src/core/BaseGame.js',
    '/src/core/GameRegistry.js',
    '/src/core/StorageManager.js',
    '/games/target-hunter/meta.js',
    '/games/target-hunter/game.js',
    '/games/neon-snake/meta.js',
    '/games/neon-snake/game.js',
    '/games/cyber-flappy/meta.js',
    '/games/cyber-flappy/game.js',
    '/games/brick-breaker/meta.js',
    '/games/brick-breaker/game.js',
    '/games/memory-matrix/meta.js',
    '/games/memory-matrix/game.js',
    '/games/zap-pets/meta.js',
    '/games/zap-pets/game.js',
    '/games/zap-pets/assets/fox.png',
    '/games/zap-pets/assets/bear.png',
    '/games/zap-pets/assets/bunny.png',
    '/src/lib/three.module.js'
  ];

  try {
    for (const ep of endpoints) {
      const res = await new Promise((resolve, reject) => {
        http.get(`http://localhost:${port}${ep}`, (response) => {
          let body = '';
          response.on('data', chunk => body += chunk);
          response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, length: body.length }));
        }).on('error', reject);
      });

      assert.strictEqual(res.status, 200, `Endpoint '${ep}' must return status 200 OK`);
      assert.ok(res.length > 0, `Endpoint '${ep}' must return non-empty content`);
    }
    console.log(`✓ PASS: All ${endpoints.length} critical server endpoints resolved with status 200 OK`);
  } finally {
    await new Promise((resolve) => testServer.close(resolve));
  }
}
