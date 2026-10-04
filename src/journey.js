import { COLLEGES, DESTINATIONS, RESEARCH_DATE } from './catalog.js';
import { academicYear, compareCourse } from './rules.js';
import { resolveEntryCourse, resolveCourse, normalizeCustomCourse, customCourseSnapshot } from './custom-courses.js';

const collegeById = new Map(COLLEGES.map((college) => [college.id, college]));
const destinationById = new Map(DESTINATIONS.map((destination) => [destination.id, destination]));
const statuses = new Set(['completed', 'in-progress', 'planned']);
const list = (value) => Array.isArray(value) ? value : [];
const validEntry = (entry) => entry && typeof entry.id === 'string' && entry.id.trim()
  && resolveEntryCourse(entry) && statuses.has(entry.status)
  && typeof entry.term === 'string' && /^(Spring|Summer|Fall|Winter) 20\d{2}$/.test(entry.term);

/** A viewing milestone belongs to this exact record, destination and source snapshot. */
export function evidenceKey(entry, destinationId) {
  const identity = [RESEARCH_DATE, entry?.id ?? null, entry?.courseId ?? null, entry?.term ?? null, destinationId ?? null];
  const customKey = customCourseSnapshot(entry);
  if (customKey) identity.push(customKey);
  return `evidence:${JSON.stringify(identity)}`;
}

/** These milestones describe planning actions, never admission or enrollment readiness. */
export function deriveJourney(state) {
  const profile = state?.profile || {};
  const collegeIds = new Set(list(profile.collegeIds).filter((id) => collegeById.has(id)));
  const destinationIds = new Set(list(profile.destinationIds).filter((id) => destinationById.has(id)));
  const entries = list(state?.entries).filter(validEntry);
  const customColleges = new Set(entries.map(resolveEntryCourse).filter(course => course.custom).map(course => course.collegeName.trim().toLowerCase()));
  const sourceCount = collegeIds.size + customColleges.size;
  const viewed = new Set(list(state?.journey?.evidenceViewed).filter((key) => typeof key === 'string'));
  const evidenceDone = entries.some((entry) => [...destinationIds].some((id) => viewed.has(evidenceKey(entry, id))));
  const planned = entries.filter((entry) => entry.status === 'planned');
  const questions = list(state?.journey?.questions).filter((question) => question
    && typeof question.text === 'string' && question.text.trim()
    && (!question.destinationId || destinationIds.has(question.destinationId))
    && entries.some((entry) => entry.courseId === question.courseId && entry.term === question.term
      && (!entry.customCourse || (question.customCourse && customCourseSnapshot({ ...entry, customCourse: question.customCourse }) === customCourseSnapshot(entry)))));
  const collegesDone = sourceCount > 0 && destinationIds.size > 0;
  const steps = [
    {
      id: 'colleges', title: 'Choose your colleges', done: collegesDone, action: 'setup',
      detail: collegesDone
        ? `${sourceCount} source ${sourceCount === 1 ? 'college' : 'colleges'} and ${destinationIds.size} ${destinationIds.size === 1 ? 'destination' : 'destinations'} selected. You can change your choices.`
        : 'Record a source college and choose a destination when you are ready to explore.',
    },
    {
      id: 'courses', title: 'Add a course', done: entries.length > 0, action: 'catalog',
      detail: entries.length
        ? `${entries.length} ${entries.length === 1 ? 'course record' : 'course records'} saved with an original college, status and term.`
        : 'Record a course you have taken, are taking, or are considering.',
    },
    {
      id: 'evidence', title: 'Open course evidence', done: evidenceDone, action: 'go-compare',
      detail: evidenceDone
        ? 'You opened evidence for a current course and selected destination. Unverified credit still needs school review.'
        : 'Open the evidence for one of your courses and a selected destination. Notice what remains unverified.',
    },
    {
      id: 'plan', title: 'Draft a semester plan', done: planned.length > 0, action: 'go-plan',
      detail: planned.length
        ? `${planned.length} planned ${planned.length === 1 ? 'course' : 'courses'} saved. A plan is an idea to discuss, not enrollment.`
        : 'Save a course as planned after exploring the evidence. Check prerequisites and availability before enrolling.',
    },
    {
      id: 'questions', title: 'Prepare an advisor question', done: questions.length > 0, action: 'prepare-question',
      detail: questions.length
        ? `${questions.length} ${questions.length === 1 ? 'question is' : 'questions are'} ready for a current course and term. Nothing has been sent.`
        : 'Prepare a question about an exact course and term to take to a counselor. A destination is optional.',
    },
  ];
  return {
    steps,
    completed: steps.filter((step) => step.done).length,
    total: steps.length,
    nextStep: steps.find((step) => !step.done) || null,
  };
}

/** Prepare source-backed question text locally. This does not evaluate or award credit. */
export function createAdvisorQuestion(courseOrId, destinationOrId, entry) {
  const course = resolveCourse(typeof courseOrId === 'string' ? courseOrId : courseOrId?.id, [entry]);
  const destination = destinationById.get(typeof destinationOrId === 'string' ? destinationOrId : destinationOrId?.id);
  const destinationOptional = destinationOrId == null || destinationOrId === '' || destinationOrId?.id === '';
  if (!course || (!destination && !destinationOptional) || !validEntry(entry) || entry.courseId !== course.id) return null;
  const collegeName = course.custom ? course.collegeName : collegeById.get(course.collegeId).name;
  const result = compareCourse(course, destination, entry);
  const parts = [
    destination
      ? `For ${course.code} at ${collegeName} in ${entry.term}, what credit, if any, would ${destination.name} award to a student applying from high school with dual-enrollment coursework?`
      : `For ${course.code} at ${collegeName} in ${entry.term}, how can I confirm any high-school credit and find out where it could count toward college? I have not chosen a destination college.`,
  ];
  if (destination?.type === 'UC' && course.ucYear) {
    parts.push(`The prototype cites ${course.ucYear} UC systemwide unit evidence (${result.unitsText}). Can you confirm the applicable agreement for ${academicYear(entry.term)} and the units awarded after transcript review?`);
  } else if (result.kind === 'preliminary') {
    parts.push(`The preliminary database lists ${result.equivalentText} with ${result.unitsText}, but no effective academic year. Which equivalent and credit hours would an individual evaluation confirm for this term?`);
    if (Number.isFinite(course.units)) parts.push(`The source course carries ${course.units} local semester units. Please confirm how the displayed destination credits relate to those units.`);
  } else {
    parts.push('The prototype has no verified course match. This is an open question, not a rejection. What source or individual review can establish the result for this exact course and term?');
  }
  if (course.historical) parts.push('Please use this exact historical source code without assuming it is equivalent to a renumbered current course.');
  parts.push('Which general-education or major requirements, if any, could it fulfill for this applicant route, and what grade, transcript, sequence or duplicate-credit conditions need checking?');
  return {
    id: `question:${evidenceKey(entry, destination?.id || '')}`,
    text: parts.join(' '),
    courseId: course.id,
    destinationId: destination?.id || '',
    term: entry.term,
    ...(course.custom ? { customCourse: normalizeCustomCourse(entry.customCourse) } : {}),
  };
}
