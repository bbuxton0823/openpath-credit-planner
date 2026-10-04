import test from 'node:test';
import assert from 'node:assert/strict';
import { COLLEGES, COURSES, DESTINATIONS } from '../src/data.js';
import { academicYear, compareCourse, duplicateWarnings, suggestCourses, totals } from '../src/rules.js';

const findCourse = (id) => COURSES.find((course) => course.id === id);
const state = (destinationIds, entries = []) => ({ profile: { collegeIds: ['laney'], destinationIds, planningTerm: 'Spring 2027' }, entries });

test('catalog preserves all four source colleges and all fourteen destinations', () => {
  assert.equal(COLLEGES.length, 4);
  assert.equal(DESTINATIONS.filter((destination) => destination.type === 'UC').length, 9);
  assert.equal(DESTINATIONS.filter((destination) => destination.type === 'HBCU').length, 5);
  assert.equal(COURSES.filter((course) => course.suggestionEligible).length, 16);
  assert.equal(new Set(COURSES.map((course) => course.id)).size, COURSES.length);
  for (const college of COLLEGES) assert.equal(COURSES.filter((course) => course.collegeId === college.id && course.suggestionEligible).length, 4);
});

test('academic year follows fall through summer and rejects unknown terms', () => {
  assert.equal(academicYear('Fall 2026'), '2026-27');
  assert.equal(academicYear('Spring 2027'), '2026-27');
  assert.equal(academicYear('Summer 2026'), '2025-26');
  assert.equal(academicYear('unknown'), null);
  assert.equal(academicYear(), null);
});

test('source-year mismatch never silently becomes current UC evidence', () => {
  const match = compareCourse('laney-engl-c1000', 'uc-berkeley', { term: 'Fall 2025' });
  const mismatch = compareCourse('laney-engl-c1000', 'uc-berkeley', { term: 'Fall 2026' });
  assert.equal(match.kind, 'published');
  assert.equal(match.yearMismatch, false);
  assert.equal(mismatch.kind, 'review');
  assert.equal(mismatch.yearMismatch, true);
  assert.match(mismatch.yearText, /2025-26.*2026-27/);
  assert.match(mismatch.requirementText, /not been verified/);
  assert.equal(compareCourse('laney-engl-c1000', 'uc-berkeley').label, 'Course term needed');
});

test('old numbering stays separate and does not establish a current equivalent', () => {
  assert.equal(compareCourse('laney-historical-engl-1a', 'ncat').kind, 'preliminary');
  assert.equal(compareCourse('laney-engl-c1000', 'ncat').kind, 'unknown');
  assert.equal(compareCourse('laney-stat-c1000', 'ncat').kind, 'unknown');
  assert.equal(compareCourse('laney-psyc-c1000', 'ncat').kind, 'unknown');
  assert.equal(compareCourse('laney-historical-engl-1a', 'uc-berkeley').kind, 'unknown');
  assert.equal(findCourse('laney-historical-engl-1a').units, null);
  const candidates = suggestCourses(state(['uc-berkeley'], [{ courseId: 'laney-historical-engl-1a', status: 'completed' }]));
  assert.ok(candidates.some(({ course }) => course.code === 'ENGL C1000'), 'unverified historic identity must not suppress a current course as equivalent');
});

test('unknown is not rejection and blocked lookup remains disclosed', () => {
  for (const id of ['spelman', 'howard', 'tuskegee', 'morehouse']) {
    const result = compareCourse('laney-math-3a', id, { term: 'Fall 2026' });
    assert.equal(result.kind, 'unknown');
    assert.match(result.notes.join(' '), /not a decision to reject/);
    assert.equal(result.unitsText, 'Award not verified');
  }
  assert.match(compareCourse('laney-math-3a', 'morehouse').notes.join(' '), /blocked by CAPTCHA before a Peralta search/);
});

