# Matriculate: student credit-planning prototype

**Product:** Matriculate, formerly OpenPath. **Version:** MVP 0.5 general student scope. **Date:** October 4, 2026. **Stage:** development prototype. The latest grade alerts and Matriculate rename are local/source changes and have not been deployed. The hosted beta remains the earlier OpenPath release; its documented checks do not verify these newer changes. **Implementation:** browser-native HTML, CSS, ES modules, a Node.js local server, and Node built-in tests. No browser runtime dependencies or hosted application-data services. Pinned development-only Wrangler supports Cloudflare static hosting.

The brand change preserves existing repository/Worker URLs, npm package identity, `openpath.prototype.v1` storage and schema, build ownership markers, and historical artifact filenames. New download names use the `matriculate-` prefix. No saved-plan migration or deployment is part of the rename. The source also includes a CSS-only motion treatment described below; it is not deployed.

Motion is progressive enhancement: one bounded welcome gradient, finite heading/dialog entrances and tactile controls. Normal preference enables brief motion; reduced-motion preference keeps decorative motion, progress and transitions static. Credit quantities, unknown values, warnings and evidence stay stable. Controls are available immediately, the dialog close target is 44px, and no animation library, external font, background video, WebGL runtime or ongoing JavaScript loop is introduced. The gradient is shader-like CSS styling, not an actual shader renderer. [AUDIT.md](./AUDIT.md) records measured asset weight, browser checks and the unverified physical-device/older-browser limits.

## 1. Product decision

**Choose your next college course while keeping your future options open.**

Matriculate helps students at any high school organize school and college coursework, separate recorded credit from unresolved decisions, and prepare a next step for counselor review. OUSD graduation rules and Peralta-to-UC/HBCU evidence are the initial researched coverage, not an eligibility boundary for using the planner. Outside that coverage, students can record their own school context and college courses while credit applicability remains explicitly unverified.

The prototype answers three questions:

1. What college coursework have I completed, started, or planned?
2. What does the documented evidence say at each destination, and what still needs review?
3. What is the next useful action: a researched course idea, a course to discuss, or a question to resolve?

The default interface is one guided flow: **Your classes → Your colleges → Your next class**. These are navigation stages, not a readiness score or a checklist the student must complete perfectly. A student can skip prior coursework or continue without choosing a destination. The resulting action may be saving a counselor question rather than selecting a class.

The connected outcome adds a second question to the same college course: could it contribute to high-school graduation as well as future college credit? College coursework taken during high school remains the core record and planning object. OUSD students have a limited researched policy route. A general or unknown-school profile can use an optional student-entered total-credit target, with no invented subject requirements. Section 16 defines the researched OUSD scope; section 17 adds the district's Fall 2026 course list; section 19 defines the general profile and manual course requirements.

It does not calculate admission chances, recommend a best-fit college or course, promise a credit award, or treat an unknown match as a rejection. Detailed comparison and record-management tools remain available behind **Tools & details** instead of competing with the next guided action.

**Unknown:** We do not yet know whether students will repeatedly use this workflow or prefer it to existing planners and counselor guidance.

## 2. Audience and job to be done

The primary user is a high-school student taking or considering college coursework, including a student with an undecided major or an unresearched school. Students do not need to attend OUSD or Peralta to keep a record. The initial evidence is strongest for the specified Peralta courses and UC/HBCU destinations. The student owns the record. A counselor or parent can review an exported summary without needing an account.

Job statement: “When I choose my next college class, help me see where it has documented value and what I must verify, so I can make a practical plan without deciding my university or major yet.”

This is not initially a counselor administration tool, a GPA tracker, or a complete degree audit. The record can remain on the device as the student progresses into college, but an eventual change from first-year to transfer applicant requires new rules. Accumulating units must not silently change the applicant route.

## 3. Researched coverage and general records

The reviewed source-college catalog covers four Peralta institutions. Identical-looking course codes at different colleges remain separate catalog records:

- Laney College
- Merritt College
- Berkeley City College
- College of Alameda

Students may also enter a college course manually with its own source-college name and course identity. A manual record is local student data and has no automatic equivalence to a researched record. General high-school profiles support optional school/district names, graduation year and a manual total-credit target. The 17-school OUSD directory and OUSD policies remain a separate researched route.

The destination directory contains exactly these 14 institutions:

| UC undergraduate campuses | HBCU pilot shortlist |
| --- | --- |
| University of California, Berkeley | Spelman College |
| University of California, Davis | Howard University |
| University of California, Irvine | Tuskegee University |
| University of California, Los Angeles | Morehouse College |
| University of California, Merced | North Carolina A&T State University |
| University of California, Riverside | |
| University of California, San Diego | |
| University of California, Santa Barbara | |
| University of California, Santa Cruz | |

The HBCU list is the user-selected pilot shortlist, resolved during prior research using the 2027 U.S. News list. It is not an institutional ranking feature, a fit assessment, or a guarantee of eligibility or admission. No substituted destinations.

The researched seed catalog is 16 verified institution-course records: ENGL C1000 (4 semester units), STAT C1000 (4), MATH 3A (5), and PSYC C1000 (3), independently documented for all four colleges in ASSIST 2025-26. Two supported-English records add ENGL C1000E at Laney and Merritt only, with 5 local units, a 4-UC-unit cap, and its documented duplicate relationship with C1000. Sixteen historical source-code records support exact-identity review through the detailed catalog. Their unverified local titles and units remain unknown. These 34 researched records remain distinct from the additional district schedule identities in section 17. Neither set is a complete Peralta catalog.

## 4. Positioning hypothesis

Existing tools cover substantial parts of this problem. Transferology supports high-school college coursework, destination matching, uncertain matches, and some institution-provided degree audits. CreditMap targets high-school AP and dual enrollment, including a manual dual-enrollment research add-on. Plan My Transfer offers CCC-to-UC/CSU course and major planning. See [RESEARCH.md](./RESEARCH.md) for sources, retrieval status, and unresolved coverage.

