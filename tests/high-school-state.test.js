import test from 'node:test';
import assert from 'node:assert/strict';
import { makeDemo, emptyState, normalizeState, saveState, loadState, STORAGE_KEY } from '../src/state.js';

const storage = () => { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }; };

test('legacy college record and exact Howard question survive optional HS migration', () => {
  const old = makeDemo();
  delete old.highSchool;
  old.entries.push({ id: 'sample-math', courseId: 'merritt-math-3a', status: 'planned', term: 'Spring 2027' });
  old.journey.questions = [{ id: 'saved-howard', courseId: old.entries[0].courseId, term: 'Fall 2025', destinationId: 'howard', text: 'I took ENGL C1000 at Laney College in Fall 2025 while in high school. Would Howard award credit, and which GE or major requirement, if any, could it meet? What transcript and grade information do you need to review it?' }];
  const result = normalizeState(old);
  for (const field of ['entries', 'profile', 'journey', 'guide']) assert.deepEqual(result[field], old[field]);
  assert.deepEqual(result.highSchool.courses, []);
  assert.deepEqual(result.highSchool.allocations, []);
  assert.equal(result.highSchool.profile.policyConfirmed, false);
});

test('HS profile and records round trip without changing college units or records', () => {
  const state = makeDemo();
  const collegeEntries = structuredClone(state.entries);
  state.highSchool.profile = { ...state.highSchool.profile, districtId: 'ousd', policyId: 'ousd-comprehensive', graduationYear: '2027', schoolId: 'other', schoolName: 'Fictional comprehensive school' };
  state.highSchool.courses = [{ id: 'fictional-hs', title: 'Fictional English 9', subjectId: 'english', credits: 10, status: 'completed', result: 'passing', creditAward: 'earned', provenance: 'student-reported', note: 'Fictional record only', courseType: 'standard', term: '2025-26', gradeLevel: '9' }];
  const clean = normalizeState(state);
  const mem = storage();
  assert.equal(saveState(mem, clean), true);
  assert.deepEqual(loadState(mem).state, clean);
  assert.deepEqual(clean.entries, collegeEntries);
});

test('malformed HS extension requires recovery without overwriting original college record', () => {
  for (const highSchool of ['broken', { profile: {}, courses: [{ id: 'broken' }], allocations: [] }]) {
    const old = { ...makeDemo(), highSchool };
    const mem = storage(); const raw = JSON.stringify(old); mem.setItem(STORAGE_KEY, raw);
    assert.ok(loadState(mem).warning);
    assert.equal(mem.getItem(STORAGE_KEY), raw);
  }
});

test('new plans do not silently assume OUSD, school or a graduation requirement profile', () => {
  const profile = emptyState().highSchool.profile;
  assert.equal(profile.districtId, null);
  assert.equal(profile.policyId, null);
  assert.equal(profile.schoolId, 'unknown');
});
