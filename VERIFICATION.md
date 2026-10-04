# OpenPath verification

## Plus/minus high-school credit correction, October 4, 2026

Supported plus/minus letter grades now defer to the explicit passing result, earned award, credit quantity and provenance recorded for high-school credit. A fictional completed B+ English record with an explicit three-credit award counts three earned high-school credits. The grade alone creates no award. University grade-policy review is unchanged, as are failure, incomplete, withdrawal, pass-grade, school-approval and duplicate checks.

Release preparation checks:

- `rtk node --test tests/course-record.test.js tests/high-school-export.test.js tests/grade-persistence.test.js`: 27 passed, including the positive award, missing assertions, provenance, linked approval/transcript gates, exports and separate university review.
- `rtk npm test`: 164 passed, zero failed.
- `rtk npm run check`: 38 JavaScript files passed syntax checks.
- `rtk git diff --check`: no whitespace errors.
- `rtk npm run cf:dry-run`: built 22 allowlisted files and passed for the existing dev environment without runtime bindings.

These are local and packaging results. The deployment/version details below describe the preceding beta release; they do not establish publication or hosted-browser verification of this correction. Saved browser plans and verification artifacts remain excluded from Git and the public build.

## Public development beta, October 4, 2026

The expanded prototype is deployed at https://openpath-credit-planner-dev.buxtonbycha.workers.dev. It supports students at any high school through a student-recorded total graduation-credit target and manual college courses. OUSD requirements and Peralta transfer research remain limited, dated coverage. No official award, graduation eligibility, admission result or enrollment is claimed.

