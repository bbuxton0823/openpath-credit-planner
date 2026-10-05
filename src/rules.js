import { COLLEGES, COURSES, DESTINATIONS, SOURCES } from './catalog.js';
import { classifyFinalGrade, normalizeFinalGrade } from './course-record.js';
import { resolveCourse, resolveEntryCourse, customCourseIdentity } from './custom-courses.js';

const courseById = new Map(COURSES.map((course) => [course.id, course]));
const collegeById = new Map(COLLEGES.map((college) => [college.id, college]));
const destinationById = new Map(DESTINATIONS.map((destination) => [destination.id, destination]));
const REQUIREMENT_UNKNOWN = 'Campus GE and major applicability have not been verified.';

/** Planning convention: fall starts the academic year; spring/summer end it. */
export function academicYear(term) {
  const match = /^(Fall|Winter|Spring|Summer)\s+(\d{4})$/i.exec(String(term || '').trim());
  if (!match) return null;
  const year = Number(match[2]) - (match[1].toLowerCase() === 'fall' ? 0 : 1);
  return `${year}-${String(year + 1).slice(-2)}`;
}

function compareCourseEvidence(courseOrId, destinationOrId, entry = {}) {
  const course = typeof courseOrId === 'string' ? resolveCourse(courseOrId, [entry]) : courseOrId?.courseId ? resolveEntryCourse(courseOrId) : courseOrId;
  const destination = typeof destinationOrId === 'string' ? destinationById.get(destinationOrId) : destinationOrId;
  const fallback = {
    kind: 'unknown', label: 'No verified match', unitsText: 'Award not verified',
    equivalentText: 'No verified equivalent', requirementText: REQUIREMENT_UNKNOWN,
    yearText: 'Effective academic year not verified', applicantText: 'First-year dual-enrollment route; individual review needed.',
    notes: ['Missing evidence is an open question, not a decision to reject credit.'], sources: [], yearMismatch: false,
  };
  if (!course || !destination) return fallback;
  if (course.custom) return { ...fallback, label: 'Needs transfer review', notes: [
    'This is a student-entered college class outside the researched catalog. No course, title or college-name similarity establishes transferable credit.',
    ...fallback.notes, destination.policyNote,
  ], sources: [{ title: `${destination.name}: published policy and evaluation route`, url: destination.policyUrl }] };

  const college = collegeById.get(course.collegeId);
  const termYear = academicYear(entry.term);
  if (destination.type === 'UC' && course.ucYear) {
    const yearMismatch = Boolean(termYear && termYear !== course.ucYear);
    return {
      kind: yearMismatch || !termYear ? 'review' : 'published',
      label: yearMismatch ? 'Evidence year differs' : !termYear ? 'Course term needed' : 'Published unit credit',
      unitsText: `${course.ucUnits} UC semester units in the published agreement`,
      equivalentText: 'UC systemwide transferable units; no campus course equivalent verified',
      requirementText: REQUIREMENT_UNKNOWN,
      yearText: `Source: ${course.ucYear}${termYear ? ` · Course: ${termYear}` : ' · Course year not provided'}`,
      applicantText: 'First-year dual enrollment. Transferable credit can count toward degree units; it does not establish admission or campus requirements.',
      notes: [
        'The same UC systemwide unit-credit evidence applies across the nine campuses. These are not nine independently verified campus GE matches.',
        ...(yearMismatch ? [`Your course falls in ${termYear}. Verify the agreement for that year before relying on ${course.ucYear} evidence.`] : []),
        ...(!termYear ? ['Add a course term so its academic year can be compared with the evidence year.'] : []),
        'The 2026-27 selection returned 2025-26 during research; no 2026-27 agreement was verified.',
        'Grade eligibility, repeat limits and individual transcript evaluation remain to be checked. UC-E, UC-M and Cal-GETC labels alone do not establish first-year campus GE completion.',
        ...(course.ucNote ? [course.ucNote] : []),
      ],
      sources: [{ title: `${college.name}: ASSIST 2025-26 UC Transfer Course Agreement`, url: college.assistUrl }, SOURCES.ucDualEnrollment, SOURCES.ucFirstYear],
      yearMismatch,
    };
  }
  if (destination.id === 'ncat' && course.ncat) {
    const equivalents = course.ncat.equivalents;
    return {
      kind: 'preliminary', label: 'Preliminary equivalent',
      unitsText: equivalents.map((equivalent) => `${equivalent.units} credits displayed`).filter((value, index, all) => all.indexOf(value) === index).join(' OR '),
      equivalentText: equivalents.map((equivalent) => `${equivalent.code} · ${equivalent.title}`).join(' OR '),
      requirementText: REQUIREMENT_UNKNOWN,
      yearText: 'The database does not display an effective academic year',
      applicantText: 'First-year dual enrollment. Final individual evaluation follows acceptance.',
      notes: [
        'The public database is preliminary and unofficial. A published equivalent is not a final award or proof of major/GE fulfillment.',
        course.ncat.note,
        'Grade eligibility and applicability to your course term remain unverified.',
        ...(course.historical ? [course.catalogNote] : []),
      ],
      sources: [SOURCES.ncatDatabase, SOURCES.ncatFaq, SOURCES.ncatCredits], yearMismatch: false,
    };
  }
  return {
    ...fallback,
    notes: [
      ...fallback.notes, destination.policyNote,
      ...(destination.id === 'ncat' && ['ENGL C1000', 'STAT C1000', 'PSYC C1000', 'ENGL C1000E'].includes(course.code)
        ? ['Matches for historical ENGL 1A, MATH 13 or PSYCH 1A cannot be carried onto this course without an explicit verified numbering bridge.'] : []),
      ...(course.historical ? [course.catalogNote] : []),
    ],
    sources: [{ title: `${destination.name}: published policy and evaluation route`, url: destination.policyUrl }],
  };
}

