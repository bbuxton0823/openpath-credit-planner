import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSES, DESTINATIONS, RESEARCH_DATE } from '../src/data.js';
import { createAdvisorQuestion, deriveJourney, evidenceKey } from '../src/journey.js';

const record = (overrides = {}) => ({ id: 'record-1', courseId: 'laney-engl-c1000', status: 'completed', term: 'Fall 2026', ...overrides });
const empty = () => ({ viewMode: 'standard', profile: { collegeIds: [], destinationIds: [] }, entries: [], journey: { evidenceViewed: [], questions: [] } });
const example = () => ({ ...empty(), profile: { collegeIds: ['laney'], destinationIds: ['uc-berkeley'] }, entries: [record()] });
const step = (state, id) => deriveJourney(state).steps.find((item) => item.id === id);

test('empty or reset state starts five planning milestones without inventing progress', () => {
  for (const state of [empty(), undefined, {}]) {
    const journey = deriveJourney(state);
    assert.equal(journey.total, 5);
    assert.equal(journey.completed, 0);
    assert.equal(journey.nextStep.id, 'colleges');
    assert.ok(journey.steps.every((item) => item.done === false));
  }
});

test('college milestone requires a real source college and destination', () => {
  const state = empty();
  state.profile = { collegeIds: ['fake'], destinationIds: ['uc-berkeley'] };
  assert.equal(step(state, 'colleges').done, false);
  state.profile.collegeIds = ['laney'];
  state.profile.destinationIds = ['fake'];
  assert.equal(step(state, 'colleges').done, false);
  state.profile.destinationIds = ['howard'];
  assert.equal(step(state, 'colleges').done, true);
});

test('evidence keys preserve exact record identity, term, target and research snapshot', () => {
  const entry = record();
  const key = evidenceKey(entry, 'uc-berkeley');
  assert.ok(key.includes(RESEARCH_DATE));
  assert.equal(key, evidenceKey({ ...entry }, 'uc-berkeley'));
  for (const changed of [{ id: 'record-2' }, { courseId: 'merritt-engl-c1000' }, { term: 'Spring 2027' }]) {
    assert.notEqual(key, evidenceKey(record(changed), 'uc-berkeley'));
  }
  assert.notEqual(key, evidenceKey(entry, 'howard'));
});

test('previously viewed term, source snapshot or destination does not complete current evidence step', () => {
  const state = example();
  state.journey.evidenceViewed = [evidenceKey(state.entries[0], 'uc-berkeley')];
  assert.equal(step(state, 'evidence').done, true);
  state.entries[0].term = 'Spring 2027';
  assert.equal(step(state, 'evidence').done, false);
  state.entries[0].term = 'Fall 2026';
  state.profile.destinationIds = ['howard'];
  assert.equal(step(state, 'evidence').done, false);
  state.profile.destinationIds = ['uc-berkeley'];
  state.journey.evidenceViewed = [evidenceKey(state.entries[0], 'uc-berkeley').replace(RESEARCH_DATE, '2025-01-01')];
  assert.equal(step(state, 'evidence').done, false);
});

test('reading unknown evidence completes a reading action without claiming acceptance', () => {
  const state = example();
  state.profile.destinationIds = ['howard'];
  state.journey.evidenceViewed = [evidenceKey(state.entries[0], 'howard')];
  const result = step(state, 'evidence');
  assert.equal(result.done, true);
  assert.match(result.detail, /Unverified credit still needs school review/);
  const question = createAdvisorQuestion('laney-engl-c1000', 'howard', state.entries[0]);
  assert.match(question.text, /no verified course match/);
  assert.match(question.text, /not a rejection/);
});

test('course and plan milestones ignore malformed or unknown entries', () => {
  const state = empty();
  state.entries = [record({ courseId: 'unknown', status: 'planned' }), record({ term: 'whenever' }), record({ status: 'awarded' }), null];
  assert.equal(step(state, 'courses').done, false);
  assert.equal(step(state, 'plan').done, false);
  state.entries.push(record({ status: 'in-progress' }));
  assert.equal(step(state, 'courses').done, true);
  assert.equal(step(state, 'plan').done, false);
});

test('removing a planned course or changing its status unsets the plan milestone', () => {
  const state = example();
  state.entries.push(record({ id: 'plan-1', courseId: 'laney-math-3a', status: 'planned' }));
  assert.equal(step(state, 'plan').done, true);
  state.entries[1].status = 'completed';
  assert.equal(step(state, 'plan').done, false);
  state.entries[1].status = 'planned';
  state.entries.pop();
  assert.equal(step(state, 'plan').done, false);
});

