import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyHighSchoolProfile, graduationProgress } from '../src/high-school.js';
import { compareCourse, totals } from '../src/rules.js';
import { customCourseSnapshot } from '../src/custom-courses.js';
import { gradeAlerts, gradeReviewContent, renderHighSchoolRecords, connectedCredits, renderGraduationProgress } from '../src/high-school-view.js';

const schoolClass = (changes = {}) => ({ id: 'school-1', title: 'English', subjectId: 'english', credits: 3,
  status: 'completed', finalGrade: 'D', result: 'passing', creditAward: 'earned', provenance: 'school-verified',
  gradeLevel: '9', term: 'Fall 2025', courseType: 'standard', note: '', ...changes });
const collegeEntry = (changes = {}) => ({ id: 'college-1', courseId: 'laney-engl-c1000', status: 'completed', term: 'Fall 2025', finalGrade: 'D', ...changes });
const allocation = (changes = {}) => ({ id: 'allocation-1', collegeEntryId: 'college-1', linkedCourseId: 'laney-engl-c1000', linkedTerm: 'Fall 2025',
  subjectId: 'english', credits: 13, status: 'approved', result: 'passing', creditAward: 'earned', provenance: 'school-verified',
  gradeLevel: '11', enrollmentType: 'district-de', schoolApproval: 'confirmed', transcript: 'received', ...changes });
const state = ({ courses = [], entries = [], allocations = [], targets = ['uc-berkeley'], profile = {} } = {}) => ({
  profile: { destinationIds: targets }, entries, journey: { evidenceViewed: [], questions: [] },
  highSchool: { profile: { ...emptyHighSchoolProfile(), districtId: 'ousd', schoolId: 'skyline', policyId: 'ousd-comprehensive', ...profile }, courses, allocations },
});
const schoolAlerts = input => gradeAlerts(input, graduationProgress(input).courses[0]);
const hasAlert = (alerts, id) => alerts.some(alert => alert.id === id);
const earned = progress => progress.totals.verifiedEarned + progress.totals.reportedEarned;

test('D variants retain explicit verified and reported school awards and do not mutate credit math', () => {
  for (const finalGrade of ['D+', 'D', 'D-']) {
    for (const provenance of ['school-verified', 'student-reported']) {
      const input = state({ courses: [schoolClass({ finalGrade, provenance })] });
      const before = structuredClone(input);
      const progress = graduationProgress(input);
      assert.equal(progress.totals.verifiedEarned, provenance === 'school-verified' ? 3 : 0);
      assert.equal(progress.totals.reportedEarned, provenance === 'student-reported' ? 3 : 0);
      assert.equal(progress.totalRequirement.remainingWithReported, 227);
      assert.equal(progress.subjects.find(subject => subject.id === 'english').remainingWithReported, 37);
      const alerts = gradeAlerts(input, progress.courses[0]);
      assert.deepEqual(alerts.map(alert => alert.id), ['uc-preparation']);
      renderHighSchoolRecords(input);
      gradeReviewContent(input, 'school', 'school-1');
      assert.deepEqual(graduationProgress(input), progress);
      assert.deepEqual(input, before);
    }
  }
});

test('D grades with missing earned awards, passing results or amounts still need school confirmation', () => {
  for (const change of [{ creditAward: 'unconfirmed' }, { result: 'pending' }, { credits: null }]) {
    const input = state({ courses: [schoolClass(change)] });
    assert.equal(earned(graduationProgress(input)), 0);
    const alerts = schoolAlerts(input);
    assert.equal(alerts.find(alert => alert.id === 'school-confirmation')?.title, 'Needs school confirmation');
    assert.equal(hasAlert(alerts, 'no-earned-credit'), false);
    assert.equal(hasAlert(alerts, 'uc-preparation'), true);
  }
});

