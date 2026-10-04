import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHighSchoolProfile, updateHighSchoolProfile, graduationProgress } from '../src/high-school.js';
import { customCourseSnapshot } from '../src/custom-courses.js';
import { renderGraduationProgress, highSchoolProfileForm, highSchoolAllocationForm, connectedCredits } from '../src/high-school-view.js';
import { highSchoolSummaryLines } from '../src/high-school-export.js';

const profile = (changes = {}) => ({ districtId: 'other', districtName: 'Example district', schoolId: 'other', schoolName: 'Example high school', manualCreditTarget: 24, ...changes });
const schoolClass = (changes = {}) => ({ id: 'school-1', title: 'School English', subjectId: 'english', credits: 10, status: 'completed', result: 'passing', creditAward: 'earned', provenance: 'school-verified', gradeLevel: 'unknown', term: '2025-26', ...changes });
const catalogEntry = () => ({ id: 'college-1', courseId: 'laney-engl-c1000', term: 'Fall 2026', status: 'completed', finalGrade: 'B' });
const customEntry = (changes = {}) => ({ id: 'manual-1', courseId: 'custom:manual-1', term: 'Fall 2026', status: 'completed', finalGrade: 'B', customCourse: { collegeName: 'Example College', code: 'ENGL 101', title: 'College Writing', units: 4, unitSystem: 'quarter' }, ...changes });
const allocation = (entry, changes = {}) => ({ id: 'award-1', collegeEntryId: entry.id, linkedCourseId: entry.courseId, linkedTerm: entry.term, linkedCustomCourseKey: customCourseSnapshot(entry), subjectId: 'english', credits: 3, gradeLevel: 'unknown', status: 'approved', result: 'passing', creditAward: 'earned', provenance: 'school-verified', schoolApproval: 'confirmed', transcript: 'received', enrollmentType: 'unknown', ...changes });
const state = (changes = {}) => ({ entries: [], profile: { destinationIds: ['uc-berkeley', 'howard'] }, highSchool: { profile: profile(), courses: [], allocations: [] }, ...changes });

test('general profile fields are optional, bounded and do not infer an OUSD policy', () => {
  const raw = profile({ requirementsNote: 'Ask about the diploma target', requirementsSourceUrl: 'https://school.example/requirements', manualCreditTarget: '24' });
  const before = structuredClone(raw);
  const normalized = normalizeHighSchoolProfile(raw);
  assert.equal(normalized.districtId, 'other');
  assert.equal(normalized.districtName, 'Example district');
  assert.equal(normalized.manualCreditTarget, 24);
  assert.equal(normalized.policyId, null);
  assert.equal(normalized.policyConfirmed, false);
  assert.equal(normalized.requirementsSourceUrl, raw.requirementsSourceUrl);
  assert.deepEqual(raw, before);
  assert.equal(normalizeHighSchoolProfile({}).manualCreditTarget, null);
  for (const value of [-1, 1001, Infinity, NaN, {}, true, 'no']) assert.throws(() => normalizeHighSchoolProfile(profile({ manualCreditTarget: value })));
  for (const url of ['javascript:alert(1)', 'http://school.example/requirements', 'not a URL']) assert.throws(() => normalizeHighSchoolProfile(profile({ requirementsSourceUrl: url })), /https/);
});

test('a manual target compares totals only, with no imported subject, grade-level, GPA or project requirement', () => {
  const input = state({ highSchool: { profile: profile({ schoolId: 'oakland-tech', policyId: 'ousd-comprehensive', policyConfirmed: true }), courses: [schoolClass(), schoolClass({ id: 'planned', title: 'Future class', credits: 7, status: 'planned' })], allocations: [] } });
  const progress = graduationProgress(input);
  assert.equal(progress.requirementKind, 'manual-target');
  assert.equal(progress.policy, null);
  assert.equal(progress.schoolPolicy, null);
  assert.equal(progress.totalRequirement.required, 24);
  assert.equal(progress.totalRequirement.remainingWithReported, 14);
  assert.equal(progress.totals.verifiedEarned, 10);
  assert.equal(progress.totals.planned, 7);
  assert.ok(progress.subjects.every(row => row.required == null && row.remainingWithReported == null && !row.conditions.length));
  assert.equal(progress.gpa.minimum, null);
  assert.equal(progress.seniorProject.required, null);
  assert.doesNotMatch(progress.policyGaps.join(' '), /OUSD|Oakland|Rudsdale|230|2027|3\.3/);
  assert.equal(progress.comparisonOnly, true);
});

