import { resolveEntryCourse, customCourseSnapshot, customCourseIdentity } from './custom-courses.js';
import { OUSD_SCHOOLS, OUSD_DIRECTORY_SOURCE } from './school-roster.js';

export const HS_MAX_CREDITS_PER_RECORD = 1000; // Input safety bound, not a school credit limit.
export const FINAL_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'P', 'NP', 'I', 'W'];
export function normalizeFinalGrade(value) {
  if (value == null || (typeof value === 'string' && !value.trim())) return '';
  if (typeof value !== 'string' || !FINAL_GRADES.includes(value.trim().toUpperCase())) throw new Error('Choose a supported final grade or leave it blank.');
  return value.trim().toUpperCase();
}
export function classifyFinalGrade(value) {
  const grade = normalizeFinalGrade(value);
  if (!grade) return 'unknown';
  if (grade === 'F' || grade === 'NP') return 'failure';
  if (grade === 'I' || grade === 'W') return 'incomplete';
  return grade === 'P' || /[+-]$/.test(grade) ? 'conditional' : 'letter-pass';
}
export function validateFinalGradeStatus(value, status) {
  if (normalizeFinalGrade(value) && status !== 'completed') throw new Error('A final grade belongs to a completed attempt. Choose Completed or set Final grade to Not recorded.');
}

export const HS_SUBJECTS = [
  ['history-social-studies', 'History and social studies'], ['english', 'English'],
  ['math', 'Mathematics'], ['science', 'Science'], ['world-language', 'World language'],
  ['visual-performing-arts', 'Visual and performing arts'], ['pe', 'Physical education'],
  ['electives', 'Electives'], ['unassigned', 'Needs subject review'],
].map(([id, label]) => ({ id, label }));

export const HIGH_SCHOOL_SOURCES = {
  graduation: { title: 'OUSD high-school graduation requirements', url: 'https://www.ousd.org/high-school-linked-learning-office/for-students-families/hs-graduation-requirements', checkedDate: '2026-10-04', effectiveYear: null },
  graduationPolicy: { title: 'OUSD BP 6146.1: high-school graduation requirements', url: 'https://www.ousd.org/board-of-ed/board-policy/board-policy-preview/~board/board-policies/post/61461-high-school-graduation-requirements-bp', bodyDate: '2020-05-13', checkedDate: '2026-10-04', effectiveYear: null },
  alternativeCredit: { title: 'OUSD BP 6146.11: alternative credits toward graduation', url: 'https://www.ousd.org/board-of-ed/board-policy/board-policy-preview/~board/board-policies/post/614611-alternative-credits-toward-graduation-bp', bodyDate: '2016-01-27', checkedDate: '2026-10-04', effectiveYear: null },
  preapproval: { title: 'OUSD: pre-approval for classes outside the district', url: 'https://www.ousd.org/communications-public-affairs/newsroom/news/~board/ousd-news/post/important-pre-approval-process-for-taking-classes-outside-oakland-unified-and-receiving-district-credit', bodyDate: '2025-11-14', checkedDate: '2026-10-04', effectiveYear: null },
  skyline: { title: 'Skyline: concurrent college enrollment', url: 'https://skyline.ousd.org/academics-programs/concurrent-college-enrollment', checkedDate: '2026-10-04', effectiveYear: null },
  oaklandTech: { title: 'Oakland Technical: dual and concurrent enrollment', url: 'https://oaklandtech.ousd.org/academics/dual-concurrent-enrollment', checkedDate: '2026-10-04', effectiveYear: null },
};