/** Source facts remain visible; a student-entered grade never becomes an individual award. */
export function compareCourse(courseOrId, destinationOrId, entry = {}) {
  if (courseOrId?.courseId && !Object.keys(entry).length) entry = courseOrId;
  const result = compareCourseEvidence(courseOrId, destinationOrId, entry);
  const grade = normalizeFinalGrade(entry.finalGrade);
  // A plain D is a high-school letter pass, but it sits below the C threshold many
  // receiving colleges use, so it gets the same policy review as D+ and D-.
  const classification = grade === 'D' ? 'conditional' : classifyFinalGrade(grade);
  if (!['failure', 'incomplete', 'conditional'].includes(classification)) return result;
  const recordGradeIssue = classification === 'failure'
    ? `Recorded final grade ${grade}: this failed attempt is not earned credit. Ask the receiving school to review its policy.`
    : classification === 'incomplete'
      ? `Recorded grade ${grade}: completion and any credit need school review.`
      : `Recorded final grade ${grade}: the receiving school must confirm its grade threshold or pass-grade policy.`;
  return { ...result, kind: 'review', evidenceKind: result.kind, evidenceLabel: result.label,
    label: classification === 'failure' ? `Recorded ${grade}: failed attempt` : `Recorded ${grade}: grade policy review`,
    unitsText: classification === 'failure' ? 'No earned credit established for this failed attempt' : 'Individual credit award not verified',
    recordGradeIssue, notes: [recordGradeIssue, `Source unit information: ${result.unitsText}. This is not this student’s award.`, ...result.notes] };
}

export function totals(entries = []) {
  const result = { completed: 0, inProgress: 0, planned: 0, unknownByStatus: { completed: 0, inProgress: 0, planned: 0 } };
  const keys = { completed: 'completed', 'in-progress': 'inProgress', planned: 'planned' };
  for (const entry of entries) {
    const key = keys[entry.status];
    const course = resolveEntryCourse(entry);
    if (!key || !course) continue;
    if (course.custom && course.unitSystem === 'unknown') {
      result.unclassifiedByStatus ||= { completed: 0, inProgress: 0, planned: 0 };
      result.unclassifiedByStatus[key] += 1;
      if (!Number.isFinite(course.units)) result.unknownByStatus[key] += 1;
      continue;
    }
    if (course.unitSystem === 'quarter') {
      result.quarterByStatus ||= { completed: 0, inProgress: 0, planned: 0 };
      if (Number.isFinite(course.units)) result.quarterByStatus[key] += course.units;
      else result.unknownByStatus[key] += 1;
      continue;
    }
    if (Number.isFinite(course.units)) result[key] += course.units;
    else result.unknownByStatus[key] += 1;
  }
  // Custom units can be decimals; keep binary float noise (0.1 + 0.2) out of the UI and exports.
  const round = value => Math.round(value * 100) / 100;
  for (const key of ['completed', 'inProgress', 'planned']) {
    result[key] = round(result[key]);
    if (result.quarterByStatus) result.quarterByStatus[key] = round(result.quarterByStatus[key]);
  }
  return result;
}

