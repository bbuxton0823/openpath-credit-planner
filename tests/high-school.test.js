import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyHighSchoolProfile, normalizeHighSchoolProfile, normalizeHighSchoolRecords, normalizeHighSchoolAllocations, graduationProgress, suggestHighSchoolCredit, OUSD_COMPREHENSIVE_POLICY } from '../src/high-school.js';
import { totals as collegeTotals } from '../src/rules.js';

const hsCourse = (changes = {}) => ({ id: 'hs-1', title: 'English 9', subjectId: 'english', credits: 10, status: 'completed', result: 'passing', creditAward: 'earned', provenance: 'school-verified', gradeLevel: '9', courseType: 'standard', term: 'Fall 2025', ...changes });
const college = (changes = {}) => ({ id: 'college-1', courseId: 'laney-engl-c1000', status: 'completed', term: 'Fall 2025', ...changes });
const allocation = (changes = {}) => ({ id: 'allocation-1', collegeEntryId: 'college-1', linkedCourseId: 'laney-engl-c1000', linkedTerm: 'Fall 2025', subjectId: 'english', credits: 13, status: 'approved', result: 'passing', creditAward: 'earned', provenance: 'school-verified', gradeLevel: '11', enrollmentType: 'district-de', schoolApproval: 'confirmed', transcript: 'received', ...changes });
const state = (courses = [], allocations = [], profile = {}) => ({ entries: [college()], highSchool: { profile: { ...emptyHighSchoolProfile(), districtId: 'ousd', policyId: 'ousd-comprehensive', schoolId: 'other', policyConfirmed: true, graduationYear: '2027', ...profile }, courses, allocations } });

test('OUSD baseline is explicit, totals 230, and does not infer a cohort or other-program policy', () => {
  assert.equal(OUSD_COMPREHENSIVE_POLICY.subjectRequirements.reduce((sum, subject) => sum + subject.credits, 0), 230);
  assert.equal(graduationProgress({}).totalRequirement.required, null);
  assert.equal(graduationProgress(state([], [], { districtId: null })).totalRequirement.required, null);
  assert.equal(graduationProgress(state([], [], { policyId: 'other-program' })).totalRequirement.required, null);
  const baseline = graduationProgress(state([], [], { policyConfirmed: false }));
  assert.equal(baseline.totalRequirement.required, 230);
  assert.equal(baseline.policyStatus, 'baseline-only');
  assert.equal(baseline.comparisonOnly, true);
  assert.match(baseline.policyGaps.join(' '), /No certified 2027/);
});

test('completed and passing alone do not establish an earned award', () => {
  for (const change of [{ creditAward: 'unconfirmed' }, { result: 'pending' }, { gradeLevel: 'unknown' }]) {
    const progress = graduationProgress(state([hsCourse(change)]));
    assert.equal(progress.totals.verifiedEarned, 0);
    assert.equal(progress.totals.pendingReview, 10);
  }
  const failed = graduationProgress(state([hsCourse({ result: 'not-passing' })]));
  assert.equal(failed.totals.verifiedEarned, 0);
  assert.equal(failed.totals.notEarned, 10);
});

test('reported, verified, in-progress and planned high-school credits remain distinct', () => {
  const progress = graduationProgress(state([
    hsCourse(), hsCourse({ id: 'hs-2', title: 'Biology', subjectId: 'science', provenance: 'student-reported', gradeLevel: 'unknown', credits: 5 }),
    hsCourse({ id: 'hs-3', title: 'Geometry', subjectId: 'math', status: 'in-progress' }),
    hsCourse({ id: 'hs-4', title: 'Spanish', subjectId: 'world-language', status: 'planned' }),
  ]));
  assert.deepEqual(progress.totals, { verifiedEarned: 10, reportedEarned: 5, inProgress: 10, planned: 10, pendingReview: 0, notEarned: 0 });
  assert.equal(progress.totalRequirement.remainingVerified, 220);
  assert.equal(progress.totalRequirement.remainingWithReported, 215);
});

test('subject satisfaction caps do not truncate total earned credits or count college units', () => {
  const input = state([hsCourse({ credits: 50 })]);
  const before = structuredClone(input);
  const progress = graduationProgress(input);
  assert.equal(progress.subjects.find(subject => subject.id === 'english').appliedVerified, 40);
  assert.equal(progress.totals.verifiedEarned, 50);
  assert.equal(progress.totalRequirement.remainingVerified, 180);
  assert.equal(collegeTotals(input.entries).completed, 4);
  assert.deepEqual(input, before);
});

