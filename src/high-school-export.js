import { COLLEGES } from './catalog.js';
import { graduationProgress, HIGH_SCHOOL_SOURCES } from './high-school.js';

import { resolveEntryCourse } from './custom-courses.js';
const collegeById = new Map(COLLEGES.map(college => [college.id, college]));
const creditStatus = row => `  Derived credit status: ${row.classification}. ${row.reasons.join(' ')}`;

/** Review-copy text uses the same derived credit decisions as the on-screen notebook. */
export function highSchoolSummaryLines(state) {
  const progress = graduationProgress(state);
  const { profile, policy } = progress;
  const ousdScope = profile.districtId === 'ousd';
  const manualTarget = progress.requirementKind === 'manual-target';
  const lines = ['HIGH-SCHOOL CREDIT: SEPARATE FROM COLLEGE UNITS',
    `District: ${profile.districtName || profile.districtId || 'not selected'}. School: ${profile.schoolName || profile.schoolId}. Graduation year: ${profile.graduationYear || 'not confirmed'}.`,
    ousdScope ? `Requirement profile: ${profile.policyId || 'not selected'}. School/cohort applicability confirmed by user: ${profile.policyConfirmed ? 'yes' : 'no'}.` : 'Requirement mode: student-recorded total comparison only. No school policy has been verified.',
    ousdScope ? `GPA entered: ${profile.gpa || 'unknown'}. Senior project: ${profile.seniorProject}.` : 'Subject, GPA, project and other graduation requirements are not established by a total credit target.',
    policy
      ? `OUSD comprehensive baseline: ${policy.totalCredits} HS credits, subject requirements, GPA at least ${policy.minimumGpa.toFixed(1)} and senior project. This is not a certified class-of-2027 policy or a graduation determination.`
      : manualTarget ? `Student-recorded total credit target: ${profile.manualCreditTarget}. This is not a verified school requirement or a graduation determination.` : 'No numeric graduation baseline is applied to the selected school/program. Confirm its requirements with the school.',
    ousdScope ? 'HS diploma, UC A-G admission subjects, and college transferable units/GE/major use are independent reviews. No units are added across these systems.' : 'High-school graduation, university admission requirements, and college credit are independent reviews. No units are added across these systems.',
    'School-verified labels reflect the user-entered record; this local prototype has not authenticated a school transcript.'];
  lines.push(`HS earned: ${progress.totals.verifiedEarned} school-verified as recorded; ${progress.totals.reportedEarned} student-reported. In progress: ${progress.totals.inProgress}; planned: ${progress.totals.planned}; pending review: ${progress.totals.pendingReview}; not earned: ${progress.totals.notEarned}.`,
    `${manualTarget ? 'Student-recorded total target' : 'Selected baseline required'}: ${progress.totalRequirement.required ?? 'unknown'}. Remaining using recorded earned: ${progress.totalRequirement.remainingWithReported ?? 'unknown'}. Remaining using school-verified records only: ${progress.totalRequirement.remainingVerified ?? 'unknown'}.`);
  progress.subjects.forEach(row => lines.push(`  ${row.label}: ${row.verifiedEarned} school-verified, ${row.reportedEarned} reported.${ousdScope ? ` Required ${row.required ?? 'unknown'}; remaining with reported ${row.remainingWithReported ?? 'unknown'}. ${row.conditions.join(' ')}` : ' Recorded subject credits only; no subject target is set.'}`));
  if (!ousdScope && profile.requirementsNote) lines.push(`Student-entered requirement notes: ${profile.requirementsNote}`);
  if (!ousdScope && profile.requirementsSourceUrl) lines.push(`Student-entered source (not verified here): ${profile.requirementsSourceUrl}`);
  lines.push(...progress.policyGaps.map(gap => `Policy review: ${gap}`));
  if (progress.schoolPolicy) lines.push(...progress.schoolPolicy.conditions.map(condition => `School review: ${condition}`));

  for (const row of progress.courses) {
    lines.push(`${row.title} | ${row.term || 'term unknown'} | grade level ${row.gradeLevel} | final grade ${row.finalGrade || 'Not recorded'} (student-entered) | ${row.courseType} | ${row.status} | ${row.credits ?? 'unknown'} HS credits in ${row.subjectId} | saved result ${row.result} | saved award claim ${row.creditAward} | ${row.provenance} | ${row.note || 'No provenance note'}`, creditStatus(row));
  }
  for (const row of progress.allocations) {
    const entry = row.linkedEntry;
    const course = resolveEntryCourse(entry);
    const identity = course ? `${course.code}, ${course.collegeName || collegeById.get(course.collegeId)?.name || 'College unknown'}, ${entry.term}, ${entry.status}${course.custom ? ' (student-entered college course)' : ''}` : 'Missing or unrecognized college record, excluded';
    lines.push(`Linked allocation: ${identity} | final grade ${entry?.finalGrade || 'Not recorded'} (student-entered) | ${row.credits ?? 'unknown'} HS credits in ${row.subjectId} | ${row.enrollmentType} | grade level ${row.gradeLevel} | saved result ${row.result} | saved award claim ${row.creditAward} | ${row.provenance} | approval ${row.status} | school confirmation ${row.schoolApproval} | preapproval ${row.preapproval} | principal ${row.principalApproval} | transcript ${row.transcript} | ${row.note || 'No provenance note'}`,
      creditStatus(row), `  Award record was linked to: ${row.linkedCourseId || 'unconfirmed'}, ${row.linkedTerm || 'term unconfirmed'}.${row.linkedCustomCourseKey ? ' A snapshot of the student-entered course details is also saved.' : ''}`);
  }

  lines.push('HS record does not create college exam credit for ordinary, AP or IB classes.');
  const sources = ousdScope ? [...(policy?.sources || [HIGH_SCHOOL_SOURCES.graduation, HIGH_SCHOOL_SOURCES.alternativeCredit, HIGH_SCHOOL_SOURCES.preapproval]), ...(progress.schoolPolicy?.source ? [progress.schoolPolicy.source] : [])] : [];
  const seen = new Set();
  for (const source of sources) {
    if (seen.has(source.url)) continue;
    seen.add(source.url);
    lines.push(`Source: ${source.title}. Checked ${source.checkedDate}.${source.bodyDate ? ` Source body date: ${source.bodyDate}.` : ''} Effective academic year not verified. ${source.url}`);
  }
  return lines;
}
