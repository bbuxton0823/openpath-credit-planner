import { COLLEGES, COURSES, DESTINATIONS } from './catalog.js';
import { emptyHighSchoolProfile, normalizeHighSchoolProfile, updateHighSchoolProfile, normalizeHighSchoolRecords, normalizeHighSchoolAllocations } from './high-school.js';
import { normalizeFinalGrade, normalizeCourseWorkflow, validateFinalGradeStatus } from './course-record.js';
import { customCourseId, normalizeCustomCourse, resolveEntryCourse, resolveCourse, customCourseSnapshot } from './custom-courses.js';

export const STORAGE_KEY = 'openpath.prototype.v1';
export function emptyState() {
  return { version: 1, setupComplete: false, isDemo: false, viewMode: 'standard',
    guide: { started: false, step: 'classes', note: '' }, journey: { evidenceViewed: [], questions: [] }, profile: {
    graduationYear: '2027', major: 'Undecided', collegeIds: [], destinationIds: [], planningTerm: 'Spring 2027',
  }, entries: [], highSchool: { profile: emptyHighSchoolProfile(), courses: [], allocations: [] } };
}
export const validTerm = value => /^(Spring|Summer|Fall|Winter) (20\d{2})$/.test(value);

export function updateCollegeEntry(existing, fields) {
  const finalGrade = normalizeFinalGrade(fields.finalGrade);
  validateFinalGradeStatus(finalGrade, fields.status);
  if (!validTerm(fields.term)) throw new Error('Choose the course term and year.');
  const next = { ...existing, ...fields, id: existing?.id || fields.id, finalGrade };
  if (next.customCourse !== undefined) {
    next.customCourse = normalizeCustomCourse(next.customCourse);
    next.courseId = customCourseId(next.id);
  }
  if (!resolveEntryCourse(next)) throw new Error('Choose a known course or enter the original college class details.');
  const contextChanged = !existing || existing.courseId !== next.courseId || existing.term !== next.term || existing.status !== next.status
    || customCourseSnapshot(existing) !== customCourseSnapshot(next);
  return { ...next, workflow: normalizeCourseWorkflow(contextChanged ? { requiredSignaturesNote: existing?.workflow?.requiredSignaturesNote } : existing.workflow) };
}

/** A different school must review approvals again, while course facts stay intact. */
export function updateSchoolContext(state, fields) {
  const previous = state.highSchool.profile;
  const profile = updateHighSchoolProfile(previous, fields);
  const changed = ['districtId', 'districtName', 'schoolId', 'schoolName', 'policyId', 'graduationYear'].some(key => previous[key] !== profile[key]);
  return {
    entries: changed ? state.entries.map(entry => ({ ...entry, workflow: normalizeCourseWorkflow({ requiredSignaturesNote: entry.workflow?.requiredSignaturesNote }) })) : state.entries,
    highSchool: { ...state.highSchool, profile,
      allocations: changed ? state.highSchool.allocations.map(record => ({ ...record, status: 'pending', schoolApproval: 'unknown', preapproval: 'unknown', principalApproval: 'unknown' })) : state.highSchool.allocations },
  };
}

function defaultGuide(state) {
  return {
    started: state.setupComplete || state.entries.length > 0,
    step: state.entries.some(entry => entry.status === 'planned') ? 'next' : state.entries.length ? 'colleges' : 'classes',
    note: '',
  };
}

