import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSES } from '../src/catalog.js';
import { emptyHighSchoolProfile } from '../src/high-school.js';
import { OUSD_SCHOOLS } from '../src/school-roster.js';
import { renderGraduationProgress, connectedCredits, renderHighSchoolRecords, highSchoolProfileForm, highSchoolCourseForm, highSchoolAllocationForm } from '../src/high-school-view.js';

const entry = (changes = {}) => ({ id: 'college-1', courseId: 'laney-engl-c1000', status: 'completed', term: 'Fall 2025', ...changes });
const hsClass = (changes = {}) => ({ id: 'hs-1', title: 'English 9', subjectId: 'english', credits: 10, status: 'completed', result: 'passing', creditAward: 'earned', provenance: 'school-verified', gradeLevel: '9', courseType: 'standard', term: 'Fall 2025', note: '', ...changes });
const allocation = (changes = {}) => ({ id: 'allocation-1', collegeEntryId: 'college-1', linkedCourseId: 'laney-engl-c1000', linkedTerm: 'Fall 2025', subjectId: 'english', credits: 13, status: 'approved', result: 'passing', creditAward: 'earned', provenance: 'school-verified', gradeLevel: '11', enrollmentType: 'district-de', schoolApproval: 'confirmed', transcript: 'received', note: '', ...changes });
const state = (courses = [], allocations = [], profile = {}) => ({ profile: { destinationIds: ['uc-berkeley', 'uc-davis', 'howard'] }, entries: [entry()], highSchool: { profile: { ...emptyHighSchoolProfile(), districtId: 'ousd', policyId: 'ousd-comprehensive', ...profile }, courses, allocations } });

test('no school or another program displays unknown required credits without a graduation verdict', () => {
  for (const input of [{ entries: [], profile: {} }, state([], [], { policyId: 'other-program' })]) {
    const html = renderGraduationProgress(input);
    assert.match(html, /(?:Baseline required|Your total target)<\/dt><dd>\?<\/dd>/);
    assert.match(html, /Remaining to (?:baseline|target)<\/dt><dd>\?<\/dd>/);
    assert.match(html, /not graduation eligibility/);
    assert.doesNotMatch(html, /<progress/);
  }
});

test('progress visibly separates recorded verification and self-report and excludes unfinished amounts', () => {
  const html = renderGraduationProgress(state([
    hsClass(), hsClass({ id: 'reported', title: 'Biology', credits: 5, provenance: 'student-reported' }),
    hsClass({ id: 'current', title: 'Geometry', credits: 20, status: 'in-progress' }),
    hsClass({ id: 'planned', title: 'Spanish', credits: 20, status: 'planned' }),
  ]));
  assert.match(html, /Recorded earned<\/dt><dd>15<\/dd>/);
  assert.match(html, /10 school-verified as recorded<br>5 student-reported/);
  assert.match(html, /Remaining to baseline<\/dt><dd>215<\/dd>/);
  assert.match(html, /In-progress and planned credits are not earned/);
  assert.match(html, /20 in progress · 20 planned/);
});

test('a full credit total still displays subject and non-credit conditions without declaring graduation readiness', () => {
  const html = renderGraduationProgress(state([hsClass({ credits: 230 })]));
  assert.match(html, /not graduation eligibility/);
  assert.match(html, /overall 2\.0 GPA/);
  assert.match(html, /senior project/i);
  assert.match(html, /algebra and geometry/);
  assert.match(html, /World history 10, U\.S\. history 10/);
  assert.match(html, /biological and physical science/);
  assert.doesNotMatch(html, /ready to graduate|graduation eligible|all requirements met/i);
});

