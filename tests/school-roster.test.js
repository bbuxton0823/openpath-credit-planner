import test from 'node:test';
import assert from 'node:assert/strict';
import { OUSD_SCHOOLS, OUSD_DIRECTORY_SOURCE } from '../src/school-roster.js';
import { normalizeHighSchoolProfile, updateHighSchoolProfile, graduationProgress } from '../src/high-school.js';
import { courseWorkflow } from '../src/course-record.js';

const profile = (changes = {}) => ({ districtId: 'ousd', schoolId: 'skyline', policyId: 'ousd-comprehensive', graduationYear: '2027', policyConfirmed: true, schoolName: '', ...changes });
const progressFor = schoolId => graduationProgress({ highSchool: { profile: profile({ schoolId }) } });

test('the official OUSD high-school roster has seventeen distinct names and direct directory sources', () => {
  assert.equal(OUSD_SCHOOLS.length, 17);
  assert.equal(new Set(OUSD_SCHOOLS.map(school => school.id)).size, 17);
  assert.equal(new Set(OUSD_SCHOOLS.map(school => school.name)).size, 17);
  assert.equal(OUSD_DIRECTORY_SOURCE.checkedDate, '2026-10-04');
  assert.ok(OUSD_SCHOOLS.every(school => school.sourceUrl.startsWith(`${OUSD_DIRECTORY_SOURCE.url}/schools/~board/school-directory/post/`)));
  assert.equal(OUSD_SCHOOLS.find(school => school.id === 'oakland-tech').name, 'Oakland Technical High School');
  assert.match(OUSD_SCHOOLS.find(school => school.id === 'oakland-tech').sourceUrl, /\/oakland-technical-high-school$/);
  assert.match(OUSD_SCHOOLS.find(school => school.id === 'skyline').sourceUrl, /\/skyline-high-school$/);
  assert.equal(OUSD_SCHOOLS.find(school => school.id === 'life-academy').name, 'LIFE Academy');
  assert.equal(OUSD_SCHOOLS.find(school => school.id === 'sojourner-truth-independent-study').name, 'Sojourner Truth Independent Study (Online)');
});

test('all roster IDs normalize without restricting grade spans or losing unknown and Other options', () => {
  for (const school of OUSD_SCHOOLS) {
    const normalized = normalizeHighSchoolProfile(profile({ schoolId: school.id, schoolName: 'Old name' }));
    assert.equal(normalized.schoolId, school.id);
    assert.equal(normalized.schoolName, school.name);
  }
  assert.equal(normalizeHighSchoolProfile({ schoolId: 'unknown' }).schoolId, 'unknown');
  assert.equal(normalizeHighSchoolProfile({ schoolId: 'unlisted-charter', schoolName: 'Local charter' }).schoolId, 'unknown');
  const other = normalizeHighSchoolProfile({ schoolId: 'other', schoolName: 'Local charter' });
  assert.equal(other.schoolId, 'other');
  assert.equal(other.schoolName, 'Local charter');
});

test('review-required programs never inherit the comprehensive-school numeric baseline', () => {
  const reviewedNames = OUSD_SCHOOLS.filter(school => school.program === 'review-required').map(school => school.name);
  assert.deepEqual(reviewedNames, ['Dewey Academy', 'Gateway to College at Laney College', 'Ralph J. Bunche Academy', 'Rudsdale Continuation High School', 'Sojourner Truth Independent Study (Online)', 'Street Academy']);
  for (const school of OUSD_SCHOOLS) {
    const progress = progressFor(school.id);
    if (school.program === 'review-required') {
      assert.equal(progress.totalRequirement.required, null, school.name);
      assert.equal(progress.policy, null, school.name);
      assert.equal(progress.profile.policyConfirmed, false, school.name);
      assert.ok(progress.subjects.every(subject => subject.required == null));
      assert.ok(progress.policyGaps.some(gap => gap.includes(school.name) && gap.includes('No numeric')));
      assert.equal(progress.schoolPolicy.source.url, school.sourceUrl);
    } else {
      assert.equal(progress.totalRequirement.required, 230, school.name);
      assert.ok(progress.policyGaps.some(gap => gap.includes('No certified 2027')));
    }
  }
});

test('school or policy context changes invalidate confirmation without mutating the saved profile', () => {
  const existing = normalizeHighSchoolProfile(profile({ gpa: '3.2', seniorProject: 'in-progress' }));
  const before = structuredClone(existing);
  for (const change of [{ schoolId: 'oakland-tech' }, { schoolId: 'life-academy' }, { districtId: null }, { policyId: 'other-program' }, { graduationYear: '2028' }]) {
    const next = updateHighSchoolProfile(existing, { ...change, policyConfirmed: true });
    assert.equal(next.policyConfirmed, false, JSON.stringify(change));
    assert.equal(next.gpa, '3.2');
    assert.equal(next.seniorProject, 'in-progress');
  }
  assert.equal(updateHighSchoolProfile(existing, { gpa: '3.5' }).policyConfirmed, true);
  assert.equal(updateHighSchoolProfile(profile({ schoolId: 'other', schoolName: 'School A' }), { schoolName: 'School B' }).policyConfirmed, false);
  assert.deepEqual(existing, before);
});

test('workflow school approval recognizes a newly listed school without a hardcoded roster subset', () => {
  const entry = { id: 'c1', courseId: 'laney-engl-c1000', term: 'Fall 2025', status: 'in-progress', workflow: { approvalSignatures: 'recorded', linkedCourseId: 'laney-engl-c1000', linkedTerm: 'Fall 2025', linkedStatus: 'in-progress' } };
  const input = { entries: [entry], highSchool: { profile: profile({ schoolId: 'castlemont-high-school' }), allocations: [{ id: 'a1', collegeEntryId: 'c1', linkedCourseId: 'laney-engl-c1000', linkedTerm: 'Fall 2025', status: 'approved', schoolApproval: 'confirmed', enrollmentType: 'district-de' }] } };
  assert.equal(courseWorkflow(input, entry).steps[0].done, true);
});