test('verified college allocations require a completed passing earned award and school transcript review', () => {
  assert.equal(graduationProgress(state([], [allocation()])).totals.verifiedEarned, 13);
  for (const change of [{ status: 'pending' }, { result: 'pending' }, { creditAward: 'unconfirmed' }, { transcript: 'unknown' }, { schoolApproval: 'unknown' }, { enrollmentType: 'unknown' }, { gradeLevel: 'unknown' }]) {
    const progress = graduationProgress(state([], [allocation(change)]));
    assert.equal(progress.totals.verifiedEarned, 0, JSON.stringify(change));
    assert.equal(progress.allocations[0].classification, 'pending-review');
  }
  const reported = graduationProgress(state([], [allocation({ provenance: 'student-reported', transcript: 'unknown' })]));
  assert.equal(reported.totals.reportedEarned, 13);
  assert.equal(reported.totals.verifiedEarned, 0);
});

test('external preapproval and Skyline principal approval are explicit, while district DE needs no external form', () => {
  const external = allocation({ enrollmentType: 'external-concurrent', preapproval: 'approved' });
  assert.equal(graduationProgress(state([], [external])).totals.verifiedEarned, 13);
  assert.equal(graduationProgress(state([], [{ ...external, preapproval: 'unknown' }])).totals.verifiedEarned, 0);
  assert.equal(graduationProgress(state([], [external], { schoolId: 'skyline' })).totals.verifiedEarned, 0);
  assert.equal(graduationProgress(state([], [{ ...external, principalApproval: 'approved' }], { schoolId: 'skyline' })).totals.verifiedEarned, 13);
  assert.equal(graduationProgress(state([], [allocation({ preapproval: 'unknown' })], { schoolId: 'skyline' })).totals.verifiedEarned, 13);
});

test('Oakland Technical non-elective allocations remain pending and subjects are never inferred', () => {
  const english = graduationProgress(state([], [allocation()], { schoolId: 'oakland-tech' }));
  assert.equal(english.totals.verifiedEarned, 0);
  assert.match(english.allocations[0].reasons.join(' '), /limits college coursework to electives/);
  assert.equal(graduationProgress(state([], [allocation({ subjectId: 'electives' })], { schoolId: 'oakland-tech' })).totals.verifiedEarned, 13);
  assert.equal(normalizeHighSchoolRecords([hsCourse({ title: 'Calculus', subjectId: 'unknown' })])[0].subjectId, 'unassigned');
});

test('reported Oakland Technical non-elective awards do not satisfy subject or total requirements', () => {
  const progress = graduationProgress(state([], [allocation({ subjectId: 'math', provenance: 'student-reported' })], { schoolId: 'oakland-tech' }));
  assert.equal(progress.allocations[0].classification, 'pending-review');
  assert.match(progress.allocations[0].reasons.join(' '), /limits college coursework to electives/);
  assert.equal(progress.totals.reportedEarned, 0);
  assert.equal(progress.totals.verifiedEarned, 0);
  assert.equal(progress.totals.pendingReview, 13);
  assert.equal(progress.subjects.find(subject => subject.id === 'math').appliedWithReported, 0);
  assert.equal(progress.totalRequirement.remainingWithReported, 230);
  const elective = graduationProgress(state([], [allocation({ subjectId: 'electives', provenance: 'student-reported' })], { schoolId: 'oakland-tech' }));
  assert.equal(elective.totals.reportedEarned, 13);
});

test('linked status edits and deletion immediately revise allocation totals', () => {
  const input = state([], [allocation()]);
  assert.equal(graduationProgress(input).totals.verifiedEarned, 13);
  input.entries[0].status = 'planned';
  assert.equal(graduationProgress(input).totals.planned, 13);
  assert.equal(graduationProgress(input).totals.verifiedEarned, 0);
  input.entries[0].status = 'in-progress';
  assert.equal(graduationProgress(input).totals.inProgress, 13);
  input.entries = [];
  const missing = graduationProgress(input);
  assert.equal(missing.allocations[0].classification, 'excluded');
  assert.equal(missing.totals.verifiedEarned, 0);
});