Cloudflare Worker `openpath-credit-planner-dev`, environment `dev`, account `968bbe4ecaf64a0b5bede5b53e06aedd` (Buxtonbycha@gmail.com's Account). Checked version `6a2f7a54-8481-41d2-9ce6-784b59ee285c`, deployment `f242af2b-b21d-4887-8a0e-d7295aa9ee45`, 100 percent allocation. The private source repository is https://github.com/bbuxton0823/openpath-credit-planner. Public browser assets can be read regardless of source-repository privacy.

| Final command or check | Result |
| --- | --- |
| `rtk proxy npm test` | 159 passed, 0 failed, after the last runtime change; `verification/final-beta-test-run.txt` |
| `rtk npm run check` | All 38 JavaScript files passed syntax checks |
| `rtk npm run build` | 22 explicitly selected files, including static header configuration |
| `rtk npm run cf:dry-run` | Explicit dev environment passed with static assets only and no runtime bindings |
| `rtk npm run cf:deploy:dev` | Actual public deployment completed; version and deployment above |
| Public and local Workers HTTP assertions | Each origin passed 21 GET and 21 HEAD asset checks against source/build bytes, all seven headers, and 17 excluded-path 404 checks |
| Actual downloaded JSON/text files | 21 content assertions passed; `verification/beta-export-checks.json` |
| `rtk git diff --check` | No whitespace errors |

The final browser check used the public workers.dev URL in the Codex in-app browser. Every test record was explicitly fictional and entered through ordinary controls. No browser storage or hidden app state was written by test code.

| Public browser path | Observed result |
| --- | --- |
| New visitor | Welcome said students at any high school; no account or existing record was required |
| Unknown requirements | Visible Add your school's graduation requirements action; target and remaining were unknown, with no fabricated number |
| General school | Fictional Valley High School, class of 2027, accepted a manual 240-credit target without selecting OUSD |
| Manual calculation | 20 recorded earned high-school credits produced 220 remaining, with Based on the school requirements you entered beside the result |
| Custom college class | Fictional Coast College ENGL 101 retained title, Fall 2025, completed status, B grade and four quarter units |
| Separate outcomes | Four local quarter units stayed separate from the manual high-school target and displayed Needs transfer review; no university award was inferred |
| Independent school award | An explicitly entered five-credit linked allocation raised recorded HS earned from 20 to 25 without changing college units or adding a duplicate class |
| Failed grades | F and NP each removed that five-credit allocation from earned totals; B restored the previously recorded allocation |
| No destination selected | Prepare a question used School counselor; saved question could be edited and survived reload without a destination or Peralta college selection |
| Manual planning | ART 100 could be planned without selecting a researched Peralta college; seven units with an unknown system were excluded from numeric semester/quarter totals |
| Grade/status guard | A final A on a planned class was blocked; clearing the grade permitted saving |
| Duplicate guard | Re-entering the same manual college/code/term was blocked without adding another course |
| School selector | All 17 OUSD schools remained available only within the selected OUSD route |
| Alternative program | Rudsdale kept required and remaining credits unknown even when the comprehensive baseline was selected |
| School changes | Approval and schedule confirmations reset; grade, term, units, course identity and approval note remained. The linked award returned to review |
| Return to general school | The manual target returned to 240, with 20 earned and 220 remaining; OUSD subject, GPA, project and conversion rules were not applied |
| Reload and export | Records, counselor question and manual totals persisted; summary used the entered class of 2027 |
| Remove manual class | Removed only the temporary ART 100 plan through confirmation; ENGL 101, school class, linked allocation and counselor question remained |
| Responsive forms | With a 375-pixel viewport override, actual document width and scroll width both measured 360 pixels. Custom-course and general-school dialogs measured 326 pixels wide, without horizontal overflow |
| Keyboard and console | Escape closed school settings and returned focus to School details. No captured warnings or errors on the checked final public path |

The test deliberately changed school context. The final browser example therefore keeps its five-credit college-to-school allocation in review and displays 20 recorded earned, 240 target and 220 remaining. It does not treat the old allocation as a new-school award. The temporary unknown-unit ART 100 record was exported before removal so that its separate treatment could be checked.

Both download event waiters reached their three-second limit, but new files were present in Downloads. Actual `openpath-plan (3).json` and `openpath-counselor-review (5).txt` passed 21 assertions covering exact custom identity, separate quarter and unknown-system quantities, grades, optional destinations, saved question, 240/20/220 totals, school-change invalidation and retained notes. The text used graduation year 2027 and included no OUSD source, 230-credit baseline or 3.3 estimate. Copies are kept locally as `verification/beta-general-plan.json` and `verification/beta-general-review.txt`.

Final screenshots: `verification/beta-final-desktop.jpg`, `verification/beta-general-mobile.jpg`, and `verification/beta-custom-form-mobile.jpg`. `verification/general-cloudflare-dev-check.json` records checked URLs, version, deployment, public asset hashes and exclusions. The entire verification directory is ignored by Git and excluded from public hosting.

Both original local examples were reopened. The localhost:4317 record retained three classes, its exact Howard question and 4/3/5 semester-unit totals, with no high-school records added. The separate 127.0.0.1:8787 OUSD example retained 23 recorded earned (10 school-verified as recorded and 13 student-reported), a provisional 230-credit baseline, 207 remaining, its saved question and the same 4/3/5 college totals. Browser plans do not sync across these origins.

The deployed `src/app.js` SHA-256 is `75fe5819f1ec49295be6fcffb43ac06fe80ab414d8ace93957602981cefdaaac`, matching the local source and build. No paid AI, student account, SIS connection, D1 database, server student storage, school submission or billing change was introduced. Static-asset pricing is documented in HOSTING.md; the existing account's subscription tier could not be verified with its current OAuth permissions.

Not verified: official school awards, applicability of requirements to a real student, current course availability, campus GE/major fulfillment, admission eligibility, external school delivery, a new screen-reader audit, or newly generated print/PDF output. Those limits remain explicit. Earlier local verification below is retained as history; its smaller counts and no-publication statements describe earlier revisions, not the current beta.

## Earlier local revisions

These checks preceded the general-school/manual-course expansion and public deployment.

## Automated checks

| Command or check | Result |
| --- | --- |
| `rtk proxy npm test` | 132 tests passed, 0 failed; output saved in `verification/grades-test-run.txt` |
| `rtk npm run check` | 33 JavaScript files passed Node syntax checks |
| `rtk npm run build` | 20 explicitly allowlisted files; no project-directory copy |
| `rtk npm run cf:dry-run` | Passed; no bindings, no publication |
| Final local Workers HTTP assertions | 19 GET and 19 HEAD routes matched source/build bytes and all 7 headers; 17 excluded paths returned 404 |
| Downloaded JSON/TXT readback | 21 assertions passed for the actual final files; retained as `verification/grades-plan.json` and `verification/grades-counselor-review.txt` |
| `rtk rg -n '\x{2014}' src index.html PRD.md RESEARCH.md README.md HOSTING.md` | No matches |

The last change after the JavaScript checks was scoped checklist padding in CSS. Build, dry run, runtime byte/header checks, and desktop/mobile rendering were repeated for that change.

Runtime: existing Node 22.22.2 and npm 10.9.7. Wrangler 4.147.0 is a pinned development dependency. No browser runtime dependency was added. The original MVP was also checked with Node 26.3.1; this is not a claim of all-version compatibility.

Tests cover exact college/course identity, source-year gaps, unknown versus rejected, historical numbering, preliminary A&T data, known caps and duplicate limits, separate unit totals, existing-family exclusions, grouping without dropping college alternatives, legacy storage migration, malformed-data recovery, general and contextual questions, and the static asset boundary. The optional hosted judgment seam remains disabled. A separate in-memory audit also exercised 376 seeded comparisons during the preceding review; the checked-in tests are the repeatable regression suite.


## Final grades, course checklist, and school roster

The original localhost:4317 record was reopened with the new modules. Its exact Howard question, the three college records and 4 completed-attempt / 3 in-progress / 5 planned local-unit totals remained. Its high-school notebook stayed empty. No grade was invented for an older record.

Browser actions used the separate fictional preview at http://127.0.0.1:8787/. The saved preview now includes a student-entered B for its existing Laney ENGL C1000 attempt and A for Fictional English 9. These fictional grades were entered through the ordinary edit forms. The original credit amounts, course terms and separate school provenance remain, with 23 recorded earned HS credits (10 school-verified as recorded and 13 student-reported), 230 provisional baseline credits, and 207 remaining. Nothing was sent to a school.

| Rendered browser check | Observed result |
| --- | --- |
| College final grade | Existing completed English class opened with Not recorded; all 17 supported grade values were available |
| Failed college attempt | Recording F reduced HS earned from 23 to 10; the linked 13-credit record showed Not earned and university evidence showed Recorded F: failed attempt |
| Passing college record | Changing the fictional grade to B restored the pre-existing recorded award to 23; the grade itself did not create an allocation |
| Status contradiction | Trying B on the in-progress psychology record kept the dialog open with the completed-attempt validation message; Cancel preserved the prior record |
| High-school final grade | Final grade and Grade 9 were separate fields; F reduced earned from 23 to 13 despite the old passing/earned claim, then A restored 23 |
| Full School menu | The actual native selector contained all 17 official district schools alphabetically, plus Not confirmed and Another school; legacy free-text school name was intact |
| Alternative school | Rudsdale selection displayed School-specific requirements need review and unknown required/remaining credits; selection survived reload |
| Changed-school approvals | Selecting another school retained course/credit facts but reset the linked allocation to Pending review; restoring the fictional school and explicitly reviewing its old allocation restored the original totals |
| Checklist | Schedule confirmation and optional note saved through the linked-record navigation and survived reload; the recorded grade reused the existing class |
| Derived completion | Schedule and final grade became Recorded; approval and school-credit posting remained Not yet recorded because their independent conditions were unmet |
| Keyboard | Enter opened the four-check disclosure and checklist form; Escape returned focus to Update checklist |
| Final-build navigation | Toggling schedule confirmation, opening either linked form, and cancelling immediately refreshed the saved checklist without reload |
| Phone layout | At a 375-pixel viewport, document width was 360; grade/checklist dialogs were 326 pixels wide with no horizontal overflow |
| Final reload | Grade B, grade A, school name, original course terms/credit amounts, and the checked schedule record persisted |
| Desktop console | No captured warnings or errors on the final checked path |

Final screenshots: `verification/grades-connected-desktop.jpg`, `verification/grades-connected-mobile.jpg`, `verification/grades-entry-mobile.jpg`, and `verification/grades-checklist-mobile.jpg`.

Both export-event waiters timed out after three seconds, but the actual files appeared in Downloads. Readback of `openpath-plan (2).json` and `openpath-counselor-review (4).txt` passed 21 assertions: B/A grades, separate grade level, workflow snapshot and schedule state, preserved college totals, one linked allocation, distinct HS provenance totals, the saved preview question, and matching text representations. Copies are retained as `verification/grades-plan.json` and `verification/grades-counselor-review.txt`. This confirms local file creation; no school delivery or official award is claimed.

A review found and corrected two text-export issues: ordinary HS records now include derived credit status and exclusion reasons, and school-specific programs no longer receive an unconditional comprehensive-baseline statement. The checklist also refreshes immediately when returning from a linked form after its automatic save.

## Connected OUSD extension, preceding verification

The original localhost:4317 record was reopened after the final source changes. It still has 4 completed, 3 in-progress, and 5 planned college units. Its exact original Howard question remains unchanged. No high-school course or allocation was silently added to that original record.

The separate 127.0.0.1:8787 preview contains an explicitly fictional high-school example added through the rendered forms: Fictional English 9, 10 credits, recorded school-verified; and an explicitly entered 13-credit student-reported elective allocation linked to the existing Laney ENGL C1000 record. It shows 23 recorded earned HS credits, a provisional 230-credit comprehensive baseline, and 207 remaining using recorded earned. Only 10 credits are in the school-verified-as-recorded bucket. The app does not authenticate either record. Its college totals remain 4/3/5.

| Rendered browser check | Observed result |
| --- | --- |
| School profile | OUSD + comprehensive baseline and fictional school name saved; class of 2027 recorded, applicability checkbox left unchecked |
| Ordinary HS class | Added completed/passing/earned 10-credit English record; semester college units unchanged |
| Unapproved allocation | Explicit 13-credit linked allocation stayed pending and earned progress remained 10 |
| Student-reported approved allocation | Separate 13 reported and 10 school-verified buckets; no duplicate college course created |
| Policy estimate | Opening the 4 × 3.3 estimate displayed 13 but left the credit amount blank until explicitly entered |
| Edit status | Switching the 10-credit HS class to planned reduced earned from 23 to 13; restoring completed restored 23 |
| Remove school class | Removed the test HS record through confirmation; earned dropped to 13 while college records stayed intact; fictional record then re-added |
| Linked college term edit | Temporarily changing ENGL C1000 from Fall 2025 to Fall 2024 put its allocation into review and reduced earned to 10; original term restored |
| District catalog | Bunche showed ART 205, 2 semester units, the source trimester label, and Not transferable |
| Save a district listing | Added ART 205 as planned Fall 2026; saved card kept the district flag and unknown university awards; removed this temporary record afterward |
| Reload | Profile, ordinary HS record, linked allocation, totals, college courses and saved question persisted |
| Keyboard | Enter opened subject details; Escape closed allocation dialog and returned focus to its invoking button |
| Mobile | At 375 CSS pixels, document scroll width was 360 and allocation dialog width was 326; no horizontal overflow |
| Subject detail | English 10/40 with 30 remaining; electives 13/50 with 37 remaining; other subject gaps, GPA/project, program and cohort limits visible |

New regression coverage includes separate HS/college quantities, capped subject satisfaction and non-negative remaining, passing plus explicit award, school provenance, approval/transcript conditions, Skyline and Oakland Tech restrictions, duplicate and missing links, link snapshots invalidated by changed college terms, ordinary-course status/removal, unknown school/program applicability, grade 9-12 scope, semester-only conversion, migration preservation, escaped rendering, and exact schedule identities.

The public schedule snapshot contains all 79 populated rows across 16 school/program groups: 74 Peralta and 5 CSU East Bay reference-only listings. A read-only CSV parity check matched all 79 rows across seven public identity/provenance fields. Combined/range course strings remain browsing-only. Variable amounts stay unknown. PSYCH C1000 is not treated as PSYC C1000. The merged catalog has 85 records, including 51 schedule-only identities, and 66 addable source listings.

Screenshots:

- `verification/ousd-connected-desktop.jpg`: final connected desktop record.
- `verification/ousd-connected-mobile.jpg`: complete phone-width record.
- `verification/ousd-allocation-mobile.jpg`: school allocation form at phone width.

Export buttons were exercised in this pass and displayed Download requested. The in-app browser did not report a completed download event within the bounded wait, and a new file was not found in Downloads at readback. New OUSD export file completion is therefore unverified. The prior guided export artifacts below remain historical evidence, not proof for the new fields. No school award, current seat availability, applicable class-of-2027 policy, A-G completion, university degree use, public deployment, or remote hosting behavior is claimed.

## Guided browser checks (preceding three-stage revision)

Used the Codex in-app browser. The isolated first-time record used `http://localhost:8787`; the separate returning-record preview used `http://127.0.0.1:8787`. Neither shares browser storage with the watched `http://localhost:4317` record.

| Path | Observed result |
| --- | --- |
| Fresh entry | One main action, Find my next class; plain description, no account or major requirement |
| Start by keyboard | Enter opens Your classes and moves focus to its heading |
| No previous classes | Explicit skip proceeds without creating any course entries |
| No university selected | Continue remains available; no unsupported recommendation is invented |
| Undecided ending | Choose a Peralta college, save a general counselor question, reload; question remains |
| Protect guide-only data | Explore a sample shows replacement confirmation even when only choices or a general question are saved; cancel preserves the record |
| Familiar-name search | English finds current English records; college filter and course number distinguish the source |
| Add a past class | Status, term and year start blank; an empty save is blocked; explicit Completed / Fall 2025 saves correctly |
| Duplicate entry | Adding the same course/status/term again leaves one record and explains that it is already saved |
| College choices | All 14 destinations remain available in grouped selection; selected UC Berkeley and Howard persist when moving back and forward |
| Small shortlist | Course families appear once; existing English is excluded; source-college alternatives remain available |
| Save a draft | Selected Laney statistics for Spring 2027, then saved it as planned; it did not increase completed units |
| Useful ending | Saved a contextual Howard question directly on the result screen, without the matrix, evidence dialog, or a separate Journey mode |
| Back and reload | The explicit English record, destination choices, statistics draft, and saved question remained; totals were 4 completed, 0 in progress, 4 planned |
| Optional evidence | School-by-school details remain reachable; Escape returns focus to the opening button |
| Narrow screen | At a 390 by 844 viewport override, measured content width and document scroll width both equaled 375 CSS pixels |
| Primary action | The saved-result screen exposed one primary button, Save a copy for my counselor |
| Console | No captured application warnings or errors during the checked guided path |

These checks show that the shortest useful paths work. They do not establish student comprehension, preference, or long-term motivation. The five-student study in PRD.md remains a proposal. No students were recruited or contacted.

## Corrections made during review

- Preserve focus across evidence-to-question dialogs, including Escape.
- Retain exact course, source college, term and destination in text exports even when question wording is edited.
- Reject blank saved entry IDs through recoverable storage validation.
- Protect notes and college-only state before loading a sample.
- Block exact duplicate new course entries in the guided flow and retain warnings for recorded duplicates.
- Mark graduation year as not provided when the guided student has not confirmed the full settings form.
- Report Download requested rather than claiming that a browser definitely saved a file.
- Keep the no-evidence route useful without suggesting an academically verified next class.

## Export verification

The initial MVP produced actual text and JSON downloads, retained under `verification/openpath-counselor-review.txt` and `verification/openpath-plan.json`. Those are earlier four-course, Howard-only test fixtures, not the watched demo record.

During the follow-on work, the browser download-event waiter timed out. The app's request notice alone is not proof of a saved file. A fresh guided test export was independently found and read back from Downloads. Six text assertions passed, including unconfirmed graduation year, separate 4/0/4 unit buckets, exact statistics/Laney/Spring 2027/Howard question context, and source-year and unknown-evidence labels. The fresh JSON export passed course status, destination, guide-step, general-note, and contextual-question checks. Copies are saved as `verification/guided-counselor-review.txt` and `verification/guided-plan.json`. The delayed file readback, not the timed-out event waiter, establishes the successful downloads. No export was sent to a school.

## Hosting and remaining limits

See HOSTING.md for the exact public asset list, pinned tooling, headers, local-runtime checks, and publication gate. The local preview must be stopped before clean rebuilds or dry runs, then restarted; replacing dist while a preview was running caused HTTP 500 until restart.

Not verified: actual credit awards, admissions, degree applicability, grades, prerequisites, course availability, enrollment permission, the accuracy of every supplied research row, OS printing/PDF output, assistive-technology behavior, all-browser compatibility, or a full accessibility audit. Evidence remains a dated research snapshot. Passing tests do not make a credit decision authoritative.

No Cloudflare account, authentication, billing, remote resources, domain, public URL, TLS setup, or hosted browser behavior was tested. A future separately authorized publication needs the intended account and Worker name confirmed, authenticated access if not already available, and verification of the returned URL. No login, deployment, paid API call, commit, push, or school submission was performed.

## Final watched-record preservation and artifacts

The original `http://localhost:4317/#home` tab was refreshed only after the revised UI was ready. Its two existing course records and planned Merritt MATH 3A remained: 4 completed, 3 in-progress, and 5 planned local units. The original Howard question about Laney ENGL C1000 / Fall 2025 remained word-for-word. The three-stage guide is left on the saved-draft result; another reload retained that result and data. No course, destination, or question was replaced. The selected view/step was updated to the new result screen.

The final phone check also completed the no-past-classes route through a saved Laney statistics draft and counselor question. Totals were 0 completed, 0 in progress, 4 planned. The final content and document widths both measured 375 CSS pixels with a 390 by 844 viewport override. The override was then reset. The temporary fresh-test tab was closed; the watched result remains visible. No application errors or warnings were captured on the final watched tab.

Current artifacts:

- `verification/guided-entry-desktop.jpg`: final simple entry screen.
- `verification/guided-saved-plan-screen.jpg`: final visible watched-record result.
- `verification/guided-saved-plan.jpg`: full saved-plan page with original advisor question.
- `verification/guided-result-mobile.jpg`: final phone-width first-class result.
- `verification/guided-counselor-review.txt`: independently read-back guided text export.
- `verification/guided-plan.json`: independently read-back guided JSON export.

Earlier `desktop-overview`, `mobile-evidence`, `mobile-summary`, `watched-demo-*`, and `cloudflare-journey-desktop` images document the earlier interface only. They are not screenshots of the final simplified guide.

The original 4317 process remains running. Its already-loaded route matcher is the earlier constrained `/src/*.js` and `/src/*.css` matcher. The on-disk server now uses an explicit 10-route allowlist; that narrower version was tested on a fresh temporary port and will take effect on the next normal server restart. The Cloudflare preview uses the final strict generated allowlist now. This incidental local-server tightening does not change student state.

## Final credit-summary refinement

The saved-plan and selected-candidate cards now show at most three plain-language checks. Real term/year uncertainty, unknown destination credit, and an advisor check of degree use and readiness remain visible. The existing preliminary A&T facts remain labeled preliminary. **See all credit details** is a native expandable control containing every prior condition plus the complete selected-school evidence and original source links. The entry screen and its screenshot were not changed.

- `rtk node --test tests/guide.test.js`: 14 passed, including 1,530 seeded course/destination/term combinations plus combined-target cases, missing/matching/different years, historical IDs, and no-state-mutation checks.
- `rtk npm test`: 60 passed, 0 failed. `rtk npm run check`: 16 JavaScript files passed.
- Build retained 11 allowlisted files. Cloudflare dry run passed. Fresh local Workers checks passed for 10 GET and 10 HEAD public routes, all 7 headers, and 17 excluded-path 404s.
- Browser verified exactly three summary bullets for the retained calculus plan; details are hidden initially. Enter expands the native control and exposes the full alternative-course rule, all four selected school sections, and 10 source links. Enter collapses it again.
- A temporary ENGL C1000E record was added to the separate test preview alongside ENGL C1000. The specific duplicate-credit and unit-cap warnings stayed rendered and visible outside any details element. The temporary record was then removed and the test preview returned to 4 completed, 3 in-progress, and 5 planned units.
- At the phone viewport, both collapsed and expanded pages measured 375 CSS pixels for content width and scroll width. The temporary viewport override was reset.
- Refreshed the original watched tab, selected its saved-plan result, and verified the original 4/3/5 totals and unchanged Howard question. Updated `guided-saved-plan.jpg`, `guided-saved-plan-screen.jpg`, and `guided-result-mobile.jpg`; added `guided-credit-details-mobile.jpg`. The original entry screenshot is unchanged.

This refinement changed no student record, evidence dataset, credit rule, dependency, or hosting configuration. Publication and all previously stated academic/accessibility verification limits remain unchanged.
