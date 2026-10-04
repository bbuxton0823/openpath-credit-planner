import { graduationProgress, normalizeFinalGrade, classifyFinalGrade } from './high-school.js';
import { resolveEntryCourse, customCourseSnapshot } from './custom-courses.js';

export { FINAL_GRADES, normalizeFinalGrade, classifyFinalGrade, validateFinalGradeStatus } from './high-school.js';

const text = (value, limit) => typeof value === 'string' ? value.slice(0, limit) : '';

/** Locally recorded workflow checkpoints. Course/term snapshots never authenticate approval.
 * Posting has no saved checkbox: it is derived from the linked high-school credit award.
 */
export function normalizeCourseWorkflow(value) {
  const workflow = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    approvalSignatures: workflow.approvalSignatures === 'recorded' ? 'recorded' : 'unknown',
    requiredSignaturesNote: text(workflow.requiredSignaturesNote, 1500),
    scheduleConfirmed: workflow.scheduleConfirmed === true,
    linkedCourseId: text(workflow.linkedCourseId, 200),
    linkedTerm: text(workflow.linkedTerm, 60),
    linkedStatus: ['planned', 'in-progress', 'completed'].includes(workflow.linkedStatus) ? workflow.linkedStatus : '',
    ...(workflow.linkedCustomCourseKey !== undefined ? { linkedCustomCourseKey: text(workflow.linkedCustomCourseKey, 1500) } : {}),
  };
}

export function courseWorkflow(state, entry) {
  const progress = graduationProgress(state);
  const workflow = normalizeCourseWorkflow(entry?.workflow);
  const entries = Array.isArray(state?.entries) ? state.entries : [];
  const matchingEntries = entries.filter(saved => saved?.id === entry?.id);
  const sourceCourse = resolveEntryCourse(entry);
  const customKey = customCourseSnapshot(entry);
  const current = matchingEntries.length === 1 && sourceCourse
    && ['planned', 'in-progress', 'completed'].includes(entry?.status)
    && matchingEntries[0].courseId === entry.courseId && matchingEntries[0].term === entry.term
    && matchingEntries[0].status === entry.status && customCourseSnapshot(matchingEntries[0]) === customKey;
  const snapshotCurrent = Boolean(current && entry.term?.trim() && workflow.linkedCourseId === entry.courseId
    && workflow.linkedTerm === entry.term && workflow.linkedStatus === entry.status
    && (!sourceCourse?.custom || workflow.linkedCustomCourseKey === customKey));
  const allocations = progress.allocations.filter(row => row.collegeEntryId === entry?.id);
  const allocation = allocations.length === 1 ? allocations[0] : null;
  const allocationCurrent = Boolean(allocation && allocation.classification !== 'excluded'
    && allocation.linkedCourseId === entry?.courseId && allocation.linkedTerm === entry?.term
    && (!sourceCourse?.custom || allocation.linkedCustomCourseKey === customKey));
  const schoolId = progress.profile.schoolId;
  const knownSchool = schoolId !== 'unknown' && (schoolId !== 'other' || Boolean(progress.profile.schoolName.trim()));
  const ousd = progress.profile.districtId === 'ousd';
  const routeApproved = !ousd || allocation?.enrollmentType === 'district-de'
    || (allocation?.enrollmentType === 'external-concurrent' && allocation.preapproval === 'approved'
      && (schoolId !== 'skyline' || allocation.principalApproval === 'approved'));
  const subjectAllowed = !ousd || schoolId !== 'oakland-tech' || allocation?.subjectId === 'electives';
  const approvalDone = Boolean(snapshotCurrent && allocationCurrent && knownSchool && subjectAllowed && routeApproved
    && workflow.approvalSignatures === 'recorded' && allocation.status === 'approved' && allocation.schoolApproval === 'confirmed');
  const scheduleDone = Boolean(snapshotCurrent && workflow.scheduleConfirmed && entry.status !== 'planned');
  const grade = normalizeFinalGrade(entry?.finalGrade);
  const gradeClass = classifyFinalGrade(grade);
  const gradeDone = Boolean(snapshotCurrent && entry.status === 'completed' && grade);
  const postingDone = Boolean(snapshotCurrent && allocationCurrent && allocation.classification === 'verified-earned'
    && allocation.transcript === 'received' && allocation.schoolApproval === 'confirmed');
  let gradeDetail = 'Record the final grade after the course is completed. A grade alone does not award credit.';
  if (gradeDone) {
    gradeDetail = gradeClass === 'failure' ? `Final grade ${grade} is recorded. It does not support earned high-school credit.`
      : gradeClass === 'incomplete' ? `Grade ${grade} is recorded. The school must review completion and any credit.`
        : gradeClass === 'conditional' || /[+-]$/.test(grade) ? `Final grade ${grade} is recorded. The school must confirm its grade and credit rules.`
          : `Final grade ${grade} is recorded. The school still determines any credit award.`;
  }
  const steps = [
    { id: 'approval', title: 'Record school approval', done: approvalDone,
      detail: approvalDone ? 'Required signatures and the applicable school approvals are recorded locally. This app does not authenticate them.'
        : !snapshotCurrent ? 'Confirm the required signatures and school approvals for this course and term.'
          : !knownSchool ? 'Choose the high school before checking its required signatures and approvals.'
            : ousd ? 'Record the signatures the school requires and its approval of this course. External enrollment may need prior or principal approval.'
              : 'Ask your school which approvals and signatures apply to this course, then record its decision.', nextAction: 'approval' },
    { id: 'schedule', title: 'Confirm the course schedule', done: scheduleDone,
      detail: scheduleDone ? 'The schedule is recorded as confirmed for this course and term.' : 'Confirm enrollment and the schedule, then mark the course in progress or completed.', nextAction: 'schedule' },
    { id: 'grade', title: 'Record the final grade', done: gradeDone, detail: gradeDetail, nextAction: 'grade' },
    { id: 'posting', title: 'Confirm high-school credit posting', done: postingDone,
      detail: postingDone ? 'A school-verified earned award, official transcript receipt and school review are recorded. This app does not authenticate the posting.'
        : allocationCurrent && allocation.classification === 'reported-earned' ? 'This award is student-reported. School-verified credit and official transcript receipt are still needed.'
          : 'Ask the school to confirm posted credit. A completed course or grade does not establish a posted award.', nextAction: 'posting' },
  ];
  const nextStep = steps.find(step => !step.done) || null;
  return { steps, completed: steps.filter(step => step.done).length, total: steps.length, nextStep, nextAction: nextStep?.id || null, snapshotCurrent };
}
