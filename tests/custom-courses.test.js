import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSES, DESTINATIONS } from '../src/catalog.js';
import { customCourseId, normalizeCustomCourse, resolveEntryCourse, resolveCourse, customCourseIdentity, customCourseSnapshot } from '../src/custom-courses.js';
import { emptyState, normalizeState, updateCollegeEntry, updateSchoolContext, loadState, saveState, STORAGE_KEY } from '../src/state.js';
import { compareCourse, totals, duplicateWarnings, suggestCourses } from '../src/rules.js';
import { briefEvidence, studentChecks, guidedCandidates } from '../src/guide.js';
import { evidenceKey, createAdvisorQuestion, deriveJourney } from '../src/journey.js';
import { courseWorkflow, normalizeCourseWorkflow } from '../src/course-record.js';

const details = (changes = {}) => ({ collegeName: 'Example Community College', code: 'ENGL C1000', title: 'Academic Reading and Writing', units: 4, unitSystem: 'semester', ...changes });
const custom = (changes = {}) => ({ id: 'manual-1', courseId: customCourseId('manual-1'), term: 'Fall 2025', status: 'completed', finalGrade: 'B', customCourse: details(), ...changes });
const plan = entry => ({ ...emptyState(), entries: [entry || custom()] });

test('manual course details normalize explicitly and never alter the researched catalog', () => {
  const before = structuredClone(COURSES);
  const entry = custom({ customCourse: details({ collegeName: ' Example Community College ', units: '4' }) });
  const resolved = resolveEntryCourse(entry);
  assert.equal(resolved.collegeId, entry.courseId);
  assert.equal(resolved.collegeName, 'Example Community College');
  assert.equal(resolved.units, 4);
  assert.equal(resolved.suggestionEligible, false);
  assert.equal(resolved.ucYear, undefined);
  assert.equal(resolved.ncat, undefined);
  assert.strictEqual(resolveEntryCourse({ courseId: COURSES[0].id }), COURSES[0]);
  assert.strictEqual(resolveCourse(COURSES[0].id), COURSES[0]);
  assert.deepEqual(COURSES, before);
  for (const change of [{ collegeName: '' }, { code: ' ' }, { title: '' }, { units: Infinity }, { units: -1 }, { unitSystem: 'credits' }]) {
    assert.throws(() => normalizeCustomCourse(details(change)), JSON.stringify(change));
  }
});

test('custom records round trip with stable IDs and malformed identities preserve recovery data', () => {
  const state = plan();
  const before = structuredClone(state);
  const saved = new Map();
  const storage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
  assert.equal(saveState(storage, state), true);
  assert.deepEqual(loadState(storage).state, normalizeState(state));
  assert.equal(loadState(storage).state.entries[0].id, 'manual-1');
  assert.deepEqual(state, before);
  for (const changes of [{ courseId: 'laney-engl-c1000' }, { courseId: 'custom:different-id' }, { customCourse: details({ code: '' }) }]) {
    const bad = plan(custom(changes));
    const raw = JSON.stringify(bad);
    storage.setItem(STORAGE_KEY, raw);
    assert.ok(loadState(storage).warning);
    assert.equal(storage.getItem(STORAGE_KEY), raw);
  }
});

test('manual source or title resemblance never inherits UC or HBCU evidence', () => {
  const entry = custom({ customCourse: details({ collegeName: 'Laney College' }) });
  const supplied = { ...resolveEntryCourse(entry), ucYear: '2025-26', ucUnits: 4, ncat: { equivalents: [{ code: 'FAKE', units: 4 }] } };
  for (const destination of DESTINATIONS) {
    for (const course of [entry, supplied, entry.courseId]) {
      const result = compareCourse(course, destination, entry);
      assert.equal(result.kind, 'unknown', destination.id);
      assert.equal(result.label, 'Needs transfer review');
      assert.equal(result.unitsText, 'Award not verified');
      assert.match(result.notes.join(' '), /not a decision to reject/);
    }
  }
  for (const finalGrade of ['F', 'NP', 'P', 'C-', 'I', 'W']) {
    const failed = { ...entry, finalGrade };
    const result = compareCourse(failed, 'uc-berkeley');
    assert.equal(result.kind, 'review');
    assert.equal(result.evidenceKind, 'unknown');
    assert.ok(result.recordGradeIssue.includes(finalGrade));
  }
});

