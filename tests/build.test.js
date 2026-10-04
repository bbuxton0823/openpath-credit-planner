import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { build, PUBLIC_ASSETS } from '../scripts/build.js';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'openpath-build-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [source] of PUBLIC_ASSETS) {
    await mkdir(path.dirname(path.join(root, source)), { recursive: true });
    await writeFile(path.join(root, source), source);
  }
  return root;
}

async function files(root, prefix = '') {
  const result = [];
  for (const entry of await readdir(path.join(root, prefix), { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    result.push(...(entry.isDirectory() ? await files(root, relative) : [relative]));
  }
  return result.sort();
}

test('build publishes only the explicit public allowlist', async t => {
  const root = await fixture(t);
  for (const extra of ['RESEARCH.md', '.env', 'src/private.js', 'public/student-plan.json']) {
    await writeFile(path.join(root, extra), 'private fixture');
  }
  const result = await build(root);
  assert.deepEqual(await files(result.output), PUBLIC_ASSETS.map(([, target]) => target).sort());
  assert.equal(await readFile(path.join(result.output, 'src/journey.js'), 'utf8'), 'src/journey.js');
  assert.equal(await readFile(path.join(result.output, 'src/guide.js'), 'utf8'), 'src/guide.js');
  assert.equal(await readFile(path.join(result.output, 'src/guide.css'), 'utf8'), 'src/guide.css');
  for (const asset of ['catalog.js', 'custom-courses.js', 'custom-course-view.js', 'ousd-schedule.js', 'high-school.js', 'high-school-view.js', 'high-school-export.js', 'high-school.css', 'course-record.js', 'course-workflow-view.js', 'school-roster.js']) {
    assert.equal(await readFile(path.join(result.output, 'src', asset), 'utf8'), `src/${asset}`);
  }
});

test('rebuild removes stale files only inside its owned dist', async t => {
  const root = await fixture(t);
  await build(root);
  await writeFile(path.join(root, 'dist/student-plan.json'), 'stale private fixture');
  await writeFile(path.join(root, 'student-plan.json'), 'outside build output');
  await build(root);
  assert.deepEqual(await files(path.join(root, 'dist')), PUBLIC_ASSETS.map(([, target]) => target).sort());
  assert.equal(await readFile(path.join(root, 'student-plan.json'), 'utf8'), 'outside build output');
});

test('build preserves an unowned dist directory', async t => {
  const root = await fixture(t);
  await mkdir(path.join(root, 'dist'));
  await writeFile(path.join(root, 'dist/student-plan.json'), 'preserve me');
  await assert.rejects(build(root), /unowned dist/);
  assert.equal(await readFile(path.join(root, 'dist/student-plan.json'), 'utf8'), 'preserve me');
});

test('build rejects a symlinked source before changing an existing build', async t => {
  const root = await fixture(t);
  await build(root);
  await rm(path.join(root, 'src/app.js'));
  await symlink(path.join(root, 'index.html'), path.join(root, 'src/app.js'));
  await assert.rejects(build(root), /symlink/);
  assert.equal(await readFile(path.join(root, 'dist/src/app.js'), 'utf8'), 'src/app.js');
});

test('build rejects symlinked source directories and output directories', async t => {
  const root = await fixture(t);
  await rm(path.join(root, 'src'), { recursive: true });
  await symlink(path.join(root, 'public'), path.join(root, 'src'));
  await assert.rejects(build(root), /symlink/);
  await symlink(path.join(root, 'public'), path.join(root, 'dist'));
  await assert.rejects(build(root), /symlink dist/);
});

test('missing source never destroys the prior build', async t => {
  const root = await fixture(t);
  await build(root);
  await rm(path.join(root, 'src/journey.js'));
  await assert.rejects(build(root), /ENOENT/);
  assert.equal(await readFile(path.join(root, 'dist/src/journey.js'), 'utf8'), 'src/journey.js');
});

test('hosting config limits assets to dist and preserves strict client-only policy', async () => {
  const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.assets.directory, './dist');
  assert.equal(config.assets.not_found_handling, 'none');
  assert.equal(config.main, undefined);
  assert.equal(config.d1_databases, undefined);
  assert.equal(config.dev.ip, '127.0.0.1');
  assert.equal(config.send_metrics, false);
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, false);
  assert.equal(config.observability.enabled, false);
  assert.equal(config.dependencies_instrumentation.enabled, false);
  assert.equal(config.env.dev.name, 'openpath-credit-planner-dev');
  assert.equal(config.env.dev.account_id, '968bbe4ecaf64a0b5bede5b53e06aedd');
  assert.equal(config.env.dev.workers_dev, true);
  assert.equal(config.env.dev.preview_urls, true);
  assert.deepEqual(config.env.dev.assets, { directory: './dist', not_found_handling: 'none' });
  for (const environment of [config, config.env.dev]) {
    for (const key of ['route', 'routes', 'main', 'd1_databases', 'kv_namespaces', 'r2_buckets', 'services']) assert.equal(environment[key], undefined);
  }
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(packageJson.devDependencies.wrangler, '4.147.0');
  for (const script of ['preview', 'cf:dry-run', 'cf:deploy:dev']) {
    assert.ok(packageJson.scripts[script].includes('--env dev'));
    assert.ok(packageJson.scripts[script].includes('WRANGLER_SEND_METRICS=false'));
  }
  const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  for (const policy of ["connect-src 'none'", "frame-ancestors 'none'", "form-action 'none'", 'X-Content-Type-Options: nosniff', 'Referrer-Policy: no-referrer']) {
    assert.ok(headers.includes(policy));
  }
});