The hypothesis to test is that undecided students will value a portable coursework record that gives them a clear next action while separating researched evidence from unanswered questions. The Peralta comparison keeps UC and HBCU options side by side as a focused evidence example. Manual records broaden who can use the workflow; they do not broaden the verified credit coverage. Do not claim an empty market, unique invention, higher accuracy, proven demand, or guaranteed savings.

## 5. Main journey

Use one illustrative student throughout testing: a high-school junior who has completed Laney ENGL C1000, is considering a spring course, and wants to keep UC Berkeley, UC Davis, Howard, and North Carolina A&T on the list. The sample is fictional and visibly labeled.

1. The student opens the welcome screen and begins the guide, or deliberately loads a labeled sample from Tools & details.
2. **Your classes:** the student searches for English, chooses ENGL C1000 at Laney, and explicitly enters status, starting term, and year. These fields start blank for a new taken-class record. There is also a skip action for students who have not taken college classes.
3. **Your colleges:** the student adds UC Berkeley, UC Davis, Howard, and North Carolina A&T. Each selection is removable. The student could instead continue with “I'm not sure yet.” No major, name, date of birth, login, or transcript is required.
4. **Your next class:** the student selects where they could take a Peralta class and reviews the visible planning term. Class ideas are grouped by course family to avoid presenting the same class as four competing suggestions. Choosing a family reveals every available source-college option within the selected scope.
5. The student selects MATH 3A and its source college. **What we know** shows the scoped UC unit evidence and A&T preliminary match. **What still needs checking** shows the dated/undated evidence, final credit and requirement questions, and prerequisites/availability. Full school-by-school details and sources remain optional to open.
6. The student saves this exact course to the draft. It remains planned, not earned or enrolled. The saved result offers a counselor question in place, followed by a review download. The student can edit the question or leave it for later.
7. The same underlying comparison keeps old A&T ENGL 1A separate from current ENGL C1000. Howard remains unresolved. A no-destination or evidence-insufficient plan produces a savable general counselor question instead of an invented course candidate.
8. Reloading retains coursework, destinations, draft, questions, and the guide stage. Existing records with planned coursework resume at the draft result. Clearing is explicit; export a copy first because there is no automatic re-import or school-submission action.

## 6. Screens and interaction requirements

### Guided shell and welcome

Use a compact brand header, a secondary Tools & details menu, three stage buttons, one main content column, and a clearly dominant next action. The welcome screen explains the workflow and local storage without a dashboard or setup questionnaire. The three stages stay revisitable. There is no five-step completion meter, view-mode choice, gamified score, or implication of college readiness in the current interface.

Show the prototype label and the high-school dual-enrollment scope. Keep major optional with an undecided default. Graduation year and full profile settings belong in the detailed tools, not as a prerequisite to starting the guide. Sample loading and reset must explain which local record is replaced and require an explicit choice when a record already exists.

### Stage 1: Your classes

Search current records by code, title, or college; narrow by source college when useful. Keep the exact source college on results and saved rows. A new taken-class form begins with blank status, term, and year and cannot save until all three are supplied. Never prefill a historical date or mark a course completed merely because it was selected. Existing records keep their actual saved values when edited. An explicit skip action leads to college selection.

Provide **Add another college class** when the course is outside the researched catalog, and **Plan another college class** in the draft stage. Keep its source college, code, title, units or unknown, unit system, term/status and optional final grade on the same kind of saved card. Show **Needs transfer review**. The student can use a general/unknown-school profile through **Add your school's graduation requirements** without choosing an OUSD school or policy. Section 19 defines the implemented scope and its verification boundary.

Completed and in-progress classes appear here; planned classes appear in the draft result. Detailed tools retain the full searchable catalog, including the opt-in historical identities, and record editing/removal. An exact duplicate must be prevented or explained, never silently counted as additional destination credit. Completed, in-progress, and planned **local** unit totals remain distinct. “Completed” is a student report, not evidence of a passing grade. An optional student-entered final grade belongs on the existing add/edit form; it remains separate from high-school grade level and does not establish an official award. Blank grades leave grade-dependent rules unchecked. Section 18 defines validation and the same-course follow-up workflow.

### Stage 2: Your colleges

Provide a compact picker for all 14 destinations, grouped UC/HBCU, and removable selected-college chips. Avoid a full wall of institutional cards as the required entry flow. Make “I'm not sure yet” a valid continuation. Selection means curiosity, not fit, eligibility, commitment, or a recommendation. Source-college selection for the next class is separate from destination-college selection.

### Stage 3: Your next class

Label researched class ideas as Peralta coverage. A student outside that coverage can retain a manual course plan or save a counselor question without claiming a Peralta match. When exploring the researched ideas, ask for a source Peralta college if none is selected and allow more source colleges and an intended term through the visible where/when controls. Show a short list of researched class families, ordered by the deterministic evidence rules. Each family retains every eligible source-college option within the selected source scope. Require the student to choose the exact source-college record before saving; grouping never merges identities or their different rules.

For the selected idea, show two readable sections in place: **What we know** and **What still needs checking**. The first contains only source-scoped statements. The second uses at most three plain-language bullets to keep current-term uncertainty, unknown schools, and advisor review of degree use and readiness visible. A native **See all credit details** control expands complete conditions, technical rules, per-school evidence and original sources. Detected conflicts in saved classes remain visible outside that control. General alternative-course limits with no detected conflict may stay in the expanded details.

Class ideas are planning candidates, not enrollment-ready or best-fit recommendations. Do not invent seats, scheduling, eligibility, or prerequisites. Exclude already saved courses and known duplicate-credit alternatives. Save the chosen record as planned with its intended term; offer edit and explore-another-class actions without losing the draft.

If no destinations are selected, or available evidence cannot support class ideas for the selection, show a general counselor question that the student can edit and save. Store it as `guide.note`. Saving a question is a useful outcome; it must not create a fictitious course, credit result, or destination match.