test('ordinary school records work before choosing a district or a target', () => {
  const progress = graduationProgress({ highSchool: { courses: [schoolClass({ gradeLevel: 'other' })] } });
  assert.equal(progress.totals.verifiedEarned, 10);
  assert.equal(progress.totalRequirement.required, null);
  assert.equal(progress.totalRequirement.remainingWithReported, null);
  assert.equal(progress.requirementKind, 'unknown');
  assert.doesNotMatch(progress.policyGaps.join(' '), /OUSD|230|Skyline/);
});

test('generic college awards require explicit reviewed provenance without OUSD route or principal rules', () => {
  const entry = catalogEntry();
  const input = state({ entries: [entry], highSchool: { profile: profile({ schoolId: 'skyline' }), courses: [], allocations: [allocation(entry, { preapproval: 'not-approved' })] } });
  assert.equal(graduationProgress(input).totals.verifiedEarned, 3);
  input.highSchool.allocations[0].transcript = 'unknown';
  assert.equal(graduationProgress(input).allocations[0].classification, 'pending-review');
  input.highSchool.allocations[0].provenance = 'student-reported';
  assert.equal(graduationProgress(input).totals.reportedEarned, 3);
});

test('custom college awards require matching full detail snapshots despite stable entry IDs', () => {
  const entry = customEntry();
  const input = state({ entries: [entry], highSchool: { profile: profile(), courses: [], allocations: [allocation(entry)] } });
  assert.equal(graduationProgress(input).totals.verifiedEarned, 3);
  for (const change of [{ collegeName: 'Another College' }, { code: 'ENGL 102' }, { title: 'Changed title' }, { units: 5 }, { unitSystem: 'semester' }]) {
    const changed = structuredClone(input);
    Object.assign(changed.entries[0].customCourse, change);
    const progress = graduationProgress(changed);
    assert.equal(progress.totals.verifiedEarned, 0);
    assert.equal(progress.allocations[0].classification, 'pending-review');
    assert.match(progress.allocations[0].reasons.join(' '), /details are new or changed/);
  }
  delete input.highSchool.allocations[0].linkedCustomCourseKey;
  assert.equal(graduationProgress(input).totals.verifiedEarned, 0);
  input.entries = [];
  assert.equal(graduationProgress(input).allocations[0].classification, 'excluded');
});

test('duplicate manual college identities exclude ambiguous allocations without merging records', () => {
  const first = customEntry();
  const second = customEntry({ id: 'manual-2', courseId: 'custom:manual-2' });
  const input = state({ entries: [first, second], highSchool: { profile: profile(), courses: [], allocations: [allocation(first)] } });
  assert.equal(graduationProgress(input).allocations[0].classification, 'excluded');
  assert.equal(input.entries.length, 2);
});

test('changing general names and target context resets baseline confirmation without deleting records', () => {
  const old = { districtId: 'ousd', schoolId: 'other', schoolName: 'School A', policyId: 'ousd-comprehensive', policyConfirmed: true };
  for (const change of [{ districtName: 'District B' }, { schoolName: 'School B' }, { manualCreditTarget: 24 }, { requirementsNote: 'Recheck' }, { requirementsSourceUrl: 'https://school.example/new' }]) assert.equal(updateHighSchoolProfile(old, change).policyConfirmed, false);
  assert.equal(old.policyConfirmed, true);
});

