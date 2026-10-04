import { DESTINATIONS } from './catalog.js';
import { compareCourse, suggestCourses } from './rules.js';
import { resolveCourse } from './custom-courses.js';

/** Keep every researched college option while presenting each course family once. */
export function guidedCandidates(state) {
  const groups = new Map();
  for (const candidate of suggestCourses(state)) {
    const family = candidate.course.family;
    if (!groups.has(family)) groups.set(family, { family, options: [] });
    groups.get(family).options.push(candidate);
  }
  return [...groups.values()];
}

/** Short, source-scoped facts and open checks for the same evidence as the full planner. */
export function briefEvidence(courseOrId, state, entry) {
  const course = resolveCourse(typeof courseOrId === 'string' ? courseOrId : courseOrId?.id, state?.entries || [], state?.journey?.questions || []) || (courseOrId?.custom ? courseOrId : undefined);
  const targetIds = new Set(Array.isArray(state?.profile?.destinationIds) ? state.profile.destinationIds : []);
  const targets = DESTINATIONS.filter((destination) => targetIds.has(destination.id));
  if (!targets.length) return {
    known: [],
    check: ['Choose colleges you might attend, or ask a counselor where this class could count.'],
  };
  if (!course) return {
    known: [],
    check: ['Choose an exact course and source college from the research catalog. No credit result is verified yet.'],
  };
  const context = entry ?? { term: state?.profile?.planningTerm, status: 'planned' };
  const known = [];
  const check = [];
  const unknownSchools = [];
  let morehouseBlocked = false;
  let numberingCheck = false;
  let ucIncluded = false;
  for (const destination of targets) {
    const result = compareCourse(course, destination, context);
    const sourceKind = result.evidenceKind || result.kind;
    if (result.recordGradeIssue && !check.includes(result.recordGradeIssue)) check.unshift(result.recordGradeIssue);
    if (destination.type === 'UC') {
      if (ucIncluded) continue;
      ucIncluded = true;
      if (course.ucYear && sourceKind !== 'unknown') {
        known.push(`${course.ucYear} UC guide lists ${course.ucUnits} semester units.`);
        if (result.yearMismatch) check.push(`Confirm credit for ${context.term}; the UC guide covers ${course.ucYear}.`);
        else if ((result.evidenceLabel || result.label) === 'Course term needed') check.push(`Add your course term; the UC guide covers ${course.ucYear}.`);
        if (course.code === 'ENGL C1000E') check.push('ENGL C1000E has 5 local units but a 4-UC-unit cap; it duplicates ENGL C1000.');
        else if (course.code === 'MATH 3A') check.push('Check one-series limits before combining calculus alternatives.');
        else if (course.code === 'STAT C1000' && course.collegeId === 'alameda') check.push('Alameda STAT C1000 and SOCSC 125 earn UC credit for only one.');
      } else {
        unknownSchools.push('UC');
      }
    } else if (sourceKind === 'preliminary') {
      const equivalents = course.ncat.equivalents;
      const credits = [...new Set(equivalents.map(equivalent => equivalent.units))].join(' or ');
      known.push(equivalents.length > 1
        ? `${destination.shortName} lists preliminary alternatives (${credits} credits for one, not both).`
        : `${destination.shortName} lists a preliminary match (${credits} credits).`);
      check.push(`${destination.shortName} gives no effective year; it must confirm the match and final credit against transcript units.`);
    } else {
      unknownSchools.push(destination.shortName);
      if (destination.id === 'morehouse') morehouseBlocked = true;
      if (destination.id === 'ncat') numberingCheck = true;
    }
  }
  if (unknownSchools.length) check.push(`${unknownSchools.join(', ')}: no verified course match; unknown isn't rejection.${morehouseBlocked ? ' Morehouse\'s lookup was blocked before a Peralta search.' : ''}`);
  if (course.historical || numberingCheck) check.push('No old-to-new course-number match is verified. Keep historical and current courses separate.');
  check.push('Each school must confirm how it counts toward a degree and any grade/transcript rules.');
  check.push('Check prerequisites, placement and course availability before enrolling.');
  return { known: [...new Set(known)], check: [...new Set(check)] };
}

/** A short student-facing checklist; briefEvidence retains the full conditions. */
export function studentChecks(courseOrId, state, entry) {
  const course = resolveCourse(typeof courseOrId === 'string' ? courseOrId : courseOrId?.id, state?.entries || [], state?.journey?.questions || []) || (courseOrId?.custom ? courseOrId : undefined);
  const targetIds = new Set(Array.isArray(state?.profile?.destinationIds) ? state.profile.destinationIds : []);
  const targets = DESTINATIONS.filter(destination => targetIds.has(destination.id));
  if (!targets.length) return ['Choose colleges you might attend, or ask a counselor where this class could count.'];
  if (!course) return ['Choose the exact class and college where you took it, or ask a counselor to help find it.'];

  const context = entry ?? { term: state?.profile?.planningTerm, status: 'planned' };
  const timeChecks = [];
  const unknownSchools = new Set();
  let ucIncluded = false;
  for (const destination of targets) {
    const result = compareCourse(course, destination, context);
    const sourceKind = result.evidenceKind || result.kind;
    if (result.recordGradeIssue && !timeChecks.includes(result.recordGradeIssue)) timeChecks.unshift(result.recordGradeIssue);
    if (sourceKind === 'unknown') {
      unknownSchools.add(destination.type === 'UC' ? 'UC' : destination.shortName);
      continue;
    }
    if (destination.type === 'UC') {
      if (ucIncluded) continue;
      ucIncluded = true;
      if (result.yearMismatch) {
        timeChecks.push(`Ask UC to confirm credit for ${context.term}; our UC guide covers ${course.ucYear}.`);
      } else if (sourceKind === 'review') {
        timeChecks.push(`Add the term when you took or will take this class; our UC guide covers ${course.ucYear}.`);
      }
    } else if (sourceKind === 'preliminary') {
      timeChecks.push(`${destination.shortName} must confirm its possible match; its guide gives no year.`);
    }
  }
  const checks = [];
  if (timeChecks.length) checks.push(timeChecks.join(' '));
  if (unknownSchools.size) checks.push(`Credit at ${[...unknownSchools].join(', ')} is still unknown, not rejected.`);
  checks.push('Ask an advisor how it counts toward your degree and whether you’re ready to enroll.');
  return checks;
}