### Draft, questions, and review

After a class is saved, display the draft with its evidence summary and one next action to prepare a counselor question. The inline question can be edited and saved, or deferred. Specific questions retain exact course, source-college, term, and destination context; general questions stay explicitly general. Saving sends nothing. Changed context leaves a specific question available for review rather than silently presenting it as current.

Offer a readable review download and access to the full printable summary. The summary contains coursework/status/term, source colleges, selected destinations, source years/URLs, specific questions, and any general counselor note. Label it as a dated planning draft. JSON export preserves an offline record; it is not a restore UI.

### Tools & details

Keep all-class editing, the detailed comparison matrix, the full class-idea planner, review/print/exports, full settings, sample data, and clear/reset accessible here. These use the same saved record as the guide. A clear return action leads back to the guided home. The detailed matrix remains useful on desktop and accessible on narrow screens, but is not mandatory in the main journey.

Each detailed course-destination result exposes these independent dimensions:

| Dimension | Required presentation |
| --- | --- |
| Unit credit / equivalent | Published transferable-unit evidence, preliminary named equivalent, or not verified |
| Local and destination units | Distinct values and units, with a discrepancy explanation when relevant |
| GE applicability | Not verified unless a specific applicable source exists |
| Major applicability | Not verified; an undecided major is not a passed rule |
| Evidence status | Published, preliminary, review required, or no verified match |
| Time | Student course term, evidence academic year or “not stated,” and mismatch flag |
| Applicant route | First-year dual enrollment, general policy only, or applicability unconfirmed |
| Evaluation conditions | Final transcript/evaluation, grade, sequence, duplication, or other unresolved condition |

The detail view contains source institution/code, destination/system, source link, retrieval date, academic year, claim scope, constraints, and review questions. It is keyboard accessible and closing restores focus. A school with only policy evidence must remain visible. No percent, acceptance score, red/green verdict, or university ranking replaces the independent fields.

## 7. Deterministic evidence and suggestion rules

1. Match evidence using explicit source-institution identity and exact supported course identity. Whitespace/case normalization may support display lookup; it must not create a renumbering bridge.
2. Keep historical ENGL 1A, MATH 13, and PSYCH 1A separate from current ENGL C1000, STAT C1000, and PSYC C1000. Title similarity and shared subject matter cannot establish identity.
3. Treat UC systemwide transferability as one evidence group. Selecting nine UC campuses must not produce nine independent proofs or multiply a ranking score by nine. Preserve each campus as a destination for comparison and future campus-specific evidence.
4. A&T's preliminary equivalent is a second, separate evidence group where the exact source college and course code are documented. An unknown effective year stays unknown. Displayed A&T hours are not a final student award.
5. Absence of a verified match produces an unknown/review state. Preserve “not researched,” “research blocked,” and “no entry found in the searched source” where known. None means rejected.
6. Compare the student course's academic year with the source year. Explicit academic-year selection is acceptable; if deriving it from term/year, document and test the mapping. Unknown term or source year is not a match. A 2026-27 course must flag 2025-26 evidence as requiring review.
7. Keep quantity calculations deterministic. Completed, in-progress, and planned local units are distinct. Destination totals, if shown, must be identified as conditional evidence-based estimates and must apply known caps and duplicates. Prefer not showing a destination total where evidence is incomplete.
8. Supported English is one UC credit group where documented: C1000E's 5 local units do not become 5 UC units; C1000 plus C1000E does not become 8 or 9 UC units. Do not invent rules for other unresearched combinations.
9. Candidate ranking is an evidence-navigation aid. Sort by documented evidence-group coverage, distinguish published from preliminary support in the explanation, and use a stable neutral tiebreaker such as course code. All year, identity, and applicability flags remain visible. Missing HBCU evidence must not be a negative credit decision or a recommendation against that institution.
10. When selected destinations have no course-level evidence, state that the seed data cannot rank usefulness there. Show an honest review state instead of manufacturing a “best” course. Retain policy links and useful counselor questions.
11. Group class ideas by a stable, known course-family key solely for presentation. Retain each eligible source college and exact record inside the group. Filtering may narrow the selected source scope; grouping itself must not discard alternate colleges or copy one college's evidence onto another.
12. The new taken-class form requires explicit status, term, and year. A configured future planning term can prefill a new draft, but is not evidence of when past coursework occurred. General counselor notes do not satisfy course-level evidence or record requirements.

## 8. Data and evidence model

The implementation may use immutable JS seed objects and versioned JSON local state. No database is needed. Logical fields are required even if names differ in code.

| Entity | Required fields and invariants |
| --- | --- |
| Source institution | Stable catalog ID and official display name where researched; separately identified student-entered college name for manual records; no shared identity inferred from district or name similarity |
| Destination | Stable ID, official name, type, optional system ID, policy-source references |
| Course | Stable ID including source college, code/title, units or unknown, explicit unit system, and researched/manual provenance; catalog/evidence year and source references only where supplied; no automatic manual equivalence |
| General high-school profile | Optional school name, district name, graduation cohort and student-entered total-credit target; no OUSD rule or subject/GPA/project requirement inferred outside its researched route |
| Student record | Version, selected source/destination IDs, useful school/graduation year, major preference, fixed supported applicant route, course entries, sample flag, optional guide metadata, retained legacy Journey metadata |
| Course entry | Unique entry ID, course ID, status, term/year or explicit academic year, optional student-entered final grade, optional local workflow confirmations; no final grade on a non-completed record |
| Guide metadata | `started`, stage `classes`/`colleges`/`next`, and general counselor `note`; missing fields get safe defaults derived from existing valid coursework |
| Specific counselor question | Editable text plus exact course ID, destination ID, and term; preserved in `journey.questions` for compatibility even though the old Journey interface is superseded |
| Connected high-school outcome | District/school context, source college/course, policy reference, potential high-school credits distinct from college semester units, approval/transcript conditions, subject applicability and school-specific rule status; no final award inferred from the college record |
| Evidence | Stable ID, source college/course identity, destination or system scope, claim kind, equivalent if any, displayed destination units if any, academic year or null, first-year applicability, preliminary/final character, source references, constraints |
| Source | Stable ID, title, publisher, URL, checked date, retrieval method/status, effective period distinct from checked date, claim scope, research notes |
| Rule | Type, exact affected course IDs/group, destination scope, cap/combination behavior, source reference; no unsourced inferred rule |
| Derived result | Independent unit/equivalent, GE, major, time, applicant, and condition states; reasons and source references |