export const OUSD_COMPREHENSIVE_POLICY = {
  id: 'ousd-comprehensive', districtId: 'ousd', title: 'OUSD comprehensive-school baseline',
  totalCredits: 230, minimumGpa: 2, seniorProjectRequired: true, effectiveYear: null,
  subjectRequirements: [
    { subjectId: 'history-social-studies', credits: 30, conditions: ['World history 10, U.S. history 10, government 5 and economics 5.'] },
    { subjectId: 'english', credits: 40, conditions: [] },
    { subjectId: 'math', credits: 30, conditions: ['Includes algebra and geometry; a subject total does not verify these courses.'] },
    { subjectId: 'science', credits: 30, conditions: ['Includes biological and physical science; a subject total does not verify these areas.'] },
    { subjectId: 'world-language', credits: 20, conditions: [] },
    { subjectId: 'visual-performing-arts', credits: 10, conditions: [] },
    { subjectId: 'pe', credits: 20, conditions: [] },
    { subjectId: 'electives', credits: 50, conditions: [] },
  ],
  conditions: [
    'This baseline covers grades 9 through 12. School and graduation-cohort applicability need confirmation.',
    'A passing D can earn course credit; the overall 2.0 GPA requirement remains separate.',
    'The senior project is a separate grade-12 requirement.',
    'External courses need prior approval, and official college transcripts are needed to confirm credit.',
    'Alternative programs have different requirements. This baseline is not a verified 2027 graduation profile.',
  ],
  sources: [HIGH_SCHOOL_SOURCES.graduation, HIGH_SCHOOL_SOURCES.graduationPolicy, HIGH_SCHOOL_SOURCES.alternativeCredit, HIGH_SCHOOL_SOURCES.preapproval],
};

export const HS_SCHOOL_POLICIES = {
  skyline: { title: 'Skyline college-course review', source: HIGH_SCHOOL_SOURCES.skyline, conditions: ['External concurrent enrollment is generally enrichment; principal approval is needed to apply it toward graduation.', 'District dual-enrollment credit is posted after completion.'] },
  'oakland-tech': { title: 'Oakland Technical college-course review', source: HIGH_SCHOOL_SOURCES.oaklandTech, conditions: ['Published school policy limits college-course credit to electives and does not allow replacing existing high-school courses.'] },
};

const subjectIds = new Set(HS_SUBJECTS.map(subject => subject.id));
const schoolIds = new Set(['unknown', 'other', ...OUSD_SCHOOLS.map(school => school.id)]);
const oneOf = (value, options, fallback) => options.includes(value) ? value : fallback;
const text = (value, max = 1500) => typeof value === 'string' ? value.slice(0, max) : '';
const gradeLevels = ['unknown', '9', '10', '11', '12', 'other'];

/** Optional state.highSchool = { profile, courses:[], allocations:[] }.
 * Course: {id,title,subjectId,credits:number|null,status,result,creditAward,provenance,
 *          courseType:'standard'|'ap'|'ib',gradeLevel,finalGrade,term,note}.
 * Allocation: {id,collegeEntryId,linkedCourseId,linkedTerm,subjectId,credits,status:'pending'|'approved',result,
 *              creditAward,provenance,enrollmentType,preapproval,transcript,
 *              schoolApproval,principalApproval,gradeLevel,note}.
 * creditAward is 'unconfirmed'|'earned'; provenance is a recorded claim, not authenticated.
 * Missing grades, subject choices, awards and approvals never become passed conditions.
 */
export function emptyHighSchoolProfile() {
  return { districtId: null, districtName: '', schoolId: 'unknown', schoolName: '', graduationYear: '', policyId: null,
    policyConfirmed: false, gpa: '', seniorProject: 'unknown', manualCreditTarget: null, requirementsNote: '', requirementsSourceUrl: '' };
}

