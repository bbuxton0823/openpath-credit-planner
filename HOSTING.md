# Cloudflare development beta hosting

Matriculate, formerly OpenPath, is a prototype with an authorized public development beta at [openpath-credit-planner-dev.buxtonbycha.workers.dev](https://openpath-credit-planner-dev.buxtonbycha.workers.dev). It serves audit-fix source commit `9fb379c4811f92cc26e9e95b53970a6710dcd79d` as version `83d0b907-6e37-466c-9211-bd3231613cb3`. Existing repository/Worker URLs, package identity and browser storage are unchanged. The build marker now includes generated-directory identity. The [source repository](https://github.com/bbuxton0823/openpath-credit-planner) is currently public; its visibility was read without changing it.

The static application was updated on October 4, 2026 using existing Cloudflare authentication. No account creation, plan change, database, secret, custom domain, or student-data upload was performed. This is a beta, not a production-readiness claim.

## Current audit-fix deployment

- Source: `9fb379c4811f92cc26e9e95b53970a6710dcd79d`, branch `fix/audit-self-review-findings`, [PR #1](https://github.com/bbuxton0823/openpath-credit-planner/pull/1).
- Worker/environment: `openpath-credit-planner-dev`, `dev`.
- Version: `83d0b907-6e37-466c-9211-bd3231613cb3`.
- Release URL: [83d0b907-openpath-credit-planner-dev.buxtonbycha.workers.dev](https://83d0b907-openpath-credit-planner-dev.buxtonbycha.workers.dev).
- Deployment: `d72138ef-042d-4fc4-ba67-ece377251011`, 100% traffic.
- Created: `2026-10-05T00:54:35.247283Z`, October 4, 2026 at 5:54 PM Pacific.

The local Claude workflow used the existing macOS GitHub keyring and Wrangler OAuth session. No new credential or account-wide Cloudflare MCP consent was needed. It passed dependency installation, 187 tests, 40 JavaScript syntax checks, diff checking and a 22-file dry run with zero bindings. The remote branch matched the PR's application commit, and authenticated Cloudflare readback confirmed this deployment. Three changed browser assets matched local source. [VERIFICATION.md](./VERIFICATION.md) records the subsequent hosted checks separately. Deployment did not merge the PR or change the application-data architecture.

Closeout HTTP checks on the stable beta and release URL passed 42 exact-source GET bodies, 42 successful empty HEAD bodies and 36 excluded-path 404s. The exact 22-file source/build manifest matched. Stable-beta responses matched seven configured headers. The release URL matched six headers, with the known `X-Robots-Tag: noindex` versus `noindex, nofollow` mismatch. Canonical `/` served the app; `/index.html` redirected there with 307. No preview rebuild or restart was performed. Results are in ignored `verification/audit-closeout-http.json`.

A separate documentation-drafting session recorded desktop Chrome checks on the isolated version origin that passed six grade cases, separate local college units, a single course-named counselor action, read-only keyboard interaction, reload and reduced motion. Actual hosted text and JSON downloads were read back: the text retained one correct earned-credit summary line while folding a fictional forged newline into its note; JSON retained that newline inside the note field. The stable-beta plan and both localhost instances were untouched. [VERIFICATION.md](./VERIFICATION.md) records file hashes, exact results and browser limitations. This documentation closeout changed no application source and did not repeat Claude's 187-test run.

## Historical Matriculate deployment

- Source: clean commit `2ce8faa5d3a143d656928d44b785751fb3832b27`.
- Worker/environment: `openpath-credit-planner-dev`, `dev`.
- Version: `6a086714-b2a9-4aea-b43b-8fc65dd7b4d0`.
- Release URL: [6a086714-openpath-credit-planner-dev.buxtonbycha.workers.dev](https://6a086714-openpath-credit-planner-dev.buxtonbycha.workers.dev).
- Deployment: `14415063-b42a-4264-9f0f-10ffd2b7ff39`, 100% of the development Worker's traffic.
- Created: `2026-10-05T00:18:06Z`, October 4, 2026 at 5:18 PM Pacific.

Authenticated version and deployment reads confirmed these identifiers. The authorized deployment uploaded five changed assets from the same 22-file allowlist, with no bindings or backend. The original port 4317 server was left running; the port 8787 preview was restarted after the build. Browser storage was not uploaded.

HTTP checks compared all 21 served assets against source and build bytes on the stable beta, release URL and restarted preview. All 63 GETs matched, all 63 HEADs were successful and empty, and all 54 excluded-path requests returned 404, including `AUDIT.md`. Disk inspection confirmed 22 allowlisted files. The stable beta and preview matched all seven configured headers. The release URL matched six headers but returned `X-Robots-Tag: noindex` instead of the configured `noindex, nofollow`; this known difference remains recorded rather than counted as a strict header pass.

Hosted browser checks covered grade alerts, award preservation, exact-course evidence, reload, read-only questions, keyboard focus, all three guide stages, phone-width layout, and normal/reduced motion. The stable beta was refreshed read-only and preserved its existing fictional plan. No warning or error entries were captured on either hosted tab. Hosted downloads were not repeated; the 14 local export assertions apply to unchanged source. [VERIFICATION.md](./VERIFICATION.md) records the precise scope and limits. Raw results remain in ignored `verification/matriculate-release-http.json` and `verification/matriculate-release-browser.json`. Historical checks below remain evidence for their recorded releases only.

## Choice and tradeoff

This app needs static browser assets only. `wrangler.jsonc` uses the explicit `dev` environment and points Cloudflare Workers at the generated `dist/` directory. The dedicated Worker is `openpath-credit-planner-dev`; no other Worker is targeted. There is no authored Worker handler, server API, binding, or D1 database. The current browser modules continue to perform exact lookups, planning calculations, and local persistence. This is simpler than adding an unused backend. A later curated-data service could use D1, but it needs a separate data-maintenance design and authorization.

The app uses in-page navigation, so `not_found_handling` is `none`. Unlisted paths return a genuine 404 rather than the app shell. This deliberately avoids an SPA fallback that could make requests for excluded private files appear successful.

## Toolchain

- Wrangler `4.147.0` is pinned as a local development dependency. `package-lock.json` fixes its dependency graph. No browser runtime dependency or framework was added.
- The npm package metadata declares Node `>=22.0.0`. Verification used Node `v22.22.2` and npm `10.9.7` from the existing shell setup.
- The existing global Wrangler installation and user-level configuration were not edited.
- Both `WRANGLER_SEND_METRICS=false` and `send_metrics: false` disable Wrangler usage metrics for the documented commands. Dependency instrumentation and Worker observability are also disabled. A generic telemetry information line appeared on the first dry run despite these settings.
- The local preview binds to `127.0.0.1:8787`. It uses `--local`, with no tunnel or remote binding.
- Wrangler also exposes its own local developer tooling in the preview runtime. Those endpoints are separate from the app's public asset allowlist. Keep this development server on loopback; it is not a public hosting server.

Official Cloudflare documentation consulted on October 4, 2026:

- [Static Assets](https://developers.cloudflare.com/workers/static-assets/) describes asset serving without a custom Worker script.
- [Asset configuration](https://developers.cloudflare.com/workers/static-assets/binding/) documents the asset directory and routing options.
- [Custom headers](https://developers.cloudflare.com/workers/static-assets/headers/) documents `_headers`, which configures asset responses without itself becoming a served asset.
- [Wrangler installation and compatibility](https://developers.cloudflare.com/workers/wrangler/install-and-update/) recommends a project-local installation and supported Node versions.
- [Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/workers/) describes local mode and deployment dry runs.
- [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) documents the explicit `--env dev` selection, workers.dev routing, and version URLs.
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) states that requests to static assets are free and unlimited. No authored runtime handler, Workers Cache feature, or paid binding was added.
- [Version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/) describes the separately addressable public version snapshot.

## Public asset boundary

`scripts/build.js` copies exactly these paths:

```text
index.html
src/app.js
src/data.js
src/catalog.js
src/custom-courses.js
src/ousd-schedule.js
src/state.js
src/rules.js
src/judgment.js
src/journey.js
src/guide.js
src/high-school.js
src/high-school-view.js
src/high-school-export.js
src/course-record.js
src/custom-course-view.js
src/course-workflow-view.js
src/school-roster.js
src/styles.css
src/guide.css
src/high-school.css
public/_headers -> _headers
```

These are 22 files: the HTML entry, 20 browser source/style files, and the header configuration. The HTML loads `guide.css` and `high-school.css` after the base styles. The local Node server uses an explicit public URL set that includes the same browser assets. The district schedule, 17-school roster, and school-policy modules contain curated public evidence. Saved student grades, checklist entries, general school profiles and manual targets, custom college classes, school records, and college-credit connections remain in browser storage. The custom-course modules are application code; entered custom classes are not written into the public catalog or build. The build never copies an entire source or project directory. Research documents, screenshots, verification exports, tests, package files, `.env` files, and user plans are absent from `dist/`. Symlinked source files, source directories, output directories, and ownership markers are rejected. Missing or invalid source files fail before an existing output is replaced.

`dist/` is generated and disposable. The first successful build writes `.openpath-dist-owner` beside it, including the generated directory's identity. Later builds clear only that same generated directory, including stale files accidentally added there. An unmarked or manually recreated `dist/` is preserved and the build stops. A legacy marker without directory identity also stops the build when `dist/` exists; inspect and preserve any needed contents before removing old generated output and rebuilding. Do not store personal files in generated output. The marker is outside the public directory.

The `_headers` policy retains same-origin scripts and styles, blocks app network connections and form submissions, blocks embedding, prevents content-type sniffing, and suppresses referrers. `Cache-Control: no-store` keeps prototype asset changes easy to inspect. `X-Robots-Tag: noindex, nofollow` is a crawler preference, not access control. The beta URL and its version URL serve these public assets to anyone who can reach them. No access-control service was added.

Student records remain in browser local storage and are not included in the build. Storage belongs to a browser origin, which includes scheme, host, and port. `localhost:4317`, `localhost:8787`, `127.0.0.1:8787`, and the hosted beta URL have separate records. Switching views within one origin preserves the same record. Browser clearing or loss of that profile can erase it. JSON export provides a local copy, not cloud backup or account synchronization.

## Commands

Run from the repository checkout root, the directory containing `package.json`. Commands below use the existing RTK wrapper; plain `npm` invokes the same project scripts if RTK is unavailable.

```sh
rtk npm ci --no-fund --no-audit
rtk npm test
rtk npm run check
rtk npm run build
rtk npm run preview
```

The preview URL is [http://127.0.0.1:8787/](http://127.0.0.1:8787/). Leave that process open while reviewing. After changing app source, stop the preview with Control-C and rerun `rtk npm run preview`; this rebuilds before starting a fresh local runtime. The preview serves generated files, not the source directory. There is no automatic source build or app network-based refresh. A clean rebuild during a long-running preview produced HTTP 500 during verification; restarting the task-owned preview restored correct responses. The underlying dev-runtime cause was not diagnosed, so do not rely on its file watcher after replacing `dist/`.

The original Node server remains available with `rtk npm start` on [http://localhost:4317/](http://localhost:4317/).

To check packaging without publication:

```sh
rtk npm run cf:dry-run
```

This runs `wrangler deploy --env dev --dry-run --outdir .wrangler/dry-run` with metrics disabled after rebuilding. It is not a deployment. Generated Wrangler artifacts stay in ignored `.wrangler/`, outside `dist/`. Stop an existing preview before this command, then restart it with `rtk npm run preview` for browser review.

For a quick response check while preview runs:

```sh
rtk proxy curl -sSI http://127.0.0.1:8787/
rtk proxy curl -sSI http://127.0.0.1:8787/PRD.md
```

Expected: app response 200 with the documented security headers; excluded document response 404.

## Historical verification of the expanded beta

The final general-school and custom-course integration passed:

- `rtk proxy npm test`: 159 tests passed, zero failed or skipped. Raw output is in `verification/general-beta-test-run.txt`.
- `rtk npm run check`: all 38 JavaScript files passed. The checker includes every `.js` file in `src/`, `tests/`, and `scripts/`, plus `server.js`.
- `rtk npm run cf:dry-run`: rebuilt 22 allowlisted files, found no bindings, and exited successfully. Wrangler reported 23 asset entries; direct filesystem inspection confirmed exactly 22 files, with `_headers` used as configuration.
- `rtk npm run cf:deploy:dev`: deployed only the dedicated development Worker. The final graduation-year display correction uploaded only `src/app.js` and reused 20 previously uploaded assets.
- `rtk proxy npm run preview`: rebuilt the same 22 files and restored the local runtime at `http://127.0.0.1:8787/`, session `45737`.
- Both the public beta and local preview returned 200 for `/` and all 20 source assets. All 21 GET bodies exactly matched source and `dist/` bytes. All 21 HEAD responses were empty and successful. Every GET matched all seven configured security/cache headers.
- Both origins rejected all 17 checked private or missing paths with 404: `/PRD.md`, `/RESEARCH.md`, `/README.md`, `/HOSTING.md`, `/VERIFICATION.md`, `/package.json`, `/package-lock.json`, `/wrangler.jsonc`, `/.env`, `/.openpath-dist-owner`, `/.wrangler/dry-run/index.js`, `/verification/general-beta-test-run.txt`, `/student-plan.json`, `/node_modules/wrangler/package.json`, `/_headers`, `/src/not-real.js`, and `/missing`.
- The exact version URL also returned byte-identical HTML and rejected `/PRD.md` with 404.

After the full 159-test run, the final graduation-year display correction changed only `src/app.js`. All 38 syntax checks, the 22-file build and dry run, and every public/local HTTP check were repeated. The full JavaScript suite was not repeated for this display-only correction; the latest browser/export verification is recorded in `VERIFICATION.md`.

Build regression tests cover exact allowlisting, stale output removal, unowned directory preservation, symlink rejection, missing-source preservation, explicit dev targeting, and static configuration. General-school tests cover optional manual targets, no OUSD policy outside OUSD, escaped notes, custom-course identity changes, distinct unit systems, no 3.3 estimate for custom entries, and export parity. Existing OUSD, college, grade, journey, and persistence regressions remain in the same passing suite.

The final source, build, public HTTP, and local HTTP hashes are recorded in `verification/general-cloudflare-dev-check.json`. The checked source values were:

```text
8227aaffbd101bee39aac1d49d79e50df12b59cb41ddbfc874548508bf72a1e1  index.html
75fe5819f1ec49295be6fcffb43ac06fe80ab414d8ace93957602981cefdaaac  src/app.js
c5e95210726fe007e793fdcc7d3b6725e511a37641e58ac8485f4a4bc4f3c127  src/data.js
5f877223fd4591c104d4b41d5c487dbea4740e3db2aa061e82c51eaf10d767b2  src/catalog.js
93277ef3d62feab829be8b8b9aa3431965ff2d09f50f08dfe010fb5e77dc4df0  src/custom-courses.js
8dc63e11f46ab795b6bcbaa6e402fd0409a468d3a4f348d80b4f5d92e26e14cd  src/ousd-schedule.js
1730a21fdd2948d85d48f5f50f4a384d3f6f98b5f0c832d07faf953744168d3c  src/state.js
416c8caf90d047b492a0a42066769d8de3b63fcba530d3bc0d8daf3b77a3b761  src/rules.js
7da7fb2e7a1766b4a15e2edceb8661ac6be982523e0726592b5f422525fe2676  src/judgment.js
5d0709ac00495071e09e22ffb662b7633523b1be747c3d5afd5627279cbd7a34  src/journey.js
4748e3b6edc19df000031a4375e6ccbb2cc24285fd671476b40d5c4a3f1273ae  src/guide.js
92e811b11439408c0ea2b27dd6e415096135a085b3c292b0d01cc026adc6365f  src/high-school.js
ecb976bd6462b6659c4b7303c7ab77fa722c5873f28c382ea1e049f9dd35a987  src/high-school-view.js
04d109385fbb015d6c74229127640cd6ac5e735c604441bbb5693e2cbf0accb8  src/high-school-export.js
2de7a9c8ddf7de20cf8323a611ee0a035575acc6a398fbc02eacc399d9ca900e  src/course-record.js
423d6ceae204a4fa257c625233b02f7a28c05d5f4bf5ecbc44bb6d77b807205e  src/custom-course-view.js
d94e6a2e17deaf74428b7d698504de3eaf2b0868e82e92d930073395e1524237  src/course-workflow-view.js
f59e8e832da4012053461b13cef7d0acfb98bb69dfc3dce3750193ce57b99108  src/school-roster.js
60e206c165f68ce459726d9f09449bacffe73a5958d116899c00f9d7a5e0f2c2  src/styles.css
e99c2ef27aeebef6a8b4cc257b56e740b8868c77227868f9758ec5312ecb272d  src/guide.css
0a476b31035bae06a0c4d7bb042d157bdd3bc0ca733e52f777b72cd1b23803bd  src/high-school.css
6ebee87aa6c63ac11b173b53fdeef6c75291558c7a8fe2d26af3bfd7a192ae71  public/_headers
```

A later source edit requires another build and runtime check. See `VERIFICATION.md` for browser journey evidence. The hosting checks alone do not verify that interactive workflow.

## Historical expanded-beta deployment and update procedure

The existing OAuth session exposed one Cloudflare account, ID `968bbe4ecaf64a0b5bede5b53e06aedd`, with workers.dev subdomain `buxtonbycha`. An authenticated read confirmed the exact target Worker did not exist before the initial deployment. The subsequent update replaced only this dedicated development Worker; no unrelated Worker was changed. `wrangler whoami` and the account/subdomain reads succeeded without a new login.

The account settings returned `default_usage_model: standard`. That setting does not establish the subscription tier. Reading account subscriptions returned HTTP 403 with the existing OAuth permissions, so the Free/Paid account plan is unverified. No subscription, billing, or plan change was made. Static-assets-only serving is the no-cost path described in the official pricing documentation above.

`env.dev` explicitly pins the account and Worker name. It enables workers.dev and version URLs. The unselected top-level environment has both URL types disabled. No custom route, domain, runtime entrypoint, D1, KV, R2, service binding, cron, or paid feature is configured.

The authorized publishing command was:

```sh
rtk npm run cf:deploy:dev
```

The script rebuilds the exact allowlist, then invokes `WRANGLER_SEND_METRICS=false wrangler deploy --env dev`. It publishes 21 static browser assets plus header configuration without uploading documents, verification exports, or saved student records.

Historical expanded-beta deployment result:

- Worker: `openpath-credit-planner-dev`.
- Public beta: [openpath-credit-planner-dev.buxtonbycha.workers.dev](https://openpath-credit-planner-dev.buxtonbycha.workers.dev).
- Version: `6a2f7a54-8481-41d2-9ce6-784b59ee285c`.
- Version URL: [6a2f7a54-openpath-credit-planner-dev.buxtonbycha.workers.dev](https://6a2f7a54-openpath-credit-planner-dev.buxtonbycha.workers.dev).
- Deployment: `f242af2b-b21d-4887-8a0e-d7295aa9ee45`, 100% of the development Worker's traffic.
- Deployment time: `2026-10-04T21:20:34.765Z`.

The initial development deployment was followed by the general-school and custom-course update documented above. The final integrated results are 159 passing tests, 38 syntax checks, and a 22-file allowlist. They are saved in `verification/general-beta-test-run.txt`.

The actual HTTPS beta was reopened programmatically after that deployment. All 21 public GET responses exactly matched the then-current source and `dist/` bytes. All 21 HEAD requests returned 200 with empty bodies. Every asset response matched all seven configured security/cache headers. All 17 excluded/private paths returned 404. The version URL returned the exact HTML bytes and rejected `/PRD.md` with 404. `wrangler versions list --env dev --json` and `wrangler deployments list --env dev --json` confirmed the version and its 100% deployment. Raw results are in `verification/general-cloudflare-dev-check.json`.

Hosted browser journey validation is recorded separately in `VERIFICATION.md`. HTTP correctness does not alone establish the browser workflow, official school decisions, or production readiness. The original localhost4317 process and browser storage were preserved.

Future authorized development updates use the same explicit `cf:deploy:dev` script after tests and a dry run. Stop the local preview before rebuild/deploy, then restart it if still needed. Do not add paid features, change subscriptions, or target a different account or custom domain through this command without separate authorization.
