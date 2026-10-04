import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('loopback server serves the prototype and blocks private files and writes', async () => {
  const server = spawn(process.execPath, ['server.js'], {
    cwd: new URL('..', import.meta.url), env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    const [data] = await once(server.stdout, 'data');
    const address = String(data).trim().split(' ').at(-1);
    const response = await fetch(address);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /OpenPath/);
    assert.match(response.headers.get('content-security-policy'), /connect-src 'none'/);
    assert.equal((await fetch(`${address}/src/app.js`)).status, 200);
    assert.equal((await fetch(`${address}/package.json`)).status, 404);
    assert.equal((await fetch(`${address}/../AGENTS.md`)).status, 404);
    assert.equal((await fetch(`${address}/`, { method: 'POST', body: 'test-only' })).status, 405);
  } finally {
    server.kill();
    await once(server, 'exit');
  }
});