export function normalizeState(value) {
  if (!value || value.version !== 1 || !value.profile || !Array.isArray(value.entries)) throw new Error('Unrecognized saved format.');
  const state = emptyState();
  state.setupComplete = value.setupComplete === true;
  state.isDemo = value.isDemo === true;
  // Optional additions keep pre-Journey v1 records readable without rewriting coursework.
  state.viewMode = value.viewMode === 'journey' ? 'journey' : 'standard';
  const journey = value.journey || {};
  state.journey.evidenceViewed = [...new Set(Array.isArray(journey.evidenceViewed)
    ? journey.evidenceViewed.filter(key => typeof key === 'string' && key.length <= 2000) : [])];
  const ids = (values, records) => [...new Set(Array.isArray(values) ? values.filter(id => records.some(r => r.id === id)) : [])];
  state.profile = {
    graduationYear: /^20\d{2}$/.test(value.profile.graduationYear) ? String(value.profile.graduationYear) : '2027',
    major: typeof value.profile.major === 'string' ? value.profile.major.slice(0, 80) : 'Undecided',
    collegeIds: ids(value.profile.collegeIds, COLLEGES),
    destinationIds: ids(value.profile.destinationIds, DESTINATIONS),
    planningTerm: validTerm(value.profile.planningTerm) ? value.profile.planningTerm : 'Spring 2027',
  };
  const seen = new Set();
  state.entries = value.entries.filter(entry => entry && typeof entry.id === 'string' && entry.id.trim() &&
    resolveEntryCourse(entry) && ['completed', 'in-progress', 'planned'].includes(entry.status) &&
    validTerm(entry.term) && !seen.has(entry.id) && seen.add(entry.id))
    .map(entry => {
      const { id, courseId, status, term } = entry;
      const record = { id, courseId, status, term };
      if (entry.customCourse !== undefined) record.customCourse = normalizeCustomCourse(entry.customCourse);
      // Keep legacy course identities exactly as saved. Missing grade remains unknown.
      if (entry.finalGrade !== undefined) {
        record.finalGrade = normalizeFinalGrade(entry.finalGrade);
        validateFinalGradeStatus(record.finalGrade, status);
      }
      if (entry.workflow !== undefined) record.workflow = normalizeCourseWorkflow(entry.workflow);
      return record;
    });
  if (state.entries.length !== value.entries.length) throw new Error('Some saved courses need recovery.');
  state.journey.questions = (Array.isArray(journey.questions) ? journey.questions : [])
    .filter(q => q && typeof q.id === 'string' && typeof q.text === 'string' && q.text.trim()
      && resolveCourse(q.courseId, state.entries, [q])
      && (!q.destinationId || DESTINATIONS.some(d => d.id === q.destinationId)) && validTerm(q.term))
    .map(q => {
      const savedCustom = q.customCourse || state.entries.find(entry => entry.courseId === q.courseId)?.customCourse;
      return { id: q.id.slice(0, 2000), text: q.text.trim().slice(0, 1500), courseId: q.courseId, destinationId: q.destinationId || '', term: q.term,
        ...(savedCustom ? { customCourse: normalizeCustomCourse(savedCustom) } : {}) };
    });
  // Optional extension: older v1 plans gain an empty HS notebook, never inferred credit.
  const highSchool = value.highSchool;
  if (highSchool != null && (typeof highSchool !== 'object' || Array.isArray(highSchool))) throw new Error('High-school records need recovery.');
  state.highSchool = {
    profile: normalizeHighSchoolProfile(highSchool?.profile),
    courses: normalizeHighSchoolRecords(highSchool?.courses),
    allocations: normalizeHighSchoolAllocations(highSchool?.allocations),
  };
  const guide = value.guide || {};
  const guideDefaults = defaultGuide(state);
  state.guide = {
    started: typeof guide.started === 'boolean' ? guide.started : guideDefaults.started,
    step: ['classes', 'colleges', 'next'].includes(guide.step) ? guide.step : guideDefaults.step,
    note: typeof guide.note === 'string' ? guide.note.slice(0, 1500) : '',
  };
  return state;
}
export function loadState(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return { state: raw ? normalizeState(JSON.parse(raw)) : emptyState(), warning: '' };
  } catch {
    return { state: emptyState(), warning: 'Saved data could not be read. The original has not been changed. Export the saved copy before starting again.' };
  }
}
export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state))); return true; }
  catch { return false; }
}
export function makeDemo() {
  const state = emptyState();
  const pickDestination = text => DESTINATIONS.find(d => d.name.includes(text))?.id;
  state.setupComplete = true;
  state.isDemo = true;
  state.profile.collegeIds = COLLEGES.filter(c => /Laney|Merritt/.test(c.name)).map(c => c.id);
  state.profile.destinationIds = ['Berkeley', 'Davis', 'Carolina', 'Howard'].map(pickDestination).filter(Boolean);
  const findCourse = (collegeName, code) => COURSES.find(c => c.code === code && COLLEGES.find(k => k.id === c.collegeId)?.name.includes(collegeName));
  state.entries = [
    { id: 'sample-english', courseId: findCourse('Laney', 'ENGL C1000')?.id, status: 'completed', term: 'Fall 2025' },
    { id: 'sample-psych', courseId: findCourse('Merritt', 'PSYC C1000')?.id, status: 'in-progress', term: 'Fall 2026' },
  ].filter(e => e.courseId);
  state.guide = defaultGuide(state);
  return state;
}
