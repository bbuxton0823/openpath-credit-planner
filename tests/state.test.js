import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, normalizeState, makeDemo, loadState, saveState, STORAGE_KEY } from '../src/state.js';
import { judgment } from '../src/judgment.js';
import { deriveJourney } from '../src/journey.js';
const memoryStorage = () => { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) }; };

test('first visit has no sample data or selected colleges', () => {
  const { state } = loadState(memoryStorage());
  assert.equal(state.setupComplete, false);
  assert.deepEqual(state.entries, []);
  assert.deepEqual(state.profile.collegeIds, []);
  assert.deepEqual(state.guide, { started: false, step: 'classes', note: '' });
});
test('sample data is explicit and survives a storage round trip with changed targets', () => {
  const storage = memoryStorage(); const state = makeDemo();
  assert.equal(state.entries.length, 2);
  assert.equal(state.profile.destinationIds.length, 4);
  state.profile.destinationIds = state.profile.destinationIds.slice(0, 1);
  state.entries[0].term = 'Spring 2027';
  assert.equal(saveState(storage, state), true);
  assert.deepEqual(loadState(storage).state, state);
});
test('invalid and newer data is preserved without throwing or overwriting', () => {
  const storage = memoryStorage(); storage.setItem(STORAGE_KEY, '{broken');
  assert.ok(loadState(storage).warning);
  assert.equal(storage.getItem(STORAGE_KEY), '{broken');
  assert.throws(() => normalizeState({ version: 2, profile: {}, entries: [] }));
});
test('malformed course records are rejected rather than silently dropped', () => {
  const state = makeDemo(); state.entries[0].term = 'whenever';
  assert.throws(() => normalizeState(state));
});
test('blank or whitespace saved entry IDs require recovery without overwriting the original', () => {
  for (const id of ['', ' \t\n ']) {
    const state = makeDemo(); state.entries[0].id = id;
    assert.throws(() => normalizeState(state), /Some saved courses need recovery/);
    const storage = memoryStorage();
    const raw = JSON.stringify(state);
    storage.setItem(STORAGE_KEY, raw);
    const restored = loadState(storage);
    assert.ok(restored.warning);
    assert.deepEqual(restored.state.entries, []);
    assert.equal(storage.getItem(STORAGE_KEY), raw);
  }
});
test('blocked browser storage is a recoverable save failure', () => {
  assert.equal(saveState({ setItem() { throw Error('blocked'); } }, emptyState()), false);
});
test('optional judgment seam stays disabled and abstains', async () => {
  assert.equal(judgment.enabled, false);
  assert.deepEqual(await judgment.selectEvidenceCandidate({ candidates: [] }), { candidateId: null, status: 'disabled', requiresHumanReview: true });
});
test('pre-Journey v1 records gain optional defaults without changing courses or targets', () => {
  const legacy = makeDemo(); delete legacy.viewMode; delete legacy.journey;
  const restored = normalizeState(legacy);
  assert.equal(restored.viewMode, 'standard');
  assert.deepEqual(restored.journey, { evidenceViewed: [], questions: [] });
  assert.deepEqual(restored.entries, legacy.entries);
  assert.deepEqual(restored.profile, legacy.profile);
});
test('Journey choice and contextual questions persist while both views share one record', () => {
  const storage = memoryStorage(); const state = makeDemo();
  state.viewMode = 'journey'; state.journey.evidenceViewed = ['viewed-key'];
  state.journey.questions = [{ id: 'question', text: 'Does this exact course count for my term?', courseId: state.entries[0].courseId, destinationId: state.profile.destinationIds[0], term: state.entries[0].term }];
  assert.equal(saveState(storage, state), true);
  const restored = loadState(storage).state;
  assert.deepEqual(restored, state);
  restored.viewMode = 'standard'; assert.deepEqual(restored.entries, state.entries);
  assert.deepEqual(emptyState().journey, { evidenceViewed: [], questions: [] });
});
test('invalid optional Journey values do not break legacy course recovery', () => {
  const state = makeDemo(); state.viewMode = 'unknown';
  state.journey = { evidenceViewed: [true, 'okay', 'okay'], questions: [{ id: 'invalid', text: 'Question' }] };
  const restored = normalizeState(state);
  assert.equal(restored.viewMode, 'standard');
  assert.deepEqual(restored.journey, { evidenceViewed: ['okay'], questions: [] });
  assert.deepEqual(restored.entries, state.entries);
});
test('older state gains a guide step from its existing records without losing preferences', () => {
  const legacy = makeDemo();
  legacy.viewMode = 'journey';
  legacy.journey.evidenceViewed = ['previous-view'];
  delete legacy.guide;
  let restored = normalizeState(legacy);
  assert.deepEqual(restored.guide, { started: true, step: 'colleges', note: '' });
  assert.equal(restored.viewMode, 'journey');
  assert.deepEqual(restored.journey, legacy.journey);
  assert.deepEqual(restored.entries, legacy.entries);
  assert.deepEqual(restored.profile, legacy.profile);
  legacy.entries[0].status = 'planned';
  restored = normalizeState(legacy);
  assert.deepEqual(restored.guide, { started: true, step: 'next', note: '' });
  legacy.entries = [];
  assert.deepEqual(normalizeState(legacy).guide, { started: true, step: 'classes', note: '' });
  legacy.setupComplete = false;
  assert.deepEqual(normalizeState(legacy).guide, { started: false, step: 'classes', note: '' });
});
test('valid guide preferences persist and invalid optional fields use record-based defaults', () => {
  const state = makeDemo();
  state.guide = { started: false, step: 'next', note: 'What should I ask an advisor?' };
  const storage = memoryStorage();
  assert.equal(saveState(storage, state), true);
  assert.deepEqual(loadState(storage).state, state);
  state.guide = { started: 'yes', step: 'unknown' };
  assert.deepEqual(normalizeState(state).guide, { started: true, step: 'colleges', note: '' });
  state.guide = { started: true, step: 'classes', note: '' };
  assert.deepEqual(normalizeState(state).guide, state.guide);
});
test('general guide notes are bounded and never complete a contextual Journey question', () => {
  const state = makeDemo();
  state.guide.note = 'Which courses should I discuss with an advisor?';
  const restored = normalizeState(state);
  assert.equal(restored.guide.note, state.guide.note);
  assert.equal(deriveJourney(restored).steps.find(step => step.id === 'questions').done, false);
  assert.deepEqual(restored.journey.questions, []);
  state.guide.note = 'x'.repeat(1600);
  assert.equal(normalizeState(state).guide.note.length, 1500);
  state.guide.note = { text: 'Invalid note' };
  assert.equal(normalizeState(state).guide.note, '');
});
