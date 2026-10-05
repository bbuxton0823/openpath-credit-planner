import http from 'node:http';
import { readFile } from 'node:fs/promises';
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
const port = Number(process.env.PORT || 4317);
const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  let name;
  try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end('Bad request'); return; }
  if (!publicPaths.has(name)) { res.writeHead(404).end('Not found'); return; }
  try {
    const target = path.join(root, name === '/' ? 'index.html' : name);
    const body = await readFile(target);
    res.writeHead(200, {
      'Content-Type': `${types[path.extname(target)] || 'text/plain'}; charset=utf-8`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
      'Referrer-Policy': 'no-referrer',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404).end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Matriculate local prototype: http://localhost:${server.address().port}`));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
