import { COLLEGES } from './catalog.js';
import { resolveEntryCourse } from './custom-courses.js';
import { courseWorkflow, normalizeCourseWorkflow, normalizeFinalGrade } from './course-record.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const statusLabel = value => ({ completed: 'Completed', 'in-progress': 'In progress', planned: 'Planned' }[value] || 'Status not recorded');

function checklist(steps) {
  return `<ol class="course-workflow-steps">${steps.map(step => `<li><div><strong>${esc(step.title)}</strong><span class="course-workflow-state">${step.done ? 'Recorded' : 'Not yet recorded'}</span></div><p>${esc(step.detail)}</p></li>`).join('')}</ol>`;
}

export function renderCourseWorkflow(state, entry) {
  if (!entry?.id || !resolveEntryCourse(entry)) return '';
  const workflow = courseWorkflow(state, entry);
  const next = workflow.nextStep || workflow.steps.find(step => !step.done);
  return `<section class="course-workflow" aria-label="Course checklist"><div class="course-workflow-next"><div><p class="course-workflow-label">STUDENT-RECORDED CHECKLIST</p><h3>${next ? `Next: ${esc(next.title)}` : 'Your checklist is recorded.'}</h3><p>${next ? esc(next.detail) : 'Review the record with your school if anything changes.'}</p></div><button type="button" class="text-button" data-action="course-workflow" data-entry="${esc(entry.id)}">Update checklist</button></div><details class="course-workflow-details"><summary>See the four checks</summary>${checklist(workflow.steps)}<p class="course-workflow-note">Student-recorded steps. This app does not sign forms, submit requests, or confirm an official credit award.</p></details></section>`;
}

export function courseWorkflowForm(state, entryId) {
  const entry = state.entries?.find(item => item.id === entryId);
  const sourceCourse = resolveEntryCourse(entry);
  if (!entry || !sourceCourse) return '<p>This class is no longer in your record. Close this dialog and choose a saved class.</p>';
  const school = COLLEGES.find(item => item.id === sourceCourse.collegeId) || {name:sourceCourse.collegeName};
  const record = normalizeCourseWorkflow(entry.workflow);
  const derived = courseWorkflow(state, entry);
  const grade = normalizeFinalGrade(entry.finalGrade);
  return `<form id="course-workflow-form" class="hs-form course-workflow-form" data-entry="${esc(entry.id)}"><p class="dialog-lede">${esc(sourceCourse.code)} · ${esc(sourceCourse.title)}<br>${esc(school?.name)} · ${esc(entry.term)}</p><p class="hs-help">Your checklist, saved in this browser. Nothing is signed, submitted, or officially verified here.</p><fieldset><legend>1. Approval form and signatures</legend><label>Required approvals and signatures<select name="approvalSignatures"><option value="unknown"${record.approvalSignatures === 'unknown' ? ' selected' : ''}>Not confirmed</option><option value="recorded"${record.approvalSignatures === 'recorded' ? ' selected' : ''}>I recorded the required approvals and signatures</option></select></label><p class="hs-help">Ask your school which form and signatures this class needs. Recording this step does not create an approval.</p><label>Optional approval note<textarea name="requiredSignaturesNote" maxlength="1500" rows="3" placeholder="Which school-required steps have you checked?">${esc(record.requiredSignaturesNote)}</textarea></label></fieldset><fieldset><legend>2. Class on your schedule</legend><label class="hs-check"><input type="checkbox" name="scheduleConfirmed"${record.scheduleConfirmed ? ' checked' : ''}>I confirmed this class is on my schedule.</label><p class="hs-help">The checklist also uses your class status: ${esc(statusLabel(entry.status))}. A planned class is not enrollment.</p></fieldset><fieldset><legend>3. Final grade</legend><p>${grade ? `Final grade: <strong>${esc(grade)}</strong> (recorded)` : 'Final grade: Not recorded.'}</p><p class="hs-help">Change the grade in the existing class record. Recording a grade does not award credit.</p></fieldset><fieldset><legend>4. School credit posted</legend><p class="hs-help">This step reads the school-credit connection and official-transcript record for this exact class and term. It has no separate completion checkbox.</p></fieldset><details class="course-workflow-details"><summary>See what is still needed</summary>${checklist(derived.steps)}</details><div class="dialog-actions"><button type="button" class="button secondary" data-action="close">Cancel</button><button type="submit" class="button primary">Save checklist</button></div><p class="hs-help">Opening either record below saves your current checklist entries first.</p><div class="course-workflow-record-links"><button type="button" class="text-button" data-action="hs-allocation" data-entry="${esc(entry.id)}">Review school approval and credit record</button><button type="button" class="text-button" data-action="guide-edit" data-id="${esc(entry.id)}">Edit class status or final grade</button></div></form>`;
}
