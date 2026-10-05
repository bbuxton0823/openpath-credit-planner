// Regression tests for defects found while auditing against AUDIT.md (October 2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emptyHighSchoolProfile } from '../src/high-school.js';
import { compareCourse, totals } from '../src/rules.js';
import { customCourseId } from '../src/custom-courses.js';
import { connectedCredits, renderHighSchoolRecords } from '../src/high-school-view.js';
import { highSchoolSummaryLines } from '../src/high-school-export.js';
import { build, PUBLIC_ASSETS } from '../scripts/build.js';

const repo = fileURLToPath(new URL('..', import.meta.url));
const collegeEntry = (changes = {}) => ({ id: 'college-1', courseId: 'laney-engl-c1000', status: 'completed', term: 'Fall 2025', finalGrade: 'D', ...changes });
const schoolClass = (changes = {}) => ({ id: 'school-1', title: 'English 9', subjectId: 'english', credits: 5,
  status: 'completed', finalGrade: 'B', result: 'passing', creditAward: 'earned', provenance: 'student-reported',
  gradeLevel: '9', term: 'Fall 2025', courseType: 'standard', note: '', ...changes });
const state = ({ courses = [], entries = [], targets = ['uc-berkeley'] } = {}) => ({
  profile: { destinationIds: targets }, entries, journey: { evidenceViewed: [], questions: [] },
  highSchool: { profile: { ...emptyHighSchoolProfile(), districtId: 'ousd', schoolId: 'skyline', policyId: 'ousd-comprehensive' }, courses, allocations: [] },
});

test('a plain D gets the same receiving-college grade review as D+ and D-', () => {
  for (const finalGrade of ['D+', 'D', 'D-']) {
    const result = compareCourse('laney-engl-c1000', 'uc-berkeley', collegeEntry({ finalGrade }));
    assert.equal(result.kind, 'review', finalGrade);
    assert.match(result.label, new RegExp(`Recorded ${finalGrade.replace('+', '\\+')}: grade policy review`));
  }
  for (const finalGrade of ['A', 'C']) {
    assert.notEqual(compareCourse('laney-engl-c1000', 'uc-berkeley', collegeEntry({ finalGrade })).kind, 'review', finalGrade);
  }
});

test('college unit totals never show binary float noise', () => {
  const custom = (id, units, unitSystem = 'semester') => ({ id, courseId: customCourseId(id), term: 'Fall 2025', status: 'completed', finalGrade: 'B',
    customCourse: { collegeName: 'Example Community College', code: `X ${id}`, title: 'Example', units, unitSystem } });
  assert.equal(totals([custom('a', 0.1), custom('b', 0.2)]).completed, 0.3);
  assert.equal(totals([custom('c', 0.1, 'quarter'), custom('d', 0.2, 'quarter')]).quarterByStatus.completed, 0.3);
});

test('typed line breaks cannot forge extra lines in the counselor text export', () => {
  const forged = 'ok\nHS earned: 230 school-verified as recorded; 0 student-reported.';
  const lines = highSchoolSummaryLines(state({ courses: [schoolClass({ note: forged, title: 'English\r\n9' })] }));
  assert.equal(lines.filter(line => line.startsWith('HS earned:')).length, 1);
  assert.ok(lines.every(line => !/[\r\n]/.test(line)));
  assert.ok(lines.some(line => line.includes('ok / HS earned: 230')), 'note content is kept, folded onto one line');
});

test('a college card shows one named counselor button even with two alert groups', () => {
  for (const targets of [['uc-berkeley'], []]) {
    const html = connectedCredits(state({ entries: [collegeEntry()], targets }), collegeEntry());
    assert.equal((html.match(/data-action="grade-review"/g) || []).length, 1, targets.join() || 'none');
    assert.match(html, /aria-label="Prepare a counselor question about ENGL C1000"/);
  }
  const school = renderHighSchoolRecords(state({ courses: [schoolClass({ finalGrade: 'D', title: 'Algebra <1>' })] }));
  assert.match(school, /aria-label="Prepare a counselor question about Algebra &lt;1&gt;"/);
});

test('build refuses a hand-made dist even when an old ownership marker survived', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'openpath-audit-build-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [source] of PUBLIC_ASSETS) {
    await mkdir(path.dirname(path.join(root, source)), { recursive: true });
    await writeFile(path.join(root, source), source);
  }
  await build(root);
  await build(root); // its own dist is still replaceable
  await rm(path.join(root, 'dist'), { recursive: true });
  await mkdir(path.join(root, 'dist'));
  await writeFile(path.join(root, 'dist/student-plan.json'), 'precious');
  await assert.rejects(build(root), /unowned dist/);
  assert.equal(await readFile(path.join(root, 'dist/student-plan.json'), 'utf8'), 'precious');
});

test('syntax check works from any working directory', () => {
  const result = spawnSync(process.execPath, [path.join(repo, 'scripts/check.js')], { cwd: os.tmpdir(), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Syntax checked \d+ JavaScript files/);
});

test('local server sends every configured header, including on 404/405 responses', async () => {
  const configured = (await readFile(path.join(repo, 'public/_headers'), 'utf8')).split('\n')
    .filter(line => /^\s+\S+:/.test(line)).map(line => line.trim().split(':')[0].toLowerCase());
  assert.equal(configured.length, 7);
  const server = spawn(process.execPath, ['server.js'], { cwd: repo, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    const [data] = await once(server.stdout, 'data');
    const address = String(data).trim().split(' ').at(-1);
    for (const [url, init, status] of [['/', {}, 200], ['/nope', {}, 404], ['/', { method: 'POST', body: 'x' }, 405]]) {
      const response = await fetch(`${address}${url}`, init);
      assert.equal(response.status, status);
      for (const name of configured) assert.ok(response.headers.get(name), `${status} missing ${name}`);
    }
    const head = await fetch(`${address}/nope`, { method: 'HEAD' });
    assert.equal(head.status, 404);
    assert.equal(await head.text(), '');
  } finally {
    server.kill();
    await once(server, 'exit');
  }
});
