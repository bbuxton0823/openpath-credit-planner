import test from 'node:test';
import assert from 'node:assert/strict';
import { COLLEGES, COURSES, DESTINATIONS } from '../src/data.js';
import { suggestCourses } from '../src/rules.js';
import { briefEvidence, guidedCandidates, studentChecks } from '../src/guide.js';

const state = (destinationIds = ['uc-berkeley', 'ncat'], entries = []) => ({
  profile: { collegeIds: COLLEGES.map(college => college.id), destinationIds, planningTerm: 'Spring 2027' }, entries,
});

test('guided candidates show each family once without dropping source-college choices', () => {
  const input = state();
  const groups = guidedCandidates(input);
  assert.equal(groups.length, 4);
  assert.equal(new Set(groups.map(group => group.family)).size, groups.length);
  assert.equal(groups[0].family, 'math-3a');
  for (const group of groups) {
    assert.equal(group.options.length, 4);
    assert.equal(new Set(group.options.map(option => option.course.collegeId)).size, 4);
    assert.ok(group.options.every(option => option.course.family === group.family));
  }
  const original = suggestCourses(input);
  for (const group of groups) assert.deepEqual(group.options, original.filter(option => option.course.family === group.family));
});

test('guided candidates omit saved families and retain the source-college filter', () => {
  const input = state(['uc-berkeley'], [{ courseId: 'laney-engl-c1000', status: 'completed', term: 'Fall 2026' }]);
  input.profile.collegeIds = ['merritt'];
  const groups = guidedCandidates(input);
  assert.equal(groups.length, 3);
  assert.ok(groups.every(group => group.family !== 'engl-c1000' && group.options.length === 1));
  assert.ok(groups.every(group => group.options[0].course.collegeId === 'merritt'));
  assert.deepEqual(guidedCandidates(state(['howard'])), []);
});

test('brief UC facts count one systemwide source and expose the course-year mismatch', () => {
  const targets = DESTINATIONS.filter(destination => destination.type === 'UC').map(destination => destination.id);
  const brief = briefEvidence('laney-engl-c1000', state(targets));
  assert.equal(brief.known.length, 1);
  assert.match(brief.known[0], /2025-26 UC guide lists 4 semester units/);
  assert.match(brief.check.join(' '), /Confirm credit for Spring 2027.*covers 2025-26/);
  assert.match(brief.check.join(' '), /school must confirm how it counts toward a degree/);
  assert.match(brief.check.join(' '), /grade\/transcript rules/);
  assert.match(brief.check.join(' '), /prerequisites, placement and course availability/);
  const matching = briefEvidence('laney-engl-c1000', state(targets), { term: 'Fall 2025' });
  assert.doesNotMatch(matching.check.join(' '), /Confirm credit for/);
  const missing = briefEvidence('laney-engl-c1000', state(targets), {});
  assert.match(missing.check.join(' '), /Add your course term/);
});

test('brief N.C. A&T facts remain preliminary with an unknown effective year', () => {
  const brief = briefEvidence('merritt-math-3a', state(['ncat']));
  assert.match(brief.known.join(' '), /preliminary match \(4 credits\)/);
  assert.match(brief.check.join(' '), /no effective year/);
  assert.match(brief.check.join(' '), /must confirm the match and final credit/);
});

