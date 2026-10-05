# Matriculate development prototype

**Matriculate, formerly OpenPath,** is a student credit-planning prototype for students at any high school. It keeps three stages: **Your classes, Your colleges, Your next class**. OUSD high-school requirements and Peralta-to-UC/HBCU evidence are its limited researched coverage.

It is a development prototype, not an official credit evaluation, degree audit, admission assessment, or enrollment service.

The same college course can carry a separate high-school credit record beside its college-credit evidence. A local copy of OUSD's official Fall 2026 list supplies one researched course browser. District schedule flags, high-school awards, local college units, and university degree use remain separate.

The rename preserves repository and Worker URLs, the npm package name `openpath-local-prototype`, browser storage key `openpath.prototype.v1` and its schema, and the build-ownership marker `.openpath-dist-owner` with value `OpenPath generated dist v1`. Historical evidence and export filenames retain their original names. Existing saved plans do not need migration for the brand change.

## Development beta

The [public development beta](https://openpath-credit-planner-dev.buxtonbycha.workers.dev) serves Matriculate, including the latest grade alerts and CSS motion treatment. Source commit `2ce8faa5d3a143d656928d44b785751fb3832b27` was deployed on October 4, 2026 at 5:18 PM Pacific as Cloudflare version `6a086714-b2a9-4aea-b43b-8fc65dd7b4d0`. The [GitHub source repository](https://github.com/bbuxton0823/openpath-credit-planner) is currently public, as is the development site. Hosted HTTP and browser checks passed within the scope and limits recorded in [VERIFICATION.md](./VERIFICATION.md).

Use fictional coursework to try the prototype. From **Tools & details**, choose **Explore a sample**, then explore a college class, a credit explanation, and the four course checks. Or start empty and follow **Your classes → Your colleges → Your next class**. Loading a sample can replace the current local plan, so export anything you want to keep first.

No sign-in is required. Plans stay in that browser's local storage and do not sync between devices or URLs. The app does not upload the plan, authenticate school records, or submit anything to a school. Browser storage is not encrypted, and clearing site data removes the plan. Text, print/PDF and JSON copies are available; JSON has no automatic import feature.

Treat the beta as a planning draft to review with a counselor. Evidence is a dated, incomplete snapshot. Unknown credit is not rejection, a course listing is not enrollment, and a finished checklist is not an awarded credit or graduation decision. The detailed limits and verification record are below.

### School and course coverage

The general/unknown-school profile accepts optional school and district names, graduation year, a student-entered total-credit target, and requirement notes/source link. Choose **Add your school's graduation requirements**, then leave the district unconfirmed or select **Another district or school**. The target supports total progress only; the app does not verify the supplied link. It does not invent subject requirements or apply OUSD's 230-credit, GPA, senior-project or 3.3 conversion rules outside the researched OUSD route.

**Add another college class** records a college name, exact course number, title, units or unknown, semester/quarter/unknown unit system, term, status and optional final grade. **Plan another college class** offers the same form from the draft stage. These records stay in this browser and display **Needs transfer review**. They do not inherit Peralta evidence through similar names or codes. Semester, quarter and unknown units stay distinct. Existing researched records use the same cards and three-stage flow. [PRD.md](./PRD.md) records the requirements; [VERIFICATION.md](./VERIFICATION.md) records the checks completed for each implementation stage.

## Run locally

Requires **Node.js 22 or newer**. The original prototype was checked with Node.js 26.3.1; the Cloudflare preparation was checked with the current Node.js 22.22.2 shell runtime. The Node server needs no package installation or API keys. Cloudflare preview uses a pinned local, development-only Wrangler tool and an explicit public-asset build.

From a repository checkout (use its actual folder name if different):

```sh
cd openpath-credit-planner
npm start
```

Open [http://localhost:4317](http://localhost:4317). The server binds to `127.0.0.1`, so it is available only on this computer. Keep the terminal running; press `Ctrl+C` there to stop the server. RTK is optional; in a workspace that uses it, prefix the npm commands with `rtk`.

If port 4317 is already occupied, first check whether this prototype is already running. An optional `PORT` environment variable changes the port, but browser storage is separate for each origin, including its port.

## Try the prototype

Start at the welcome screen and choose **Find my next class**. No account or major is required. The supported route is high-school dual enrollment and first-year college entry.

1. **Your classes:** use **Add another college class** for a manual record, search the Peralta research, or browse OUSD's Fall 2026 listings. Keep the exact source college and course identity, then enter status, term and year. New taken-class fields start blank. School details and college coursework are optional; continue when ready.
2. **Your colleges:** add any of the 14 destinations you are curious about. Remove a selection using its chip. **Continue, I'm not sure yet** is a valid option when you have not chosen destinations.
3. **Your next class:** use **Plan another college class** for a manual plan, or explore the researched Peralta ideas. Those ideas are grouped by course family, with an exact source-college choice. Read **What we know** and **What still needs checking** before saving a draft to discuss with a counselor.

The saved result offers an inline counselor question and a review download. Edit and save the question, or leave it for later. If no destination is selected or the evidence cannot support class ideas, the guide offers a general counselor question instead. Saving that question creates no class or credit result.

These are navigation stages, not a readiness score. Class ideas are ordered by documented evidence, not by what is best for a student. Prerequisites, availability, degree use, and final credit still require review. Completed, in-progress, and planned local units remain separate.

A brief welcome light effect, heading/dialog entrances and tactile controls use CSS only. This shader-like styling adds 2,658 CSS bytes and no JavaScript or dependencies. It respects reduced-motion preferences and keeps credit amounts, evidence and warnings still. The static fallback remains usable; measured weight and browser-testing limits are in [AUDIT.md](./AUDIT.md).

**Your high-school credit picture** offers optional school details and a total-credit comparison. A general profile uses only the target you enter; the researched OUSD route can use its applicable baseline. On any saved college class, **Record school credit** connects its high-school amount, subject, and approval record to that existing entry. Add ordinary school classes separately when useful for your credit record. AP/IB class records do not create college awards. Completed status alone does not establish passing or earned credit.

Existing college and high-school add/edit forms include **Final grade, if available**, separate from high-school grade level. Supported student-entered values are A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F, P, NP, I and W, or **Not recorded**. Only completed records may have a final grade. Clear it before changing the class to in-progress or planned. Older records keep a blank grade.

Completed D-range records show a UC A-G preparation warning when UC is selected, or a quieter conditional note when no colleges are selected. An HBCU-only selection omits that UC note. An explicitly recorded diploma award stays separate; an unconfirmed award needs school review. Completed F/NP or recorded non-passing attempts show **0 earned credits**, retain the attempted amount, and suggest retake or credit-recovery review. **Ask your counselor** opens a read-only question to copy. It does not send or save anything.

Saved college cards show the next course action. **See the four checks** expands school approval and required signatures, schedule/enrollment confirmation, final grade, and high-school credit posting. **Update checklist** records approval/signature status, an optional note, and a schedule-confirmation checkbox. The school determines which signatories are required for the route. The app collects no actual signatures, enrolls nobody, and has no school-system connection.

The checklist reads final grade from the existing class and posting from its exact linked school-credit/transcript record. There is no separate posting checkbox. A planned class does not satisfy schedule confirmation. Changing the course, term, or status clears local checklist confirmations for review; it does not create another course.

## Tools, review copies, and existing records

**Tools & details** keeps the full class editor, detailed credit matrix, full class-idea planner, review/exports, settings, sample plan, and reset available. These tools share the guide's saved record. The full catalog includes an **Include historical course numbers** option. **See all credit details** expands the full conditions and per-school sources below a summary of at most three plain-language checks. Current-term uncertainty and unknown-school status remain visible. Detected conflicts in saved classes remain visible outside the collapsed details.

In the full review, **Save text** downloads a readable report with source URLs and questions. **Print / PDF** uses the browser's print dialog. **Save JSON** exports the local state for offline backup or manual recovery. General counselor notes and specific course questions are included. No message is sent to a school.

New source-version downloads use `matriculate-plan.json`, `matriculate-counselor-review.txt`, and, when recovering a saved copy, `matriculate-saved-recovery.txt`. Previously downloaded OpenPath files remain unchanged.

The high-school review text includes each record's calculated credit status and exclusion/review reasons. For alternative programs without a reviewed baseline, it explicitly says that no numeric graduation baseline is applied instead of presenting 230 as their requirement.

There is **no import interface**. A JSON download is not an automatic restore feature. Export anything you want to retain before confirming a sample replacement or clearing the local plan.

Older version-1 records retain valid coursework and saved questions. When guide metadata is missing, a record with planned courses resumes at the draft result; other existing coursework resumes at college selection. The earlier five-step **My Journey** interface is superseded. Its stored metadata remains for compatibility, but no separate Journey view is needed for the current flow. Specific questions retain their course/college/term/destination context and are labeled for review if it no longer matches the current plan.

## Cloudflare local preview

The public development beta is authorized; a local preview alone does not establish successful publication. Hosting uses static assets only, without an application API, D1, or student login. Wrangler **4.147.0** is pinned in `devDependencies`. Its dependency lockfile is included. No browser runtime dependency was added.

From the project directory:

```sh
npm ci --no-fund --no-audit
npm run preview
```

Open [http://127.0.0.1:8787/](http://127.0.0.1:8787/). This command builds the public allowlist and starts `wrangler dev --local` on loopback. Usage metrics are disabled in the supplied scripts/configuration.

**Stop the preview before rebuilding or running a packaging dry run.** Press `Ctrl+C` in its terminal. A clean build replaces `dist/`; doing that while the preview is running can leave it returning 500 responses. After editing source, stop it and run `npm run preview` again. This rebuilds the assets and restarts the preview.

With the preview stopped, check packaging without uploading or publishing:

```sh
npm run cf:dry-run
npm run preview
```

The generated `dist/` contains only the explicitly selected app assets and header configuration listed in `scripts/build.js`. It excludes documents, verification exports, screenshots, dependencies, and local plans. Do not place personal files in generated output. [HOSTING.md](./HOSTING.md) documents the allowlist, exact checks, official sources, and deployment procedure. D1 is a possible later home for centrally maintained course evidence, not an unused dependency in this prototype.

**Each origin has separate browser storage.** `localhost:4317`, `127.0.0.1:8787`, and the public beta URL do not share a plan. The guide and detailed tools share data within one origin; no cross-origin migration or cloud synchronization is implemented.

## Included data and behavior

- Four researched source colleges: Laney, Merritt, Berkeley City, and College of Alameda. Manual college records outside this coverage remain student-entered and need transfer review.
- **34 researched catalog records:** 16 current course records, two supported-English records, and 16 historical source-code records. Source college is preserved. Historical local titles and units that were not verified remain unknown.
- **79 OUSD Fall 2026 listings across 16 school/program groups:** 74 Peralta listings and five reference-only CSU East Bay listings. The snapshot adds 51 unambiguous schedule-only identities to the original 34 records, for 85 bundled catalog records. Currently 66 listings resolve to addable records; combined/range/section labels and external-college rows remain source/review links. Repeated listings are retained.
- **14 destinations:** all nine undergraduate UC campuses, plus Spelman, Howard, Tuskegee, Morehouse, and North Carolina A&T. The HBCU shortlist is a selected pilot scope, not a ranking or fit recommendation.
- Deterministic comparison and class-idea rules. Grouping preserves each eligible source-college option instead of merging course identities. UC systemwide unit evidence counts as one evidence group, regardless of how many UC campuses are selected. Unknown HBCU evidence is not a rejection.
- Known supported-English UC caps and duplicate-credit rules. No automatic equivalence between historical and renumbered course codes.
- Persistent local setup, college and optional high-school records, linked credit allocations, selected destinations, guide stage, plan, and counselor questions, with handling for unavailable or unreadable browser storage. New taken-class records require a supplied status and term/year.
- Responsive layout, keyboard-accessible controls, evidence details, text export, JSON export, and printable counselor summary.

## Evidence limits

The course evidence is an **October 4, 2026 research snapshot** and does not refresh automatically. [RESEARCH.md](./RESEARCH.md) distinguishes supplied prior-session checks from public pages reopened during this build.

UC course evidence is explicitly **2025-26**. A newer student course term is flagged for review. Published transferable-unit evidence does not establish a particular student's final award or campus-specific first-year GE/major completion. No such campus requirement was verified.

North Carolina A&T equivalents are preliminary, have no stated effective year, and require individual evaluation. A displayed equivalent's credits are not a final award. Current C1000 course codes do not inherit older ENGL 1A, MATH 13, or PSYCH 1A matches. The apparent MATH 3A local/destination credit difference is a review question, not a proven credit loss.

Howard, Spelman, Tuskegee, and Morehouse have policy guidance but no verified exact Peralta course matches in this dataset. Morehouse's public lookup was blocked before a Peralta search, which is different from finding no matches. Some general transfer policies have unconfirmed first-year applicability.

Final grades are student-entered. A grade does not calculate GPA, authenticate a transcript, establish OUSD approval, or create college credit or GE/major use. F/NP and I/W cannot count as earned high-school credit. P requires school review. Plus/minus letter grades can count an explicitly recorded passing and earned high-school award, with its recorded provenance and all applicable approval checks. Receiving-university grade and transfer review remains separate. Optional high-school passing-result and GPA records do not establish university conditions.

Courses with unknown local units are excluded from numeric totals and make those totals incomplete. The OUSD snapshot identifies listed offerings, but does not establish current seats, student eligibility, complete degree requirements, applicant fit, or admission eligibility. A planning candidate is not an enrollment-ready recommendation.

### OUSD connected credit limits

The school picker includes **17 OUSD district schools serving high-school grades**, including combined-grade and alternative schools, from the [official directory](https://www.ousd.org/our-schools/school-directory) checked October 4, 2026. Charter schools are a separate roster outside these 17. Use Other and the school-name field for a charter or unlisted school. Existing Skyline, Oakland Technical and free-text school records are retained. This profile roster is separate from the course sheet's 16 school/program groups.

**Dewey Academy, Gateway to College at Laney College, Ralph J. Bunche, Rudsdale, Sojourner Truth Independent Study, and Street Academy** require school-specific review and do not automatically receive the 230-credit baseline. Other district schools use it only provisionally, pending school/program and graduation-cohort confirmation. Changing the school resets confirmed profile applicability and course-checklist confirmations for review while preserving the coursework.

The optional comprehensive-school baseline is 230 high-school credits, a 2.0 GPA, and a senior project. Subject totals and required content remain separate checks. The district page is undated, its linked handout is 2023-24, and no certified 2027 cohort profile was verified. Another program requires its own school review. Rudsdale's published 190-credit minimum is one reason not to apply 230 to every OUSD student.

Recorded student-reported and school-verified-as-recorded awards remain distinguishable. The app does not authenticate school records. Planned, in-progress and pending credits are not earned credits. The optional BP 6146.11 calculation rounds semester units multiplied by 3.3 to a whole high-school credit. It is a policy estimate, does not prefill the credit amount, and is not an award. Unknown or quarter units have no conversion estimate.

District dual enrollment differs from external concurrent enrollment. External coursework needs applicable preapproval and transcript review. Skyline's external graduation use requires principal approval; Oakland Technical's published DE rule limits credit to electives and disallows replacing existing high-school courses. The school confirms the relevant subject and award. A credit total never produces a graduation-eligibility verdict. [RESEARCH.md](./RESEARCH.md) records official sources, policy dates and gaps; [PRD.md](./PRD.md) defines the subject baseline and acceptance criteria.

### District schedule limits

The [official OUSD page](https://www.ousd.org/high-school-linked-learning-office/for-students-families/dual-enrollment) links the [public course sheet](https://docs.google.com/spreadsheets/d/14_D4lvEDjvou_TBa6q5StlEB8zTiK5lsvI52qjDwGZU/edit?usp=sharing) used for the October 4, 2026 snapshot. All populated rows in its reviewed Fall 2026 tab are retained. Original trimester wording, variable units, and limited transfer flags stay visible. The app includes no contacts or personal information from the sheet and never fetches it automatically.

The sheet's **UC/CSU transfer (OUSD Transcript codes TBD)** flag is district schedule information. It is not an OUSD subject award, HBCU match, or first-year university GE/major evaluation. Only Merritt ENGL C1000 exactly matches an original researched record. `PSYCH C1000` does not inherit `PSYC C1000` evidence. Schedule-only courses begin with unknown destination evidence and are excluded from evidence-ranked class ideas. Fall 2026 listing does not replace a student's actual taken term or refresh older ASSIST evidence.

## Storage and privacy

The app stores its record in browser `localStorage` under **`openpath.prototype.v1`**. Optional `guide` fields hold the current stage and a general counselor note. Specific questions retain `journey.questions` for compatibility. Optional `highSchool` fields hold school context, school classes, and allocations linked to college entries. Older records receive empty high-school collections while valid coursework and questions remain. This is not encrypted storage or an official school record. Anyone with access to the same browser profile may be able to access it. Clearing site/browser data removes the saved record. Another browser, profile, hostname, or port has separate storage.

The Node process serves local files. There is no application data backend, account system, telemetry, transcript upload, or automatic submission. The app makes no API requests. Its Content Security Policy uses `connect-src 'none'` and restricts runtime assets to this origin. Opening an evidence link intentionally visits that public website; the app does not append the student's record to the link.

The optional Jev judgment seam is disabled and contains no network transport or credentials. Every MVP flow works without it. Any future hosted TypeSafe/Jev call or student-data transmission requires separate authorization.

## Check the code

Start an independent review with [AUDIT.md](./AUDIT.md), which records reproduction commands, the checked release, credit and privacy invariants, current checks, and unresolved readiness work.

From the project directory:

```sh
npm test
npm run check
```

Tests use Node's built-in test runner. The check command runs JavaScript syntax checks, not a type checker or a full accessibility audit.

The unchanged deployed source passed 180 automated tests and 39 JavaScript syntax checks before deployment. Hosted browser checks covered grade alerts without changed award totals, course evidence, reload, read-only counselor questions, keyboard focus, phone-width layouts and reduced motion. All 21 served assets matched source and build bytes on the stable beta, release URL and local preview. The release URL returned the known `X-Robots-Tag: noindex` difference; the stable beta and preview matched all seven configured headers. Actual local JSON/text downloads passed 14 content assertions before deployment; hosted downloads were not repeated. [VERIFICATION.md](./VERIFICATION.md) records exact results and limits for each release.

The proposed five-student usability study in [PRD.md](./PRD.md) has not been run, and no participants have been recruited for this build. Browser checks are not evidence of student comprehension or verified school policy applicability.

Local captures, screenshots, exports and backups under `verification/` are ignored by Git and are not included in the repository or public build. The written verification report may describe them without publishing those files.

## Project map

| File | Purpose |
| --- | --- |
| `index.html` | Local app entry point |
| `server.js` | Loopback static server and response security headers |
| `src/app.js` | Screens, interactions, evidence details, and exports |
| `src/styles.css` | Detailed-tool and shared styling |
| `src/guide.css` | Responsive guided-flow styling |
| `src/data.js` | Curated course, institution, destination, and source records |
| `src/ousd-schedule.js` | Public Fall 2026 district listings, source fields and snapshot provenance |
| `src/catalog.js` | Exact-identity catalog integration without guessed equivalents |
| `src/custom-courses.js` | Manual college-course identities, validation and source separation |
| `src/custom-course-view.js` | Manual college-course add/edit form |
| `src/school-roster.js` | Sourced 17-school OUSD directory and school-specific review routes |
| `src/course-record.js` | Final-grade helpers and local course-checklist rules |
| `src/course-workflow-view.js` | Next-action card, four checks and checklist editing |
| `src/high-school.js` | District baseline, school conditions, credit allocation and progress rules |
| `src/high-school-view.js` | Connected outcomes, school records, progress and editing forms |
| `src/high-school-export.js` | Pure high-school review text using calculated credit statuses and policy limits |
| `src/high-school.css` | Connected-credit and school-record styling |
| `src/rules.js` | Exact-identity evidence lookup, year handling, totals, and candidates |
| `src/state.js` | Versioned local storage, legacy defaults, guide state, validation, and sample |
| `src/judgment.js` | Disabled optional judgment interface |
| `src/journey.js` | Retained Journey logic and contextual advisor question generation |
| `src/guide.js` | Course-family grouping and concise source-scoped evidence summaries |
| `scripts/build.js` | Explicit public-asset allowlist and safe generated output |
| `wrangler.jsonc` | Local/static Cloudflare configuration, with no bindings |
| `public/_headers` | Static-asset security and caching policy |
| `HOSTING.md` | Cloudflare instructions, evidence, and publication gate |
| `tests/rules.test.js` | Evidence and planning regression tests |
| `tests/guide.test.js` | Grouped class ideas and concise evidence regression tests |
| `tests/journey.test.js` | Retained contextual-question and legacy Journey behavior tests |
| `tests/state.test.js` | Persistence and saved-state regression tests |
| `tests/high-school.test.js`, `tests/high-school-state.test.js` | HS credit calculations, approval conditions, link snapshots and migration |
| `tests/high-school-view.test.js` | Connected rendering, source limits, escaping and form contracts |
| `tests/grade-alerts.test.js` | Grade-warning scope, preserved awards, failure attempts and read-only counselor questions |
| `tests/schedule.test.js` | District snapshot identities, flags, variable units and catalog persistence |
| `tests/custom-courses.test.js`, `tests/custom-course-view.test.js` | Manual college identity, forms, persistence and evidence boundaries |
| `tests/general-high-school.test.js` | General-school targets and isolation from OUSD policy rules |
| `tests/build.test.js` | Public-asset allowlist and safe-output tests |
| `tests/server.test.js` | Local server response checks |
| `scripts/check.js` | JavaScript syntax-check command |
| `PRD.md` | Product requirements, acceptance criteria, and phased roadmap |
| `RESEARCH.md` | Evidence provenance, limitations, and follow-up questions |
| `VERIFICATION.md` | Recorded implementation verification |
| `AUDIT.md` | Independent audit handoff and unresolved readiness work |

The next development step is to review actual student comprehension and verify additional applicable evidence, beginning with academic-year coverage and first-year requirement use. See [PRD.md](./PRD.md) for the buildable follow-on scope.