test('missing or changed course and term snapshots require renewed allocation review', () => {
  const input = state([], [allocation()]);
  assert.equal(graduationProgress(input).totals.verifiedEarned, 13);
  input.entries[0].term = 'Spring 2027';
  let changed = graduationProgress(input);
  assert.equal(changed.totals.verifiedEarned, 0);
  assert.equal(changed.allocations[0].classification, 'pending-review');
  input.highSchool.allocations[0].linkedTerm = 'Spring 2027';
  assert.equal(graduationProgress(input).totals.verifiedEarned, 13);
  input.entries[0].courseId = 'merritt-engl-c1000';
  assert.equal(graduationProgress(input).totals.verifiedEarned, 0);
  input.highSchool.allocations[0].linkedCourseId = 'merritt-engl-c1000';
  assert.equal(graduationProgress(input).totals.verifiedEarned, 13);
  delete input.highSchool.allocations[0].linkedTerm;
  changed = graduationProgress(input);
  assert.equal(changed.allocations[0].classification, 'pending-review');
  assert.equal(changed.totals.verifiedEarned, 0);
  input.highSchool.allocations[0].provenance = 'student-reported';
  assert.equal(graduationProgress(input).totals.reportedEarned, 0);
});

test('multiple allocations or duplicate college course identities exclude all ambiguous awards', () => {
  const doubled = graduationProgress(state([], [allocation(), allocation({ id: 'allocation-2', subjectId: 'electives' })]));
  assert.equal(doubled.totals.verifiedEarned, 0);
  assert.ok(doubled.allocations.every(row => row.classification === 'excluded'));
  const differentIds = state([], [allocation(), allocation({ id: 'allocation-2', collegeEntryId: 'college-2' })]);
  differentIds.entries.push(college({ id: 'college-2', status: 'planned' }));
  const ambiguous = graduationProgress(differentIds);
  assert.equal(ambiguous.totals.verifiedEarned, 0);
  assert.equal(ambiguous.totals.planned, 0);
  assert.equal(ambiguous.issues.length, 2);
});

test('same high-school title and term needs review, while a title alone never merges distinct records', () => {
  const duplicate = graduationProgress(state([hsCourse(), hsCourse({ id: 'hs-2' })]));
  assert.equal(duplicate.totals.verifiedEarned, 0);
  assert.equal(duplicate.issues.length, 2);
  const distinct = graduationProgress(state([hsCourse(), hsCourse({ id: 'hs-2', term: 'Spring 2026' })]));
  assert.equal(distinct.totals.verifiedEarned, 20);
});

test('normalizers reject invalid/duplicate IDs and nonfinite or out-of-bound credits without mutation', () => {
  const input = [hsCourse()];
  const before = structuredClone(input);
  normalizeHighSchoolRecords(input);
  assert.deepEqual(input, before);
  for (const id of ['', '  ']) assert.throws(() => normalizeHighSchoolRecords([hsCourse({ id })]));
  for (const title of [undefined, '', ' \t ']) assert.throws(() => normalizeHighSchoolRecords([hsCourse({ title })]), /course title/);
  assert.throws(() => normalizeHighSchoolRecords([{ id: 'broken' }]), /course title/);
  assert.throws(() => normalizeHighSchoolRecords([hsCourse(), hsCourse()]));
  assert.throws(() => normalizeHighSchoolAllocations([allocation(), allocation()]));
  assert.throws(() => normalizeHighSchoolAllocations([allocation({ collegeEntryId: '' })]));
  for (const credits of [Infinity, NaN, -1, 1001, 'no']) assert.throws(() => normalizeHighSchoolRecords([hsCourse({ credits })]));
  assert.equal(normalizeHighSchoolRecords([hsCourse({ credits: '' })])[0].credits, null);
  assert.equal(normalizeHighSchoolProfile({}).districtId, null);
});

test('semester conversion is a rounded policy estimate and never an award or quarter conversion', () => {
  for (const [units, credits] of [[3, 10], [4, 13], [5, 17]]) {
    const estimate = suggestHighSchoolCredit(units, 'semester');
    assert.equal(estimate.credits, credits);
    assert.equal(estimate.awarded, false);
    assert.equal(estimate.kind, 'policy-estimate');
    assert.equal(estimate.source.bodyDate, '2016-01-27');
  }
  for (const [units, system] of [[4, 'quarter'], [null, 'semester'], [Infinity, 'semester']]) assert.equal(suggestHighSchoolCredit(units, system).credits, null);
});

test('GPA and senior project are separate recorded requirements, not credit or eligibility awards', () => {
  const progress = graduationProgress(state([], [], { gpa: '1.9', seniorProject: 'complete' }));
  assert.equal(progress.gpa.status, 'below-baseline');
  assert.equal(progress.seniorProject.status, 'complete');
  assert.equal(progress.totals.verifiedEarned, 0);
  assert.equal(progress.comparisonOnly, true);
  assert.equal(graduationProgress(state([], [], { gpa: '2.0' })).gpa.status, 'at-or-above-baseline');
});
