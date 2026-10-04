import test from 'node:test';
import assert from 'node:assert/strict';
import { makeDemo, loadState, saveState, STORAGE_KEY, updateCollegeEntry, updateSchoolContext } from '../src/state.js';
import { compareCourse, totals } from '../src/rules.js';
import { briefEvidence, studentChecks } from '../src/guide.js';
import { normalizeCourseWorkflow } from '../src/course-record.js';
const storage = () => { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key,value) => data.set(key,value) }; };
const workflowFor = entry => normalizeCourseWorkflow({ approvalSignatures:'recorded', scheduleConfirmed:true, requiredSignaturesNote:'Fictional approval note', linkedCourseId:entry.courseId, linkedTerm:entry.term, linkedStatus:entry.status });

test('optional grade and workflow survive JSON persistence without changing original IDs or course totals', () => {
  const state = makeDemo(), store = storage(), before = totals(state.entries);
  const original = { ...state.entries[0] };
  state.entries[0] = updateCollegeEntry(original, { ...original, finalGrade:'B' });
  state.entries[0].workflow = workflowFor(state.entries[0]);
  assert.equal(saveState(store,state),true);
  assert.deepEqual(loadState(store).state,state);
  assert.equal(state.entries[0].id,original.id);
  assert.deepEqual(totals(state.entries),before);
  assert.equal(JSON.parse(store.getItem(STORAGE_KEY)).entries[0].finalGrade,'B');
});

test('invalid or contradictory grades preserve saved data for recovery', () => {
  for (const [grade,status] of [['F','planned'],['B','in-progress'],['Z','completed']]) {
    const state = makeDemo(), store = storage();
    state.entries[0].finalGrade = grade; state.entries[0].status = status;
    const raw = JSON.stringify(state); store.setItem(STORAGE_KEY,raw);
    assert.ok(loadState(store).warning);
    assert.equal(store.getItem(STORAGE_KEY),raw);
    assert.throws(() => updateCollegeEntry(state.entries[0],state.entries[0]));
  }
});

test('course, term and status edits reset confirmations while a grade edit keeps matching context', () => {
  const state = makeDemo(); const original = { ...state.entries[0], finalGrade:'B' };
  original.workflow = workflowFor(original);
  assert.equal(updateCollegeEntry(original,{...original,finalGrade:'A'}).workflow.scheduleConfirmed,true);
  for (const change of [{courseId:state.entries[1].courseId},{term:'Fall 2026'},{status:'planned',finalGrade:''}]) {
    const next = updateCollegeEntry(original,{...original,...change});
    assert.equal(next.workflow.scheduleConfirmed,false);
    assert.equal(next.workflow.approvalSignatures,'unknown');
    assert.equal(next.workflow.requiredSignaturesNote,'Fictional approval note');
    assert.equal(original.workflow.scheduleConfirmed,true);
  }
});

test('failed and unresolved grades override apparent university awards while keeping source facts and local load totals', () => {
  const state = makeDemo(), entry = state.entries[0], before = totals(state.entries);
  for (const grade of ['F','NP','I','W','P','C-','A+']) {
    entry.finalGrade = grade;
    const result = compareCourse(entry.courseId,'uc-berkeley',entry);
    assert.equal(result.kind,'review');
    assert.ok(result.recordGradeIssue.includes(grade));
    assert.equal(result.evidenceKind,'published');
    assert.ok(!/^4 UC/.test(result.unitsText));
    const brief = briefEvidence(entry.courseId,state,entry);
    assert.ok(brief.known.some(text => text.includes('UC guide lists')));
    assert.ok(brief.check.some(text => text.includes(`grade ${grade}`)));
    const checks = studentChecks(entry.courseId,state,entry);
    assert.ok(checks.some(text => text.includes(`grade ${grade}`)));
    assert.ok(!checks.some(text => text.includes('Add the term')));
    assert.ok(checks.length <= 3);
    assert.deepEqual(totals(state.entries),before);
  }
});

test('changing school resets prior approval and checklist context without removing course facts or award history', () => {
  const state = makeDemo();
  state.highSchool.profile = { ...state.highSchool.profile, districtId:'ousd',schoolId:'skyline',schoolName:'Skyline High School',policyId:'ousd-comprehensive',policyConfirmed:true };
  state.entries[0].workflow = workflowFor(state.entries[0]);
  state.highSchool.allocations = [{id:'award',collegeEntryId:state.entries[0].id,credits:13,subjectId:'electives',status:'approved',schoolApproval:'confirmed',preapproval:'approved',principalApproval:'approved',transcript:'received',note:'Retain evidence'}];
  const result = updateSchoolContext(state,{...state.highSchool.profile,schoolId:'oakland-tech',schoolName:'Oakland Technical High School'});
  assert.equal(result.highSchool.profile.policyConfirmed,false);
  assert.equal(result.entries[0].workflow.scheduleConfirmed,false);
  assert.equal(result.highSchool.allocations[0].status,'pending');
  assert.equal(result.highSchool.allocations[0].schoolApproval,'unknown');
  assert.equal(result.highSchool.allocations[0].credits,13);
  assert.equal(result.highSchool.allocations[0].transcript,'received');
  assert.equal(result.highSchool.allocations[0].note,'Retain evidence');
  assert.deepEqual(state.highSchool.allocations[0].status,'approved');
});

test('plus/minus university grade review remains separate from recorded high-school awards', () => {
  for (const finalGrade of ['B+', 'C-']) {
    for (const [courseId, target, evidenceKind] of [['laney-engl-c1000', 'uc-berkeley', 'published'], ['merritt-math-3a', 'ncat', 'preliminary'], ['laney-engl-c1000', 'howard', 'unknown']]) {
      const result = compareCourse(courseId, target, { status: 'completed', term: 'Fall 2025', finalGrade });
      assert.equal(result.kind, 'review');
      assert.equal(result.evidenceKind, evidenceKind);
      assert.equal(result.label, `Recorded ${finalGrade}: grade policy review`);
      assert.equal(result.unitsText, 'Individual credit award not verified');
      assert.match(result.recordGradeIssue, /receiving school must confirm its grade threshold/);
    }
  }
});
