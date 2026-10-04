import test from 'node:test';
import assert from 'node:assert/strict';
import { highSchoolSummaryLines } from '../src/high-school-export.js';
import { OUSD_SCHOOLS } from '../src/school-roster.js';

const course = (changes = {}) => ({ id: 'hs-1', title: 'English 9', subjectId: 'english', credits: 10, status: 'completed', result: 'passing', creditAward: 'earned', provenance: 'school-verified', gradeLevel: '9', finalGrade: '', ...changes });
const entry = (changes = {}) => ({ id: 'college-1', courseId: 'laney-engl-c1000', term: 'Fall 2025', status: 'completed', finalGrade: 'B', ...changes });
const allocation = (changes = {}) => ({ id: 'allocation-1', collegeEntryId: 'college-1', linkedCourseId: 'laney-engl-c1000', linkedTerm: 'Fall 2025', subjectId: 'english', credits: 13, status: 'approved', result: 'passing', creditAward: 'earned', provenance: 'school-verified', gradeLevel: '11', enrollmentType: 'district-de', schoolApproval: 'confirmed', transcript: 'received', ...changes });
const state = (changes = {}) => ({ entries: [entry()], highSchool: { profile: { districtId: 'ousd', schoolId: 'skyline', policyId: 'ousd-comprehensive', graduationYear: '2027' }, courses: [], allocations: [], ...changes } });
const summary = input => highSchoolSummaryLines(input).join('\n');

test('export omits the comprehensive numeric baseline for every review-required program', () => {
  for (const school of OUSD_SCHOOLS.filter(school => school.program === 'review-required')) {
    const input = state({ profile: { districtId: 'ousd', schoolId: school.id, policyId: 'ousd-comprehensive', policyConfirmed: true } });
    const text = summary(input);
    assert.ok(text.includes(school.name));
    assert.match(text, /No numeric graduation baseline is applied/);
    assert.match(text, /Selected baseline required: unknown/);
    assert.doesNotMatch(text, /OUSD comprehensive baseline: 230/);
    assert.doesNotMatch(text, /GPA at least 2\.0/);
    assert.ok(text.includes(school.sourceUrl));
  }
});

test('only an applicable selected policy exports its numeric baseline and separate conditions', () => {
  const applicable = summary(state());
  assert.match(applicable, /OUSD comprehensive baseline: 230 HS credits/);
  assert.match(applicable, /not a certified class-of-2027 policy or a graduation determination/);
  assert.match(applicable, /GPA entered: unknown/);
  assert.match(applicable, /No units are added across these systems/);
  for (const input of [{}, state({ profile: {} }), state({ profile: { districtId: 'ousd', schoolId: 'skyline', policyId: 'other-program' } })]) {
    assert.doesNotMatch(summary(input), /OUSD comprehensive baseline: 230/);
  }
});

test('failed direct high-school grades export the veto beside the preserved earned claim', () => {
  for (const finalGrade of ['F', 'NP']) {
    const input = state({ courses: [course({ finalGrade })] });
    const lines = highSchoolSummaryLines(input);
    const index = lines.findIndex(line => line.startsWith('English 9 |'));
    assert.match(lines[index], /saved award claim earned/);
    assert.match(lines[index + 1], /Derived credit status: not-earned/);
    assert.ok(lines[index + 1].includes(`recorded ${finalGrade} grade does not support earned credit`));
    assert.match(lines.join('\n'), /HS earned: 0 school-verified as recorded; 0 student-reported/);
    assert.match(lines.join('\n'), /not earned: 10/);
  }
});

test('unresolved grades and unfinished classes export their actual derived status without awarding credit', () => {
  for (const finalGrade of ['I', 'W', 'P']) {
    assert.match(summary(state({ courses: [course({ finalGrade })] })), /Derived credit status: pending-review/);
  }
  for (const status of ['planned', 'in-progress']) {
    const text = summary(state({ courses: [course({ status })] }));
    assert.ok(text.includes(`Derived credit status: ${status}`));
    assert.match(text, /These credits are not earned/);
  }
  const unknown = summary(state({ courses: [course({ credits: null, creditAward: 'unconfirmed' })] }));
  assert.match(unknown, /unknown HS credits/);
  assert.doesNotMatch(unknown, /null HS credits/);
});

test('plus/minus grades retain the explicit recorded school award in the review copy', () => {
  for (const finalGrade of ['B+', 'C-']) {
    const text = summary(state({ courses: [course({ finalGrade })] }));
    assert.ok(text.includes(`final grade ${finalGrade} (student-entered)`));
    assert.match(text, /Derived credit status: verified-earned/);
    assert.match(text, /HS earned: 10 school-verified as recorded; 0 student-reported/);
  }
});

test('allocation export preserves exact course snapshots, grade restrictions and missing-link exclusions', () => {
  const input = state({ allocations: [allocation()] });
  input.entries[0].finalGrade = 'F';
  let text = summary(input);
  assert.match(text, /Linked allocation: ENGL C1000, Laney College, Fall 2025, completed/);
  assert.match(text, /final grade F \(student-entered\)/);
  assert.match(text, /Derived credit status: not-earned/);
  assert.match(text, /Award record was linked to: laney-engl-c1000, Fall 2025/);
  input.entries = [];
  text = summary(input);
  assert.match(text, /Missing or unrecognized college record, excluded/);
  assert.match(text, /Derived credit status: excluded/);
});

test('export retains provenance and source dates without mutating the plan or calculating a GPA', () => {
  const input = state({ courses: [course({ provenance: 'student-reported', note: 'Counselor question', finalGrade: 'A' })] });
  const before = structuredClone(input);
  const text = summary(input);
  assert.match(text, /Derived credit status: reported-earned/);
  assert.match(text, /Counselor question/);
  assert.match(text, /GPA entered: unknown/);
  assert.match(text, /Source body date: 2016-01-27/);
  assert.match(text, /Source body date: 2025-11-14/);
  assert.match(text, /Effective academic year not verified/);
  assert.deepEqual(input, before);
});