Never overwrite a student's term with the source year to obtain a match. Store absence as `null`/explicit unknown, not zero, false acceptance, or false rejection. The public seed data and private local state remain separate so a later evidence refresh does not rewrite the student's coursework.

## 9. Architecture, privacy, and optional judgment seam

Use a static front end with pure rule functions, a data module, a storage module, and a thin UI. The local server binds to loopback. Browser state persists in a versioned `localStorage` key, with safe handling for invalid JSON, unsupported versions, and storage errors. Render user-editable values as text. External evidence URLs open without leaking student record values in query strings.

The prototype performs no account creation, telemetry, student-data transmission, automatic online research, or background hosted inference. Local storage belongs to this browser and device, is not an institutional record, and can be lost if browser data is cleared. Provide export before destructive reset. Do not inspect credentials.

The optional Jev seam is disabled by default and must not be necessary for any MVP flow. Later, a constrained judgment provider could select from already known candidates or classify supplied evidence into allowed labels. It can return a typed choice, boolean probability, or score; it does not generate explanations, verify sources, establish historical bridges, or award credit. Exact lookups, arithmetic, dates, caps, and duplicate rules stay in code. Human-readable reasons come from source-backed templates. A separate explicit authorization is required before the first hosted TypeSafe/Jev request or student-data transmission. No such authorization is included in this project.

## 10. P0 acceptance criteria

| ID | Observable pass condition |
| --- | --- |
| P0-01 | A new visitor sees the welcome screen and can enter the three-stage guide without a name, account, transcript, major, or mandatory profile questionnaire. Prior classes and destination selection can be skipped explicitly. |
| P0-02 | All four source colleges and all 14 exact destinations are available; changing selections persists after reload. |
| P0-03 | All 16 core catalog records preserve source college, code, title, units, and ASSIST 2025-26 provenance. Unsupported additional records are not invented. |
| P0-04 | A student can search, add, edit status/term, and remove a course. New taken-class status, term, and year start blank and are mandatory. Reload retains supplied values and local unit buckets respond correctly. |
| P0-05 | Comparison independently shows unit/equivalent evidence, unknown GE/major applicability, source year, student year, and applicant/evaluation constraints. |
| P0-06 | A 2026-27 entry does not display 2025-26 evidence as current. Undated A&T data does not receive a fabricated effective year. |
| P0-07 | ENGL C1000, STAT C1000, and PSYC C1000 do not inherit older A&T code matches. MATH 3A can show its exact-code preliminary evidence with constraints. |
| P0-08 | Howard, Spelman, Tuskegee, and Morehouse remain visible as unresolved course matches; Morehouse's blocked research is not described as a completed lookup with no results. |
| P0-09 | Class ideas exclude saved courses and known duplicates, explain independent evidence groups, and avoid multiplying UC support by campus count. Family grouping preserves all eligible source-college options. |
| P0-10 | Planned and in-progress courses never increase completed local units or appear as awarded destination credit. Known supported-English caps and duplicate rules pass regression tests if those records are included. |
| P0-11 | Choosing an exact source-college record saves a planned draft and presents the saved result with an inline question action. Changing target schools retains the plan and refreshes its evidence. Editing/removal remain accessible. |
| P0-12 | A printable/exportable counselor summary includes source colleges, course status/term, destinations, evidence sources/years, specific questions, and the general counselor note, with no sending action. |
| P0-13 | Sample data is labeled, loading/reset is explicit, and clearing returns a useful empty state. Browser persistence failures are recoverable or explained. |
| P0-14 | Main flows work with keyboard controls and a phone-width viewport. Controls have labels, focus is visible, status is not color-only, and evidence details can be opened and closed accessibly. |
| P0-15 | Meaningful rule/storage tests pass and the rendered sample-to-plan-to-export flow is exercised in a browser without uncaught application errors. The shipped README records exact commands and verification limitations. |
| P0-16 | No app path invokes hosted judgment, sends student data, creates accounts, enrolls in classes, publishes, or deploys. |
| P0-17 | No-target and evidence-insufficient paths offer a savable general counselor question. They do not create fabricated class ideas or credit results. The note survives reload and appears in the review export. |
| P0-18 | The guide keeps known facts and unresolved checks visible before and after saving. Full sources are optional to open, but the caveats are not optional to see. |
| P0-19 | A valid older version-1 record retains coursework and legacy questions. Missing guide fields initialize safely; records with planned coursework resume at the draft result. No historical term or activity is invented. |
| P0-20 | Tools & details reaches editing, detailed comparison, full planner, summary/exports, settings, sample and reset, with a clear return to the guide. The old five-step Journey interface is not the current default or an extra required view. |

## 11. Evaluation and release checklist

Automated regression fixtures cover exact institution/code identity, academic-year mismatch and missing year, unknown versus rejected, completed versus planned totals, known duplicate caps, A&T preliminary credit discrepancies, destination changes, stable class-idea ordering, family grouping without lost source options, one-group UC counting, local persistence round trips, guide defaults for legacy records, general notes, and malformed saved data.

Manual browser verification follows the example in section 5. Exercise welcome and skip paths; reject a new taken-class save with blank status/term/year; select destination chips and a second source college; choose a class family and exact source record; save and edit the draft; prepare a question; reload; inspect review exports; and reach detailed tools. Also check an unknown-only destination set, no destinations, retained legacy planned courses/questions, and reset/sample behavior. Check a narrow viewport and keyboard navigation. Record actual commands, results, and browser observations in [VERIFICATION.md](./VERIFICATION.md); this PRD is a requirement, not evidence that a check passed.

