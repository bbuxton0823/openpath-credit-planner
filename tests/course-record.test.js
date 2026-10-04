import test from 'node:test';
import assert from 'node:assert/strict';
import { FINAL_GRADES, normalizeFinalGrade, classifyFinalGrade, validateFinalGradeStatus, normalizeCourseWorkflow, courseWorkflow } from '../src/course-record.js';
import { graduationProgress, normalizeHighSchoolRecords } from '../src/high-school.js';

const entry = (changes = {}) => ({ id: 'college-1', courseId: 'laney-engl-c1000', term: 'Fall 2025', status: 'completed', finalGrade: 'B',
  workflow: { approvalSignatures: 'recorded', requiredSignaturesNote: 'School confirmed the required signatures.', scheduleConfirmed: true, linkedCourseId: 'laney-engl-c1000', linkedTerm: 'Fall 2025', linkedStatus: 'completed' }, ...changes });
const award = (changes = {}) => ({ id: 'allocation-1', collegeEntryId: 'college-1', linkedCourseId: 'laney-engl-c1000', linkedTerm: 'Fall 2025', subjectId: 'english', credits: 13, status: 'approved', result: 'passing', creditAward: 'earned', provenance: 'school-verified', gradeLevel: '11', enrollmentType: 'district-de', schoolApproval: 'confirmed', transcript: 'received', ...changes });
const hsCourse = (changes = {}) => ({ id: 'hs-1', title: 'English 9', subjectId: 'english', credits: 10, status: 'completed', result: 'passing', creditAward: 'earned', provenance: 'school-verified', gradeLevel: '9', finalGrade: '', ...changes });
const state = (record = entry(), allocation = award(), profile = {}) => ({ entries: [record], highSchool: { profile: { districtId: 'ousd', policyId: 'ousd-comprehensive', schoolId: 'skyline', ...profile }, courses: [], allocations: allocation ? [allocation] : [] } });

test('grade domain is explicit, blank means unknown and invalid saved grades fail cleanly', () => {
  assert.equal(FINAL_GRADES.length, 17);
  for (const value of [undefined, null, '', '  ']) assert.equal(normalizeFinalGrade(value), '');
  assert.equal(normalizeFinalGrade(' a- '), 'A-');
  for (const value of ['Z', 'Pass', 3, {}, ['A']]) assert.throws(() => normalizeFinalGrade(value), /supported final grade/);
  assert.equal(classifyFinalGrade(''), 'unknown');
  for (const value of ['F', 'NP']) assert.equal(classifyFinalGrade(value), 'failure');
  for (const value of ['I', 'W']) assert.equal(classifyFinalGrade(value), 'incomplete');
  for (const value of ['A', 'B', 'C', 'D']) assert.equal(classifyFinalGrade(value), 'letter-pass');
  for (const value of ['P', 'A+', 'A-', 'B+', 'B-', 'C+', 'C-', 'D+', 'D-']) assert.equal(classifyFinalGrade(value), 'conditional');
});

test('nonblank final grades belong only to completed attempts', () => {
  for (const status of ['planned', 'in-progress', '']) {
    assert.throws(() => validateFinalGradeStatus('F', status), /completed attempt.*Not recorded/);
    assert.throws(() => normalizeHighSchoolRecords([hsCourse({ status, finalGrade: 'A' })]), /completed attempt/);
    assert.doesNotThrow(() => validateFinalGradeStatus('', status));
  }
  for (const grade of FINAL_GRADES) assert.doesNotThrow(() => validateFinalGradeStatus(grade, 'completed'));
});

test('blank grades preserve legacy explicit awards, while exact letter grades never create an award', () => {
  for (const finalGrade of ['', 'A', 'B', 'C', 'D']) {
    const input = state(entry({ finalGrade }));
    input.highSchool.courses = [hsCourse({ finalGrade })];
    assert.equal(graduationProgress(input).totals.verifiedEarned, 23);
    input.highSchool.courses[0].creditAward = 'unconfirmed';
    input.highSchool.allocations[0].creditAward = 'unconfirmed';
    assert.equal(graduationProgress(input).totals.verifiedEarned, 0);
  }
});