test('quarter units and unknown systems never enter the semester-unit totals', () => {
  const records = [
    custom(),
    custom({ id: 'quarter', courseId: customCourseId('quarter'), status: 'in-progress', finalGrade: '', customCourse: details({ units: 5, unitSystem: 'quarter' }) }),
    custom({ id: 'unknown', courseId: customCourseId('unknown'), status: 'planned', finalGrade: '', customCourse: details({ units: 9, unitSystem: 'unknown' }) }),
    custom({ id: 'blank', courseId: customCourseId('blank'), customCourse: details({ units: null }) }),
  ];
  const result = totals(records);
  assert.deepEqual({ completed: result.completed, inProgress: result.inProgress, planned: result.planned }, { completed: 4, inProgress: 0, planned: 0 });
  assert.deepEqual(result.quarterByStatus, { completed: 0, inProgress: 5, planned: 0 });
  assert.deepEqual(result.unclassifiedByStatus, { completed: 0, inProgress: 0, planned: 1 });
  assert.equal(result.unknownByStatus.completed, 1);
  assert.equal(totals([{ courseId: 'laney-engl-c1000', status: 'completed' }]).quarterByStatus, undefined);
});

test('manual duplicate identity uses college, exact code and term with only trim/case normalization', () => {
  const first = custom();
  const second = custom({ id: 'manual-2', courseId: customCourseId('manual-2'), status: 'planned', finalGrade: '', customCourse: details({ collegeName: ' example community college ', code: 'engl c1000', title: 'Different supplied title' }) });
  assert.equal(customCourseIdentity(first), customCourseIdentity(second));
  assert.equal(duplicateWarnings([first, second]).length, 1);
  assert.notEqual(customCourseIdentity(first), customCourseIdentity({ ...second, term: 'Spring 2026' }));
  assert.notEqual(customCourseIdentity(first), customCourseIdentity({ ...second, customCourse: details({ code: 'ENGL  C1000' }) }));
});

test('custom detail edits preserve entry IDs and clear workflow confirmation snapshots', () => {
  const original = custom();
  original.workflow = normalizeCourseWorkflow({ approvalSignatures: 'recorded', requiredSignaturesNote: 'Keep note', scheduleConfirmed: true, linkedCourseId: original.courseId, linkedTerm: original.term, linkedStatus: original.status, linkedCustomCourseKey: customCourseSnapshot(original) });
  for (const change of [{ collegeName: 'Another College' }, { code: 'ENG 101' }, { title: 'Changed title' }, { units: 3 }, { unitSystem: 'quarter' }]) {
    const next = updateCollegeEntry(original, { ...original, customCourse: details(change) });
    assert.equal(next.id, original.id);
    assert.equal(next.courseId, original.courseId);
    assert.equal(next.workflow.scheduleConfirmed, false);
    assert.equal(next.workflow.requiredSignaturesNote, 'Keep note');
    assert.notEqual(customCourseSnapshot(next), customCourseSnapshot(original));
  }
  assert.equal(original.workflow.scheduleConfirmed, true);
});

test('custom workflow grade and schedule steps require matching manual-detail snapshots', () => {
  const entry = custom();
  entry.workflow = { scheduleConfirmed: true, linkedCourseId: entry.courseId, linkedTerm: entry.term, linkedStatus: entry.status, linkedCustomCourseKey: customCourseSnapshot(entry) };
  const state = plan(entry);
  let workflow = courseWorkflow(state, entry);
  assert.equal(workflow.steps[1].done, true);
  assert.equal(workflow.steps[2].done, true);
  assert.equal(workflow.steps[3].done, false);
  entry.customCourse.units = 5;
  workflow = courseWorkflow(state, entry);
  assert.equal(workflow.snapshotCurrent, false);
  assert.equal(workflow.completed, 0);
});

test('custom course evidence stays unknown and never creates recommendations', () => {
  const state = plan();
  state.profile.destinationIds = ['uc-berkeley', 'howard'];
  const before = structuredClone(state);
  assert.deepEqual(briefEvidence(state.entries[0].courseId, state, state.entries[0]).known, []);
  assert.match(studentChecks(state.entries[0].courseId, state, state.entries[0]).join(' '), /unknown, not rejected/);
  assert.deepEqual(suggestCourses(state), []);
  assert.deepEqual(guidedCandidates(state), []);
  assert.deepEqual(state, before);
});