test('general progress renders the student-recorded total without OUSD policy copy or source links', () => {
  const input = state({ highSchool: { profile: profile({ requirementsNote: '<img src=x>', requirementsSourceUrl: 'https://school.example/requirements' }), courses: [schoolClass()], allocations: [] } });
  const html = renderGraduationProgress(input);
  assert.match(html, /Your total target<\/dt><dd>24/);
  assert.match(html, /Remaining to target<\/dt><dd>14/);
  assert.match(html, /Student-recorded, not verified/);
  assert.match(html, /Based on the school requirements you entered/);
  assert.match(html, /Your requirement source \(not verified here\)/);
  assert.match(html, /&lt;img src=x&gt;/);
  assert.doesNotMatch(html, /<img|OUSD|ousd\.org|230|2\.0 GPA|senior project|× 3\.3|required course sequences.*algebra/i);
  assert.doesNotMatch(html, /graduation eligible|ready to graduate/i);
  const unknown = renderGraduationProgress({});
  assert.match(unknown, /data-action="hs-profile">Add your school&#39;s graduation requirements<\/button>/);
  assert.match(unknown, /Your total target<\/dt><dd>\?<\/dd>/);
  assert.doesNotMatch(unknown, /<progress/);
});

test('profile fieldsets hide and disable inactive fields so duplicate school-name controls cannot overwrite each other', () => {
  const general = highSchoolProfileForm(state());
  assert.match(general, /data-hs-profile-fields="ousd" hidden disabled/);
  assert.match(general, /data-hs-profile-fields="general"><legend>/);
  assert.match(general, /name="manualCreditTarget"[^>]*value="24"/);
  const ousd = highSchoolProfileForm(state({ highSchool: { profile: { districtId: 'ousd' } } }));
  assert.match(ousd, /data-hs-profile-fields="general" hidden disabled/);
  assert.match(ousd, /data-hs-profile-fields="ousd"><legend>/);
});

test('custom unit systems remain explicit and never offer the OUSD3.3 conversion', () => {
  for (const districtId of ['ousd', 'other', null]) {
    for (const unitSystem of ['semester', 'quarter', 'unknown']) {
      const entry = customEntry(); entry.customCourse.unitSystem = unitSystem;
      const input = state({ entries: [entry], highSchool: { profile: profile({ districtId, policyId: 'ousd-comprehensive' }), courses: [], allocations: [] } });
      const form = highSchoolAllocationForm(input, entry.id);
      assert.match(form, /name="credits"[^>]*value=""/);
      assert.doesNotMatch(form, /3\.3|policy estimate/);
      const card = connectedCredits(input, entry);
      assert.ok(card.includes(unitSystem === 'unknown' ? 'units (system not confirmed)' : `${unitSystem} units`));
      assert.match(card, /We haven’t verified how this course counts at your selected colleges/);
      assert.match(card, /data-action="prepare-question" data-entry="manual-1"/);
      assert.match(card, /Needs transfer review/);
      assert.doesNotMatch(card, /Published unit credit/);
      if (districtId !== 'ousd') assert.doesNotMatch(form, /name="(?:principalApproval|preapproval|enrollmentType)"/);
    }
  }
});

test('general exports retain manual targets and custom course identity without OUSD source leakage', () => {
  const entry = customEntry();
  const input = state({ entries: [entry], highSchool: { profile: profile({ requirementsSourceUrl: 'https://school.example/requirements', requirementsNote: 'Confirm the total with my school.' }), courses: [schoolClass()], allocations: [allocation(entry)] } });
  const text = highSchoolSummaryLines(input).join('\n');
  assert.match(text, /Student-recorded total credit target: 24/);
  assert.match(text, /Student-entered source \(not verified here\): https:\/\/school.example/);
  assert.match(text, /Linked allocation: ENGL 101, Example College, Fall 2026, completed \(student-entered college course\)/);
  assert.match(text, /Derived credit status: verified-earned/);
  assert.doesNotMatch(text, /OUSD|ousd\.org|230|GPA at least|senior project|2027 requirement|3\.3/i);
  assert.match(text, /not a verified school requirement or a graduation determination/);
});