test('failed college and high-school grades veto conflicting earned and passing claims', () => {
  for (const finalGrade of ['F', 'NP']) {
    for (const provenance of ['school-verified', 'student-reported']) {
      const input = state(entry({ finalGrade }), award({ provenance }));
      input.highSchool.courses = [hsCourse({ finalGrade, provenance })];
      const progress = graduationProgress(input);
      assert.equal(progress.totals.notEarned, 23);
      assert.equal(progress.totals.verifiedEarned + progress.totals.reportedEarned, 0);
      assert.equal(progress.totalRequirement.remainingWithReported, 230);
    }
  }
});

test('incomplete, withdrawal and pass grades require review without universal credit assumptions', () => {
  for (const finalGrade of ['I', 'W', 'P']) {
    const input = state(entry({ finalGrade }));
    input.highSchool.courses = [hsCourse({ finalGrade })];
    const progress = graduationProgress(input);
    assert.equal(progress.totals.pendingReview, 23, finalGrade);
    assert.equal(progress.totals.verifiedEarned + progress.totals.reportedEarned, 0, finalGrade);
    assert.equal(progress.allocations[0].finalGrade, finalGrade);
  }
});

test('a completed B+ English award counts its three recorded school credits without changing the record', () => {
  for (const profile of [{}, { districtId: 'other', policyId: null, manualCreditTarget: 240 }]) {
    const input = state(entry(), null, profile);
    input.highSchool.courses = [hsCourse({ title: 'English', credits: 3, term: 'fall 2025', finalGrade: 'B+' })];
    const before = structuredClone(input);
    const progress = graduationProgress(input);
    assert.equal(progress.courses[0].classification, 'verified-earned');
    assert.equal(progress.totals.verifiedEarned, 3);
    assert.equal(progress.totals.pendingReview, 0);
    assert.equal(progress.totalRequirement.remainingWithReported, profile.districtId === 'other' ? 237 : 227);
    assert.deepEqual(input, before);
  }
});

test('plus/minus school grades still require explicit passing and earned awards with separate provenance', () => {
  for (const finalGrade of ['B+', 'C-']) {
    for (const provenance of ['school-verified', 'student-reported']) {
      const input = state(entry(), null);
      input.highSchool.courses = [hsCourse({ credits: 3, finalGrade, provenance })];
      const progress = graduationProgress(input);
      assert.equal(progress.totals.verifiedEarned, provenance === 'school-verified' ? 3 : 0);
      assert.equal(progress.totals.reportedEarned, provenance === 'student-reported' ? 3 : 0);
      for (const change of [{ credits: null }, { result: 'pending' }, { creditAward: 'unconfirmed' }]) {
        const unconfirmed = structuredClone(input);
        Object.assign(unconfirmed.highSchool.courses[0], change);
        const pending = graduationProgress(unconfirmed);
        assert.equal(pending.courses[0].classification, 'pending-review');
        assert.equal(pending.totals.verifiedEarned + pending.totals.reportedEarned, 0);
      }
      input.highSchool.courses[0].result = 'not-passing';
      assert.equal(graduationProgress(input).courses[0].classification, 'not-earned');
    }
  }
});

test('plus/minus college-to-school awards retain approval and transcript requirements', () => {
  for (const finalGrade of ['B+', 'C-']) {
    const input = state(entry({ finalGrade }));
    assert.equal(graduationProgress(input).totals.verifiedEarned, 13);
    assert.equal(courseWorkflow(input, input.entries[0]).steps[3].done, true);
    for (const change of [{ status: 'pending' }, { schoolApproval: 'unknown' }, { transcript: 'unknown' }]) {
      const unconfirmed = structuredClone(input);
      Object.assign(unconfirmed.highSchool.allocations[0], change);
      assert.equal(graduationProgress(unconfirmed).allocations[0].classification, 'pending-review');
      assert.equal(graduationProgress(unconfirmed).totals.verifiedEarned, 0);
      assert.equal(courseWorkflow(unconfirmed, unconfirmed.entries[0]).steps[3].done, false);
    }
  }
});

test('workflow defaults are unknown and notes are bounded without mutating source', () => {
  assert.deepEqual(normalizeCourseWorkflow(), { approvalSignatures: 'unknown', requiredSignaturesNote: '', scheduleConfirmed: false, linkedCourseId: '', linkedTerm: '', linkedStatus: '' });
  const value = { approvalSignatures: true, requiredSignaturesNote: 'x'.repeat(1600), scheduleConfirmed: 'true', linkedStatus: 'bad' };
  const before = structuredClone(value);
  const normalized = normalizeCourseWorkflow(value);
  assert.equal(normalized.requiredSignaturesNote.length, 1500);
  assert.equal(normalized.scheduleConfirmed, false);
  assert.equal(normalized.approvalSignatures, 'unknown');
  assert.deepEqual(value, before);
});

