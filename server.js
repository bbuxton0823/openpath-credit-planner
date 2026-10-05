import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const publicPaths = new Set([
  '/', '/src/app.js', '/src/data.js', '/src/catalog.js', '/src/custom-courses.js', '/src/ousd-schedule.js', '/src/state.js', '/src/rules.js',
  '/src/judgment.js', '/src/journey.js', '/src/guide.js',
  '/src/high-school.js', '/src/high-school-view.js',
  '/src/high-school-export.js',
  '/src/custom-course-view.js',
  '/src/course-record.js', '/src/course-workflow-view.js', '/src/school-roster.js',
  '/src/styles.css', '/src/guide.css', '/src/high-school.css',
]);
// Same headers as the Cloudflare deployment, read from public/_headers, on every response.
function parseHeaders(text) {
  const headers = {};
  let inGlobal = false;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) { inGlobal = line.trim() === '/*'; continue; }
    const at = line.indexOf(':');
    if (inGlobal && at > 0) headers[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  return headers;
}
const securityHeaders = parseHeaders(readFileSync(path.join(root, 'public/_headers'), 'utf8'));
const port = Number(process.env.PORT || 4317);
const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { ...securityHeaders, Allow: 'GET, HEAD' }).end();
    return;
  }
  let name;
  try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400, securityHeaders).end('Bad request'); return; }
  if (!publicPaths.has(name)) { res.writeHead(404, securityHeaders).end(req.method === 'HEAD' ? undefined : 'Not found'); return; }
  try {
    const target = path.join(root, name === '/' ? 'index.html' : name);
    const body = await readFile(target);
    res.writeHead(200, {
      ...securityHeaders,
      'Content-Type': `${types[path.extname(target)] || 'text/plain'}; charset=utf-8`,
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404, securityHeaders).end(req.method === 'HEAD' ? undefined : 'Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Matriculate local prototype: http://localhost:${server.address().port}`));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