export function normalizeHighSchoolProfile(value = {}) {
  const profile = value && typeof value === 'object' ? value : {};
  const gpa = typeof profile.gpa === 'number' ? String(profile.gpa) : text(profile.gpa, 20).trim();
  const districtId = oneOf(profile.districtId, ['ousd', 'other'], null);
  const schoolId = schoolIds.has(profile.schoolId) ? profile.schoolId : 'unknown';
  const school = districtId === 'ousd' ? OUSD_SCHOOLS.find(school => school.id === schoolId) : null;
  const requirementsSourceUrl = text(profile.requirementsSourceUrl, 2000).trim();
  if (requirementsSourceUrl) {
    let valid = false;
    try { valid = new URL(requirementsSourceUrl).protocol === 'https:'; } catch {}
    if (!valid) throw new Error('Use an https:// requirement-source link, or leave it blank.');
  }
  return {
    districtId,
    districtName: text(profile.districtName, 160),
    schoolId,
    schoolName: school?.name || text(profile.schoolName, 160),
    graduationYear: /^20\d{2}$/.test(String(profile.graduationYear || '')) ? String(profile.graduationYear) : '',
    policyId: oneOf(profile.policyId, ['ousd-comprehensive', 'other-program'], null),
    policyConfirmed: districtId === 'ousd' && profile.policyConfirmed === true && school?.program !== 'review-required',
    manualCreditTarget: normalizeCredits(profile.manualCreditTarget),
    requirementsNote: text(profile.requirementsNote, 2000),
    requirementsSourceUrl,
    gpa: gpa !== '' && Number.isFinite(Number(gpa)) && Number(gpa) >= 0 && Number(gpa) <= 5 ? gpa : '',
    seniorProject: oneOf(profile.seniorProject, ['unknown', 'complete', 'in-progress'], 'unknown'),
  };
}

/** Updates a profile without transferring a prior policy confirmation to a new context.
 * The caller must also reset allocation approvals and workflow checkpoints on school changes.
 */
export function updateHighSchoolProfile(existing, raw) {
  const before = normalizeHighSchoolProfile(existing);
  const next = normalizeHighSchoolProfile({ ...before, ...(raw && typeof raw === 'object' ? raw : {}) });
  const contextChanged = ['districtId', 'districtName', 'schoolId', 'schoolName', 'policyId', 'graduationYear', 'manualCreditTarget', 'requirementsNote', 'requirementsSourceUrl'].some(key => before[key] !== next[key]);
  if (contextChanged) next.policyConfirmed = false;
  return next;
}

function normalizeCredits(value) {
  if (value == null || value === '') return null;
  if ((typeof value !== 'number' && typeof value !== 'string') || !String(value).trim()) throw new Error('High-school credits must be a finite number.');
  const credits = Number(value);
  if (!Number.isFinite(credits) || credits < 0 || credits > HS_MAX_CREDITS_PER_RECORD) throw new Error(`High-school credits must be between 0 and ${HS_MAX_CREDITS_PER_RECORD}.`);
  return credits;
}
function normalizedRows(values, normalize, label) {
  if (values == null) return [];
  if (!Array.isArray(values)) throw new Error(`${label} must be a list.`);
  const seen = new Set();
  return values.map(row => {
    if (!row || typeof row.id !== 'string' || !row.id.trim() || row.id.length > 200 || seen.has(row.id)) throw new Error(`${label} has an invalid or duplicate record ID.`);
    seen.add(row.id);
    return normalize(row);
  });
}
function awardFields(row) {
  return { subjectId: subjectIds.has(row.subjectId) ? row.subjectId : 'unassigned', credits: normalizeCredits(row.credits),
    result: oneOf(row.result, ['passing', 'not-passing', 'pending'], 'pending'),
    creditAward: oneOf(row.creditAward, ['unconfirmed', 'earned'], 'unconfirmed'),
    provenance: oneOf(row.provenance, ['student-reported', 'school-verified'], 'student-reported'),
    gradeLevel: oneOf(String(row.gradeLevel ?? 'unknown'), gradeLevels, 'unknown'), note: text(row.note) };
}
export function normalizeHighSchoolRecords(values) {
  return normalizedRows(values, row => {
    if (typeof row.title !== 'string' || !row.title.trim()) throw new Error('A high-school record needs a course title.');
    const status = oneOf(row.status, ['completed', 'in-progress', 'planned'], 'planned');
    validateFinalGradeStatus(row.finalGrade, status);
    return { id: row.id, title: text(row.title, 200), ...awardFields(row), finalGrade: normalizeFinalGrade(row.finalGrade),
      status,
      courseType: oneOf(row.courseType, ['standard', 'ap', 'ib'], 'standard'), term: text(row.term, 60) };
  }, 'High-school records');
}
export function normalizeHighSchoolAllocations(values) {
  return normalizedRows(values, row => {
    if (typeof row.collegeEntryId !== 'string' || !row.collegeEntryId.trim() || row.collegeEntryId.length > 200) throw new Error('A high-school allocation needs a valid college-entry ID.');
    return { id: row.id, collegeEntryId: row.collegeEntryId,
      linkedCourseId: text(row.linkedCourseId, 200), linkedTerm: text(row.linkedTerm, 60), linkedCustomCourseKey: text(row.linkedCustomCourseKey, 3000), ...awardFields(row),
      status: oneOf(row.status, ['pending', 'approved'], 'pending'),
      enrollmentType: oneOf(row.enrollmentType, ['unknown', 'district-de', 'external-concurrent'], 'unknown'),
      preapproval: oneOf(row.preapproval, ['unknown', 'approved', 'not-approved'], 'unknown'),
      transcript: oneOf(row.transcript, ['unknown', 'received'], 'unknown'),
      schoolApproval: oneOf(row.schoolApproval, ['unknown', 'confirmed'], 'unknown'),
      principalApproval: oneOf(row.principalApproval, ['unknown', 'approved'], 'unknown') };
  }, 'High-school allocations');
}