/** Warnings concern published limits, never an inferred final credit award. */
export function duplicateWarnings(entries = []) {
  const warnings = [];
  const customGroups = new Map();
  for (const entry of entries) {
    const identity = customCourseIdentity(entry);
    if (identity) customGroups.set(identity, [...(customGroups.get(identity) || []), entry]);
  }
  for (const group of customGroups.values()) if (group.length > 1) {
    const course = resolveEntryCourse(group[0]);
    warnings.push(`${course.collegeName}: ${course.code} has multiple manually entered records for ${group[0].term}. Review this possible duplicate; no equivalency or extra credit is inferred.`);
  }
  const grouped = new Map();
  for (const entry of entries) {
    const course = courseById.get(entry.courseId);
    if (!course) continue;
    const key = `${course.collegeId}:${course.family}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(course);
  }
  for (const courses of grouped.values()) {
    const course = courses[0];
    const college = collegeById.get(course.collegeId);
    if (courses.length > 1) {
      const codes = [...new Set(courses.map((item) => item.code))];
      if (course.family === 'engl-c1000' && ['laney', 'merritt'].includes(course.collegeId) && codes.includes('ENGL C1000E')) {
        warnings.push(`${college.name}: ENGL C1000 and ENGL C1000E duplicate UC credit. Count at most 4 UC units for this group, subject to year and individual review. Local-unit totals below still show the recorded courses.`);
      } else {
        warnings.push(`${college.name}: ${codes.join(' / ')} appears more than once. Review repeated credit before counting an award; local-unit totals include every recorded entry.`);
      }
    }
    if (courses.some((item) => item.code === 'ENGL C1000E')) {
      warnings.push(`${college.name}: ENGL C1000E carries 5 local units, but the 2025-26 UC agreement caps it at 4 UC units.`);
    }
    if (course.collegeId === 'alameda' && course.code === 'STAT C1000') {
      warnings.push('College of Alameda: STAT C1000 and SOCSC 125 receive UC credit for only one. Check any SOCSC 125 coursework outside this prototype catalog.');
    }
  }
  return [...new Set(warnings)];
}

export function suggestCourses(state) {
  const profile = state?.profile || {};
  const targetIds = new Set(profile.destinationIds || []);
  const targets = DESTINATIONS.filter((destination) => targetIds.has(destination.id));
  const colleges = new Set(profile.collegeIds || []);
  const entries = state?.entries || [];
  const existingIds = new Set(entries.map((entry) => entry.courseId));
  // This is a repetition filter for planning, not a credit-equivalency bridge.
  const existingFamilies = new Set(entries.map((entry) => courseById.get(entry.courseId)?.family).filter(Boolean));
  const hasUc = targets.some((destination) => destination.type === 'UC');
  const hasNcat = targetIds.has('ncat');
  const planningYear = academicYear(profile.planningTerm);

  return COURSES.filter((course) => course.suggestionEligible && colleges.has(course.collegeId)
    && !existingIds.has(course.id) && !existingFamilies.has(course.family))
    .map((course) => {
      const evidenceGroups = [];
      if (hasUc && course.ucYear) evidenceGroups.push('UC systemwide units');
      if (hasNcat && course.ncat) evidenceGroups.push('N.C. A&T preliminary equivalent');
      const unknownTargets = targets.filter((destination) => destination.type !== 'UC' && !(destination.id === 'ncat' && course.ncat));
      const parts = [];
      if (hasUc) parts.push(`Published ${course.ucYear} UC systemwide unit evidence, counted once across selected UC campuses`);
      if (hasNcat && course.ncat) parts.push('an exact source-code preliminary N.C. A&T equivalent');
      return {
        course,
        reason: `${parts.join('; ')}.${unknownTargets.length ? ' Other selected destinations need course-level review; missing evidence is not a rejection.' : ''}`,
        evidenceGroups,
        reviewText: [
          'Planning candidate only. Verify prerequisites, course availability and grade eligibility before enrolling.',
          hasUc && planningYear !== course.ucYear ? `Verify ${planningYear || 'your planned academic year'} against the ${course.ucYear} UC source.` : '',
          hasNcat && course.ncat ? 'N.C. A&T has no effective source year and needs individual review.' : '',
          'Campus GE and major applicability remain unverified.',
        ].filter(Boolean).join(' '),
      };
    })
    .filter((candidate) => candidate.evidenceGroups.length > 0)
    .sort((a, b) => b.evidenceGroups.length - a.evidenceGroups.length
      || a.course.title.localeCompare(b.course.title)
      || a.course.collegeId.localeCompare(b.course.collegeId));
}