test('custom questions retain orphaned source snapshots and optional destinations on reload', () => {
  const state = plan();
  const entry = state.entries[0];
  const question = createAdvisorQuestion(entry.courseId, undefined, entry);
  assert.deepEqual(createAdvisorQuestion(entry.courseId, { id: '', name: 'School counselor' }, entry), question);
  assert.equal(question.destinationId, '');
  assert.match(question.text, /Example Community College/);
  assert.match(question.text, /not chosen a destination/);
  assert.deepEqual(question.customCourse, entry.customCourse);
  state.journey.questions = [question];
  assert.equal(deriveJourney(state).steps.find(step => step.id === 'questions').done, true);
  state.entries = [];
  const loaded = normalizeState(state);
  assert.deepEqual(loaded.journey.questions, [question]);
  assert.equal(resolveCourse(question.courseId, loaded.entries, loaded.journey.questions).collegeName, 'Example Community College');
  assert.equal(deriveJourney(loaded).steps.find(step => step.id === 'questions').done, false);
});

test('custom changes invalidate prior evidence and contextual questions without rewriting their saved text', () => {
  const state = plan();
  const entry = state.entries[0];
  state.profile.destinationIds = ['howard'];
  state.journey.evidenceViewed = [evidenceKey(entry, 'howard')];
  state.journey.questions = [createAdvisorQuestion(entry.courseId, 'howard', entry)];
  const originalText = state.journey.questions[0].text;
  assert.equal(deriveJourney(state).completed, 4);
  entry.customCourse.code = 'ENG 102';
  const derived = deriveJourney(state);
  assert.equal(derived.steps.find(step => step.id === 'evidence').done, false);
  assert.equal(derived.steps.find(step => step.id === 'questions').done, false);
  assert.equal(state.journey.questions[0].text, originalText);
});

test('maximum-length custom evidence keys survive optional metadata normalization', () => {
  const entry = custom({ customCourse: details({ collegeName: 'C'.repeat(160), code: 'X'.repeat(80), title: 'T'.repeat(200) }) });
  const state = plan(entry);
  state.journey.evidenceViewed = [evidenceKey(entry, 'howard')];
  state.journey.questions = [createAdvisorQuestion(entry.courseId, 'howard', entry)];
  const loaded = normalizeState(state);
  assert.deepEqual(loaded.journey.evidenceViewed, state.journey.evidenceViewed);
  assert.equal(loaded.journey.questions[0].id, state.journey.questions[0].id);
});

test('new district and manual school context clears approvals without deleting custom records', () => {
  const state = plan();
  state.highSchool.profile = { ...state.highSchool.profile, districtId: 'other', districtName: 'District A', schoolId: 'other', schoolName: 'School A' };
  state.entries[0].workflow = { scheduleConfirmed: true, requiredSignaturesNote: 'Keep this note' };
  state.highSchool.allocations = [{ id: 'allocation-1', collegeEntryId: state.entries[0].id, status: 'approved', schoolApproval: 'confirmed' }];
  const result = updateSchoolContext(state, { districtName: 'District B' });
  assert.equal(result.entries[0].id, state.entries[0].id);
  assert.deepEqual(result.entries[0].customCourse, state.entries[0].customCourse);
  assert.equal(result.entries[0].workflow.scheduleConfirmed, false);
  assert.equal(result.highSchool.allocations[0].status, 'pending');
});

test('generic school approval guidance does not invent OUSD enrollment-route requirements', () => {
  const entry = custom();
  entry.workflow = { linkedCourseId: entry.courseId, linkedTerm: entry.term, linkedStatus: entry.status, linkedCustomCourseKey: customCourseSnapshot(entry) };
  const state = plan(entry);
  state.highSchool.profile = { ...state.highSchool.profile, districtId: 'other', districtName: 'Example district', schoolId: 'other', schoolName: 'Example high school' };
  const approval = courseWorkflow(state, entry).steps[0];
  assert.match(approval.detail, /Ask your school which approvals and signatures apply/);
  assert.doesNotMatch(approval.detail, /principal|external enrollment|prior approval/i);
});