export function suggestHighSchoolCredit(collegeUnits, unitSystem) {
  const units = (typeof collegeUnits === 'number' || typeof collegeUnits === 'string') && String(collegeUnits).trim() ? Number(collegeUnits) : NaN;
  const available = unitSystem === 'semester' && Number.isFinite(units) && units >= 0 && units <= HS_MAX_CREDITS_PER_RECORD;
  return { credits: available ? Math.round(units * 3.3) : null, kind: available ? 'policy-estimate' : 'unavailable', awarded: false,
    label: available ? 'Policy estimate only, not awarded credit' : 'No conversion verified',
    note: available ? 'OUSD general policy uses semester units × 3.3, rounded to the nearest whole high-school credit. School subject approval and official transcript review still determine any award.' : 'Only the published semester-unit formula is supported. Enter valid semester units or ask the school; quarter units are not converted.',
    source: HIGH_SCHOOL_SOURCES.alternativeCredit };
}

const emptyTotals = () => ({ verifiedEarned: 0, reportedEarned: 0, inProgress: 0, planned: 0, pendingReview: 0, notEarned: 0 });
const bucket = { 'verified-earned': 'verifiedEarned', 'reported-earned': 'reportedEarned', 'in-progress': 'inProgress', planned: 'planned', 'pending-review': 'pendingReview', 'not-earned': 'notEarned' };
const rounded = number => Math.round(number * 1000000) / 1000000;
function countsBy(values, key) {
  const counts = new Map();
  for (const value of values) { const id = key(value); if (id != null) counts.set(id, (counts.get(id) || 0) + 1); }
  return counts;
}
function academicIdentity(entry) {
  if (resolveEntryCourse(entry)?.custom) {
    const identity = customCourseIdentity(entry);
    return identity ? `custom:${identity}` : null;
  }
  return entry && typeof entry.courseId === 'string' && typeof entry.term === 'string' && entry.term.trim() ? JSON.stringify([entry.courseId, entry.term]) : null;
}
function hsIdentity(row) {
  return row.title.trim() && row.term.trim() ? JSON.stringify([row.title.trim().replace(/\s+/g, ' ').toLowerCase(), row.term.trim().toLowerCase()]) : null;
}
function finalGradeRestriction(value) {
  const grade = normalizeFinalGrade(value);
  const classification = classifyFinalGrade(grade);
  if (classification === 'failure') return { classification: 'not-earned', reasons: [`The recorded ${grade} grade does not support earned credit.`] };
  if (classification === 'incomplete') return { classification: 'pending-review', reasons: [`The recorded ${grade} grade does not establish completed, passing coursework. Ask the school to review this award.`] };
  // Plus/minus letter grades use the explicit passing and earned award checks below.
  // Receiving-college grade policy review is handled separately by the transfer rules.
  if (grade === 'P') return { classification: 'pending-review', reasons: [`The school must confirm how the recorded ${grade} grade meets its grade and credit rules.`] };
  return null;
}
function earnedClassification(row, recordStatus, checks = [], ousdScope = false) {
  const reasons = [];
  if (ousdScope && row.gradeLevel === 'other') return { classification: 'excluded', reasons: ['This baseline covers grades 9 through 12; this record is outside that scope.'] };
  if (recordStatus === 'planned' || recordStatus === 'in-progress') return { classification: recordStatus, reasons: ['This course is not completed. These credits are not earned.'] };
  const gradeRestriction = finalGradeRestriction(row.finalGrade);
  if (gradeRestriction) return gradeRestriction;
  if (row.credits == null) return { classification: 'pending-review', reasons: ['The high-school credit amount has not been recorded.'] };
  if (row.result === 'not-passing') return { classification: 'not-earned', reasons: ['A non-passing result does not establish earned credit.'] };
  if (row.result !== 'passing') reasons.push('A passing result has not been recorded.');
  if (row.creditAward !== 'earned') reasons.push('An earned credit award has not been explicitly recorded.');
  if (reasons.length) return { classification: 'pending-review', reasons };
  if (row.provenance === 'student-reported') return { classification: 'reported-earned', reasons: ['This earned-credit claim is student-reported and remains unverified.', ...checks, ...(ousdScope && row.gradeLevel === 'unknown' ? ['Grade 9-12 applicability needs confirmation.'] : [])] };
  if (ousdScope && row.gradeLevel === 'unknown') checks.push('Grade 9-12 applicability needs confirmation.');
  return checks.length ? { classification: 'pending-review', reasons: checks } : { classification: 'verified-earned', reasons: ['School-verified earned credit, as recorded. This app does not authenticate school records.'] };
}

