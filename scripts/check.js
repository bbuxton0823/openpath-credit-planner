import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
// Resolve from the repo, not the caller's working directory.
const root = fileURLToPath(new URL('..', import.meta.url));
const files = ['server.js', ...['src', 'tests', 'scripts'].flatMap(dir => readdirSync(path.join(root, dir)).filter(f => f.endsWith('.js')).map(f => `${dir}/${f}`))]
  .map(file => path.join(root, file));
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Syntax checked ${files.length} JavaScript files.`);