test('school conditions, dated sources and unverified cohort remain available in collapsed details', () => {
  const skyline = renderGraduationProgress(state([], [], { schoolId: 'skyline' }));
  assert.match(skyline, /principal approval/);
  assert.match(skyline, /skyline\.ousd\.org/);
  assert.match(skyline, /Checked 2026-10-04/);
  assert.match(skyline, /Effective year\/cohort not verified/);
  assert.match(skyline, /No certified 2027/);
  const tech = renderGraduationProgress(state([], [], { schoolId: 'oakland-tech' }));
  assert.match(tech, /limits college-course credit to electives/);
  assert.doesNotMatch(tech, /<details class="hs-details" open/);
});

test('all student-controlled record, note, school and attribute strings are HTML-escaped', () => {
  const evil = '<img src=x onerror="alert(1)">';
  const input = state([hsClass({ title: evil, id: evil, note: evil, term: evil })], [allocation({ note: evil })], { schoolName: evil });
  const outputs = [renderGraduationProgress(input), renderHighSchoolRecords(input), highSchoolProfileForm(input), highSchoolCourseForm(input, evil), highSchoolAllocationForm(input, 'college-1')];
  for (const html of outputs) {
    assert.doesNotMatch(html, /<img/);
    assert.ok(html.includes('&lt;img'), 'escaped student content remains readable');
  }
  const linked = connectedCredits(input, entry({ id: evil, term: evil }));
  assert.doesNotMatch(linked, /<img/);
  assert.match(linked, /data-entry="&lt;img/);
});

test('linked school and college amounts stay separate and UC evidence appears once with its source year', () => {
  const input = state([], [allocation()]);
  const html = connectedCredits(input, input.entries[0]);
  assert.match(html, /13 high-school credits/);
  assert.match(html, /4 local semester units/);
  assert.match(html, /School-verified, as recorded/);
  assert.equal((html.match(/UC systemwide units/g) || []).length, 1);
  assert.match(html, /2025-26 source/);
  assert.match(html, /Howard/);
  assert.match(html, /No verified match/);
  assert.match(html, /Destination award and degree use remain separate/);
});

test('planned and unknown links cannot display school credit as earned', () => {
  const planned = state([], [allocation()]);
  planned.entries[0].status = 'planned';
  const plannedHtml = connectedCredits(planned, planned.entries[0]);
  assert.match(plannedHtml, /Planned, not earned/);
  assert.doesNotMatch(plannedHtml, /School-verified, as recorded/);
  const missing = connectedCredits(state(), entry());
  assert.match(missing, /School credit not recorded/);
  assert.match(missing, /do not automatically fill/);
});

test('allocation form offers only an unfilled estimate and requires explicit outcome and approval records', () => {
  const html = highSchoolAllocationForm(state(), 'college-1');
  assert.match(html, /name="credits"[^>]*value=""/);
  assert.match(html, /gives 13 high-school credits as a policy estimate/);
  assert.match(html, /not an award and has not filled the amount/);
  assert.match(html, /value="unconfirmed" selected/);
  assert.match(html, /value="student-reported" selected/);
  assert.doesNotMatch(html, /value="earned" selected|value="approved" selected|value="passing" selected/);
  for (const field of ['enrollmentType', 'preapproval', 'principalApproval', 'schoolApproval', 'transcript', 'gradeLevel']) assert.ok(html.includes(`name="${field}"`), field);
});

test('AP and IB school forms do not imply automatic college awards and retain the action contract', () => {
  const input = state([hsClass({ courseType: 'ap' })]);
  assert.match(renderHighSchoolRecords(input), /Exam scores and college awards are not inferred/);
  assert.match(highSchoolCourseForm(input, 'hs-1'), /AP or IB class does not create college credit/);
  assert.match(highSchoolCourseForm(input, 'hs-1'), /id="hs-course-form"[^>]*data-id="hs-1"/);
  assert.match(highSchoolProfileForm(input), /id="hs-profile-form"/);
  assert.match(highSchoolAllocationForm(input, 'college-1'), /id="hs-allocation-form"[^>]*data-entry="college-1"/);
});

test('new district schedule courses render with unknown destination evidence and retain local units', () => {
  const scheduled = COURSES.find(item => item.scheduleOnly);
  assert.ok(scheduled);
  const html = connectedCredits(state(), entry({ courseId: scheduled.id, status: 'planned', term: 'Fall 2026' }));
  assert.match(html, /For high school/);
  assert.match(html, /For college/);
  assert.match(html, /No verified match/);
  assert.doesNotMatch(html, /Published unit credit/);
});

test('school class final grade is optional, separate from grade level, and retained on edit', () => {
  const blank = highSchoolCourseForm(state(), null);
  assert.match(blank, /Final grade, if available<select name="finalGrade"><option value="" selected>Not recorded/);
  assert.match(blank, /High-school grade when taken<select name="gradeLevel"><option value="unknown" selected>Not confirmed/);
  const html = highSchoolCourseForm(state([hsClass({ finalGrade: 'B+' })]), 'hs-1');
  assert.match(html, /value="B\+" selected/);
  assert.match(html, /A final grade does not confirm a credit award/);
});

test('recorded grades appear beside school and college status without implying a credit award', () => {
  const input = state([hsClass({ finalGrade: 'F', creditAward: 'unconfirmed', result: 'not-passing' })]);
  const school = renderHighSchoolRecords(input);
  assert.match(school, /Final grade: F \(recorded\)/);
  assert.match(school, /Not earned/);
  const college = connectedCredits(input, entry({ finalGrade: 'B' }));
  assert.match(college, /Final grade: B \(recorded\)/);
  assert.match(college, /School credit not recorded/);
  assert.match(college, /Destination award and degree use remain separate/);
  assert.match(connectedCredits(input, entry()), /Final grade not recorded/);
});

test('school selector contains all 17 official schools alphabetically and preserves unknown and another school', () => {
  const html = highSchoolProfileForm(state());
  const selector = html.match(/<select name="schoolId">(.*?)<\/select>/s)?.[1];
  assert.ok(selector);
  assert.equal(OUSD_SCHOOLS.length, 17);
  assert.equal((selector.match(/<option /g) || []).length, 19);
  const sorted = [...OUSD_SCHOOLS].sort((a, b) => a.name.localeCompare(b.name, 'en'));
  let previous = -1;
  for (const school of sorted) {
    const position = selector.indexOf(`value="${school.id}"`);
    assert.ok(position > previous, `${school.name} appears once in alphabetical order`);
    assert.equal(selector.split(`value="${school.id}"`).length - 1, 1);
    previous = position;
    const edit = highSchoolProfileForm(state([], [], { schoolId: school.id }));
    assert.ok(edit.includes(`value="${school.id}" selected`), school.name);
  }
  assert.match(selector, /value="unknown" selected/);
  assert.match(selector, /value="other">Another school/);
  assert.match(highSchoolProfileForm(state([], [], { schoolId: 'other', schoolName: 'A separate school' })), /name="schoolName"[^>]*value="A separate school"/);
  assert.match(html, /Directory membership does not confirm your graduation requirements/);
  assert.match(html, /Changing schools resets prior approval and checklist confirmations for review/);
  assert.match(html, /save first, then return to confirm the baseline/);
});

test('every program needing separate review displays unknown required credits even with a stored comprehensive baseline', () => {
  const schools = OUSD_SCHOOLS.filter(item => item.program === 'review-required');
  assert.equal(schools.length, 6);
  for (const school of schools) {
    const html = renderGraduationProgress(state([], [], { schoolId: school.id, policyConfirmed: true }));
    assert.match(html, /Baseline required<\/dt><dd>\?<\/dd>/, school.name);
    assert.match(html, /Remaining to baseline<\/dt><dd>\?<\/dd>/, school.name);
    assert.match(html, /School-specific requirements need review/, school.name);
    assert.doesNotMatch(html, /Your school baseline is not selected/);
    assert.ok(html.includes(school.name), school.name);
    assert.doesNotMatch(html, /<progress/);
  }
});