test('brief unknown and blocked results never turn missing evidence into rejection', () => {
  const brief = briefEvidence('laney-math-3a', state(['howard', 'spelman', 'tuskegee', 'morehouse']));
  assert.deepEqual(brief.known, []);
  assert.match(brief.check.join(' '), /Spelman, Howard, Tuskegee, Morehouse: no verified course match; unknown isn't rejection/);
  assert.match(brief.check.join(' '), /Morehouse's lookup was blocked before a Peralta search/);
  assert.equal(brief.check.filter(item => item.includes('no verified course match')).length, 1);
});

test('brief evidence never carries a historical N.C. A&T equivalent onto a current course', () => {
  const current = briefEvidence('laney-engl-c1000', state(['ncat']));
  const historic = briefEvidence('laney-historical-engl-1a', state(['ncat', 'uc-berkeley']));
  assert.deepEqual(current.known, []);
  assert.match(current.check.join(' '), /No old-to-new course-number match is verified/);
  assert.match(historic.known.join(' '), /preliminary match \(3 credits\)/);
  assert.doesNotMatch(historic.known.join(' '), /UC guide/);
  assert.match(historic.check.join(' '), /Keep historical and current courses separate/);
});

test('brief evidence keeps supported-English unit caps and duplicates visible', () => {
  const brief = briefEvidence('laney-engl-c1000e', state(['uc-berkeley']));
  assert.match(brief.known.join(' '), /4 semester units/);
  assert.match(brief.check.join(' '), /5 local units.*4-UC-unit cap/);
  assert.match(brief.check.join(' '), /duplicates ENGL C1000/);
});

test('brief evidence without destinations asks for school choices or counselor review', () => {
  const input = state([]);
  const before = structuredClone(input);
  const brief = briefEvidence('laney-engl-c1000', input);
  assert.deepEqual(brief.known, []);
  assert.match(brief.check.join(' '), /Choose colleges you might attend.*ask a counselor where this class could count/);
  assert.deepEqual(input, before);
  assert.deepEqual(briefEvidence('unknown-course', state()).known, []);
});

test('normal four-school summaries stay concise without dropping year, degree or readiness checks', () => {
  const brief = briefEvidence('laney-math-3a', state(['uc-berkeley', 'uc-davis', 'ncat', 'howard']));
  assert.equal(brief.known.length, 2);
  assert.ok(brief.check.length <= 6);
  assert.match(brief.check.join(' '), /2025-26/);
  assert.match(brief.check.join(' '), /one-series limits/);
  assert.match(brief.check.join(' '), /no effective year/);
  assert.match(brief.check.join(' '), /grade\/transcript rules/);
  assert.match(brief.check.join(' '), /prerequisites/);
  const alternatives = briefEvidence('berkeley-city-historical-math-13', state(['ncat']));
  assert.match(alternatives.known.join(' '), /3 credits for one, not both/);
});

test('student checks stay within three plain-language bullets for every seeded course and destination', () => {
  const targetSets = [...DESTINATIONS.map(destination => [destination.id]), DESTINATIONS.map(destination => destination.id)];
  for (const course of COURSES) {
    for (const targets of targetSets) {
      for (const term of ['Fall 2025', 'Spring 2027', undefined]) {
        const checks = studentChecks(course, state(targets), { term });
        assert.ok(checks.length >= 1 && checks.length <= 3, `${course.id}: ${targets.join(', ')}`);
        assert.ok(checks.every(check => typeof check === 'string' && check.length > 0));
        assert.doesNotMatch(checks.join(' '), /\bGE\b|prerequis|effective year|transcript/i);
      }
    }
  }
});

test('student checks distinguish mismatched, matching and missing UC course terms', () => {
  const input = state(['uc-berkeley', 'uc-davis']);
  const mismatch = studentChecks('laney-engl-c1000', input);
  assert.match(mismatch[0], /confirm credit for Spring 2027.*covers 2025-26/);
  assert.equal(mismatch.filter(check => check.includes('UC guide')).length, 1);
  const matching = studentChecks('laney-engl-c1000', input, { term: 'Fall 2025' });
  assert.equal(matching.length, 1);
  assert.doesNotMatch(matching.join(' '), /confirm credit for|covers 2025-26|Add the term/);
  const missing = studentChecks('laney-engl-c1000', input, {});
  assert.match(missing[0], /Add the term.*covers 2025-26/);
  assert.match(missing.at(-1), /advisor.*degree.*ready to enroll/);
});

test('student checks combine date checks but keep unknown schools and enrollment readiness visible', () => {
  const checks = studentChecks('laney-math-3a', state(['uc-berkeley', 'uc-davis', 'ncat', 'howard']));
  assert.equal(checks.length, 3);
  assert.match(checks[0], /Spring 2027.*2025-26.*N\.C\. A&T.*possible match.*no year/);
  assert.match(checks[1], /Credit at Howard is still unknown, not rejected/);
  assert.match(checks[2], /advisor.*degree.*ready to enroll/);
  const hbcuOnly = studentChecks('laney-engl-c1000', state(['howard', 'spelman', 'tuskegee', 'morehouse']));
  assert.equal(hbcuOnly.length, 2);
  assert.match(hbcuOnly[0], /Spelman, Howard, Tuskegee, Morehouse/);
  assert.doesNotMatch(hbcuOnly.join(' '), /UC guide/);
});

test('student checks preserve historical identity instead of moving an old match to a current code', () => {
  const input = state(['ncat', 'uc-berkeley']);
  const current = studentChecks('laney-engl-c1000', input);
  const historical = studentChecks('laney-historical-engl-1a', input);
  assert.match(current.join(' '), /Credit at N\.C\. A&T is still unknown/);
  assert.doesNotMatch(current.join(' '), /possible match/);
  assert.match(historical[0], /N\.C\. A&T must confirm its possible match/);
  assert.match(historical[1], /Credit at UC is still unknown/);
  assert.doesNotMatch(historical.join(' '), /UC guide covers/);
});

test('student checks handle missing choices helpfully and leave state and evidence detail unchanged', () => {
  const input = state();
  const course = COURSES.find(course => course.id === 'laney-math-3a');
  const entry = { courseId: course.id, term: 'Spring 2027', status: 'planned' };
  const snapshot = structuredClone({ input, course, entry });
  const detail = briefEvidence(course, input, entry);
  studentChecks(course, input, entry);
  assert.deepEqual({ input, course, entry }, snapshot);
  assert.deepEqual(briefEvidence(course, input, entry), detail);
  const noTargets = studentChecks(course, state([]));
  assert.equal(noTargets.length, 1);
  assert.match(noTargets[0], /Choose colleges.*ask a counselor/);
  const unknownCourse = studentChecks('unknown-course', input);
  assert.equal(unknownCourse.length, 1);
  assert.match(unknownCourse[0], /Choose the exact class/);
});