test('standard and journey modes derive the same milestones from shared state without mutation', () => {
  const state = example();
  const before = structuredClone(state);
  const standard = deriveJourney(state);
  const journey = deriveJourney({ ...state, viewMode: 'journey' });
  assert.deepEqual(standard, journey);
  assert.deepEqual(state, before);
});

test('prepared question captures exact contextual identity and UC source-year uncertainty', () => {
  const entry = record();
  const course = COURSES.find((item) => item.id === entry.courseId);
  const destination = DESTINATIONS.find((item) => item.id === 'uc-berkeley');
  const question = createAdvisorQuestion(course, destination, entry);
  assert.deepEqual(question, createAdvisorQuestion(course.id, destination.id, { ...entry }));
  assert.equal(question.courseId, entry.courseId);
  assert.equal(question.destinationId, 'uc-berkeley');
  assert.equal(question.term, 'Fall 2026');
  assert.match(question.text, /ENGL C1000 at Laney College in Fall 2026/);
  assert.match(question.text, /2025-26 UC systemwide unit evidence/);
  assert.match(question.text, /applicable agreement for 2026-27/);
  assert.match(question.text, /general-education or major requirements, if any/);
});

test('preliminary N.C. A&T question asks for evaluation rather than assigning displayed units', () => {
  const entry = record({ courseId: 'merritt-math-3a' });
  const question = createAdvisorQuestion(entry.courseId, 'ncat', entry);
  assert.match(question.text, /MATH 131/);
  assert.match(question.text, /4 credits displayed/);
  assert.match(question.text, /no effective academic year/);
  assert.match(question.text, /5 local semester units/);
  assert.match(question.text, /individual evaluation confirm/);
});

test('historical identity never completes evidence for a current code or imports its equivalency', () => {
  const state = example();
  state.profile.destinationIds = ['ncat'];
  const historical = record({ courseId: 'laney-historical-engl-1a' });
  state.journey.evidenceViewed = [evidenceKey(historical, 'ncat')];
  assert.equal(step(state, 'evidence').done, false);
  const currentQuestion = createAdvisorQuestion('laney-engl-c1000', 'ncat', state.entries[0]);
  const historicalQuestion = createAdvisorQuestion(historical.courseId, 'ncat', historical);
  assert.doesNotMatch(currentQuestion.text, /ENGL 100/);
  assert.match(currentQuestion.text, /no verified course match/);
  assert.match(historicalQuestion.text, /ENGL 100/);
  assert.match(historicalQuestion.text, /exact historical source code without assuming/);
});

test('only a nonblank question for a current course, term and selected destination counts', () => {
  const state = example();
  state.journey.questions = [createAdvisorQuestion(state.entries[0].courseId, 'uc-berkeley', state.entries[0])];
  assert.equal(step(state, 'questions').done, true);
  state.entries[0].term = 'Spring 2027';
  assert.equal(step(state, 'questions').done, false);
  state.entries[0].term = 'Fall 2026';
  state.profile.destinationIds = ['howard'];
  assert.equal(step(state, 'questions').done, false);
  state.profile.destinationIds = ['uc-berkeley'];
  state.journey.questions[0].text = '   ';
  assert.equal(step(state, 'questions').done, false);
  state.journey.questions = ['A context-free question'];
  assert.equal(step(state, 'questions').done, false);
});

test('all five actions can complete, with no next step or implied admission result', () => {
  const state = example();
  state.entries[0].status = 'planned';
  state.journey.evidenceViewed = [evidenceKey(state.entries[0], 'uc-berkeley')];
  state.journey.questions = [createAdvisorQuestion(state.entries[0].courseId, 'uc-berkeley', state.entries[0])];
  const result = deriveJourney(state);
  assert.equal(result.completed, 5);
  assert.equal(result.nextStep, null);
  assert.match(step(state, 'plan').detail, /not enrollment/);
  assert.match(step(state, 'questions').detail, /Nothing has been sent/);
});

test('question creation rejects unknown or mismatched identities and never mutates entries', () => {
  const entry = record();
  const before = structuredClone(entry);
  assert.equal(createAdvisorQuestion('unknown', 'uc-berkeley', entry), null);
  assert.equal(createAdvisorQuestion(entry.courseId, 'unknown', entry), null);
  assert.equal(createAdvisorQuestion('merritt-engl-c1000', 'uc-berkeley', entry), null);
  assert.equal(createAdvisorQuestion(entry.courseId, 'uc-berkeley', { ...entry, term: 'unknown' }), null);
  createAdvisorQuestion(entry.courseId, 'uc-berkeley', entry);
  assert.deepEqual(entry, before);
});
