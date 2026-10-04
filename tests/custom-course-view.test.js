import test from 'node:test';
import assert from 'node:assert/strict';
import { customCourseForm } from '../src/custom-course-view.js';
import { emptyState } from '../src/state.js';
import { customCourseId } from '../src/custom-courses.js';
import { renderCourseWorkflow, courseWorkflowForm } from '../src/course-workflow-view.js';

test('manual college form starts with unknown units and optional grade, without selecting a college or school', () => {
  const state=emptyState(); const html=customCourseForm(state);
  assert.match(html,/College name/); assert.match(html,/Exact course number/); assert.match(html,/Course title/);
  assert.match(html,/<option value="unknown" selected>Not sure/);
  assert.match(html,/<option value="quarter">Quarter/);
  assert.match(html,/<option value="semester">Semester/);
  assert.match(html,/<option value="" selected>Not recorded/);
  assert.match(html,/No transfer match is inferred/);
  assert.deepEqual(state.entries,[]);
});

test('manual edit preserves the same record and escapes student-entered display fields', () => {
  const state=emptyState();state.entries=[{id:'manual',courseId:customCourseId('manual'),term:'Fall 2026',status:'completed',finalGrade:'B',customCourse:{collegeName:'Fictional <College>',code:'ENG 101',title:'Writing & Reasoning',units:5,unitSystem:'quarter'}}];
  const html=customCourseForm(state,'manual');
  assert.match(html,/data-entry="manual"/);
  assert.match(html,/Fictional &lt;College&gt;/);
  assert.match(html,/Writing &amp; Reasoning/);
  assert.match(html,/<option value="quarter" selected>/);
  assert.match(html,/<option value="B" selected>/);
  assert.match(html,/data-action="remove" data-id="manual"/);
  assert.match(renderCourseWorkflow(state,state.entries[0]),/Update checklist/);
  assert.match(courseWorkflowForm(state,'manual'),/Fictional &lt;College&gt;/);
});

test('manual planning opens a draft for the selected planning term without requiring researched source colleges', () => {
  const state=emptyState();state.profile.planningTerm='Spring 2027';
  const html=customCourseForm(state,undefined,true);
  assert.match(html,/<option value="planned" selected>Planned/);
  assert.match(html,/<option value="Spring" selected>/);
  assert.match(html,/value="2027"/);
  assert.deepEqual(state.profile.collegeIds,[]);
});