After the local MVP, the separately authorized five-student study in section 15 should test whether the guided structure improves comprehension and task completion. The targets there are proposed thresholds, not measured results.

Have a qualified counselor or articulation reviewer independently audit every seed claim, year label, and duplicate rule before a broader pilot. Resolve any false-positive applicability claim before expansion. No student recruitment or college contact is authorized by this local build.

## 12. Out of scope and roadmap

**Excluded now:** authentication, cloud sync, school SIS integration, transcript uploads/OCR, unrestricted manual course inference, GPA optimization, application essays, admissions CRM, admission predictions, scholarship matching, full major/GE audits, class-seat feeds, enrollment, payments, hosted research per student, and counselor administration.

**Phase 0, this build:** three-stage guided home, local record, curated seed evidence, grouped class ideas, draft and questions, connected credit records, the Fall 2026 district schedule browser, detailed comparison tools, export/print, and documented tests. The current expansion adds general high-school profiles and manual college courses with unverified applicability. Verify those paths before describing the expanded beta as ready. Deliver the prototype plus this PRD, provenance research, README, and verification record.

**Phase 1, evidence depth:** independently verify 2026-27 source agreements, explicit old/new course bridges, first-year campus-specific requirement applicability, additional Peralta courses, and HBCU course evidence. Capture effective periods and a repeatable review process. Expand only when claim-level provenance is complete.

**Phase 2, student validation:** run the authorized small usability pilot, revise terminology and mobile comparison, then decide whether the next investment is evidence coverage or richer planning. Evaluate repeat use before choosing a business model.

**Phase 3, durable service decision:** consider accounts, secure sync, operational ownership, evidence update cadence, accessibility audit, and institutional integrations only after scope, privacy, cost, and authorization review. Preserve the student's original course record when adding a separately verified post-high-school applicant route.

The next product decision should be grounded in observed student comprehension and an independently reviewed evidence set, not in the number of universities displayed.

## 13. Saved-state compatibility and superseded Journey interface

The earlier optional **My Journey** interface used five literal planning actions: choose colleges, add a course, open evidence, draft a plan, and prepare a question. That interface and its view switch are superseded by the current three-stage guide. They are historical implementation context, not current UI requirements. The guide does not display a five-step completion score or use it to determine credit, readiness, or eligibility.

Keep the version-1 storage key and preserve valid existing coursework, profile choices, questions, and legacy metadata. The optional `guide` object contains `started`, `step`, and `note`. When it is absent, initialize `started` from existing setup/coursework and choose `next` if planned coursework exists, otherwise `colleges` if any coursework exists, otherwise `classes`. A new empty record retains the welcome screen. Existing explicit guide state persists across reloads.

Retained `viewMode` and `journey.evidenceViewed` values must not force a user back into the superseded home screen. Evidence-visit keys describe an exact recorded visit only; they never establish comprehension or credit. Specific counselor questions remain in `journey.questions` for compatibility and are available to the guide and review tools. They retain their course/term/destination context and are marked for review when the current plan no longer matches. The new general note in `guide.note` has no course-level matching claim.

Migration must not fabricate prior actions, rewrite a valid course term, merge historical/current course identities, or discard a prior plan merely to simplify the interface. Invalid saved records retain the existing recovery path. Reset clears the complete local record, including guide and legacy metadata. Loading sample data is explicit and does not fabricate evidence visits or saved questions.

## 14. Cloudflare hosting preparation and publication gate

The chosen hosting direction is Cloudflare Workers static assets. The current implementation needs no application Worker handler, D1 binding, dynamic API, account system, or hosted judgment. A later central store of reviewed course evidence may use D1, but that is a separate data-governance and operations decision. Student plans remain in the browser.

An allowlisted build produces only the HTML entry point, required JavaScript/CSS modules, and security-header configuration. Research drafts, verification reports/exports, screenshots, secrets, dependencies, and the entire project directory must never become web assets. The build rejects symlinked inputs and unowned output directories. Genuine 404 responses are retained for unlisted files. The public app has no automatic external requests or analytics.

Wrangler is pinned as development-only tooling. On October 4, 2026, the project owner authorized a private GitHub repository, ordinary commits and pushes, and a dedicated public Cloudflare development site for beta testing. Deployment uses the existing static-asset architecture and an explicit development Worker environment. It requires authenticated account verification, an inspected asset allowlist, and checks against the returned public URL. This authorization does not include paid features, billing changes, D1, school submissions, or uploading saved student plans. HOSTING.md records the actual deployment result and update commands.

Browser storage is origin-specific. The original `localhost:4317` record, the Cloudflare local preview record, and the public beta record are separate. There is no automatic migration between origins or cloud backup. The guide and detailed tools share state only within the same browser origin. Export is the current way to retain an offline review copy; automatic import remains out of scope.

For local Cloudflare verification, stop the running preview before a clean build or packaging dry run, then restart it. Replacing its generated asset directory while it is running can leave the preview returning 500 responses. This development workflow issue does not authorize deployment.

## 15. Proposed comparison study, not yet run

Invite five intended high-school student users only after separate recruitment approval. Test the current guide against the retained detailed planner if a comparison remains useful, alternating which workflow appears first. The superseded My Journey view is not the current study treatment. Use the same course and destination example so content differences do not confound the comparison.

Each participant should record a taken class without invented dates, select or deliberately defer destination colleges, inspect one documented and one unknown credit result, and save either a suitable-to-discuss draft or a general counselor question when the evidence cannot support class ideas. Ask them to find detailed sources only after the core task. Observe where they need help and whether they recognize that more than one source college can offer a class family.

