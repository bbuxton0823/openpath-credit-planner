import { COURSES as RESEARCHED_COURSES } from './data.js';
import { OUSD_SCHEDULE_ROWS, OUSD_SCHEDULE } from './ousd-schedule.js';
export { COLLEGES, DESTINATIONS, SOURCES, RESEARCH_DATE } from './data.js';

// Exact institution and course code only. Schedule flags do not create destination evidence.
const groups = new Map();
for (const row of OUSD_SCHEDULE_ROWS) {
  if (!row.collegeId || !/^[A-Z/]+ [A-Z]?\d+[A-Z]*$/i.test(row.code)) continue;
  const key = `${row.collegeId}|${row.code}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}
const added = [];
const courseByListing = new Map();
for (const rows of groups.values()) {
  const row = rows[0];
  const unitValues = [...new Set(rows.map(item => item.units))];
  const units = unitValues.length === 1 && Number.isFinite(unitValues[0]) ? unitValues[0] : null;
  const exact = RESEARCHED_COURSES.find(c => c.collegeId === row.collegeId && c.code === row.code && !c.historical && c.units === units);
  const id = exact?.id || `ousd-2026-${row.collegeId}-${row.code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  if (!exact) added.push({
    id, collegeId: row.collegeId, code: row.code, title: row.title || row.code,
    units, unitSystem: 'semester', subject: 'District-listed course', family: `schedule-${row.code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    historical: false, suggestionEligible: false, scheduleOnly: true,
    catalogNote: 'OUSD Fall 2026 schedule identity. District transfer flags are not an independently verified university match. Confirm the course code, units, section and availability with the college.',
    scheduleSource: OUSD_SCHEDULE.source,
  });
  for (const listing of rows) courseByListing.set(listing.id, id);
}
export const COURSES = [...RESEARCHED_COURSES, ...added];
export function scheduleCourseId(rowId) { return courseByListing.get(rowId) || null; }