test('UC selection, undecided and HBCU-only targets have distinct D alert scope', () => {
  for (const targets of [['uc-berkeley'], ['howard', 'uc-davis'], ['uc-berkeley', 'uc-davis']]) {
    const alert = schoolAlerts(state({ courses: [schoolClass()], targets })).find(item => item.id === 'uc-preparation');
    assert.equal(alert.tone, 'warning');
    assert.equal(alert.title, "Below UC's minimum grade");
    assert.equal(alert.label, 'UC preparation');
    assert.match(alert.source, /^https:\/\/admission\.universityofcalifornia\.edu\//);
    assert.doesNotMatch(JSON.stringify(alert), /Howard|HBCU|N\.C\. A&T/);
  }
  for (const targets of [[], ['not-a-destination']]) {
    const alert = schoolAlerts(state({ courses: [schoolClass()], targets })).find(item => item.id === 'uc-preparation');
    assert.equal(alert.tone, 'info');
    assert.equal(alert.title, 'College requirements still need review');
    assert.match(alert.text, /^If you are considering UC:/);
  }
  assert.deepEqual(schoolAlerts(state({ courses: [schoolClass()], targets: ['howard', 'ncat'] })), []);
});

test('F and NP show zero earned credit despite conflicting passing and award records', () => {
  for (const finalGrade of ['F', 'NP']) {
    for (const provenance of ['school-verified', 'student-reported']) {
      const input = state({ courses: [schoolClass({ finalGrade, provenance, credits: 7 })], targets: ['howard'] });
      const before = structuredClone(input);
      const progress = graduationProgress(input);
      assert.equal(earned(progress), 0);
      assert.equal(progress.totals.notEarned, 7);
      const alerts = schoolAlerts(input);
      assert.deepEqual(alerts.map(alert => alert.id), ['no-earned-credit']);
      assert.equal(alerts[0].title, '0 earned credits');
      assert.match(alerts[0].label, /High-school/);
      const html = renderHighSchoolRecords(input);
      assert.match(html, /7 high-school credits recorded/);
      assert.match(html, /0 earned credits/);
      assert.deepEqual(input, before);
    }
  }
});

test('explicit non-passing results show zero earned credit even with blank grades or earlier review reasons', () => {
  for (const finalGrade of ['', 'B+', 'D', 'P', 'I', 'W']) {
    for (const credits of [3, null]) {
      const input = state({ courses: [schoolClass({ finalGrade, credits, result: 'not-passing' })] });
      const progress = graduationProgress(input);
      assert.equal(earned(progress), 0);
      const alerts = gradeAlerts(input, progress.courses[0]);
      assert.equal(hasAlert(alerts, 'no-earned-credit'), true, `${finalGrade || 'blank'} / ${credits}`);
      assert.equal(hasAlert(alerts, 'school-confirmation'), false);
      assert.match(renderHighSchoolRecords(input), /0 earned credits/);
      const question = gradeReviewContent(input, 'school', 'school-1');
      assert.match(question, /non-passing/);
      assert.equal(input.highSchool.courses[0].credits, credits);
    }
  }
});

test('unfinished records do not show final-grade alerts', () => {
  for (const status of ['planned', 'in-progress']) {
    const raw = schoolClass({ status, finalGrade: 'D', result: 'not-passing' });
    assert.deepEqual(gradeAlerts(state(), raw), []);
    const input = state({ courses: [schoolClass({ status, finalGrade: '', result: 'not-passing' })] });
    assert.deepEqual(schoolAlerts(input), []);
    assert.equal(earned(graduationProgress(input)), 0);
    assert.doesNotMatch(renderHighSchoolRecords(input), /class="grade-alerts"/);
  }
});

test('B+ remains an earned school award without a new grade alert', () => {
  const input = state({ courses: [schoolClass({ finalGrade: 'B+' })] });
  assert.equal(graduationProgress(input).totals.verifiedEarned, 3);
  assert.deepEqual(schoolAlerts(input), []);
  const html = renderHighSchoolRecords(input);
  assert.match(html, /School-verified, as recorded/);
  assert.doesNotMatch(html, /class="grade-alerts"|<details class="hs-details" open/);
});

test('generic schools keep their own target and do not inherit an OUSD grade or diploma policy', () => {
  const input = state({ courses: [schoolClass({ finalGrade: 'D-' })], profile: {
    districtId: 'other', districtName: 'Example district', schoolId: 'other', schoolName: 'Example high school',
    policyId: null, manualCreditTarget: 24,
  } });
  const before = structuredClone(input);
  const progress = graduationProgress(input);
  assert.equal(progress.policy, null);
  assert.equal(progress.totalRequirement.required, 24);
  assert.equal(progress.totalRequirement.remainingWithReported, 21);
  assert.equal(progress.gpa.minimum, null);
  assert.equal(progress.seniorProject.required, null);
  assert.equal(hasAlert(schoolAlerts(input), 'uc-preparation'), true);
  const html = renderHighSchoolRecords(input) + renderGraduationProgress(input);
  assert.doesNotMatch(html, /OUSD|Oakland|230|minimum 2\.0|senior project/i);
  assert.deepEqual(input, before);
});

test('PE and unassigned classes receive conditional UC guidance without claimed A-G approval', () => {
  for (const subjectId of ['pe', 'unassigned']) {
    const input = state({ courses: [schoolClass({ subjectId })] });
    const alert = schoolAlerts(input).find(item => item.id === 'uc-preparation');
    assert.match(alert.text, /If this class is intended for A-G/);
    assert.match(alert.next, /does not verify A-G course approval or admission eligibility/);
    assert.equal(graduationProgress(input).courses[0].subjectId, subjectId);
    assert.equal(graduationProgress(input).totals.verifiedEarned, 3);
  }
});

test('college D awards and local units remain separate from the UC preparation warning', () => {
  const input = state({ entries: [collegeEntry()], allocations: [allocation()] });
  const before = structuredClone(input);
  const load = totals(input.entries);
  const progress = graduationProgress(input);
  assert.equal(progress.totals.verifiedEarned, 13);
  assert.equal(load.completed, 4);
  const html = connectedCredits(input, input.entries[0]);
  assert.match(html, /13 high-school credits recorded/);
  assert.match(html, /4 local semester units/);
  assert.match(html, /A-G preparation is separate from diploma credit and college transfer credit/);
  assert.ok(html.indexOf('For college') < html.indexOf('Below UC&#39;s minimum grade'));
  assert.doesNotMatch(html, /Needs school confirmation|0 earned credits/);
  assert.deepEqual(totals(input.entries), load);
  assert.deepEqual(input, before);
});

test('failed college attempts show zero earned school credit without needing an allocation', () => {
  for (const finalGrade of ['F', 'NP']) {
    const input = state({ entries: [collegeEntry({ finalGrade })] });
    const before = structuredClone(input);
    const html = connectedCredits(input, input.entries[0]);
    assert.match(html, /School credit not recorded/);
    assert.match(html, /0 earned credits/);
    assert.match(html, /4 local semester units/);
    assert.equal(totals(input.entries).completed, 4);
    assert.equal(earned(graduationProgress(input)), 0);
    const question = gradeReviewContent(input, 'college', 'college-1');
    assert.match(question, /ENGL C1000/);
    assert.match(question, /Laney College/);
    assert.match(question, /Fall 2025/);
    assert.ok(question.includes(`grade is ${finalGrade}`));
    assert.deepEqual(input, before);
  }
});

test('non-passing college allocations and stale award snapshots do not gain earned credit', () => {
  const input = state({ entries: [collegeEntry({ finalGrade: '' })], allocations: [allocation({ credits: null, result: 'not-passing' })] });
  assert.match(connectedCredits(input, input.entries[0]), /School credit amount unknown/);
  assert.match(connectedCredits(input, input.entries[0]), /0 earned credits/);
  assert.match(gradeReviewContent(input, 'college', 'college-1'), /result is non-passing/);
  assert.equal(earned(graduationProgress(input)), 0);
  const stale = state({ entries: [collegeEntry({ term: 'Spring 2026' })], allocations: [allocation()] });
  assert.equal(earned(graduationProgress(stale)), 0);
  assert.match(connectedCredits(stale, stale.entries[0]), /Needs school confirmation/);
  assert.match(gradeReviewContent(stale, 'college', 'college-1'), /Spring 2026/);
  assert.doesNotMatch(gradeReviewContent(stale, 'college', 'college-1'), /Fall 2025/);
});

test('C- and P university policy review stays separate and receives no D warning', () => {
  for (const finalGrade of ['C-', 'P']) {
    const input = state({ entries: [collegeEntry({ finalGrade })], allocations: [allocation()] });
    const before = structuredClone(input);
    assert.deepEqual(gradeAlerts(input, input.entries[0], { college: true, award: graduationProgress(input).allocations[0] }), []);
    for (const destination of ['uc-berkeley', 'ncat', 'howard']) {
      const result = compareCourse(input.entries[0].courseId, destination, input.entries[0]);
      assert.equal(result.kind, 'review');
      assert.equal(result.label, `Recorded ${finalGrade}: grade policy review`);
      assert.equal(result.unitsText, 'Individual credit award not verified');
    }
    connectedCredits(input, input.entries[0]);
    assert.deepEqual(input, before);
  }
});

test('counselor questions are escaped read-only text and never save new questions', () => {
  const evil = '</textarea><img src=x onerror="alert(1)">';
  const input = state({ courses: [schoolClass({ id: 'evil', title: `English ${evil}`, term: evil })] });
  const before = structuredClone(input);
  const html = gradeReviewContent(input, 'school', 'evil');
  assert.match(html, /<textarea readonly rows="7">/);
  assert.match(html, /Nothing is sent or saved/);
  assert.match(html, /&lt;\/textarea&gt;&lt;img/);
  assert.doesNotMatch(html, /<img|type="submit"|<form/);
  assert.equal((html.match(/<\/textarea>/g) || []).length, 1);
  assert.deepEqual(input, before);
  const entry = collegeEntry({ courseId: 'custom:college-1', finalGrade: 'D-', customCourse: {
    collegeName: `Custom college ${evil}`, code: 'ENG 101', title: `Composition ${evil}`, units: 5, unitSystem: 'quarter',
  } });
  const custom = state({ entries: [entry] });
  const snapshot = customCourseSnapshot(entry);
  const customBefore = structuredClone(custom);
  const question = gradeReviewContent(custom, 'college', 'college-1');
  assert.match(question, /Custom college &lt;/);
  assert.match(question, /ENG 101/);
  assert.match(question, /Composition &lt;/);
  assert.match(question, /Fall 2025/);
  assert.match(question, /grade is D-/);
  assert.doesNotMatch(question, /<img/);
  assert.match(connectedCredits(custom, entry), /5 local quarter units/);
  assert.equal(customCourseSnapshot(entry), snapshot);
  assert.deepEqual(custom, customBefore);
});

test('removed records and grades that no longer need alerts do not produce stale counselor questions', () => {
  const input = state({ courses: [schoolClass()], entries: [collegeEntry()] });
  assert.match(gradeReviewContent(input, 'school', 'missing'), /no longer in your record/);
  assert.match(gradeReviewContent(input, 'college', 'missing'), /no longer in your record/);
  input.highSchool.courses[0].finalGrade = 'B+';
  input.entries[0].finalGrade = 'B+';
  for (const [kind, id] of [['school', 'school-1'], ['college', 'college-1']]) {
    const html = gradeReviewContent(input, kind, id);
    assert.match(html, /No grade alert currently applies/);
    assert.doesNotMatch(html, /textarea/);
  }
});

test('school alerts automatically open the recorded class group and appear before status explanations', () => {
  for (const finalGrade of ['D', 'F']) {
    const html = renderHighSchoolRecords(state({ courses: [schoolClass({ finalGrade })] }));
    assert.match(html, /<details class="hs-details" open>/);
    const alert = html.indexOf('class="grade-alerts"');
    const reason = html.indexOf('Why this status?');
    assert.ok(alert >= 0 && reason > alert);
    assert.match(html, /data-action="grade-review" data-kind="school" data-id="school-1"/);
    assert.match(html, /3 high-school credits recorded/);
  }
});