The proposed initial target is that at least four participants complete the core task without assistance. All should distinguish planned from earned units, unknown from rejected, unit evidence from degree applicability, and navigation stages from admission eligibility. Ask participants to explain their interpretation before asking which workflow they prefer. Preference is an early signal; repeat use and motivation remain untested. No students have been recruited or contacted, and no study results are claimed for this build.

## 16. Connected OUSD high-school and college outcomes

The same Peralta entry must support an optional high-school credit allocation without adding the college course a second time. Its card distinguishes three outcomes:

| Outcome | What may be shown | Boundary |
| --- | --- | --- |
| High-school graduation credit | A recorded amount and subject, its provenance, and approval/transcript conditions | An OUSD award is separate from Peralta semester units |
| College credit at selected destinations | Existing UC unit evidence or preliminary HBCU equivalency, with source year and conditions | A possible college award does not establish OUSD approval |
| College GE/major use | Applicable requirement-level evidence, otherwise explicitly unverified | Unit transferability does not establish requirement completion |

### Applicable baseline and school exceptions

The school picker contains the **17 OUSD district schools serving high-school grades** verified against the [official school directory](https://www.ousd.org/our-schools/school-directory) on October 4, 2026. Include schools spanning multiple grade levels and alternative schools. Charter schools belong to a separate directory roster and are outside these 17; keep an Other/free-text route for them and unlisted schools. Preserve saved `skyline` and `oakland-tech` identities and existing free-text school names. The school-profile roster is distinct from the 16 school/program groupings in the Fall 2026 course sheet.

Six schools require a school-specific requirement review: **Dewey Academy, Gateway to College at Laney College, Ralph J. Bunche, Rudsdale, Sojourner Truth Independent Study, and Street Academy**. Do not assign them the 230-credit comprehensive baseline automatically. The other district schools may use that baseline provisionally, with school/program and graduation-cohort confirmation still required. A directory listing establishes the school's identity, not its graduation policy.

The OUSD comprehensive-school planning baseline is **230 high-school credits, a 2.0 GPA, and a senior project**. Its subject distribution is:

| Subject | High-school credits | Additional check |
| --- | ---: | --- |
| History and social studies | 30 | World history 10, U.S. history 10, government 5, economics 5 |
| English | 40 | Approved subject application |
| Mathematics | 30 | Required algebra and geometry content |
| Science | 30 | Required biological and physical science content |
| World language | 20 | Applicable course sequence |
| Visual and performing arts | 10 | Approved subject application |
| Physical education | 20 | Applicable school rules |
| Electives | 50 | Approved allocation |

Totals do not establish required course sequences, GPA calculation, senior-project completion, or graduation eligibility. The district page is undated, and its linked handout is labeled 2023-24. The BP 6146.1 body is dated May 13, 2020, distinct from May 2026 page publication. No certified 2027 cohort profile was verified.

Ask only for optional district, school, program baseline, and graduation year. Selecting or recording school confirmation of a baseline remains a planning record, not an authenticated school decision. Other programs must stay on an unverified requirement route. Rudsdale publishes a 190-credit continuation-school minimum; the app must not apply the 230-credit comprehensive baseline to it by default or invent its full subject audit.

Changing the school resets confirmed profile applicability and course-checklist confirmations for review. Preserve the student's course records and notes; a prior school's confirmation must not appear to approve the new school's requirements.

District dual enrollment and external concurrent enrollment are separate routes. Skyline describes external concurrent enrollment primarily as enrichment, with principal approval needed for graduation use, while district dual-enrollment credits follow district posting. Oakland Technical's published dual-enrollment rule limits credit to electives and disallows replacing existing high-school courses. Generic district language must not override these school-specific checks. The older administrative regulation does not justify a blanket claim that college coursework cannot earn college credit.

### Record and calculation contract

Store optional `highSchool.profile`, `highSchool.courses`, and `highSchool.allocations` within the existing version-1 record. An allocation links to the existing college entry ID. It records subject, high-school credits or unknown, decision status, passing result, award status, reported provenance, grade level, enrollment route, approval/transcript conditions, and a note. Missing fields default to unknown or unconfirmed. Older records receive empty collections without losing coursework or questions.

Optional standard, AP, and IB high-school class records provide the surrounding credit picture. These records do not create college credit. Label student-reported earned credits separately from school-verified credits **as recorded**. The app authenticates neither source. Completed status alone never establishes a passing result or an award. In-progress, planned, pending-review, and excluded records remain distinct from earned totals. Duplicate or orphaned college allocations are excluded pending review; they must not silently multiply credit.

BP 6146.11's optional semester-unit estimate is `round(units × 3.3)` to the nearest whole high-school credit. Show it only as a policy estimate, with its source and conditions. It must not fill or award the student's high-school credit amount automatically. Unknown or quarter units receive no estimate. Actual subject placement, applicable prior approval, passing completion, official transcript receipt, and school review remain separate. The November 14, 2025 outside-course memo reinforces prior approval and transcript requirements. BP 6146.11's January 27, 2016 revision history is distinct from its May 11, 2026 page publication.

The progress card compares recorded high-school credits with the selected baseline and subject gaps. Local college units and destination awards never enter its totals. A zero remaining-credit figure must still show the other conditions and the explicit limitation that it is not a graduation decision. Include connected records, provenance, unresolved conditions, and policy sources in review exports. Each exported high-school record must include its derived credit status and exclusion/review reasons. Where no reviewed program baseline applies, the export must state that no numeric baseline is applied rather than present 230 as that program's requirement.

### Extension acceptance criteria

| ID | Observable acceptance condition |
| --- | --- |
| P0-21 | A Peralta record displays separate high-school and college outcomes; linking school credit creates no second college entry. |
| P0-22 | Missing school/program context leaves requirements unverified. The comprehensive baseline has all eight subject totals, GPA and project conditions, and an explicit cohort limitation. |
| P0-23 | Completed alone does not earn high-school credit. Pending, planned, in-progress, reported-earned and school-verified-as-recorded states remain distinguishable in totals and exports. |
| P0-24 | The optional 3.3 semester-unit estimate is rounded, source-linked, not an award, and does not prefill a credit amount. Unknown and quarter units have no numeric estimate. |
| P0-25 | External concurrent-enrollment approval, transcript and school conditions remain visible; Skyline and Oakland Technical checks do not disappear behind the district baseline. Other programs do not inherit 230 automatically. |
| P0-26 | Duplicate/missing college links are excluded from counting. Saved high-school context and valid older records survive reload. AP/IB class records infer no college award. |
| P0-27 | Earned-credit totals and remaining subject gaps never produce graduation eligibility, a guaranteed credit award, or an admissions claim. |

These are implementation requirements. [VERIFICATION.md](./VERIFICATION.md) records actual checks; this section is not a claim that browser verification passed.

## 17. OUSD Fall 2026 course browser

Use the [official OUSD dual-enrollment page](https://www.ousd.org/high-school-linked-learning-office/for-students-families/dual-enrollment) and its linked [All DE Courses public sheet](https://docs.google.com/spreadsheets/d/14_D4lvEDjvou_TBa6q5StlEB8zTiK5lsvI52qjDwGZU/edit?usp=sharing) as a one-time local snapshot checked October 4, 2026. It contains every populated course listing in the Fall 2026 tab: **79 rows across 16 school/program groups**, comprising 74 Peralta and five CSU East Bay listings. These are listings, not 79 unique courses. CSU East Bay is reference-only and does not expand the four-college planning scope.

Stage 1 provides a school selector and source-linked listings with exact published code/title, college, semester units or original variable-unit text, pathway, source term, and district transfer flag. Retain duplicate sections, combined course labels, and trimester descriptions. Missing titles and numeric units stay unknown. Omit personal/contact, staffing, location, and enrollment-management fields. The browser performs no sheet request at runtime.

The schedule module exposes snapshot metadata and stable source-row IDs. Exact college/code identity is required to link a researched record. Only the Merritt ENGL C1000 listing matches an original researched record in this snapshot. In particular, published `PSYCH C1000` does not inherit `PSYC C1000` evidence. Additional unambiguous Peralta identities may be stored with neutral unknown destination evidence. Ambiguous combined/range/section codes and external-college rows remain review-only. Do not split a combined listing into guessed courses or overwrite a historical identity's unverified units.

The district column is labeled **UC/CSU transfer (OUSD Transcript codes TBD)**. Its flags remain attributed schedule statements. They are not verified OUSD subject awards, first-year university GE/major matches, HBCU equivalencies, or a refresh of ASSIST 2025-26. Preserve negative and limited flags, including Bunche ART 205 at 2 units marked not transferable and Castlemont RLEST 2A marked CSU Only.

Adding a listing records the exact supported college course. It still requires a student-supplied status and actual taken term/year; the Fall 2026 snapshot must not fabricate when a student took a class. Schedule-only records remain outside evidence-ranked class ideas until claim-level research supports them. A listing does not establish seats, eligibility, current availability, or enrollment.

| ID | Observable acceptance condition |
| --- | --- |
| P0-28 | All 79 source listings are available by their school/program grouping with provenance; five CSU East Bay rows are reference-only. No personal/contact fields ship. |
| P0-29 | A supported unambiguous listing can be added with exact identity and unknown evidence where appropriate. Ambiguous rows stay source/review links and cannot manufacture an equivalent. |
| P0-30 | Source transfer flags, variable units, trimester notes and code differences survive the snapshot. A Fall 2026 schedule row does not silently upgrade older destination evidence. |

Follow-up research should verify uncertain schedule identities and current availability before broadening the addable set. Source refreshes remain deliberate, reviewed local-data updates. No enrollment, district contact, cloud import, or publication is part of this feature.

## 18. Final grades and course follow-up

Add **Final grade, if available** to the existing college and high-school class add/edit forms. Keep it separate from the high-school grade-level field. Supported values are A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F, P, NP, I and W, plus **Not recorded**. A nonblank final grade requires completed status. Changing a graded record to in-progress or planned requires clearing its final grade. Older records with no grade remain valid and blank; do not infer one from status, a passing-result choice, or a credit amount.

An entered grade is a student record. It does not calculate GPA, authenticate a transcript, approve OUSD credit, establish college transfer credit, or satisfy GE/major requirements. F and NP cannot contribute earned high-school credit. I and W do not establish earned credit. P requires school review. Plus/minus letter grades can count an explicitly recorded passing and earned high-school award, with its recorded provenance and all applicable approval checks. Receiving-university grade and transfer review remains separate. A passing-looking letter still needs the separate award, school subject and approval conditions.

Completed D+, D and D- records expose UC's C-or-better A-G requirement when UC is selected. With no selected colleges, use a quieter conditional UC note. HBCU-only selections do not receive a UC-specific warning. Keep any explicitly recorded diploma award intact; missing award information gets a separate school-confirmation notice. Completed F/NP or recorded non-passing attempts expose zero earned diploma credit and a retake/credit-recovery next step without deleting the attempt or its entered amount. Alerts stay visible outside the collapsed reason details. A read-only counselor-question dialog provides context without saving or sending. College local units, destination transfer evidence, GPA and graduation eligibility remain independent.

Each saved college course shows one clear next step, an **Update checklist** action, and the optional **See the four checks** detail:

1. **School approval and signatures:** confirm the applicable enrollment route and school requirements. Record whether the required signatures are complete, plus an optional note. The actual signatories must be confirmed with the school; do not invent a universal list.
2. **Schedule and enrollment confirmation:** record that the student confirmed the section and enrollment. A checkbox is a local assertion and does not reserve a seat or query the college.
3. **Final grade:** enter the optional grade when the class record is completed. A grade remains subject to the credit conditions above.
4. **High-school posting:** review the linked school-credit allocation, required transcript receipt, subject, amount and award record. A grade or finished checklist does not establish posting by itself.

Reuse the same college entry and its existing allocation. The approval/signature selection, note and schedule checkbox are local data, not digital signatures, school-system records, enrollment actions, or automatic approval. Posting has no separate checkbox; derive it from the matching school-credit allocation, its award classification, school confirmation and transcript receipt. A planned class cannot satisfy the schedule step. Changing the course, term or status clears local checklist confirmations, preventing an earlier course context from completing the new checklist.

Retain Skyline's external principal-approval requirement and Oakland Technical's elective-only/no-replacement rule. Distinguish district dual enrollment from external concurrent enrollment throughout. Preserve existing coursework, selected destinations, questions, and all 79 schedule listings when the optional fields are added.

| ID | Observable acceptance condition |
| --- | --- |
| P0-31 | Existing college and high-school forms accept only the supported optional grades, distinguish grade level, and reject a nonblank final grade on a non-completed record. A status change requires clearing the grade. |
| P0-32 | Older blank-grade records remain valid. Grade changes persist and appear in relevant course summaries without creating duplicate records or rewriting course identity, term or destination choices. |
| P0-33 | F/NP and I/W cannot count as earned high-school credit. Other grades do not bypass approval, passing-result, award, transcript or subject checks, and grade-dependent university use remains reviewable. |
| P0-34 | Each saved college card exposes the next action and an optional four-step checklist. Local signatures/enrollment confirmations do not claim actual signatures, enrollment or school verification. |
| P0-35 | Workflow state reuses the existing course/allocation and retains school-specific conditions. No grade, total or completed checklist generates a GPA, graduation decision, admission claim, GE/major match or college award. |
| P0-36 | The school picker includes the 17 verified district schools plus an Other/free-text route. The six named alternative/program schools do not inherit 230 automatically; all other baseline use remains provisional until applicable cohort review. |
| P0-37 | Changing the school resets confirmed profile applicability and course-checklist confirmations for review without discarding coursework or student notes. Roster migration preserves legacy school IDs and saved free-text school names. |

Record exact tests and browser observations in [VERIFICATION.md](./VERIFICATION.md). This requirements update does not assert that those checks have completed.

## 19. Any-school profile and manual college courses

**Historical baseline verification:** implemented and checked on the [public development beta](https://openpath-credit-planner-dev.buxtonbycha.workers.dev), deployment `6a2f7a54-8481-41d2-9ce6-784b59ee285c`, before the latest grade alerts and Matriculate rename. Public browser checks covered general profiles and total targets, manual unit-system separation, unresolved transfer evidence, question persistence, grade guards, OUSD alternatives, school-change resets and narrow-screen forms. Actual JSON and text downloads passed 21 content assertions for the saved general-school record and its evidence boundaries. Exact automated, build, deployment, browser and downloaded-file results belong in [VERIFICATION.md](./VERIFICATION.md).

A student may use the planner without selecting an OUSD school. The general/unknown-school path accepts optional school and district names, graduation cohort, a manual total-credit target, and requirement notes/source link. Label that target as student-entered, not an official requirement; a supplied link is not verified by the app. Compare recorded high-school credit totals with the target only when supplied. Missing target means an unknown remaining total. Do not infer subject distributions, minimum GPA, senior-project requirements, graduation eligibility, or an OUSD conversion from it.

OUSD rules apply only within the explicit researched OUSD route and its school/program conditions. The 230-credit baseline, 2.0 GPA, senior project, 3.3 semester-unit estimate, and school-specific restrictions must not leak into general or unknown-school results or exports. A typed school or district name is not authoritative policy evidence. Retain the 17-school directory and the six school-specific review routes as optional coverage, with the existing cohort limitations.

Manual college-course entry records the source college, code, title, units or unknown, unit system, term/year, status and optional final grade. Require an explicit source identity and course identity rather than choosing a Peralta college on the student's behalf. Keep these records in the same saved-course and draft workflow. They can have a separate high-school credit allocation and local checklist, but every school award and university use still needs its own evidence. The final-grade validation and failed/incomplete-credit restrictions in section 18 also apply.

Manual records must be visibly student-entered with **transfer review needed**. Similar college names, course codes, titles or units cannot attach researched evidence automatically. Manual entries must not become evidence-ranked recommendations. A typed ENGL C1000 at an unresearched institution does not acquire Laney's UC listing or a historical A&T equivalent. Users can retain the record and prepare questions without a verified match.

Keep semester, quarter and unknown-unit amounts distinct. Do not add unlike unit systems into an unlabeled total or infer a conversion. Unknown units make applicable totals incomplete. The manual high-school target is high-school credits only, never college units. No new external service, account, database, synchronization or student-data upload is part of this expansion.

Preserve existing Peralta entries, OUSD profile data, source identities, final grades, questions, allocations and legacy version-1 records. Switching school context resets applicable confirmations for review without deleting coursework. The same three guide stages and course cards remain the main interface. Export the general profile, manual target, manual identities and unresolved conditions with the same distinctions shown on screen.

| ID | Observable acceptance condition |
| --- | --- |
| P0-38 | A student can begin and retain a general/unknown-school record without selecting OUSD, supplying a school name or choosing a researched college. |
| P0-39 | An optional manual high-school target supports total progress only. No target leaves remaining credits unknown; no invented subject, GPA or project requirements appear. |
| P0-40 | General/unknown profiles receive no OUSD 230-credit baseline, GPA/project rule, 3.3 estimate or school-specific rule in cards, calculations or exports. |
| P0-41 | A manual college course supports the required identity, units/unknown, unit system, term, status and optional final grade through add/edit, draft, reload and review export. |
| P0-42 | Manual courses remain student-entered and transfer-review-needed. No similarity match attaches UC/HBCU evidence, award, GE/major use or an evidence-ranked recommendation. Mixed/unknown units are not silently summed as semester units. |
| P0-43 | Existing researched records and general records coexist without lost state or duplicate entries. Expanded-beta readiness is reported only after targeted rules, migration and rendered-browser checks are recorded. |
