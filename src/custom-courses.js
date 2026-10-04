import { COURSES } from './catalog.js';

const catalog = new Map(COURSES.map(course => [course.id, course]));
const requiredText = (value, name, max) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new Error(`Enter ${name} (${max} characters or fewer).`);
  return value.trim();
};

export function customCourseId(entryId) {
  if (typeof entryId !== 'string' || !entryId.trim() || entryId.length > 180) throw new Error('The custom course needs a valid record ID.');
  return `custom:${entryId}`;
}

export function normalizeCustomCourse(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('The custom college class needs its original course details.');
  let units = null;
  if (value.units != null && value.units !== '') {
    if (!['string', 'number'].includes(typeof value.units) || !String(value.units).trim()) throw new Error('Enter a valid unit amount or leave it unknown.');
    units = Number(value.units);
    if (!Number.isFinite(units) || units < 0 || units > 1000) throw new Error('College units must be between 0 and 1000, or unknown.');
  }
  if (value.unitSystem != null && !['semester', 'quarter', 'unknown'].includes(value.unitSystem)) throw new Error('Choose semester, quarter, or unknown units.');
  return { collegeName: requiredText(value.collegeName, 'the college name', 160), code: requiredText(value.code, 'the exact course number', 80),
    title: requiredText(value.title, 'the course title', 200), units, unitSystem: value.unitSystem || 'unknown' };
}

export function resolveEntryCourse(entry) {
  if (!entry || typeof entry !== 'object') return undefined;
  if (entry.customCourse === undefined) return catalog.get(entry.courseId);
  try {
    if (entry.courseId !== customCourseId(entry.id)) return undefined;
    const custom = normalizeCustomCourse(entry.customCourse);
    return { ...custom, id: entry.courseId, collegeId: entry.courseId, custom: true, subject: 'custom', family: entry.courseId, suggestionEligible: false };
  } catch { return undefined; }
}

/** Custom records remain private plan data; resolving never changes the public catalog. */
export function resolveCourse(id, entries = [], questions = []) {
  const known = catalog.get(id);
  if (known) return known;
  const entry = entries.find(entry => entry?.courseId === id);
  if (entry) return resolveEntryCourse(entry);
  const question = questions.find(question => question?.courseId === id && question.customCourse);
  return typeof id === 'string' && id.startsWith('custom:') && question
    ? resolveEntryCourse({ id: id.slice(7), courseId: id, customCourse: question.customCourse }) : undefined;
}

/** Manual duplicate warning only. This is never a course-equivalency or evidence bridge. */
export function customCourseIdentity(entry) {
  const course = resolveEntryCourse(entry);
  return course?.custom && typeof entry.term === 'string' && entry.term.trim()
    ? JSON.stringify([course.collegeName, course.code, entry.term].map(value => value.trim().toLowerCase())) : null;
}

/** All entered details are part of a recorded approval snapshot, even with a stable entry ID. */
export function customCourseSnapshot(entry) {
  const course = resolveEntryCourse(entry);
  return course?.custom ? JSON.stringify(normalizeCustomCourse(entry.customCourse)) : '';
}