test('four workflow steps reflect recorded evidence without adding posting state', () => {
  const input = state();
  const before = structuredClone(input);
  const workflow = courseWorkflow(input, input.entries[0]);
  assert.deepEqual(workflow.steps.map(step => step.id), ['approval', 'schedule', 'grade', 'posting']);
  assert.equal(workflow.completed, 4);
  assert.equal(workflow.total, 4);
  assert.equal(workflow.nextAction, null);
  assert.equal(workflow.nextStep, null);
  assert.deepEqual(input, before);
  const blank = state(entry({ finalGrade: '', workflow: undefined }), null);
  assert.equal(courseWorkflow(blank, blank.entries[0]).completed, 0);
  assert.equal(courseWorkflow(blank, blank.entries[0]).nextAction, 'approval');
});

test('approval signature checkbox never replaces school, route or subject approvals', () => {
  for (const changes of [{ schoolApproval: 'unknown' }, { status: 'pending' }, { enrollmentType: 'unknown' }, { enrollmentType: 'external-concurrent', preapproval: 'unknown' }, { enrollmentType: 'external-concurrent', preapproval: 'approved', principalApproval: 'unknown' }]) {
    const input = state(entry(), award(changes));
    assert.equal(courseWorkflow(input, input.entries[0]).steps[0].done, false, JSON.stringify(changes));
  }
  for (const profile of [{ schoolId: 'unknown' }, { schoolId: 'other', schoolName: '' }, { schoolId: 'oakland-tech' }]) {
    const input = state(entry(), award(), profile);
    assert.equal(courseWorkflow(input, input.entries[0]).steps[0].done, false, JSON.stringify(profile));
  }
  const external = state(entry(), award({ enrollmentType: 'external-concurrent', preapproval: 'approved', principalApproval: 'approved' }));
  assert.equal(courseWorkflow(external, external.entries[0]).steps[0].done, true);
  external.entries[0].workflow.approvalSignatures = 'unknown';
  assert.equal(courseWorkflow(external, external.entries[0]).steps[0].done, false);
});

test('posting requires an unambiguous verified award and official transcript receipt', () => {
  for (const changes of [{ provenance: 'student-reported' }, { transcript: 'unknown' }, { schoolApproval: 'unknown' }, { creditAward: 'unconfirmed' }]) {
    const input = state(entry(), award(changes));
    assert.equal(courseWorkflow(input, input.entries[0]).steps[3].done, false, JSON.stringify(changes));
  }
  const duplicated = state();
  duplicated.entries.push(entry({ id: 'college-2' }));
  assert.equal(courseWorkflow(duplicated, duplicated.entries[0]).steps[3].done, false);
  const removed = state();
  const former = removed.entries.pop();
  assert.equal(courseWorkflow(removed, former).completed, 0);
});

test('course, term and status snapshot changes invalidate every workflow completion', () => {
  for (const changes of [{ courseId: 'merritt-engl-c1000' }, { term: 'Spring 2027' }, { status: 'in-progress', finalGrade: '' }, { status: 'planned', finalGrade: '' }]) {
    const input = state(entry(changes));
    const workflow = courseWorkflow(input, input.entries[0]);
    assert.equal(workflow.snapshotCurrent, false);
    assert.equal(workflow.completed, 0, JSON.stringify(changes));
  }
  const planned = state(entry({ status: 'planned', finalGrade: '' }));
  planned.entries[0].workflow.linkedStatus = 'planned';
  const workflow = courseWorkflow(planned, planned.entries[0]);
  assert.equal(workflow.steps[1].done, false);
  assert.equal(workflow.steps[2].done, false);
  assert.equal(workflow.steps[3].done, false);
});

test('recording a failed, incomplete or unresolved pass grade does not complete credit posting', () => {
  for (const finalGrade of ['F', 'NP', 'I', 'W', 'P']) {
    const input = state(entry({ finalGrade }));
    const workflow = courseWorkflow(input, input.entries[0]);
    assert.equal(workflow.steps[2].done, true, finalGrade);
    assert.equal(workflow.steps[3].done, false, finalGrade);
    assert.equal(workflow.completed, 3, finalGrade);
    assert.equal(workflow.nextAction, 'posting');
  }
});