/** All totals are HIGH-SCHOOL credits only. College units are never added or converted here.
 * Subject applied amounts are capped; total earned credits remain uncapped and separate.
 * Missing policy returns null requirements. Even confirmed policy is a planning comparison,
 * not a graduation/eligibility decision. Duplicate or removed links are excluded, never repaired.
 */
export function graduationProgress(state) {
  const hs = state?.highSchool || {};
  const profile = normalizeHighSchoolProfile(hs.profile);
  const records = normalizeHighSchoolRecords(hs.courses);
  const allocations = normalizeHighSchoolAllocations(hs.allocations);
  const entries = Array.isArray(state?.entries) ? state.entries : [];
  const ousdScope = profile.districtId === 'ousd';
  const school = ousdScope ? OUSD_SCHOOLS.find(school => school.id === profile.schoolId) || null : null;
  const schoolReviewRequired = school?.program === 'review-required';
  const policy = profile.districtId === 'ousd' && profile.policyId === 'ousd-comprehensive' && !schoolReviewRequired ? OUSD_COMPREHENSIVE_POLICY : null;
  const manualTarget = !ousdScope ? profile.manualCreditTarget : null;
  const requirementKind = policy ? 'policy' : manualTarget != null ? 'manual-target' : 'unknown';
  const policyStatus = !policy ? manualTarget != null ? 'manual-target' : 'not-selected' : profile.policyConfirmed ? 'confirmed-for-planning' : 'baseline-only';
  const entryCounts = countsBy(entries, entry => entry?.id);
  const identityCounts = countsBy(entries, academicIdentity);
  const allocationCounts = countsBy(allocations, allocation => allocation.collegeEntryId);
  const hsCounts = countsBy(records, hsIdentity);
  const issues = [];
  const issue = (code, row, message) => { issues.push({ code, recordId: row.id, message }); return { classification: 'excluded', reasons: [message] }; };
  const courses = records.map(row => ({ ...row, origin: 'high-school', recordStatus: row.status, linkedEntry: null,
    ...(hsIdentity(row) && hsCounts.get(hsIdentity(row)) > 1
      ? issue('duplicate-high-school-record', row, 'Multiple records have the same title and term. Confirm distinct coursework before counting either record.')
      : earnedClassification(row, row.status, [], ousdScope)) }));
  const linked = allocations.map(row => {
    const entry = entries.find(entry => entry?.id === row.collegeEntryId);
    const sourceCourse = resolveEntryCourse(entry);
    const gradedRow = { ...row, finalGrade: normalizeFinalGrade(entry?.finalGrade) };
    const derived = { ...gradedRow, origin: 'college', recordStatus: entry?.status || 'unknown',
      linkedEntry: entry ? { id: entry.id, courseId: entry.courseId, status: entry.status, term: entry.term, finalGrade: gradedRow.finalGrade, ...(entry.customCourse ? { customCourse: { ...entry.customCourse } } : {}) } : null };
    if (!entry) return { ...derived, ...issue('missing-college-link', row, 'The linked college course is missing. This allocation is not counted.') };
    if (!sourceCourse || !['completed', 'in-progress', 'planned'].includes(entry.status)) return { ...derived, ...issue('invalid-college-link', row, 'The linked college course or status is not recognized. Review it before counting credit.') };
    if (entryCounts.get(entry.id) > 1 || identityCounts.get(academicIdentity(entry)) > 1 || allocationCounts.get(row.collegeEntryId) > 1) return { ...derived, ...issue('duplicate-college-allocation', row, 'This college course has duplicate records or allocations. Resolve them before counting any linked high-school credit.') };
    if (!row.linkedCourseId || !row.linkedTerm || row.linkedCourseId !== entry.courseId || row.linkedTerm !== entry.term) {
      const message = !row.linkedCourseId || !row.linkedTerm
        ? 'The course number and term covered by this allocation have not been confirmed. Review and save the allocation before counting credit.'
        : 'The linked college course or term changed after this allocation was recorded. Reconfirm the award for the updated course and term.';
      issues.push({ code: 'changed-college-link', recordId: row.id, message });
      return { ...derived, classification: 'pending-review', reasons: [message] };
    }
    if (sourceCourse.custom && (!row.linkedCustomCourseKey || row.linkedCustomCourseKey !== customCourseSnapshot(entry))) {
      const message = 'The student-entered course details are new or changed. Review and save this school-credit connection for the current college, course, and units.';
      issues.push({ code: 'changed-custom-course-link', recordId: row.id, message });
      return { ...derived, classification: 'pending-review', reasons: [message] };
    }
    if (entry.status !== 'completed') return { ...derived, ...earnedClassification(gradedRow, entry.status, [], ousdScope) };
    const gradeRestriction = finalGradeRestriction(gradedRow.finalGrade);
    if (gradeRestriction) return { ...derived, ...gradeRestriction };
    if (row.status !== 'approved') return { ...derived, classification: 'pending-review', reasons: ['School approval of this credit allocation has not been recorded.'] };
    const checks = [];
    if (row.schoolApproval !== 'confirmed') checks.push('School review of the graduation-credit award needs confirmation.');
    if (row.transcript !== 'received') checks.push('Receipt of the official college transcript needs confirmation.');
    if (ousdScope && row.enrollmentType === 'unknown') checks.push('Confirm whether this was district dual enrollment or external concurrent enrollment.');
    if (ousdScope && row.enrollmentType === 'external-concurrent' && row.preapproval !== 'approved') checks.push('External concurrent enrollment needs confirmed prior approval.');
    if (ousdScope && profile.schoolId === 'skyline' && row.enrollmentType === 'external-concurrent' && row.principalApproval !== 'approved') checks.push('Skyline external concurrent enrollment needs principal approval for graduation credit.');
    const restrictedSubject = ousdScope && profile.schoolId === 'oakland-tech' && row.subjectId !== 'electives';
    if (restrictedSubject) checks.push('Oakland Technical limits college coursework to electives. Resolve this non-elective allocation with the school.');
    // Known policy conflicts remain pending even if an earned award was reported.
    if (restrictedSubject || (ousdScope && row.enrollmentType === 'external-concurrent' && row.preapproval === 'not-approved')) return { ...derived, classification: 'pending-review', reasons: checks };
    return { ...derived, ...earnedClassification(gradedRow, entry.status, checks, ousdScope) };
  });
  const rows = [...courses, ...linked];
  function sumRows(selected) {
    const totals = emptyTotals();
    for (const row of selected) if (bucket[row.classification] && row.credits != null) totals[bucket[row.classification]] += row.credits;
    return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, rounded(value)]));
  }
  const totals = sumRows(rows);
  const subjects = HS_SUBJECTS.map(subject => {
    const requirement = policy?.subjectRequirements.find(requirement => requirement.subjectId === subject.id);
    const required = requirement?.credits ?? null;
    const earned = sumRows(rows.filter(row => row.subjectId === subject.id));
    return { ...subject, required, conditions: requirement?.conditions || [], ...earned,
      appliedVerified: required == null ? null : Math.min(required, earned.verifiedEarned),
      appliedWithReported: required == null ? null : Math.min(required, earned.verifiedEarned + earned.reportedEarned),
      remainingVerified: required == null ? null : Math.max(0, rounded(required - earned.verifiedEarned)),
      remainingWithReported: required == null ? null : Math.max(0, rounded(required - earned.verifiedEarned - earned.reportedEarned)) };
  });
  const required = policy?.totalCredits ?? manualTarget;
  const gpaValue = profile.gpa === '' ? null : Number(profile.gpa);
  const policyGaps = [
    'This is a planning comparison. The school determines graduation eligibility and authenticates awards.',
    ousdScope ? 'Diploma credit is separate from UC A-G admission subjects and from college unit, GE or major credit.' : 'High-school graduation, university admission requirements, and college credit are separate reviews.',
    'Subject totals do not verify required course sequences, individual course approvals or GPA calculation.',
  ];
  if (ousdScope) {
    if (schoolReviewRequired) policyGaps.push(`${school.name} needs its own reviewed graduation requirements. No numeric graduation baseline is applied.`);
    else if (!policy) policyGaps.push('No OUSD graduation baseline is selected. Programs need their own reviewed requirements.');
    else if (!profile.policyConfirmed) policyGaps.push('The comprehensive-school baseline has not been confirmed for this student.');
    if (profile.policyId === 'other-program') policyGaps.push('Alternative-program requirements, including Rudsdale’s separate credit and portfolio route, are not implemented.');
    policyGaps.push('The district page is undated and the linked handout is 2023-24. No certified 2027 requirement profile was verified.');
  } else if (manualTarget != null) policyGaps.push('The total credit target is student-entered. It does not verify subject requirements, GPA, projects, or any other graduation condition.');
  else policyGaps.push('No graduation credit target is recorded. You can still record school classes and earned credits without a target.');
  if (profile.schoolId === 'unknown' || (!ousdScope && !profile.schoolName.trim())) policyGaps.push('The student’s school and school-specific credit rules are not confirmed.');
  if (!profile.graduationYear) policyGaps.push('The graduation cohort has not been recorded.');
  return { profile, policy, policyStatus, requirementKind, comparisonOnly: true, totals, courses, allocations: linked, subjects, issues, policyGaps,
    schoolPolicy: ousdScope ? HS_SCHOOL_POLICIES[profile.schoolId] || (schoolReviewRequired ? {
      title: `${school.name}: program review`,
      source: { title: `${school.name}: OUSD directory entry`, url: school.sourceUrl, checkedDate: OUSD_DIRECTORY_SOURCE.checkedDate, effectiveYear: null },
      conditions: ['This program needs its own reviewed graduation requirements. The comprehensive-school baseline is not applied.'],
    } : null) : null,
    totalRequirement: { required, verifiedApplied: required == null ? null : Math.min(required, totals.verifiedEarned),
      reportedAndVerifiedApplied: required == null ? null : Math.min(required, totals.verifiedEarned + totals.reportedEarned),
      remainingVerified: required == null ? null : Math.max(0, rounded(required - totals.verifiedEarned)),
      remainingWithReported: required == null ? null : Math.max(0, rounded(required - totals.verifiedEarned - totals.reportedEarned)) },
    gpa: { value: gpaValue, minimum: policy?.minimumGpa ?? null, status: gpaValue == null ? 'not-recorded' : !policy ? 'policy-unknown' : gpaValue < policy.minimumGpa ? 'below-baseline' : 'at-or-above-baseline' },
    seniorProject: { status: profile.seniorProject, required: policy?.seniorProjectRequired ?? null },
  };
}
