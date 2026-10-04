import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCourseWorkflow, courseWorkflowForm } from '../src/course-workflow-view.js';

const entry = (changes = {}) => ({ id: 'college-1', courseId: 'laney-engl-c1000', status: 'completed', term: 'Fall 2026', finalGrade: '', ...changes });
const workflow = (changes = {}) => ({ approvalSignatures: 'recorded', scheduleConfirmed: true, linkedCourseId: 'laney-engl-c1000', linkedTerm: 'Fall 2026', linkedStatus: 'completed', ...changes });
const allocation = (changes = {}) => ({ id: 'award-1', collegeEntryId: 'college-1', linkedCourseId: 'laney-engl-c1000', linkedTerm: 'Fall 2026', subjectId: 'english', credits: 13, gradeLevel: '11', status: 'approved', result: 'passing', creditAward: 'earned', provenance: 'school-verified', enrollmentType: 'district-de', schoolApproval: 'confirmed', transcript: 'received', ...changes });
const state = (row = entry(), allocations = []) => ({ entries: [row], highSchool: { profile: { districtId: 'ousd', schoolId: 'skyline', policyId: 'ousd-comprehensive' }, courses: [], allocations } });

test('a saved course exposes one next step and one action before a collapsed four-step checklist', () => {
  const input = state();
  const html = renderCourseWorkflow(input, input.entries[0]);
  const compact = html.split('<details')[0];
  assert.equal((compact.match(/<h3>/g) || []).length, 1);
  assert.match(compact, /Next: Record school approval/);
  assert.equal((compact.match(/<button/g) || []).length, 1);
  assert.match(compact, /data-action="course-workflow" data-entry="college-1"/);
  assert.equal((html.match(/<li>/g) || []).length, 4);
  assert.match(html, /<details class="course-workflow-details"><summary>See the four checks/);
  assert.match(html, /Student-recorded steps/);
  assert.doesNotMatch(html, /<details[^>]* open/);
});

test('a grade changes the next step but cannot claim a student-reported posting is official', () => {
  const row = entry({ finalGrade: 'B', workflow: workflow() });
  const input = state(row, [allocation({ provenance: 'student-reported' })]);
  const html = renderCourseWorkflow(input, row);
  assert.match(html, /Next: Confirm high-school credit posting/);
  assert.match(html, /This award is student-reported/);
  assert.doesNotMatch(html, /Your checklist is recorded/);
});

test('even a fully recorded checklist keeps authentication and credit limits visible', () => {
  const row = entry({ finalGrade: 'A', workflow: workflow() });
  const html = renderCourseWorkflow(state(row, [allocation()]), row);
  assert.match(html, /Your checklist is recorded/);
  assert.match(html, /does not authenticate the posting/);
  assert.match(html, /does not sign forms, submit requests, or confirm an official credit award/);
  assert.doesNotMatch(html, /graduation eligible|ready to graduate|officially approved/i);
});

test('form saves only local checkpoints and links to the existing grade and school-credit records', () => {
  const html = courseWorkflowForm(state(), 'college-1');
  assert.match(html, /id="course-workflow-form"[^>]*data-entry="college-1"/);
  assert.match(html, /value="unknown" selected/);
  assert.match(html, /Final grade: Not recorded/);
  assert.match(html, /name="requiredSignaturesNote"/);
  assert.match(html, /name="scheduleConfirmed"/);
  assert.equal((html.match(/type="checkbox"/g) || []).length, 1);
  assert.doesNotMatch(html, /name="(?:posting|finalGrade|transcript|schoolApproval)"/);
  assert.match(html, /data-action="hs-allocation" data-entry="college-1"/);
  assert.match(html, /data-action="guide-edit" data-id="college-1"/);
  assert.match(html, /Opening either record below saves your current checklist entries first/);
  assert.match(html, /Ask your school which form and signatures this class needs/);
  assert.doesNotMatch(html, /parent signature|counselor signature|principal signature/i);
});

test('notes, terms and record identifiers are escaped and selections survive an edit', () => {
  const unsafe = '<img src=x onerror="alert(1)">';
  const row = entry({ id: unsafe, term: unsafe, workflow: workflow({ requiredSignaturesNote: `</textarea>${unsafe}` }) });
  const html = courseWorkflowForm(state(row), unsafe);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;\/textarea&gt;&lt;img/);
  assert.match(html, /data-entry="&lt;img/);
  assert.match(html, /value="recorded" selected/);
  assert.match(html, /name="scheduleConfirmed" checked/);
  assert.doesNotMatch(renderCourseWorkflow(state(row), row), /<img/);
});

test('planned, missing and unknown courses cannot gain a misleading completed summary', () => {
  const row = entry({ status: 'planned', workflow: workflow() });
  const html = courseWorkflowForm(state(row), row.id);
  assert.match(html, /A planned class is not enrollment/);
  assert.doesNotMatch(renderCourseWorkflow(state(row), row), /Your checklist is recorded/);
  assert.equal(renderCourseWorkflow(state(), entry({ courseId: 'missing-course' })), '');
  assert.match(courseWorkflowForm(state(), 'missing-entry'), /no longer in your record/);
});
