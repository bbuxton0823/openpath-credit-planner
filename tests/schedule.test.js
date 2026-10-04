import test from 'node:test';
import assert from 'node:assert/strict';
import { OUSD_SCHEDULE, OUSD_SCHEDULE_ROWS } from '../src/ousd-schedule.js';
import { COURSES, scheduleCourseId } from '../src/catalog.js';
import { compareCourse, totals } from '../src/rules.js';
import { emptyState, normalizeState } from '../src/state.js';

test('district snapshot contains every public course row and only class catalog fields', () => {
  assert.equal(OUSD_SCHEDULE_ROWS.length, 79);
  assert.equal(OUSD_SCHEDULE_ROWS.filter(row => row.collegeId).length, 74);
  assert.equal(new Set(OUSD_SCHEDULE_ROWS.map(row => row.id)).size, 79);
  assert.equal(new Set(OUSD_SCHEDULE_ROWS.map(row => row.school)).size, 16);
  assert.equal(OUSD_SCHEDULE.checkedAt, '2026-10-04');
  for (const row of OUSD_SCHEDULE_ROWS) {
    assert.equal(Object.keys(row).some(key => /instructor|email|contact|student|phone/i.test(key)), false);
    assert.ok(row.sourceUrl.startsWith(OUSD_SCHEDULE.source));
  }
});
test('nontransferable and CSU-only district flags never become UC/HBCU awards', () => {
  for (const [code, flag] of [['ART 205', 'Not transferable'], ['RLEST 2A', 'CSU Only']]) {
    const row = OUSD_SCHEDULE_ROWS.find(item => item.code === code);
    assert.equal(row.transferFlag, flag);
    const id = scheduleCourseId(row.id);
    assert.ok(id);
    assert.equal(compareCourse(id, 'uc-berkeley', {term:'Fall 2026'}).kind, 'unknown');
    assert.equal(compareCourse(id, 'howard', {term:'Fall 2026'}).kind, 'unknown');
  }
});
test('new course identity is exact and cannot borrow evidence through a spelling bridge', () => {
  const row = OUSD_SCHEDULE_ROWS.find(item => item.code === 'PSYCH C1000');
  const c = COURSES.find(item => item.id === scheduleCourseId(row.id));
  assert.equal(c.code, 'PSYCH C1000');
  assert.equal(c.ucYear, undefined);
  assert.equal(c.ncat, undefined);
  assert.notEqual(c.id, `${row.collegeId}-psyc-c1000`);
  const english = OUSD_SCHEDULE_ROWS.find(item => item.courseId === 'merritt-engl-c1000');
  assert.equal(scheduleCourseId(english.id), 'merritt-engl-c1000');
  assert.equal(compareCourse(scheduleCourseId(english.id), 'uc-berkeley', {term:'Fall 2026'}).kind, 'review');
});
test('combined or range listings and unsupported colleges are browsing-only, not synthetic courses', () => {
  for (const row of OUSD_SCHEDULE_ROWS.filter(item => !item.collegeId || /,| & |\d[A-Z]-[A-Z]/.test(item.code))) assert.equal(scheduleCourseId(row.id), null);
});
test('variable units remain unknown while exact schedule records persist with their college identity', () => {
  const row = OUSD_SCHEDULE_ROWS.find(item => item.code === 'EDUC 464');
  assert.equal(row.units, null);
  const state = emptyState();
  state.entries.push({id:'schedule-test', courseId:scheduleCourseId(row.id),status:'in-progress',term:'Fall 2026'});
  assert.deepEqual(normalizeState(state).entries, state.entries);
  const t = totals(state.entries);
  assert.equal(t.inProgress, 0);
  assert.equal(t.unknownByStatus.inProgress, 1);
});
test('repeated district sections map to one exact course identity, not extra course credit', () => {
  for (const row of OUSD_SCHEDULE_ROWS.filter(item => scheduleCourseId(item.id))) {
    const repeats = OUSD_SCHEDULE_ROWS.filter(item => item.collegeId === row.collegeId && item.code === row.code);
    assert.equal(new Set(repeats.map(item => scheduleCourseId(item.id))).size, 1);
  }
});
