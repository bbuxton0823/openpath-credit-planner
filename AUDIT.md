# Independent audit guide

**Prepared October 4, 2026.** Matriculate, formerly OpenPath, is a student credit-planning prototype. A local self-review produced the fixes below. An independent external audit has not been completed. This is not an official school evaluation or a production-readiness claim.

The current audit fixes were deployed from application commit `9fb379c4811f92cc26e9e95b53970a6710dcd79d` as Cloudflare version `83d0b907-6e37-466c-9211-bd3231613cb3` at the [public development beta](https://openpath-credit-planner-dev.buxtonbycha.workers.dev). [PR #1](https://github.com/bbuxton0823/openpath-credit-planner/pull/1) was merged into `main` as merge commit `a062efcf900928d24cb37be73224946a866dfd9e` after the deployment. The [source repository](https://github.com/bbuxton0823/openpath-credit-planner) is currently public. Repository/Worker URLs, storage/schema, package identity and historical evidence filenames are retained. The build marker now includes generated-directory identity. [VERIFICATION.md](./VERIFICATION.md) separates release checks from local preparation and historical evidence.

## Reproduce locally

Requires Node.js **22 or newer**. The recorded verification environment used Node **22.22.2** and npm **10.9.7**. Wrangler **4.147.0** is pinned as a development dependency, with its lockfile committed. There are no browser runtime dependencies or required application API keys.

From the checkout root:

```sh
npm ci --no-fund --no-audit
npm test
npm run check
npm run build
npm start
```

`npm start` serves source assets at `http://localhost:4317`. Check an occupied port before starting another process. RTK users can prefix these commands with `rtk`.

For Cloudflare's loopback runtime, use `npm run preview` and open `http://127.0.0.1:8787`. **Stop an existing 8787 preview before any build or packaging dry run.** Replacing `dist/` during a running preview previously caused HTTP 500 responses. Restart with `npm run preview`, which builds before starting. Do not stop an unrelated existing 4317 server. `npm run cf:dry-run` checks packaging without publication; it also rebuilds. The audit reproduction commands do not deploy.

## Current audit-fix checks

The local Claude workflow passed `npm ci`, 187 automated tests, 40 JavaScript syntax checks, `git diff --check` and a Cloudflare dry run with 22 allowlisted files and zero bindings. Seven new regressions cover plain-D receiving-college review, rounded unit totals, export line-break safety, one course-named counselor button, generated-directory ownership, portable syntax checks and local response headers. Existing GitHub keyring access and Wrangler OAuth completed the workflow without new credentials or account-wide Cloudflare MCP consent.

The remote branch matched the PR application commit. Authenticated Cloudflare readback confirmed deployment `d72138ef-042d-4fc4-ba67-ece377251011` at 100% traffic. Stable-beta and release-URL HTTP checks passed 42 exact-source GET bodies, 42 successful empty HEAD bodies and 36 excluded-path 404s, with an exact 22-file source/build manifest. The stable beta matched seven configured headers; the release URL matched six plus the known robots-header mismatch described below. The release-specific hosted results are in [VERIFICATION.md](./VERIFICATION.md).

A separate documentation-drafting session recorded desktop Chrome checks on an isolated version-origin plan: six school-grade cases, four separate local college units, one named counselor button, read-only keyboard behavior, reload and reduced motion. Actual hosted text/JSON downloads passed readback; a fictional forged newline stayed inside the note rather than becoming a false text-summary line. The final school-credit result was 5/240/235. Stable-beta and localhost plans were untouched. This closeout changed only documentation and did not rerun the 187-test suite. It is not a new phone, cross-browser, screen-reader or independent external audit.

## Historical verification supplied with the earlier handoff

- `rtk npm test`: 180 passed, zero failures or skipped tests, including 16 new grade-alert regressions.
- `rtk npm run check`: 39 JavaScript files passed syntax checks. This is not type checking.
- `rtk git diff --check`: passed.
- `rtk npm run cf:dry-run`: passed, 22 allowlisted public files, no bindings and no publication. The restarted local preview is at `http://127.0.0.1:8787`.
- Source and preview HTTP checks: 21 matching GET bodies, 21 successful empty HEAD bodies and 18 excluded-path 404s per origin. Preview matched all seven configured headers; the Node source server matched its four configured headers. The motion stylesheet and final disk manifest were rechecked after the last rebuild. Audit documentation and exports are not public assets.
- Actual fictional Matriculate JSON and text downloads passed 14 content assertions. Browser checks covered D awards, missing award confirmation, UC/HBCU/undecided choices, F attempts, read-only questions, Escape/focus return, reload, normal and reduced motion, and phone-width overflow. The original localhost record was inspected without editing it; the existing preview retained 23 recorded credits and 207 remaining.
- That hosted release: 63 exact-source GET bodies, 63 successful empty HEAD bodies and 54 excluded-path 404s across stable beta, release URL and preview. Stable/preview matched seven headers; the release URL matched six plus the known robots-header difference described below. The 22-file disk manifest matched the allowlist.
- Hosted browser checks retained explicit D and B+ awards totaling 6 credits, preserved a failed 5-credit attempt with zero earned, separated 4 local semester units from school and university evidence, and preserved records on reload. UC/HBCU/undecided warnings, read-only questions, keyboard focus, normal/reduced motion and all three guide stages worked at desktop and phone widths. A read-only stable-beta refresh preserved 20/240/220 high-school totals, 4 quarter units and a 5-credit pending linked allocation. No warnings or errors were captured. Hosted downloads were not repeated; the 14 local assertions apply to unchanged source.

Detailed scope and limitations are in [VERIFICATION.md](./VERIFICATION.md). These are implementation checks and internal reviews, not the requested independent external audit.

## Behavior to audit

Three outcomes must remain distinct:

| Outcome | What the prototype records or explains | What it does not establish |
| --- | --- | --- |
| High-school diploma credit | Explicit passing and earned awards, with student-reported versus school-verified-as-recorded provenance | An authenticated award or graduation eligibility |
| UC A-G preparation | A grade warning tied to UC's subject-grade requirement | A-G course approval, complete subject coverage, GPA or admission eligibility |
| College transfer credit | Dated exact-course evidence, local units, and unresolved receiving-college conditions | A student's final credit award, campus GE/major use or admission |

The grade-alert implementation is in `src/high-school-view.js`, with dialog wiring in `src/app.js` and styles in `src/high-school.css`. D+, D and D- retain explicitly recorded diploma awards when the existing award conditions are met. A UC selection adds an amber A-G warning. No selected colleges produces a quieter, conditional UC option; an HBCU-only selection omits the UC alert. Missing award confirmation remains separate. Completed F/NP or recorded non-passing attempts display zero earned high-school credit while preserving the attempted amount in course history. The school-class group opens when it contains an alert.

The alert's counselor question is a read-only, selectable draft. Opening it saves nothing and sends nothing. It is distinct from the existing saved planning-question feature. Audit escaping, keyboard focus, narrow layouts, destination changes, credit totals, persistence and exports across both ordinary school records and college-linked school awards. `src/high-school.js` owns credit classification; `src/rules.js` owns receiving-college review.

## Motion and performance boundary

`src/guide.css` adds a CSS gradient light treatment bounded to the welcome card, a single 780ms settling effect, 240ms heading entrances, 180ms dialog entrances and 140ms control feedback. It is shader-like visual styling, not GLSL or WebGL. Numeric credits, unknown values, progress fills, evidence labels and grade alerts do not animate. Dialogs remain visible and interactive from the start; the close target is 44px and the former backdrop blur is removed.

Animations are opt-in under `prefers-reduced-motion: no-preference`; reduced motion disables the new animations and transitions. Static styling is the fallback. There are no new JavaScript bytes, requests, libraries, fonts, media, animation loops or permanent `will-change` hints. The design choice uses a small CSS layer to preserve the existing navigation, focus and persistence behavior. It follows the mechanisms described in [MDN's CSS performance guidance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/CSS) and [reduced-motion guidance](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using_for_accessibility), reopened October 4, 2026.

Measured against the completed rename before motion, `guide.css` grows from **21,480 to 24,138 bytes**, an addition of **2,658 CSS bytes and 0 JavaScript bytes**. Whole-file gzip using Node's defaults grows from 4,882 to 5,585 bytes, a **703-byte difference**; this is not a measured network transfer size.

In the Codex in-app browser on the desktop host, a 390 by 844 viewport (375px content width with scrollbar) passed search, scroll, dialog, keyboard and reload checks. A scripted search/clear/scroll/dialog/Tab/Escape sample recorded 7 layouts, 35 style recalculations, 2.457ms layout time, 4.134ms style time and 2.465ms script time, with 91.731ms aggregate renderer task time. These are aggregate DevTools counters, not FPS or individual interaction latency. No physical low-end phone, CPU-throttled run, older browser, Safari/Firefox compatibility pass, battery test or formal accessibility audit was performed. Unsupported-motion static behavior is designed in CSS; older engines have not been tested.

## Data and security boundary

The hosted app consists of static assets, with no application API, authored Worker handler, database or school-system connection. Plans use origin-specific browser local storage. There is no authentication, application-level encryption, cloud backup, synchronization or import interface. Local JSON/text exports and print are available; clearing browser data can erase the plan. Use fictional records during audit.

`scripts/build.js` allowlists exactly **22 files**: 21 served HTML/JavaScript/CSS assets plus `_headers` configuration. It excludes documentation, tests, dependencies, verification exports and student plans, rejects symlinks, and only replaces marked generated output. [HOSTING.md](./HOSTING.md) lists the paths. The repository and deployed browser assets are public. Local verification captures and saved student plans are excluded from Git and the public build.

`public/_headers` configures CSP, content-type sniffing protection, frame denial, no-referrer, restricted browser permissions, no-store and noindex/nofollow. CSP blocks app network connections and form submission. These controls are not access control or an independent security audit. The recorded version URL returns `X-Robots-Tag: noindex` instead of the configured `noindex, nofollow`; the stable beta matched all seven headers. Excluded paths must return genuine 404 responses.

## Evidence and unresolved work

[RESEARCH.md](./RESEARCH.md) records the **October 4, 2026** research snapshot and distinguishes supplied research from reopened pages. Retrieval date is not policy effective date. UC transfer evidence is **2025-26**; the district schedule is **Fall 2026**. OUSD's linked graduation handout is **2023-24**, and no certified 2027 cohort profile was verified. The general-school route uses only student-entered requirements and does not inherit OUSD rules.

Primary review starting points are [UC A-G requirements](https://admission.universityofcalifornia.edu/admission-requirements/first-year-requirements/subject-requirement-a-g.html), [OUSD graduation requirements](https://www.ousd.org/high-school-linked-learning-office/for-students-families/hs-graduation-requirements), and the exact institution/course sources linked in [RESEARCH.md](./RESEARCH.md). Refresh their applicability before relying on a student plan.

Unresolved before any production decision: independent policy and code review; current course and cohort coverage; institutional verification of records, awards and eligibility; privacy/security review; data-loss and recovery design; and broader accessibility, assistive-technology and browser testing. Existing automated and browser checks cover documented scenarios only. No independent audit, penetration test, full accessibility audit or all-browser compatibility result is claimed. Record findings and reproducible evidence before broadening use.
