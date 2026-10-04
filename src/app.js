import { COLLEGES, COURSES, DESTINATIONS } from './catalog.js';
import { compareCourse, suggestCourses, totals, duplicateWarnings } from './rules.js';
import { loadState, saveState, emptyState, makeDemo, STORAGE_KEY, updateCollegeEntry, updateSchoolContext } from './state.js';
import { deriveJourney, evidenceKey, createAdvisorQuestion } from './journey.js';
import { guidedCandidates, briefEvidence, studentChecks } from './guide.js';
import { normalizeHighSchoolRecords, normalizeHighSchoolAllocations, graduationProgress } from './high-school.js';
import { renderGraduationProgress, connectedCredits, renderHighSchoolRecords, highSchoolProfileForm, highSchoolCourseForm, highSchoolAllocationForm } from './high-school-view.js';
import { scheduleCourseId } from './catalog.js';
import { OUSD_SCHEDULE, OUSD_SCHEDULE_ROWS } from './ousd-schedule.js';
import { FINAL_GRADES, normalizeCourseWorkflow, courseWorkflow } from './course-record.js';
import { renderCourseWorkflow, courseWorkflowForm } from './course-workflow-view.js';
import { highSchoolSummaryLines } from './high-school-export.js';
import { resolveCourse, resolveEntryCourse, customCourseId, normalizeCustomCourse, customCourseIdentity, customCourseSnapshot } from './custom-courses.js';
import { customCourseForm } from './custom-course-view.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const college = id => COLLEGES.find(c => c.id === id) || { id, name: course(id)?.collegeName || 'College not recorded', shortName: course(id)?.collegeName || 'College not recorded' };
const course = id => resolveCourse(id, state.entries, state.journey.questions);
const destination = id => DESTINATIONS.find(d => d.id === id) || (id === '' ? {id:'',name:'School counselor',shortName:'Counselor'} : undefined);
const statusName = status => ({ completed: 'Completed', 'in-progress': 'In progress', planned: 'Planned' }[status]);
const icons = {
  home: '<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
  courses: '<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M5 17h15M9 7h7M9 11h5M3 6h2M3 10h2"/>',
  destinations: '<path d="m12 21 6-8a7 7 0 1 0-12 0z"/><circle cx="12" cy="9" r="2"/>',
  compare: '<path d="M3 7h18M3 17h18M8 3v18M16 3v18"/>',
  plan: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18M8 16h3"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
  out: '<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
};
const icon = (key, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[key] || icons.info}</svg>`;
const nav = [['home', 'Overview'], ['courses', 'My courses'], ['destinations', 'Destinations'], ['compare', 'Compare credit'], ['plan', 'Next semester']];
let loaded;
try { loaded = loadState(localStorage); } catch { loaded = { state: emptyState(), warning: 'Browser storage is unavailable. Changes will last only for this visit. Export a copy before closing.' }; }
let state = loaded.state;
let storageWarning = loaded.warning;
const validPages = new Set([...nav.map(([id]) => id), 'summary']);
let page = validPages.has(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
let search = '';
let listFilter = 'all';
let catalogSearch = '';
let catalogCollege = '';
let showHistorical = false;
let toastTimer;
let dialogReturnTarget;
let guideSearch = '';
let guideCollege = '';
let guideFamily = '';
let guideCourseId = '';
let guideQuestionOpen = false;
let showGuideAlternatives = false;
let scheduleSchool = '';

function persist() {
  if (loaded.warning) return false;
  let success = false;
  try { success = saveState(localStorage, state); } catch { /* Browser may deny storage. */ }
  storageWarning = success ? '' : 'Changes could not be saved in this browser. Export a copy before closing.';
  return success;
}
function announce(message) {
  $('#toast').textContent = message + (storageWarning ? ' Browser saving is unavailable. Export the current plan to keep this session.' : '');
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 4500);
}
function go(next) { page = next; location.hash = next; render(); $('#page-title')?.focus(); }
window.addEventListener('hashchange', () => {
  const next = location.hash.slice(1);
  if (validPages.has(next) && next !== page) { page = next; render(); $('#page-title')?.focus(); }
});
function generatedLabel() { return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'long', timeStyle: 'short' }).format(new Date()) + ' Pacific'; }
function selectedTargets() { return state.profile.destinationIds.map(destination).filter(Boolean); }
function recordedGraduationYear() { return state.highSchool.profile.graduationYear || (state.setupComplete ? state.profile.graduationYear : ''); }
function localUnits(value, system = 'semester') { return value == null ? 'Local units unverified' : `${value} local ${system === 'unknown' ? 'units (system not recorded)' : `${system} units`}`; }
function badge(text, kind = 'muted') { return `<span class="badge ${esc(kind)}">${esc(text)}</span>`; }
function evidenceColor(result) { return result.yearMismatch || result.kind === 'review' ? 'sand' : result.kind === 'preliminary' ? 'lavender' : result.kind === 'published' ? 'green' : 'muted'; }
function pageHead(eyebrow, title, subtitle, action = '') {
  return `<div class="page-head"><div><p class="eyebrow">${eyebrow}</p><h1 id="page-title" tabindex="-1">${title}</h1><p class="lede">${subtitle}</p></div>${action}</div>`;
}
const addButton = '<button class="button primary" data-action="catalog">' + icon('plus') + 'Add a course</button>';
function render() {
  if (page === 'home') { renderGuide(); return; }
  const journeyMode = state.viewMode === 'journey';
  $('#app').innerHTML = `<aside class="sidebar">
    <a class="brand" href="#home" aria-label="OpenPath overview"><span class="brand-symbol">o<span>p</span></span><span>openpath<span class="brand-sub">A LITTLE MORE POSSIBILITY.</span></span></a>
    <div class="prototype-tag">Prototype <span>·</span> Working title</div>
    <nav aria-label="Main navigation">${nav.map(([id, label]) => `<a href="#${id}" class="nav-link ${page === id ? 'active' : ''}" ${page === id ? 'aria-current="page"' : ''}>${icon(id)}<span>${label}</span>${id === 'courses' && state.entries.length ? `<span class="nav-count">${state.entries.length}</span>` : ''}</a>`).join('')}</nav>
    <div class="sidebar-bottom"><div class="local-dot"></div><strong>Just on this device</strong><p>No account. Your plan stays in this browser.</p><button data-action="setup" class="text-button">${state.setupComplete ? 'Edit my setup' : 'Set up my path'} ${icon('arrow')}</button></div>
  </aside><div class="workspace"><header class="topbar"><div class="breadcrumb">Your path <span>/</span> ${nav.find(([id]) => id === page)?.[1] || 'Review summary'}</div><div class="top-actions"><span class="route-chip">High school → College</span><button class="button small secondary" data-action="summary">${icon('out')}<span>Review summary</span></button></div></header>
  <main id="main">${storageWarning ? `<div class="notice warning" role="alert">${icon('info')}<div>${esc(storageWarning)} <button class="text-button" data-action="download-json">Export current plan</button>${loaded.warning ? '<button class="text-button" data-action="recover">Recover original saved copy</button>' : ''}<button class="text-button" data-action="restart-storage">Start fresh in this browser</button></div></div>` : ''}
    ${state.isDemo ? '<div class="demo-banner"><span><strong>Sample journey</strong> · Fictional course history. Explore freely.</span><button class="text-button" data-action="clear">Clear sample & start my own</button></div>' : ''}
    <button class="text-button journey-back" data-action="go-home">← Back to your next class</button>
    ${({ home: journeyMode ? journeyView : overview, courses: myCourses, destinations: destinationsPage, compare: comparison, plan: planner, summary: summaryPage }[page] || overview)()}
  </main><footer class="footer"><span>Made for possibilities, not promises.</span><span>Research snapshot: Oct 4, 2026 · School review is the final step.</span></footer></div>`;
}

function guideGo(step) {
  state.guide.started = true;
  state.guide.step = step;
  persist();
  go('home');
}
function renderGuide() {
  const stages = [['classes', 'Your classes'], ['colleges', 'Your colleges'], ['next', 'Your next class']];
  $('#app').innerHTML = `<div class="guide-shell"><header class="guide-header"><a class="brand" href="#home" aria-label="OpenPath home"><span class="brand-symbol">o<span>p</span></span><span>openpath<span class="brand-sub">ONE CLASS. A CLEARER NEXT STEP.</span></span></a><details class="guide-tools-menu"><summary>Tools & details</summary><div><a href="#courses">All classes & editing</a><a href="#compare">Detailed credit comparison</a><a href="#plan">All class ideas</a><a href="#summary">Review & export</a><button data-action="setup">Full settings</button><button data-action="demo">Explore a sample</button><button data-action="clear">Clear this local plan</button></div></details></header><main id="main" class="guide-main">
  ${storageWarning ? `<div class="notice warning" role="alert">${esc(storageWarning)} <button data-action="download-json">Export current plan</button>${loaded.warning ? '<button data-action="recover">Recover original saved copy</button>' : ''}<button data-action="restart-storage">Start fresh</button></div>` : ''}
  ${state.isDemo ? '<p class="guide-note">Sample plan · Fictional classes, just for exploring.</p>' : ''}
  ${state.guide.started ? `<nav class="guide-progress" aria-label="Planning steps"><ol>${stages.map(([id, label], i) => `<li><button data-action="guide-step" data-step="${id}" ${state.guide.step === id ? 'aria-current="step"' : ''}><span class="guide-step-number">${i + 1}</span><span class="guide-step-label">${label}</span></button></li>`).join('')}</ol></nav>${({ classes: guideClasses, colleges: guideColleges, next: guideNext }[state.guide.step])()}` : `<section class="guide-welcome"><p class="eyebrow">FOR STUDENTS AT ANY HIGH SCHOOL</p><h1 id="page-title" tabindex="-1">One class.<br>A clearer next step.</h1><p>Track your high-school and college classes. Add your school’s credit requirements. Make a plan for what comes next.</p><button class="button primary" data-action="guide-start">Find my next class ${icon('arrow')}</button><p class="guide-promise">No account. No major required.<br>Your plan stays in this browser.<br>OUSD requirements and Peralta transfer research available.</p></section>`}
  </main><footer class="guide-footer"><span>OpenPath is a prototype. Your school confirms credit and class requirements.</span><span>Research checked Oct 4, 2026.</span></footer></div>`;
}
function guideHeading(title, description) {
  return `<div class="guide-heading"><h1 id="page-title" tabindex="-1">${title}</h1><p>${description}</p></div>`;
}
function guideClasses() {
  const entries = state.entries.filter(e => e.status !== 'planned');
  return guideHeading('College classes, connected to your future.', 'Track classes you take during high school. See what they could mean for college and for your high-school diploma.') +
    renderGraduationProgress(state) +
    `<section class="guide-panel"><h2>Add a college class</h2><p class="guide-note">Search our Peralta research or add a class from any college.</p><button class="button secondary" data-action="custom-add">Add another college class</button><div class="guide-search-row"><label class="guide-search">Find a class<input id="guide-course-search" type="search" placeholder="Try English, psychology, or MATH 3A" value="${esc(guideSearch)}"></label><label>At which college?<select id="guide-course-college"><option value="">Any researched Peralta college</option>${COLLEGES.map(c => `<option value="${c.id}" ${guideCollege === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label></div><div id="guide-search-results">${guideSearchResults()}</div></section>${scheduleBrowser()}
    ${duplicateWarnings(state.entries).map(w=>`<p class="notice warning">${esc(w)}</p>`).join('')}<section class="guide-course-list" aria-label="Your saved college classes">${entries.map(e => `<article class="guide-result-card"><div class="guide-course-top"><div><p class="caption">${esc(college(course(e.courseId).collegeId).name)} · ${esc(course(e.courseId).code)}</p><h2>${esc(course(e.courseId).title)}</h2><p>${statusName(e.status)} · ${esc(e.term)}</p></div><button class="text-button" data-action="guide-edit" data-id="${esc(e.id)}">Edit class</button></div>${connectedCredits(state,e)}${renderCourseWorkflow(state,e)}<details class="guide-credit-details"><summary>Review college credit</summary>${guideFacts(course(e.courseId),e)}</details></article>`).join('')}</section>
    ${renderHighSchoolRecords(state)}
    <div class="guide-actions"><button class="button primary" data-action="guide-step" data-step="colleges">${entries.length ? 'Choose colleges' : 'Continue to college choices'} ${icon('arrow')}</button><span class="guide-note">You can add more classes later.</span></div>`;
}
function guideSearchResults() {
  if (!guideSearch.trim()) return '<p class="guide-note">Search by class name or course number. We’ll keep the college and exact course number with your record.</p>';
  const q = guideSearch.trim().toLowerCase();
  const matches = COURSES.filter(c => !c.historical && (!guideCollege || c.collegeId === guideCollege) && `${c.title} ${c.code} ${c.family} ${college(c.collegeId).name} ${c.family.startsWith('engl') ? 'english writing' : ''}`.toLowerCase().includes(q));
  return matches.slice(0, 6).map(c => `<article class="guide-class-card"><div class="guide-class-copy"><h2>${esc(c.title)}</h2><p>${esc(c.code)} · ${esc(college(c.collegeId).name)} · ${localUnits(c.units, c.unitSystem)}</p></div><button class="button secondary" data-action="guide-add-class" data-course="${c.id}">Add class</button></article>`).join('') + `<p class="guide-note">${matches.length > 6 ? 'Choose a college or use a more specific search to narrow the list. ' : ''}${matches.length ? '' : 'No current class found. '}<button class="text-button" data-action="catalog">Search older course numbers</button></p>`;
}
function scheduleBrowser() {
  const schools = [...new Set(OUSD_SCHEDULE_ROWS.map(row => row.school))].sort();
  return `<details class="guide-details"><summary>Browse OUSD’s Fall 2026 college classes</summary><div><p class="guide-note">A district schedule snapshot, checked October 4, 2026. Confirm sections and enrollment with your school. High-school transcript codes were still marked TBD. A district transfer flag is separate from a university’s credit review.</p><label>High school in the district schedule<select id="schedule-school"><option value="">Choose a high school</option>${schools.map(name => `<option value="${esc(name)}" ${name === scheduleSchool ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label><div id="schedule-results">${scheduleResults()}</div><p class="caption"><a href="${esc(OUSD_SCHEDULE.source)}" target="_blank" rel="noopener noreferrer">District schedule source</a> · <a href="${esc(OUSD_SCHEDULE.linkingSource)}" target="_blank" rel="noopener noreferrer">OUSD dual-enrollment information</a></p></div></details>`;
}
function scheduleResults() {
  if (!scheduleSchool) return '<p class="guide-note">Choose a school to see its listed college classes. This does not change your graduation profile.</p>';
  const rows = OUSD_SCHEDULE_ROWS.filter(row => row.school === scheduleSchool);
  return `<p class="caption">${rows.length} published listings. Repeated course rows may represent separate sections or programs.</p><div class="guide-course-list">${rows.map(row => {
    const id = scheduleCourseId(row.id);
    return `<article class="guide-class-card"><div class="guide-class-copy"><h3>${esc(row.code)}${row.title && row.title !== row.code ? ` · ${esc(row.title)}` : ''}</h3><p>${esc((row.collegeId ? college(row.collegeId)?.name : row.collegeName) || 'College needs confirmation')} · ${row.units == null ? `Units need review (${esc(row.unitsText || 'not supplied')})` : `${row.units} ${esc(row.unitSystem || 'semester')} units`} · ${esc(row.sourceTerm || row.term)}</p><p><strong>District transfer flag:</strong> ${esc(row.transferFlag || 'Not specified')}. University award and degree use need review.</p>${row.pathway ? `<p>${esc(row.pathway)}</p>` : ''}${row.notes?.length ? `<p>${esc(Array.isArray(row.notes) ? row.notes.join(' ') : row.notes)}</p>` : ''}</div>${id ? `<button class="button secondary" data-action="schedule-add" data-course="${esc(id)}">Add listed class</button>` : `<span class="caption">${row.collegeId ? 'Confirm the individual course code in this combined or range listing before adding a record.' : 'Browse only. This college is outside the Peralta record catalog.'}</span>`}</article>`;
  }).join('')}</div>`;
}
function guideColleges() {
  return guideHeading('Which colleges are you curious about?', 'Pick any you might attend after high school. This is a starting point, not a commitment. No major needed.') +
    `<section class="guide-panel"><label class="guide-choice-row">Add a college<select id="guide-destination"><option value="">Choose a college to add</option>${['UC', 'HBCU'].map(type => `<optgroup label="${type === 'UC' ? 'University of California' : 'Historically Black colleges & universities'}">${DESTINATIONS.filter(d => d.type === type && !state.profile.destinationIds.includes(d.id)).map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</optgroup>`).join('')}</select></label><div class="guide-chips">${selectedTargets().map(d => `<button data-action="guide-remove-target" data-target="${d.id}" aria-label="Remove ${esc(d.name)}">${esc(d.name)} <span aria-hidden="true">×</span></button>`).join('')}</div>${!selectedTargets().length ? '<p class="guide-note">Not sure yet? Continue without choosing. We’ll help you prepare a question for a counselor.</p>' : '<p class="guide-note">You can change this list at any time.</p>'}</section><div class="guide-actions"><button class="button primary" data-action="guide-step" data-step="next">${selectedTargets().length ? 'See next-class ideas' : 'Continue, I’m not sure yet'} ${icon('arrow')}</button><button class="text-button" data-action="guide-step" data-step="classes">Back to my classes</button></div>`;
}
function finalGradeField(value = '') {
  return `<label>Final grade, if available<select name="finalGrade"><option value="">Not recorded</option>${FINAL_GRADES.map(grade => `<option value="${grade}" ${grade === value ? 'selected' : ''}>${grade}</option>`).join('')}</select></label><p class="guide-note">Student-entered grade. Completed means the attempt ended, not necessarily passed. A grade does not confirm credit.</p>`;
}
function formError(form, error) {
  let message = form.querySelector('.form-error');
  if (!message) { message = document.createElement('p'); message.className = 'form-error'; message.setAttribute('role', 'alert'); form.append(message); }
  message.textContent = error.message || 'Review the record before saving.';
}
function saveWorkflowForm(form) {
  const entry = state.entries.find(item => item.id === form.dataset.entry);
  if (!entry) throw new Error('This class is no longer in your record.');
  const values = new FormData(form);
  entry.workflow = normalizeCourseWorkflow({ ...Object.fromEntries(values), scheduleConfirmed: values.get('scheduleConfirmed') === 'on', linkedCourseId: entry.courseId, linkedTerm: entry.term, linkedStatus: entry.status, linkedCustomCourseKey: customCourseSnapshot(entry) });
  persist();
}
function guideCourseDialog(courseId, entryId, allowPlanned = false) {
  const c = course(courseId);
  const existing = state.entries.find(e => e.id === entryId);
  if (existing?.customCourse) { openDialog('Your college class', customCourseForm(state, entryId)); return; }
  const [season = '', year = ''] = existing?.term.split(' ') || [];
  openDialog(existing ? 'Update this class.' : 'Tell us about this class.', `<form id="guide-course-form" data-course="${c.id}" data-entry="${esc(entryId || '')}"><p class="dialog-lede">${esc(c.title)}<br>${esc(c.code)} · ${esc(college(c.collegeId).name)}</p><label>Have you finished this class?<select name="status" required><option value="">Choose a status</option>${[['completed','Yes, I finished it'],['in-progress','I’m taking it now'],...(existing || allowPlanned ? [['planned','It’s in my draft plan']] : [])].map(([value,label]) => `<option value="${value}" ${existing?.status === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>${c.scheduleOnly ? `<p class="guide-note">OUSD Fall 2026 listing. District transfer flags do not establish a receiving-college award. Verify the exact code and units before enrolling.</p>` : ''}<p class="guide-note">When did it start? The term helps us check the right year of credit information.</p><div class="field-row"><label>Term<select name="season" required><option value="">Choose a term</option>${['Fall','Winter','Spring','Summer'].map(s=>`<option ${s===season?'selected':''}>${s}</option>`).join('')}</select></label><label>Year<input name="year" type="number" min="2000" max="2099" placeholder="Year" required value="${esc(year)}"></label></div>${finalGradeField(existing?.finalGrade)}<div class="dialog-actions"><button class="button secondary" type="button" data-action="close">Back</button><button class="button primary" type="submit">Save class</button></div></form>`);
}
function guideFacts(c, entry) {
  const facts = briefEvidence(c, state, entry);
  const listings = OUSD_SCHEDULE_ROWS.filter(row => scheduleCourseId(row.id) === c.id);
  const scheduleNote = listings.length ? `<p class="guide-note">OUSD Fall 2026 schedule flag: ${esc([...new Set(listings.map(row => row.transferFlag))].join(' / '))}. This district listing is separate from the university evidence below. <a href="${esc(OUSD_SCHEDULE.source)}" target="_blank" rel="noopener noreferrer">Schedule source</a></p>` : '';
  return `${scheduleNote}<div class="guide-facts"><div><h3>What we know</h3><ul>${(facts.known.length ? facts.known : ['We don’t have a verified credit match for your selected colleges.']).map(text=>`<li>${esc(text)}</li>`).join('')}</ul></div><div><h3>What still needs checking</h3><ul>${studentChecks(c, state, entry).map(text=>`<li>${esc(text)}</li>`).join('')}</ul></div></div>
    <details class="guide-credit-details"><summary>See all credit details</summary><div class="guide-credit-content"><h3>Complete conditions to review</h3><ul>${facts.check.map(text=>`<li>${esc(text)}</li>`).join('')}</ul>${selectedTargets().map(d=>`<section><h3>${esc(d.name)}</h3>${evidenceBlock(c,d,entry)}</section>`).join('')}</div></details>`;
}
function guidePlanSettings() {
  return `<details class="guide-details"><summary>Peralta class ideas (optional): ${state.profile.collegeIds.map(id=>college(id).shortName).join(', ') || 'Choose a Peralta college'} · ${esc(state.profile.planningTerm)}</summary><form id="guide-settings-form"><fieldset><legend>Peralta colleges to research, if useful</legend>${COLLEGES.map(c=>`<label class="checkbox-row"><input type="checkbox" name="colleges" value="${c.id}" ${state.profile.collegeIds.includes(c.id)?'checked':''}>${esc(c.name)}</label>`).join('')}</fieldset><div class="field-row">${termFields(state.profile.planningTerm)}</div><button class="button secondary" type="submit">Update class ideas</button></form></details>`;
}
function guideQuestionContext() {
  const saved = state.journey.questions.find(questionIsCurrent);
  if (saved) return {entry:state.entries.find(e=>e.courseId===saved.courseId && e.term===saved.term),target:destination(saved.destinationId)};
  const entry = state.entries.find(e=>e.status==='planned') || state.entries[0];
  const target = selectedTargets().find(d=>entry && compareCourse(entry.courseId,d,entry).kind==='unknown') || selectedTargets()[0] || destination('');
  return entry && target ? {entry,target} : null;
}
function guideQuestionForm() {
  const context = guideQuestionContext();
  if (!context) return '';
  const { entry, target } = context;
  const template = createAdvisorQuestion(course(entry.courseId), target, entry);
  const existing = state.journey.questions.find(q=>q.id===template.id);
  const text = existing?.text || (target.id === '' ? template.text : `Could ${course(entry.courseId).code} at ${college(course(entry.courseId).collegeId).name} in ${entry.term} count toward my degree at ${target.name}? What grade, transcript, and class requirements should I check? I’m taking college classes while in high school.`);
  return `<section class="guide-panel guide-question"><h2>One useful question to take with you</h2><p>You can edit this. Saving keeps it with your plan and sends nothing.</p><form id="question-form" data-entry="${esc(entry.id)}" data-target="${esc(target.id)}"><label>Your question<textarea name="question" rows="4" maxlength="1500" required>${esc(text)}</textarea></label><div class="guide-actions"><button class="button primary" type="submit">Save question with my plan</button><button type="button" class="text-button" data-action="guide-question-later">Maybe later</button></div></form></section>`;
}
function guideNoCandidates() {
  const text = state.guide.note || `I’m a high-school student considering college classes${state.profile.collegeIds.length ? ` at ${state.profile.collegeIds.map(id=>college(id).name).join(' or ')}` : ''}. ${selectedTargets().length ? `I’m curious about ${selectedTargets().map(d=>d.name).join(', ')}.` : 'I haven’t chosen a university yet.'} Which class could I take next, and what prerequisites and credit rules should I check?`;
  return `<section class="guide-panel guide-question"><h2>${state.guide.note ? 'Your question is saved.' : 'Start with a question, not a guess.'}</h2><p>${selectedTargets().length ? 'The available evidence doesn’t support a next-class shortlist for this plan.' : 'Without a destination college, we can’t compare where a class might count.'} A counselor can help you choose a class.</p><form id="guide-note-form"><label>Take this to your counselor<textarea name="note" rows="4" maxlength="1500" required>${esc(text)}</textarea></label><button class="button primary" type="submit">${state.guide.note ? 'Update saved question' : 'Save my question'}</button></form>${state.guide.note ? '<button class="text-button" data-action="download-summary">Download my review copy</button>' : ''}</section>`;
}
function guideNext() {
  const planned = state.entries.filter(e=>e.status==='planned');
  const groups = guidedCandidates(state);
  const selectedGroup = groups.find(g=>g.family===guideFamily);
  const selected = selectedGroup?.options.find(o=>o.course.id===guideCourseId)?.course;
  const heading = planned.length && !showGuideAlternatives ? ['Your draft is saved.', 'One class to discuss is a useful next step. This is a plan, not enrollment or credit earned.'] : ['Explore classes for next term.', 'Explore a small shortlist, then save one class to discuss with a counselor.'];
  if (!planned.length && state.profile.collegeIds.length && !groups.length) { heading[0]='Start with a useful question.'; heading[1]='A counselor can help you choose a class. Save a question to take to that conversation.'; }
  let content = guideHeading(...heading) + renderGraduationProgress(state);

  content += guidePlanSettings();
  content += `<div class="guide-actions"><button class="button secondary" data-action="custom-add" data-planning="true">Plan another college class</button><span class="guide-note">Any college. Transfer credit still needs review.</span></div>`;
  if (planned.length && !showGuideAlternatives) {
    if (!guideQuestionOpen) content += `<div class="guide-actions guide-next-action"><button class="button primary" data-action="${state.journey.questions.length ? 'download-summary' : 'guide-question'}">${state.journey.questions.length ? 'Save a copy for my counselor' : 'Prepare my question'} ${icon('arrow')}</button><span class="guide-note">Next: ask a counselor to review this draft.</span></div>`;
    content += `<section class="guide-draft">${planned.map(e=>`<article class="guide-result-card"><span class="badge green">Saved draft · ${esc(e.term)}</span><div class="guide-course-top"><div><h2>${esc(course(e.courseId).title)}</h2><p>${esc(course(e.courseId).code)} · ${esc(college(course(e.courseId).collegeId).name)} · ${localUnits(course(e.courseId).units, course(e.courseId).unitSystem)}</p></div></div>${connectedCredits(state,e)}${renderCourseWorkflow(state,e)}${guideFacts(course(e.courseId),e)}<div class="guide-result-actions"><button class="text-button" data-action="guide-edit" data-id="${esc(e.id)}">Edit this class</button></div></article>`).join('')}</section>`;
    if (guideQuestionOpen) content += guideQuestionContext() ? guideQuestionForm() : guideNoCandidates();
    else {
      const questions = state.journey.questions;
      content += `<section class="guide-panel guide-question"><h2>Your next step: talk it through.</h2>${questions.length ? questions.map(q=>`<p>${esc(q.text)}</p><p class="caption">${questionIsCurrent(q) ? 'Saved question' : 'Plan changed: review this question'} · ${esc(questionCourse(q).code)} · ${esc(questionCollege(q).name)} → ${esc(destination(q.destinationId).name)}</p>`).join('') : '<p>Ask a counselor whether this class fits your plans and what you need before enrolling.</p>'}${questions.length ? '<button class="text-button" data-action="guide-question">Edit a question</button>' : ''}</section>`;
    }
    const t=totals(state.entries);
    content += `<div class="guide-mini-totals"><span><strong>${t.completed}</strong> completed-attempt semester units</span><span><strong>${t.inProgress}</strong> in progress</span><span><strong>${t.planned}</strong> planned, not earned</span></div>${unknownUnitsNotice(t)}${duplicateWarnings(state.entries).map(w=>`<p class="notice warning">${esc(w)}</p>`).join('')}<button class="text-button" data-action="guide-more-ideas">Explore another class</button>`;
  } else if (!groups.length) content += guideNoCandidates();
  else {
    content += `<p class="guide-note">This is a small researched catalog, not a full class schedule. Class ideas are ordered by available evidence, not by what is best for you.</p><div class="guide-course-list">${groups.map(g=>`<article class="guide-class-card"><label class="guide-class-copy"><input type="radio" name="guide-family" value="${g.family}" ${guideFamily===g.family?'checked':''}> <strong>${esc(g.options[0].course.title)}</strong><p>${esc(g.options[0].course.code)} · ${g.options.map(o=>college(o.course.collegeId).shortName).join(' or ')}</p></label></article>`).join('')}</div>`;
    if (selectedGroup) content += `<section class="guide-panel"><label class="guide-candidate-select">Choose the college for this class<select id="guide-candidate"><option value="">Choose a college</option>${selectedGroup.options.map(o=>`<option value="${o.course.id}" ${o.course.id===guideCourseId?'selected':''}>${esc(college(o.course.collegeId).name)} · ${localUnits(o.course.units)}</option>`).join('')}</select></label>${selected ? `${guideFacts(selected,{term:state.profile.planningTerm,status:'planned'})}<div class="guide-actions"><button class="button primary" data-action="guide-save-plan" data-course="${selected.id}">Save this class to my draft ${icon('arrow')}</button><span class="guide-note">For ${esc(state.profile.planningTerm)}. Not enrollment.</span></div>` : '<p class="guide-note">The college matters. Choose where you would take this exact class.</p>'}</section>`;
  }
  return content + `<div class="guide-actions"><button class="text-button" data-action="guide-step" data-step="colleges">Back to my colleges</button><a class="text-button" href="#summary">Full review & exports</a></div>`;
}

function questionCourse(question) { return question.customCourse ? resolveEntryCourse({id:question.courseId.slice(7),courseId:question.courseId,customCourse:question.customCourse}) : course(question.courseId); }
function questionCollege(question) { const c = questionCourse(question); return c.custom ? {name:c.collegeName,shortName:c.collegeName} : college(c.collegeId); }
function questionIsCurrent(question) {
  return (question.destinationId === '' || state.profile.destinationIds.includes(question.destinationId))
    && state.entries.some(entry => entry.courseId === question.courseId && entry.term === question.term && (!entry.customCourse || customCourseSnapshot(entry) === JSON.stringify(question.customCourse)));
}
function chooseQuestionContext() {
  const pairs = state.entries.flatMap(entry => selectedTargets().map(target => ({ entry, target, result: compareCourse(course(entry.courseId), target, entry) })));
  return pairs.find(pair => pair.result.kind === 'unknown')
    || pairs.find(pair => pair.result.yearMismatch)
    || pairs.find(pair => pair.result.kind === 'preliminary') || pairs[0]
    || (state.entries.length ? {entry:state.entries[0],target:destination('')} : undefined);
}
function questionsPanel() {
  return `<section class="panel question-panel"><div class="panel-heading"><div><p class="eyebrow">TAKE SOMETHING USEFUL WITH YOU</p><h2>My advisor questions</h2></div><button class="text-button" data-action="prepare-question">${icon('plus')} Prepare a question</button></div>${state.journey.questions.length ? state.journey.questions.map(q => `<article class="saved-question"><div>${badge(questionIsCurrent(q) ? 'Question prepared' : 'Plan changed: revisit this question', questionIsCurrent(q) ? 'green' : 'sand')}<p>${esc(q.text)}</p><span class="caption">${esc(questionCourse(q).code)} · ${esc(questionCollege(q).name)} · ${esc(q.term)} → ${esc(destination(q.destinationId).name)}</span></div><button class="text-button danger" data-action="remove-question" data-id="${esc(q.id)}" aria-label="Remove question about ${esc(questionCourse(q).code)} for ${esc(destination(q.destinationId).name)}">Remove</button></article>`).join('') : '<p class="lede">An unknown answer is a useful place to start a conversation. Save a question about one of your courses. It will appear in your review summary.</p>'}</section>`;
}
function journeyView() {
  const journey = deriveJourney(state);
  const next = journey.nextStep;
  const planned = state.entries.filter(entry => entry.status === 'planned');
  const context = chooseQuestionContext();
  const example = context && createAdvisorQuestion(course(context.entry.courseId), context.target, context.entry);
  return `<section class="journey-hero"><div><p class="eyebrow">MY JOURNEY · A PLANNING PREVIEW</p><h1 id="page-title" tabindex="-1">A little direction.<br>A world of possibility.</h1><p>You don’t need to decide your whole future today. Build a plan for your next conversation.</p><span class="interest-note">${esc(state.profile.major || 'Undecided')} <span>· Always room to change your mind.</span></span></div><div class="journey-progress"><span class="progress-flower" aria-hidden="true">✳</span><strong>${journey.completed}<small>of ${journey.total}</small></strong><span>planning steps done</span><progress value="${journey.completed}" max="${journey.total}" aria-label="Planning steps completed">${journey.completed} of ${journey.total}</progress><p>This tracks planning actions, not credits earned, college readiness, or admission chances.</p></div></section>
  <section class="journey-next"><div class="next-symbol" aria-hidden="true">↗</div><div><p class="eyebrow">${next ? 'YOUR NEXT SMALL STEP' : 'A USEFUL PLAN TO BRING ALONG'}</p><h2>${next ? esc(next.title) : 'Ready for a planning conversation.'}</h2><p>${next ? esc(next.detail) : 'Your draft and questions are together. A school still needs to review credit and requirements.'}</p></div><button class="button primary" data-action="${next ? esc(next.action) : 'summary'}">${next ? 'Take this step' : 'Review my summary'} ${icon('arrow')}</button></section>
  <div class="journey-grid"><section class="panel roadmap"><div class="section-line"><h2>Your path, at your pace.</h2><span>No streaks. No rush.</span></div><ol>${journey.steps.map((step, index) => `<li class="journey-step ${step.done ? 'done' : ''} ${next?.id === step.id ? 'next' : ''}"><span class="step-marker" aria-hidden="true">${step.done ? '✓' : String(index + 1).padStart(2, '0')}</span><div><div class="step-title"><h3>${esc(step.title)}</h3><span>${step.done ? 'Done' : 'To explore'}</span></div><p>${esc(step.detail)}</p><button class="text-button" data-action="${esc(step.action)}">${step.done ? 'Revisit this step' : 'Explore this step'} →</button></div></li>`).join('')}</ol><p class="caption roadmap-note">Opening evidence records a visit only. It does not confirm understanding, accuracy, credit, or eligibility. Your steps update when your plan changes.</p></section>
  <div class="journey-side"><section class="panel futures-panel"><p class="eyebrow">POSSIBLE FUTURES</p><h2>A shortlist, not a decision.</h2><div class="future-chips">${selectedTargets().length ? selectedTargets().map(d => `<span>${esc(d.name)}</span>`).join('') : '<p class="lede">Start with the colleges you’re curious about.</p>'}</div><button class="text-button" data-action="go-destinations">Explore or change colleges ${icon('arrow')}</button><p class="caption">These are your selections, not matches or unlocked destinations.</p></section>
  <section class="panel journey-semester"><p class="eyebrow">THE PLAN YOU’RE MAKING</p><h2>My next semester</h2><p class="caption">Draft courses, each with its own term. No enrollment or awarded credit.</p>${planned.length ? planned.map(entry => `<div class="journey-course"><strong>${esc(course(entry.courseId).code)}</strong><p>${esc(college(course(entry.courseId).collegeId).name)} · ${esc(entry.term)}</p><button class="text-button" data-action="edit" data-id="${esc(entry.id)}">Edit course</button></div>`).join('') : '<p class="semester-empty">A course worth discussing can start your draft.</p>'}<button class="button secondary full" data-action="go-plan">${planned.length ? 'Keep shaping my plan' : 'Explore course candidates'} ${icon('arrow')}</button></section></div></div>
  ${example ? `<section class="question-prompt"><div><p class="eyebrow">TURN AN OPEN QUESTION INTO A NEXT STEP</p><h2>${esc(course(context.entry.courseId).code)} → ${esc(context.target.name)}</h2><p>${esc(example.text)}</p><span class="caption">Research snapshot: Oct 4, 2026. UC course evidence: 2025–26. Unverified is not rejected.</span></div><button class="button secondary" data-action="prepare-question" data-entry="${esc(context.entry.id)}" data-target="${esc(context.target.id)}">Make this my question ${icon('plus')}</button></section>` : ''}
  ${questionsPanel()}<div class="journey-finish"><p>Your next conversation starts with what you have.</p><button class="button primary" data-action="summary">Review my semester & questions ${icon('arrow')}</button></div>`;
}

function prepareQuestionDialog(entryId, targetId) {
  const context = entryId ? { entry: state.entries.find(e => e.id === entryId), target: destination(targetId) || selectedTargets()[0] || destination('') } : chooseQuestionContext();
  if (!context?.entry || !context?.target) {
    openDialog('Give your question a starting point.', '<p class="dialog-lede">Choose a destination and add a course first. Then prepare a question about that exact course, college, and term.</p><div class="dialog-actions"><button class="button secondary" data-action="question-setup">Choose colleges</button><button class="button primary" data-action="catalog">Add a course</button></div>');
    return;
  }
  const { entry, target } = context;
  const template = createAdvisorQuestion(course(entry.courseId), target, entry);
  const existing = state.journey.questions.find(q => q.id === template.id);
  openDialog('A question worth asking.', `<form id="question-form" data-entry="${esc(entry.id)}" data-target="${esc(target.id)}"><p class="dialog-lede">${esc(course(entry.courseId).code)} · ${esc(college(course(entry.courseId).collegeId).name)} · ${esc(entry.term)} → ${esc(target.name)}</p><label>Your question<textarea name="question" maxlength="1500" rows="7" required>${esc(existing?.text || template.text)}</textarea></label><p class="caption">Make it your own. Saving prepares a question, not an answer. It stays in this browser and joins your review summary.</p><div class="dialog-actions"><button class="button secondary" type="button" data-action="close">Keep exploring</button><button class="button primary" type="submit">Save my question ${icon('check')}</button></div></form>`);
}

function overview() {
  const t = totals(state.entries);
  const options = suggestCourses(state);
  return `<section class="hero"><div class="hero-copy"><p class="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p><h1 id="page-title" tabindex="-1">Keep your<br>options open.</h1><p>Choose your next college course while keeping your future options open.</p><div class="hero-actions"><button class="button lime" data-action="${state.setupComplete ? 'go-plan' : 'setup'}">${state.setupComplete ? 'Explore next courses' : 'Build my path'} ${icon('arrow')}</button>${!state.setupComplete ? '<button class="hero-link" data-action="demo">Try a sample journey ↗</button>' : '<button class="hero-link" data-action="catalog">Add a course +</button>'}</div></div>
  <div class="path-art" aria-hidden="true"><svg viewBox="0 0 420 295"><defs><pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#79a898" opacity=".35"/></pattern></defs><rect width="420" height="295" fill="url(#dots)"/><path d="M65 253V195Q65 155 113 155H215Q251 155 251 116V70" fill="none" stroke="#a9ca8b" stroke-width="3"/><path d="M139 155H305Q343 155 343 193V228" fill="none" stroke="#a9ca8b" stroke-width="3" stroke-dasharray="6 7"/><circle cx="65" cy="253" r="9" fill="#d9f0b5"/><circle cx="251" cy="70" r="7" fill="#d9f0b5"/><circle cx="343" cy="228" r="7" fill="#efb791"/></svg><div class="art-card art-start"><span>THE STARTING POINT</span><strong>Your curiosity.</strong><small>One thoughtful course at a time.</small></div><div class="art-label art-uc">UC possibilities ↗</div><div class="art-label art-hbcu">HBCU possibilities ↗</div><div class="art-caption">You don’t need every answer yet.</div></div></section>
  <div class="section-line"><h2>Your path so far</h2><span>${state.setupComplete ? `${recordedGraduationYear() ? `Class of ${esc(recordedGraduationYear())}` : 'Graduation year not provided'} · ${esc(state.profile.major || 'Undecided')}` : 'Start where you are.'}</span></div>
  <div class="stats-grid">${[['Completed', t.completed, 'Student-reported local units', 'check'], ['In progress', t.inProgress, 'Local units you are taking', 'courses'], ['In your plan', t.planned, 'Local units to discuss next', 'plan']].map(([label, count, desc, i]) => `<div class="stat-card"><div><span class="stat-label">${label}</span><strong>${count}<small>units</small></strong><p>${desc}</p></div><span class="stat-icon">${icon(i)}</span></div>`).join('')}</div>
  ${unknownUnitsNotice(t)}<div class="dashboard-grid"><section class="panel"><div class="panel-heading"><div><p class="eyebrow">SMALL STEPS, MORE CLARITY</p><h2>${state.entries.length ? 'Your course notebook' : 'A plan that starts with you'}</h2></div>${state.entries.length ? '<button class="text-button" data-action="go-courses">View all →</button>' : ''}</div>
  ${state.entries.length ? state.entries.slice(0, 3).map(entry => miniCourse(entry)).join('') : `<ol class="start-steps"><li><span>01</span><div><strong>Pick your starting colleges</strong><p>Laney, Merritt, Berkeley City, or Alameda.</p></div></li><li><span>02</span><div><strong>Add what you’ve taken</strong><p>Keep completed, current, and planned courses together.</p></div></li><li><span>03</span><div><strong>See the evidence. Choose a next step.</strong><p>Compare destinations and take questions to a counselor.</p></div></li></ol>`}
  </section><section class="panel next-panel"><p class="eyebrow">A THOUGHTFUL NEXT STEP</p><h2>${options.length ? 'Look ahead, without the guesswork.' : 'Your future is still open.'}</h2><p>${options.length ? 'Explore course candidates with documented credit evidence. Then check prerequisites and fit with your counselor.' : 'Choose a few destinations. We’ll show what the research supports, and which questions still need a school’s answer.'}</p><button class="text-button" data-action="${state.setupComplete ? 'go-plan' : 'setup'}">${state.setupComplete ? 'Explore planning candidates' : 'Get started'} ${icon('arrow')}</button><div class="tiny-rule"></div><span class="caption">${selectedTargets().length} destinations selected · Major: ${esc(state.profile.major || 'Undecided')}</span></section></div>
  <div class="notice">${icon('info')}<div><strong>Credit is more than one question.</strong><p>Unit credit, a course equivalent, and a degree requirement are different things. This prototype keeps them separate. Final credit awards and requirements need school review.</p></div></div>`;
}
function unknownUnitsNotice(t) {
  const notices = [];
  if (Object.values(t.unknownByStatus || {}).some(Boolean)) notices.push('Some courses have unverified or variable local units and are excluded from numeric totals.');
  if (t.quarterByStatus) notices.push(`Quarter-unit course load, counted separately: ${t.quarterByStatus.completed} completed; ${t.quarterByStatus.inProgress} in progress; ${t.quarterByStatus.planned} planned.`);
  if (t.unclassifiedByStatus) notices.push(`Unit system not recorded for ${Object.values(t.unclassifiedByStatus).reduce((sum,value)=>sum+value,0)} course record(s). Those records are excluded from semester and quarter totals.`);
  return notices.length ? `<div class="notice warning">${notices.map(esc).join(' ')}</div>` : '';
}
function miniCourse(entry, controls = false) {
  const c = course(entry.courseId);
  return `<article class="course-row"><div class="subject-square ${esc(c.subject?.toLowerCase())}">${esc(c.code.split(' ')[0].slice(0, 3))}</div><div class="course-main"><div class="course-code">${esc(c.code)} <span>· ${esc(college(c.collegeId).shortName || college(c.collegeId).name)}</span></div><h3>${esc(c.title)}</h3><p>${esc(entry.term)} · ${localUnits(c.units, c.unitSystem)}${c.historical ? ' · Historical identity' : ''} · Final grade: ${esc(entry.finalGrade || 'Not recorded')}</p></div><div class="course-end">${badge(statusName(entry.status), entry.status === 'completed' ? 'green' : entry.status === 'planned' ? 'sand' : 'muted')}${controls ? `<button class="text-button" data-action="edit" data-id="${esc(entry.id)}" aria-label="Edit ${esc(c.code)} from ${esc(college(c.collegeId).name)}">Edit</button>` : ''}</div></article>`;
}
function myCourses() {
  const rows = state.entries.filter(e => (listFilter === 'all' || e.status === listFilter) && `${course(e.courseId).code} ${course(e.courseId).title} ${college(course(e.courseId).collegeId).name}`.toLowerCase().includes(search.toLowerCase()));
  const warnings = duplicateWarnings(state.entries);
  return pageHead('YOUR COURSE NOTEBOOK', 'Every course has a place.', 'Keep your original college, term, and course number together. These are student-reported records.', addButton) +
    `<div class="filterbar"><label class="search-field"><span class="sr-only">Search my courses</span><span aria-hidden="true">⌕</span><input id="my-search" type="search" placeholder="Search your courses or colleges" value="${esc(search)}"></label><label><span class="sr-only">Filter course status</span><select id="list-filter">${[['all', 'All statuses'], ['completed', 'Completed'], ['in-progress', 'In progress'], ['planned', 'Planned']].map(([v, l]) => `<option value="${v}" ${listFilter === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
    ${warnings.map(w => `<div class="notice warning">${icon('info')}<div>${esc(w)}</div></div>`).join('')}
    <section class="panel course-list">${rows.length ? rows.map(e => `<div>${miniCourse(e, true)}${renderCourseWorkflow(state,e)}</div>`).join('') : `<div class="empty-state">${icon('courses')}<h2>${state.entries.length ? 'No courses match that search.' : 'Start with a course you know.'}</h2><p>${state.entries.length ? 'Try a course number, college, or another status.' : 'Add a completed course, something you’re taking, or an idea for next semester.'}</p>${addButton}</div>`}</section>
    <p class="caption">Totals show recorded course load, including failed completed attempts, using known local semester units. No destination credit is awarded by this app. Missing grades and eligibility conditions remain unverified.</p>`;
}
function destinationsPage() {
  const group = type => `<section class="destination-section"><div class="section-line"><h2>${type === 'UC' ? 'University of California' : 'HBCU pilot shortlist'}</h2><span>${type === 'UC' ? 'All 9 undergraduate campuses' : '5 destinations to explore'}</span></div><div class="destination-grid">${DESTINATIONS.filter(d => d.type === type).map(d => `<label class="destination-card ${state.profile.destinationIds.includes(d.id) ? 'selected' : ''}"><input type="checkbox" data-destination="${esc(d.id)}" ${state.profile.destinationIds.includes(d.id) ? 'checked' : ''}><span class="school-symbol">${type === 'UC' ? 'UC' : d.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</span><span><strong>${esc(d.name)}</strong><small>${type === 'UC' ? 'Shared UC unit-credit evidence' : d.name.includes('Carolina') ? 'Some preliminary course equivalents' : 'Policy found · course matches unverified'}</small></span></label>`).join('')}</div></section>`;
  return pageHead('PLACES YOU COULD GO', 'Make room for possibilities.', 'Choose schools to compare. You can change these at any time.', `<button class="button primary" data-action="go-compare">Compare ${selectedTargets().length} destinations ${icon('arrow')}</button>`) + group('UC') + group('HBCU') + `<section class="panel"><h2>Policy notes for your shortlist</h2>${selectedTargets().length ? selectedTargets().map(d => `<details><summary>${esc(d.name)}</summary><p class="lede">${esc(d.policyNote)}</p><a href="${esc(d.policyUrl)}" target="_blank" rel="noopener noreferrer">Read the school’s policy ↗</a></details>`).join('') : '<p class="caption">Select a destination to see its policy source and what still needs review.</p>'}</section><div class="notice">${icon('info')}<div><strong>A shortlist, not an admission or fit assessment.</strong><p>Schools have their own eligibility and applicant policies. Less evidence here means more research is needed, not less opportunity. UC facts are one systemwide evidence group, not nine independent degree-requirement matches.</p></div></div>`;
}
function comparison() {
  const targets = selectedTargets();
  const cells = (e, d) => {
    const r = compareCourse(course(e.courseId), d, e);
    return `<td><div class="credit-cell">${badge(r.label, evidenceColor(r))}<strong>${esc(r.unitsText)}</strong>${r.equivalentText ? `<p>${esc(r.equivalentText)}</p>` : ''}<div class="cell-rule"><span>GE / major use</span><p>${esc(r.requirementText)}</p></div><p class="cell-year">${esc(r.yearText)}</p><button class="text-button" data-action="evidence" data-course="${esc(e.courseId)}" data-target="${esc(d.id)}" data-entry="${esc(e.id)}">Read evidence ${icon('arrow')}</button></div></td>`;
  };
  return pageHead('THE EVIDENCE, SIDE BY SIDE', 'What might count, and where.', 'Unit credit is only the first question. See the evidence and keep the open questions visible.', '<button class="button secondary" data-action="go-destinations">Change destinations</button>') +
  `<div class="notice compact">${icon('info')}<div>ASSIST evidence covers <strong>2025–26</strong>. Courses taken in another academic year need rechecking. A published equivalent is not a final award.</div></div>` +
  (!targets.length || !state.entries.length ? `<section class="panel empty-state">${icon('compare')}<h2>${!targets.length ? 'Choose a destination to compare.' : 'Add a course to see its evidence.'}</h2><p>See unit credit, degree-use questions, and the source behind each answer.</p><button class="button primary" data-action="${!targets.length ? 'go-destinations' : 'catalog'}">${!targets.length ? 'Choose destinations' : 'Add a course'}</button></section>` :
  `<p class="caption table-hint">${state.entries.length} courses × ${targets.length} destinations · Scroll the table sideways to compare →</p><div class="matrix-wrap" role="region" aria-label="Course credit comparison, scroll horizontally for all destinations" tabindex="0"><table class="matrix"><caption class="sr-only">Course evidence by destination. All GE and major applicability requires review.</caption><thead><tr><th scope="col">Your course</th>${targets.map(d => `<th scope="col"><span>${d.type === 'UC' ? 'UC CAMPUS' : 'HBCU'}</span>${esc(d.name)}</th>`).join('')}</tr></thead><tbody>${state.entries.map(e => `<tr><th scope="row"><strong>${esc(course(e.courseId).code)}</strong><span class="matrix-title">${esc(course(e.courseId).title)}</span><span>${esc(college(course(e.courseId).collegeId).name)}</span><span>${esc(e.term)} · ${esc(statusName(e.status))}</span><span>${localUnits(course(e.courseId).units, course(e.courseId).unitSystem)}</span></th>${targets.map(d => cells(e, d)).join('')}</tr>`).join('')}</tbody></table></div>`) +
  `<p class="caption">No verified match means unknown, not rejected. Published UC unit evidence does not independently establish campus GE or major completion. First-year dual enrollment is the route used here.</p>`;
}
function planner() {
  const candidates = suggestCourses(state);
  const plan = state.entries.filter(e => e.status === 'planned');
  const hasCoverage = selectedTargets().some(d => d.type === 'UC' || d.id === 'ncat');
  return pageHead('ONE THOUGHTFUL NEXT STEP', 'What could you take next?', 'Planning candidates from documented evidence. Course fit and readiness come next.', '<button class="button secondary" data-action="setup">Edit planning term</button>') +
    `<div class="planner-layout"><section><div class="section-line"><h2>Courses to consider next</h2><span>${esc(state.profile.planningTerm)}</span></div><div class="notice compact">${icon('info')}<div>Ordered by evidence coverage, not academic fit. UC counts as one evidence group. Missing HBCU evidence does not make a course less valuable.</div></div>
    ${!state.profile.collegeIds.length || !selectedTargets().length ? `<div class="panel empty-state"><h2>A little context helps.</h2><p>Choose at least one Peralta college and a destination to see candidates.</p><button class="button primary" data-action="setup">Set up my path</button></div>` : candidates.length ? candidates.map((item, i) => `<article class="candidate panel"><div class="candidate-top"><span class="candidate-number">${String(i + 1).padStart(2, '0')}</span><div><div class="course-code">${esc(item.course.code)} <span>· ${esc(college(item.course.collegeId).shortName || college(item.course.collegeId).name)}</span></div><h2>${esc(item.course.title)}</h2><p class="caption">${localUnits(item.course.units)}</p></div></div><p class="candidate-reason">${esc(item.reason)}</p><p class="candidate-review">${icon('info')}${esc(item.reviewText)}</p><div class="candidate-actions"><button class="text-button" data-action="candidate-evidence" data-course="${esc(item.course.id)}">Explore credit evidence →</button><button class="button secondary small" data-action="add-plan" data-course="${esc(item.course.id)}">${icon('plus')} Add to plan</button></div></article>`).join('') : `<div class="panel empty-state">${icon('check')}<h2>${hasCoverage ? 'You’ve explored this research set.' : 'More evidence is needed.'}</h2><p>${hasCoverage ? 'There are no additional documented candidates after existing courses and duplicate families are excluded.' : 'No exact course matches were verified for your selected destinations. We cannot rank candidates from policy pages alone. This is an open question, not a rejection of your courses.'} This small catalog is not the full range of worthwhile courses.</p>${!hasCoverage ? '<button class="button secondary" data-action="go-destinations">Review destinations</button>' : ''}</div>`}</section>
    <aside class="plan-aside panel"><p class="eyebrow">YOUR DISCUSSION DRAFT</p><h2>Next semester</h2><p class="caption">${plan.length} planned courses · ${totals(plan).planned} known local semester units</p>${plan.length ? plan.map(e => `<div class="plan-item"><strong>${esc(course(e.courseId).code)}</strong><p>${esc(college(course(e.courseId).collegeId).shortName || college(course(e.courseId).collegeId).name)} · ${esc(e.term)}</p><div><button class="text-button" data-action="edit" data-id="${esc(e.id)}">Edit</button><button class="text-button danger" data-action="remove" data-id="${esc(e.id)}">Remove</button></div></div>`).join('') : '<div class="plan-empty">Add a candidate to start a conversation, not an enrollment.</div>'}<div class="tiny-rule"></div><h3>Before you enroll</h3><ul class="checklist"><li>Check prerequisites and placement.</li><li>Confirm course availability and permission to enroll.</li><li>Ask about current-year credit and degree use.</li></ul><button class="button primary full" data-action="summary">Prepare review summary ${icon('arrow')}</button></aside></div>`;
}

function evidenceBlock(c, d, entry) {
  const r = compareCourse(c, d, entry);
  return `<div class="evidence-block">${badge(r.label, evidenceColor(r))}<dl><dt>Unit credit</dt><dd>${esc(r.unitsText)}</dd><dt>Course equivalent</dt><dd>${esc(r.equivalentText || 'No verified equivalent')}</dd><dt>GE / major requirement</dt><dd>${esc(r.requirementText)}</dd><dt>Evidence year and course term</dt><dd>${esc(r.yearText)} · Student term: ${esc(entry.term)}</dd><dt>Applicant route</dt><dd>${esc(r.applicantText)}</dd></dl><ul class="evidence-notes">${r.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul><h3>Check the source</h3><ul class="source-links">${r.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ${icon('out')}</a></li>`).join('')}</ul><p class="caption">Research snapshot: October 4, 2026. Source publication years differ. Links open the institution’s source; this app does not refresh evidence automatically.</p></div>`;
}
function summaryPage() {
  const t = totals(state.entries);
  return pageHead('TAKE THE QUESTIONS WITH YOU', 'A plan for your counselor.', 'A local review copy. Nothing is sent to a school.', '<div class="button-group"><button class="button secondary" data-action="download-json">Save JSON</button><button class="button secondary" data-action="download-summary">Save text</button><button class="button primary" data-action="print">Print / PDF</button></div>') +
    `<section class="panel summary-intro"><p class="caption">Review copy generated ${esc(generatedLabel())}</p><p>${state.isDemo ? '<strong>SAMPLE DATA · </strong>' : ''}First-year high-school dual enrollment · ${recordedGraduationYear() ? `Class of ${esc(recordedGraduationYear())}` : 'Graduation year not provided'} · Major: ${esc(state.profile.major || 'Undecided')}</p><p><strong>Destinations:</strong> ${esc(selectedTargets().map(d => d.name).join(', ') || 'None selected')}</p><p><strong>Local semester units:</strong> ${t.completed} completed, ${t.inProgress} in progress, ${t.planned} planned. Student-reported; not a destination award.</p>${unknownUnitsNotice(t)}<p><strong>Planning term:</strong> ${esc(state.profile.planningTerm)}. Eligibility, grades, prerequisites, schedules, and degree application are unverified.</p></section>
    ${renderGraduationProgress(state)}${renderHighSchoolRecords(state)}<section class="panel"><h2>Course record</h2>${state.entries.length ? state.entries.map(e => miniCourse(e) + connectedCredits(state,e)).join('') : '<p>No courses added yet.</p>'}${duplicateWarnings(state.entries).map(w => `<p class="notice warning">${esc(w)}</p>`).join('')}</section>
    <section class="panel"><h2>Questions to take to school</h2><ol class="review-questions"><li>Does this exact course number and college earn credit for the term I took it?</li><li>How many units will be awarded after my official transcript is evaluated?</li><li>Does it meet a GE or major requirement for my first-year applicant route?</li><li>Are a sequence, grade, placement result, or duplicate-credit rule relevant?</li><li>Am I ready and eligible to take the next course, and is it offered?</li></ol></section>
    ${questionsPanel()}${state.guide.note ? `<section class="panel"><h2>My next-class question</h2><p>${esc(state.guide.note)}</p></section>` : ''}<section class="summary-evidence"><h2>Evidence and unresolved questions</h2>${!selectedTargets().length ? '<p>Choose destinations to include a comparison.</p>' : state.entries.map(e => `<section class="panel"><h3>${esc(course(e.courseId).code)} · ${esc(college(course(e.courseId).collegeId).name)} · ${esc(e.term)}</h3>${selectedTargets().map(d => `<details><summary>${esc(d.name)} · ${esc(compareCourse(course(e.courseId), d, e).label)}</summary>${evidenceBlock(course(e.courseId), d, e)}</details>`).join('')}</section>`).join('')}</section>`;
}

function openDialog(title, content, wide = false) {
  const root = $('#dialog-root');
  if (!root.querySelector('dialog[open]')) dialogReturnTarget = document.activeElement;
  root.innerHTML = `<dialog class="${wide ? 'wide-dialog' : ''}" aria-labelledby="dialog-title"><div class="dialog-head"><div><p class="eyebrow">YOUR OPENPATH</p><h2 id="dialog-title">${title}</h2></div><button class="close-button" data-action="close" aria-label="Close dialog">×</button></div><div class="dialog-body">${content}</div></dialog>`;
  const dialog = root.querySelector('dialog');
  dialog.addEventListener('close', () => {
    if (!root.querySelector('dialog[open]')) {
      const target = dialogReturnTarget?.isConnected ? dialogReturnTarget : $('#page-title');
      target?.focus();
    }
  });
  dialog.showModal();
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
}
function closeDialog() { $('#dialog-root dialog')?.close(); }
function termFields(term, prefix = '') {
  const [season, year] = term.split(' ');
  return `<div class="form-row"><label>Term<select name="${prefix}season">${['Spring', 'Summer', 'Fall', 'Winter'].map(s => `<option ${s === season ? 'selected' : ''}>${s}</option>`).join('')}</select></label><label>Year<input type="number" name="${prefix}year" min="2000" max="2099" value="${esc(year)}" required></label></div>`;
}
function setupDialog() {
  const p = state.profile;
  openDialog('Start where you are.', `<form id="setup-form"><p class="dialog-lede">A few choices, no account. Change them whenever your plans change.</p><div class="route-info"><strong>High school dual enrollment · First-year route</strong><p>This prototype plans for students taking college courses while in high school. Each destination’s policy still needs review. Revisit your applicant route if your study continues after high school.</p></div><div class="form-row"><label>High school graduation year<input type="number" name="graduationYear" min="2000" max="2099" value="${esc(p.graduationYear)}" required></label><label>Major or interest<input name="major" maxlength="80" value="${esc(p.major)}" placeholder="Undecided is a good start"></label></div><fieldset><legend>Peralta colleges to research (optional)</legend><p class="caption">Leave blank for other colleges. Keep each course’s original college.</p><div class="choice-grid">${COLLEGES.map(c => `<label class="check-choice"><input type="checkbox" name="colleges" value="${esc(c.id)}" ${p.collegeIds.includes(c.id) ? 'checked' : ''}>${esc(c.name)}</label>`).join('')}</div></fieldset><fieldset><legend>Destinations you’re curious about</legend><p class="caption">Optional for now. These choices do not assess eligibility or school fit.</p><div class="choice-grid">${DESTINATIONS.map(d => `<label class="check-choice"><input type="checkbox" name="destinations" value="${esc(d.id)}" ${p.destinationIds.includes(d.id) ? 'checked' : ''}>${esc(d.name)}</label>`).join('')}</div></fieldset><fieldset><legend>Plan for a term</legend>${termFields(p.planningTerm)}</fieldset><p id="setup-error" class="form-error" role="alert"></p><button class="button primary full" type="submit">Save my setup ${icon('arrow')}</button><div class="dialog-actions"><button class="text-button" type="button" data-action="demo">Try a sample journey</button><button class="text-button danger" type="button" data-action="clear">Clear local plan</button></div></form>`, true);
}
function catalogDialog() {
  catalogSearch = ''; catalogCollege = ''; showHistorical = false;
  openDialog('Add a course.', `<p class="dialog-lede">A small research catalog, not the full Peralta catalog. Current course evidence comes from 2025–26.</p><div class="filterbar"><label class="search-field"><span class="sr-only">Search catalog</span><input id="catalog-search" type="search" placeholder="Course code or title"></label><label><span class="sr-only">Catalog college</span><select id="catalog-college"><option value="">All Peralta colleges</option>${COLLEGES.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label></div><label class="check-choice historical-toggle"><input id="historical-toggle" type="checkbox">Include historical course numbers</label><button class="button secondary" data-action="custom-add">Add another college class</button><div id="catalog-results"></div>`, true);
  renderCatalog();
}
function renderCatalog() {
  const matches = COURSES.filter(c => (!c.historical || showHistorical) && (!catalogCollege || c.collegeId === catalogCollege) && `${c.code} ${c.title} ${college(c.collegeId).name}`.toLowerCase().includes(catalogSearch.toLowerCase()));
  $('#catalog-results').innerHTML = `<p class="caption" role="status">${matches.length} course records. Select the college where you took the course.</p>${matches.length ? matches.map(c => `<button class="catalog-option" data-action="choose-course" data-course="${esc(c.id)}"><span class="subject-square">${esc(c.code.split(' ')[0].slice(0, 3))}</span><span><strong>${esc(c.code)} · ${esc(c.title)}</strong><small>${esc(college(c.collegeId).name)} · ${localUnits(c.units, c.unitSystem)}${c.historical ? ' · Historical, no automatic renumbering' : ''}</small></span>${icon('plus')}</button>`).join('') : '<div class="empty-state"><h3>No researched course matches.</h3><p>This does not mean the course earns no credit. Try another search and ask your counselor about courses outside this prototype.</p></div>'}`;
}
function editCourseDialog(courseId, entryId) {
  const c = course(courseId);
  const e = state.entries.find(e => e.id === entryId);
  if (e?.customCourse) { openDialog('Your college class', customCourseForm(state, entryId)); return; }
  openDialog(e ? 'Edit course record.' : 'Put it in your notebook.', `<form id="course-form" data-course="${esc(c.id)}" data-entry="${esc(entryId || '')}"><div class="course-dialog-title"><span class="subject-square">${esc(c.code.split(' ')[0].slice(0, 3))}</span><div><strong>${esc(c.code)} · ${esc(c.title)}</strong><p>${esc(college(c.collegeId).name)} · ${localUnits(c.units, c.unitSystem)}</p></div></div>${c.historical ? '<div class="notice warning">This historical number is a separate source identity. Its local units and connection to any renamed course have not been verified.</div>' : ''}<label>Course status<select name="status">${['completed', 'in-progress', 'planned'].map(s => `<option value="${s}" ${s === (e?.status || 'completed') ? 'selected' : ''}>${statusName(s)}</option>`).join('')}</select></label>${termFields(e?.term || 'Fall 2026')}${finalGradeField(e?.finalGrade)}<p class="caption">Use the exact number on your transcript. Grade-dependent eligibility needs school review. To change the course or source college, remove this record and add the correct one.</p><div class="dialog-actions">${e ? `<button class="text-button danger" type="button" data-action="remove" data-id="${esc(e.id)}">Remove record</button>` : '<button class="text-button" type="button" data-action="catalog">Back to catalog</button>'}<button class="button primary" type="submit">${e ? 'Save changes' : 'Add course'} ${icon('check')}</button></div></form>`);
}
function showEvidence(courseId, targetId, entryId) {
  const c = course(courseId); const d = destination(targetId);
  const e = state.entries.find(e => e.id === entryId) || { term: state.profile.planningTerm, status: 'planned' };
  if (e.id) {
    state.journey.evidenceViewed = [...new Set([...state.journey.evidenceViewed, evidenceKey(e, d.id)])];
    persist();
  }
  openDialog(`${esc(c.code)} → ${esc(d.name)}`, `<p class="dialog-lede">${esc(college(c.collegeId).name)} · ${esc(c.title)}</p>${evidenceBlock(c, d, e)}${e.id ? `<div class="evidence-question"><h3>Something still unclear?</h3><p>Bring the open question into your next advisor conversation.</p><button class="button secondary" data-action="prepare-question" data-entry="${esc(e.id)}" data-target="${esc(d.id)}">Prepare a question ${icon('plus')}</button></div>` : ''}`);
}
function confirmDialog(kind, id) {
  const title = kind === 'remove' ? 'Remove this course?' : kind === 'demo' ? 'Load the sample journey?' : 'Start with a clean notebook?';
  openDialog(title, `<p class="dialog-lede">${kind === 'remove' ? 'This removes the college record and its linked high-school allocation from this browser’s plan.' : 'This replaces the current local plan. Save a JSON copy first if you want to keep it.'}</p><div class="dialog-actions"><button class="button secondary" data-action="close">Keep current plan</button><button class="button primary" data-action="confirm-${kind}" data-id="${esc(id || '')}">${kind === 'remove' ? 'Remove course' : kind === 'demo' ? 'Load sample' : 'Clear local plan'}</button></div>`);
}
function download(filename, text, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.hidden = true;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce('Download requested. Check your browser downloads. Nothing was sent.');
}
function summaryText() {
  const t = totals(state.entries);
  const lines = ['OPENPATH: COUNSELOR REVIEW COPY', 'Prototype. Working title. Research snapshot: October 4, 2026.', `Review copy generated ${generatedLabel()}.`, state.isDemo ? 'SAMPLE DATA: fictional student course history.' : 'Student-reported local record.', `First-year high-school dual enrollment. Graduation: ${recordedGraduationYear() || 'not provided'}. Major: ${state.profile.major}.`, `Planning term: ${state.profile.planningTerm}.`, `Local semester units: ${t.completed} completed; ${t.inProgress} in progress; ${t.planned} planned. Not destination awards.`, 'Local-unit totals describe recorded course attempts and course load, including failed attempts. They are not earned university credit. Final grades are student-entered; eligibility, prerequisites and availability need review.', `Destinations: ${selectedTargets().map(d => d.name).join(', ') || 'None selected'}`, '', 'COURSES AND EVIDENCE'];
  if (t.quarterByStatus) lines.push(`Quarter units (separate course load): ${t.quarterByStatus.completed} completed; ${t.quarterByStatus.inProgress} in progress; ${t.quarterByStatus.planned} planned.`);
  if (t.unclassifiedByStatus) lines.push(`Course records with unknown unit system, excluded from numeric unit totals: ${Object.values(t.unclassifiedByStatus).reduce((sum,value)=>sum+value,0)}.`);
  for (const e of state.entries) {
    const c = course(e.courseId);
    lines.push('', `${c.code} | ${c.title} | ${college(c.collegeId).name} | ${e.term} | ${statusName(e.status)} | ${localUnits(c.units, c.unitSystem)} | Final grade: ${e.finalGrade || 'Not recorded'} (student-entered)`);
    const workflow = courseWorkflow(state, e);
    lines.push('  COURSE CHECKLIST: locally recorded, not authenticated by the school', ...workflow.steps.map(step => `  ${step.title}: ${step.done ? 'recorded' : 'not yet recorded'}. ${step.detail}`));
    if (e.workflow?.requiredSignaturesNote) lines.push(`  Approval note: ${e.workflow.requiredSignaturesNote}`);
    const listings = OUSD_SCHEDULE_ROWS.filter(row => scheduleCourseId(row.id) === c.id);
    if (listings.length) lines.push(`  OUSD Fall 2026 district-listed transfer flag: ${[...new Set(listings.map(row => row.transferFlag))].join(' / ')}. Not a receiving-college award, GE/major match, or HS subject allocation.`, `  Schedule checked ${OUSD_SCHEDULE.checkedAt}: ${OUSD_SCHEDULE.source}`);
    for (const d of selectedTargets()) {
      const r = compareCourse(c, d, e);
      lines.push(`  ${d.name}: ${r.label}`, `  Units: ${r.unitsText}. Equivalent: ${r.equivalentText || 'Unverified'}`, `  GE/major: ${r.requirementText}`, `  ${r.yearText}. Applicant route: ${r.applicantText}`, ...r.notes.map(n => `  Note: ${n}`), ...r.sources.map(s => `  Source: ${s.title}: ${s.url}`));
    }
  }
  lines.push('', ...duplicateWarnings(state.entries), '', 'QUESTIONS', 'Confirm the exact college, course number, term, units, and official transcript evaluation.', 'Confirm first-year GE/major applicability and any grade or sequence requirements.', 'Check duplicate credit limits, prerequisites, placement, enrollment permission and availability.', 'Unknown evidence is not rejection. UC system unit facts are not independent campus degree matches.');
  if (state.journey.questions.length) {
    lines.push('', 'MY PREPARED ADVISOR QUESTIONS');
    state.journey.questions.forEach(q => lines.push('', `${questionIsCurrent(q) ? 'Current plan' : 'Plan changed: revisit this question'} | ${questionCourse(q).code} | ${questionCollege(q).name} | ${q.term} | ${destination(q.destinationId).name}`, q.text));
  }
  if (state.guide.note) lines.push('', 'MY NEXT-CLASS QUESTION', state.guide.note);
  lines.push('', ...highSchoolSummaryLines(state));
  return lines.join('\n');
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]'); if (!button) return;
  const { action, id, course: courseId, target, entry } = button.dataset;
  if (['hs-allocation', 'guide-edit'].includes(action) && $('#course-workflow-form')) {
    const workflowForm = $('#course-workflow-form');
    try { saveWorkflowForm(workflowForm); } catch (error) { formError(workflowForm, error); return; }
    render();
    dialogReturnTarget = [...document.querySelectorAll('[data-action="course-workflow"]')].find(control => control.dataset.entry === workflowForm.dataset.entry) || $('#page-title');
  }
  if (action === 'custom-add') { openDialog('Add another college class', customCourseForm(state, undefined, button.dataset.planning === 'true')); return; }
  if (action === 'course-workflow') { openDialog('Your course checklist', courseWorkflowForm(state, entry)); return; }
  if (action === 'hs-profile') { openDialog('Your high-school requirements', highSchoolProfileForm(state)); return; }
  if (action === 'hs-add' || action === 'hs-edit') { openDialog(action === 'hs-edit' ? 'Edit high-school class' : 'Add a high-school class', highSchoolCourseForm(state, id)); return; }
  if (action === 'hs-allocation') { openDialog('Connect high-school credit', highSchoolAllocationForm(state, entry)); return; }
  if (action === 'hs-remove' || action === 'hs-allocation-remove') {
    openDialog('Remove this high-school record?', `<p>This removes ${action === 'hs-remove' ? 'this high-school class' : 'only its high-school allocation'}. College course records and advisor questions stay in your plan.</p><div class="dialog-actions"><button class="button secondary" data-action="close">Keep record</button><button class="button primary" data-action="confirm-${action}" data-id="${esc(id)}">Remove high-school record</button></div>`); return;
  }
  if (action === 'confirm-hs-remove' || action === 'confirm-hs-allocation-remove') {
    const list = action === 'confirm-hs-remove' ? 'courses' : 'allocations';
    state.highSchool[list] = state.highSchool[list].filter(record => record.id !== id);
    closeDialog(); persist(); render(); $('#page-title')?.focus(); announce('High-school record removed. College records are unchanged.'); return;
  }
  if (action === 'guide-start') { guideGo('classes'); return; }
  if (action === 'guide-step') { guideGo(button.dataset.step); return; }
  if (action === 'guide-add-class') { guideCourseDialog(courseId); return; }
  if (action === 'schedule-add') { guideCourseDialog(courseId, undefined, true); return; }
  if (action === 'guide-edit') { guideCourseDialog(state.entries.find(e=>e.id===id).courseId,id); return; }
  if (action === 'guide-remove-target') { state.profile.destinationIds=state.profile.destinationIds.filter(item=>item!==target); persist(); render(); $('#guide-destination')?.focus(); return; }
  if (action === 'guide-save-plan') {
    if (!suggestCourses(state).some(item=>item.course.id===courseId)) return;
    state.entries.push({id:crypto.randomUUID(),courseId,status:'planned',term:state.profile.planningTerm});
    state.guide.step='next'; guideQuestionOpen=false; showGuideAlternatives=false;
    persist(); render(); $('#page-title')?.focus(); announce('Draft saved. This is a class to discuss, not enrollment or earned credit.'); return;
  }
  if (action === 'guide-more-ideas') { showGuideAlternatives=true; guideFamily=''; guideCourseId=''; render(); $('#page-title')?.focus(); return; }
  if (action === 'guide-question') { guideQuestionOpen=true; render(); $('[name="question"]')?.focus(); return; }
  if (action === 'guide-question-later') { guideQuestionOpen=false; render(); $('#page-title')?.focus(); return; }
  if (action === 'guide-evidence') {
    const context=state.entries.find(e=>e.id===entry) || {term:state.profile.planningTerm,status:'planned'};
    openDialog('Credit details, when you need them.', `<p class="dialog-lede">${esc(course(courseId).title)} · ${esc(college(course(courseId).collegeId).name)} · ${esc(context.term)}</p>${selectedTargets().map(d=>`<details><summary>${esc(d.name)} · ${esc(compareCourse(courseId,d,context).label)}</summary>${evidenceBlock(course(courseId),d,context)}</details>`).join('') || '<p>Choose colleges to compare credit.</p>'}`);
    return;
  }
  if (action.startsWith('go-')) { go(action.slice(3)); return; }
  if (action === 'setup') setupDialog();
  else if (action === 'view-standard' || action === 'view-journey') { state.viewMode = action === 'view-journey' ? 'journey' : 'standard'; persist(); go('home'); }
  else if (action === 'prepare-question') prepareQuestionDialog(entry, target);
  else if (action === 'question-setup') { closeDialog(); setupDialog(); }
  else if (action === 'remove-question') { state.journey.questions = state.journey.questions.filter(q => q.id !== id); persist(); render(); $('#page-title')?.focus(); announce('Question removed from your review copy.'); }
  else if (action === 'close') closeDialog();
  else if (action === 'catalog') catalogDialog();
  else if (action === 'choose-course') editCourseDialog(courseId);
  else if (action === 'edit') editCourseDialog(state.entries.find(e => e.id === id).courseId, id);
  else if (action === 'evidence') showEvidence(courseId, target, entry);
  else if (action === 'candidate-evidence') openDialog('Follow the evidence.', `<p class="dialog-lede">${esc(course(courseId).code)} · ${esc(college(course(courseId).collegeId).name)} · Planning term ${esc(state.profile.planningTerm)}</p>${selectedTargets().map(d => `<details><summary>${esc(d.name)}</summary>${evidenceBlock(course(courseId), d, { term: state.profile.planningTerm, status: 'planned' })}</details>`).join('')}`);
  else if (action === 'add-plan') {
    if (!suggestCourses(state).some(i => i.course.id === courseId)) return;
    state.entries.push({ id: crypto.randomUUID(), courseId, status: 'planned', term: state.profile.planningTerm });
    persist(); render(); announce(`${state.viewMode === 'journey' ? 'Plan drafted. ' : ''}${course(courseId).code} added to your discussion plan.`);
  } else if (action === 'summary') go('summary');
  else if (action === 'remove' || action === 'clear') confirmDialog(action, id);
  else if (action === 'demo') { if (state.entries.length || state.setupComplete || state.guide.started || state.guide.note || state.profile.destinationIds.length || state.profile.collegeIds.length || state.highSchool.courses.length || state.highSchool.allocations.length || state.highSchool.profile.districtId) confirmDialog('demo'); else { state = makeDemo(); persist(); render(); announce('Sample journey loaded. All student records are fictional.'); } }
  else if (action === 'confirm-demo' || action === 'confirm-clear') { closeDialog(); state = action === 'confirm-demo' ? makeDemo() : emptyState(); persist(); go('home'); announce(action === 'confirm-demo' ? 'Sample journey loaded.' : 'Local plan cleared. Your own path starts here.'); }
  else if (action === 'confirm-remove') { state.entries = state.entries.filter(e => e.id !== id); state.highSchool.allocations = state.highSchool.allocations.filter(a => a.collegeEntryId !== id); closeDialog(); persist(); render(); announce('Course removed from this browser’s plan.'); }
  else if (action === 'download-json') download('openpath-plan.json', JSON.stringify({ ...state, exportedAtUTC: new Date().toISOString(), researchSnapshot: '2026-10-04', notice: 'Prototype student-reported record. No destination awards.' }, null, 2), 'application/json');
  else if (action === 'download-summary') download('openpath-counselor-review.txt', summaryText());
  else if (action === 'recover') { let raw; try { raw = localStorage.getItem(STORAGE_KEY); } catch { announce('Browser storage is unavailable.'); return; } download('openpath-saved-recovery.txt', raw || 'No saved data found.'); }
  else if (action === 'restart-storage') openDialog('Replace unreadable local data?', '<p>Export the saved copy first if you need to recover it. Starting fresh replaces only this prototype’s saved plan.</p><div class="dialog-actions"><button class="button secondary" data-action="close">Cancel</button><button class="button primary" data-action="confirm-restart-storage">Start fresh</button></div>');
  else if (action === 'confirm-restart-storage') { loaded.warning = ''; state = emptyState(); persist(); closeDialog(); go('home'); }
  else if (action === 'print') { document.querySelectorAll('#main details:not(.guide-tools-menu)').forEach(d => { d.open = true; }); window.print(); }
});
document.addEventListener('submit', event => {
  if (!['setup-form', 'course-form', 'question-form', 'guide-course-form', 'guide-settings-form', 'guide-note-form', 'hs-profile-form', 'hs-course-form', 'hs-allocation-form', 'course-workflow-form', 'custom-course-form'].includes(event.target.id)) return;
  event.preventDefault(); const form = event.target; const values = new FormData(form);
  if (form.id === 'custom-course-form') {
    try {
      const existing = state.entries.find(entry => entry.id === form.dataset.entry);
      const id = existing?.id || crypto.randomUUID();
      const customCourse = normalizeCustomCourse(Object.fromEntries(values));
      const next = updateCollegeEntry(existing, { id, courseId:customCourseId(id), customCourse, status:values.get('status'), term:`${values.get('season')} ${values.get('year')}`, finalGrade:values.get('finalGrade') });
      if (state.entries.some(entry => entry.id !== id && customCourseIdentity(entry) === customCourseIdentity(next))) throw new Error('This college and course number are already recorded for that term. Edit the existing class instead.');
      if (existing) Object.assign(existing,next); else state.entries.push(next);
      state.guide.started = true;
      if (next.status === 'planned') state.guide.step = 'next';
      closeDialog(); persist(); render(); $('#page-title')?.focus(); announce('College class saved. Transfer review is still needed.');
    } catch (error) { formError(form,error); }
    return;
  }
  if (form.id === 'course-workflow-form') {
    try { saveWorkflowForm(form); } catch (error) { formError(form, error); return; }
    closeDialog(); render(); $('#page-title')?.focus(); announce('Checklist saved in this browser. Your school confirms approvals and credit.'); return;
  }
  if (form.id.startsWith('hs-')) {
    try {
      const fields = Object.fromEntries(values);
      if (form.id === 'hs-profile-form') {
        fields.policyConfirmed = values.get('policyConfirmed') === 'on';
        if (fields.districtId !== 'ousd') {
          fields.schoolId = fields.schoolName?.trim() ? 'other' : 'unknown';
          fields.policyId = null; fields.policyConfirmed = false;
        }
        Object.assign(state, updateSchoolContext(state, fields));
      } else if (form.id === 'hs-course-form') {
        const next = { ...fields, id: form.dataset.id || crypto.randomUUID(), credits: fields.credits?.trim() ? Number(fields.credits) : null };
        state.highSchool.courses = normalizeHighSchoolRecords([...state.highSchool.courses.filter(record => record.id !== next.id), next]);
      } else {
        const existing = state.highSchool.allocations.find(record => record.collegeEntryId === form.dataset.entry);
        const collegeEntry = state.entries.find(record => record.id === form.dataset.entry);
        if (!collegeEntry) throw new Error('The linked college class is no longer in this plan.');
        const next = { ...fields, id: existing?.id || crypto.randomUUID(), collegeEntryId: collegeEntry.id, linkedCourseId: collegeEntry.courseId, linkedTerm: collegeEntry.term, linkedCustomCourseKey: customCourseSnapshot(collegeEntry), credits: fields.credits?.trim() ? Number(fields.credits) : null };
        // One allocation per saved college record. Editing updates its link rather than adding a second course.
        state.highSchool.allocations = normalizeHighSchoolAllocations([...state.highSchool.allocations.filter(record => record.collegeEntryId !== next.collegeEntryId), next]);
      }
    } catch (error) {
      let message = form.querySelector('.form-error');
      if (!message) { message = document.createElement('p'); message.className = 'form-error'; message.setAttribute('role', 'alert'); form.append(message); }
      message.textContent = error.message || 'Review the high-school record before saving.';
      return;
    }
    state.guide.started = true;
    closeDialog(); persist(); render(); $('#page-title')?.focus(); announce('High-school record saved. College units are counted separately.'); return;
  }
  if (form.id === 'guide-course-form') {
    const existing=state.entries.find(e=>e.id===form.dataset.entry);
    let next;
    try { next = updateCollegeEntry(existing, {id:existing?.id || crypto.randomUUID(),courseId:form.dataset.course,status:values.get('status'),term:`${values.get('season')} ${values.get('year')}`,finalGrade:values.get('finalGrade')}); } catch (error) { formError(form,error); return; }
    if (!existing && state.entries.some(e=>e.courseId===next.courseId && e.term===next.term && e.status===next.status)) { closeDialog(); announce('This class is already saved for that term.'); return; }
    if (existing) Object.assign(existing,next); else state.entries.push(next);
    state.profile.collegeIds=[...new Set([...state.profile.collegeIds,course(next.courseId).collegeId])];
    closeDialog(); persist(); render(); $('#page-title')?.focus(); announce('Class saved. Your other choices are unchanged.'); return;
  }
  if (form.id === 'guide-settings-form') {
    state.profile.collegeIds=values.getAll('colleges');
    state.profile.planningTerm=`${values.get('season')} ${values.get('year')}`;
    guideFamily=''; guideCourseId=''; persist(); render(); $('#page-title')?.focus(); return;
  }
  if (form.id === 'guide-note-form') {
    const note=values.get('note').trim();
    if (!note) { form.querySelector('textarea').setCustomValidity('Write a question before saving.'); form.querySelector('textarea').reportValidity(); return; }
    state.guide.note=note.slice(0,1500); persist(); render(); $('#page-title')?.focus(); announce('Question saved. Take it to a counselor to choose a class.'); return;
  }
  if (form.id === 'question-form') {
    const entry = state.entries.find(e => e.id === form.dataset.entry);
    const q = createAdvisorQuestion(course(entry.courseId), destination(form.dataset.target), entry);
    const text = values.get('question').trim();
    if (!text) { form.querySelector('textarea').setCustomValidity('Write a question before saving.'); form.querySelector('textarea').reportValidity(); return; }
    q.text = text.slice(0, 1500);
    state.journey.questions = [...state.journey.questions.filter(item => item.id !== q.id), q];
    guideQuestionOpen=false;
    closeDialog(); persist(); render(); $('#page-title')?.focus(); announce('Question prepared. It is now part of your review summary.'); return;
  }
  if (form.id === 'setup-form') {
    const collegeIds = values.getAll('colleges');
    state.profile = { graduationYear: values.get('graduationYear'), major: values.get('major').trim() || 'Undecided', collegeIds, destinationIds: values.getAll('destinations'), planningTerm: `${values.get('season')} ${values.get('year')}` };
    state.setupComplete = true;
    closeDialog(); persist(); render(); announce('Your setup is updated. You can change it anytime.');
  } else {
    const existing = state.entries.find(e => e.id === form.dataset.entry);
    let next;
    try { next = updateCollegeEntry(existing, {id:existing?.id || crypto.randomUUID(),courseId:form.dataset.course,status:values.get('status'),term:`${values.get('season')} ${values.get('year')}`,finalGrade:values.get('finalGrade')}); } catch (error) { formError(form,error); return; }
    if (existing) Object.assign(existing, next); else state.entries.push(next);
    closeDialog(); persist(); go('courses'); announce(existing ? 'Course record updated.' : 'Course added to your notebook.');
  }
});
document.addEventListener('change', event => {
  const el = event.target;
  if (el.name === 'districtId' && el.closest('#hs-profile-form')) {
    const form = el.closest('form');
    form.querySelectorAll('[data-hs-profile-fields]').forEach(section => {
      const active = section.dataset.hsProfileFields === (el.value === 'ousd' ? 'ousd' : 'general');
      section.hidden = !active; section.disabled = !active;
      section.querySelectorAll('input,select,textarea').forEach(input => { input.disabled = !active; });
    });
    return;
  }
  if (el.id === 'schedule-school') { scheduleSchool = el.value; $('#schedule-results').innerHTML = scheduleResults(); return; }
  if (el.id === 'guide-course-college') { guideCollege=el.value; $('#guide-search-results').innerHTML=guideSearchResults(); return; }
  if (el.id === 'guide-destination' && destination(el.value)) { state.profile.destinationIds=[...new Set([...state.profile.destinationIds,el.value])]; persist(); render(); $('#guide-destination')?.focus(); return; }
  if (el.id === 'guide-source' && college(el.value)) { state.profile.collegeIds=[el.value]; persist(); render(); $('#page-title')?.focus(); return; }
  if (el.name === 'guide-family') { guideFamily=el.value; const group=guidedCandidates(state).find(g=>g.family===guideFamily); guideCourseId=group?.options.length===1 ? group.options[0].course.id : ''; render(); $(`input[name="guide-family"][value="${guideFamily}"]`)?.focus(); return; }
  if (el.id === 'guide-candidate') { guideCourseId=el.value; render(); $('#guide-candidate')?.focus(); return; }
  if (el.dataset.destination) {
    state.profile.destinationIds = el.checked ? [...new Set([...state.profile.destinationIds, el.dataset.destination])] : state.profile.destinationIds.filter(id => id !== el.dataset.destination);
    persist(); render(); $(`[data-destination="${el.dataset.destination}"]`)?.focus(); announce(`${selectedTargets().length} destinations selected.`);
  } else if (el.id === 'list-filter') { listFilter = el.value; render(); $('#list-filter').focus(); }
  else if (el.id === 'catalog-college') { catalogCollege = el.value; renderCatalog(); }
  else if (el.id === 'historical-toggle') { showHistorical = el.checked; renderCatalog(); }
});
document.addEventListener('input', event => {
  if (['question','note'].includes(event.target.name)) event.target.setCustomValidity('');
  if (event.target.id === 'guide-course-search') { guideSearch=event.target.value; $('#guide-search-results').innerHTML=guideSearchResults(); }
  if (event.target.id === 'catalog-search') { catalogSearch = event.target.value; renderCatalog(); }
  if (event.target.id === 'my-search') { const pos = event.target.selectionStart; search = event.target.value; render(); $('#my-search').focus(); if (pos != null) $('#my-search').setSelectionRange(pos, pos); }
});
render();