test('N.C. A&T display preserves preliminary credits, year gap and OR alternatives', () => {
  const math = compareCourse('merritt-math-3a', 'ncat');
  assert.equal(math.kind, 'preliminary');
  assert.match(math.unitsText, /4 credits displayed/);
  assert.match(math.notes.join(' '), /not an assumed one-unit loss/);
  assert.match(math.yearText, /does not display/);
  const stats = compareCourse('berkeley-city-historical-math-13', 'ncat');
  assert.match(stats.equivalentText, /MATH 224.* OR .*ECON 206/);
  assert.match(stats.notes.join(' '), /not both/);
});

test('known local totals separate completed, in progress and planned and disclose unknown units', () => {
  const result = totals([
    { courseId: 'laney-engl-c1000', status: 'completed' },
    { courseId: 'merritt-math-3a', status: 'in-progress' },
    { courseId: 'alameda-psyc-c1000', status: 'planned' },
    { courseId: 'laney-historical-engl-1a', status: 'completed' },
  ]);
  assert.deepEqual(result, { completed: 4, inProgress: 5, planned: 3, unknownByStatus: { completed: 1, inProgress: 0, planned: 0 } });
});

test('supported English retains local units but caps UC credit and warns on duplicates', () => {
  const entries = [{ courseId: 'laney-engl-c1000', status: 'completed' }, { courseId: 'laney-engl-c1000e', status: 'planned' }];
  assert.equal(findCourse('laney-engl-c1000e').units, 5);
  assert.match(compareCourse('laney-engl-c1000e', 'uc-berkeley', { term: 'Fall 2025' }).unitsText, /^4 UC/);
  assert.match(duplicateWarnings(entries).join(' '), /at most 4 UC units/);
  assert.deepEqual([totals(entries).completed, totals(entries).planned], [4, 5]);
  assert.equal(duplicateWarnings([{ courseId: 'laney-historical-engl-1a' }, { courseId: 'laney-engl-c1000' }]).length, 0);
});

test('Alameda statistics warning retains the known out-of-catalog duplicate limit', () => {
  assert.match(duplicateWarnings([{ courseId: 'alameda-stat-c1000' }]).join(' '), /SOCSC 125/);
});

test('suggestions react to targets and count UC once without penalizing unknown HBCUs', () => {
  const onlyUc = suggestCourses(state(['uc-berkeley']));
  const allUc = suggestCourses(state(DESTINATIONS.filter((destination) => destination.type === 'UC').map((destination) => destination.id)));
  assert.equal(onlyUc.length, 4);
  assert.ok(allUc.every((candidate) => candidate.evidenceGroups.length === 1));
  assert.deepEqual(onlyUc.map(({ course }) => course.id), allUc.map(({ course }) => course.id));
  const withNcat = suggestCourses(state(['uc-berkeley', 'ncat']));
  assert.equal(withNcat[0].course.code, 'MATH 3A');
  assert.equal(withNcat[0].evidenceGroups.length, 2);
  assert.deepEqual(suggestCourses(state(['ncat'])).map(({ course }) => course.code), ['MATH 3A']);
  assert.equal(suggestCourses(state(['spelman'])).length, 0);
  assert.deepEqual(suggestCourses(state(['uc-berkeley', 'spelman'])).map(({ course }) => course.id), onlyUc.map(({ course }) => course.id));
});

test('planning candidates omit existing current families across source colleges and review eligibility', () => {
  const input = state(['uc-berkeley'], [{ courseId: 'merritt-engl-c1000e', status: 'planned' }, { courseId: 'laney-math-3a', status: 'completed' }]);
  const candidates = suggestCourses(input);
  assert.ok(candidates.every(({ course }) => !['engl-c1000', 'math-3a'].includes(course.family)));
  assert.ok(candidates.every(({ course, reviewText }) => !course.historical && /prerequisites, course availability and grade eligibility/.test(reviewText)));
  assert.ok(candidates.every(({ reviewText }) => /2026-27.*2025-26/.test(reviewText)));
  assert.equal(suggestCourses(state([])).length, 0);
});
