# Implementation plan

11 November 2026

**Approved.** Application code is in this repository. Phases 2 through 7 are implemented: Flyway, session security, the Angular shell, the questionnaire-to-finding path, opportunities and append-only decisions, Playwright, and CI.

The original gate was: do not write application code until this document was reviewed. That review is the approval recorded here.

Related documents:

- [CURRENT_STATE.md](../architecture/CURRENT_STATE.md)
- [TARGET_ARCHITECTURE.md](../architecture/TARGET_ARCHITECTURE.md)
- [DATABASE_DESIGN.md](../architecture/DATABASE_DESIGN.md)
- [FRONTEND_ARCHITECTURE.md](../architecture/FRONTEND_ARCHITECTURE.md)
- [ARCHITECTURE_DECISIONS.md](../architecture/ARCHITECTURE_DECISIONS.md)
- [API_CONTRACTS.md](../api/API_CONTRACTS.md)
- [EVALUATION_CRITERIA.md](../ai/EVALUATION_CRITERIA.md)
- [TEAM_WORKFLOW.md](TEAM_WORKFLOW.md)

## 1. Current architecture

See [CURRENT_STATE.md](../architecture/CURRENT_STATE.md). Nothing exists: the audit on 11 November 2026 found an empty directory, no git repository, no source, no database, no auth, no CI, and nothing in-tree that can be reused.

## 2. Architecture gaps

The target stack is entirely absent and must be created after approval. Naming a library in the docs set does not put it on a classpath or in a browser bundle.

- **Angular 22.2.** There is no `package.json`, `angular.json`, route tree, or client. The app has to be created on the 22.2 line (CURRENT_STATE records stable 22.2.5 as of 6 November 2026).
- **Spring Boot 4.1.2.** There is no `pom.xml`, no `com.founderslab` tree, and no running JVM process. Java 21 and Maven are part of this foundation because the backend has no build yet.
- **PostgreSQL / Flyway.** There is no database server, schema, migration directory, or seed data. Persistence has to be introduced as versioned SQL against an empty database.
- **Google session auth.** There is no OAuth client, session store, CSRF filter, or allowlist check. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `FOUNDER_EMAIL_ALLOWLIST` are unset. A Google account must not be sufficient to enter the product; the allowlist is what makes a session a founder session.
- **Census adapter.** No HTTP client calls Census. `CensusCountyBusinessPatternsAdapter` is the first research adapter, with `CENSUS_API_KEY` supplied from the environment. The class name is a contract for later code. It is not in the repository today.
- **Job poller.** Research is not synchronous. Nothing yet creates a `research_job` or polls it. The client poll interval is 2 seconds, and it has no home until the job API and the dashboard exist.
- **OpenAPI client.** There is no springdoc document and no generated Angular client. UI and server would fork immediately if each side invented its own payloads. The published OpenAPI document and [API_CONTRACTS.md](../api/API_CONTRACTS.md) are the shared contract, and the client is generated from that document.

`AIProvider` is also absent. Model calls go through that adapter, configured by `AI_API_KEY` and `AI_MODEL`. Spring AI 2.0.2 is the library behind the adapter. It is not a dependency yet, and tests must not call a paid model to prove the path.

These gaps are the reason phases 2 and 3 create stacks. They do not port a legacy app, because this directory has never run one.

## 3. Proposed architecture

The target shape is [TARGET_ARCHITECTURE.md](../architecture/TARGET_ARCHITECTURE.md).

Angular talks only to Spring controllers. A controller delegates to a service. A service uses a repository. A repository is the only layer that reads and writes PostgreSQL. Census and Spring AI 2.0.2 stay behind adapters: `CensusCountyBusinessPatternsAdapter` for County Business Patterns, and `AIProvider` for model calls. Controllers, services, and Angular do not import a Census client or a model client of their own. The rule exists so a test can replace either adapter with a fixture, and so a vendor SDK cannot leak into domain code or into the browser.

The same-origin proxy in Compose exists so the browser treats the Angular app and `/api` as one site. The session cookie can then stay HttpOnly, Secure, and `SameSite=Lax`, while the Angular CSRF interceptor copies the `XSRF-TOKEN` cookie into `X-XSRF-TOKEN`. That arrangement is why phase 2 brings up the proxy with the backend, before feature screens exist.

## 4. Database design

The tables, keys, and constraints are specified in [DATABASE_DESIGN.md](../architecture/DATABASE_DESIGN.md). This plan only fixes the rules the schema must satisfy so later phases do not invent a second model.

A **workspace** is the shared place for the founders, the questionnaire, alignment, research, and later the opportunity. Records that belong to a decision hang off that workspace so an allowlisted founder session is also a workspace membership check.

The **questionnaire** is stored as a JSONB snapshot at submit time. Research cites the answers that were actually submitted. Later edits to question content must not rewrite that snapshot, or the evidence trail will describe a questionnaire the founders did not answer.

**research_job** is the async unit. Its status is one of `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, or `CANCELLED`. The poller and the idempotency check both read this row. A new `POST /api/v1/directions/{id}/research` creates it and returns 202. The same `Idempotency-Key` returns the existing row and returns 200.

**research_source** is required for a finding. The finding cites a stored Census retrieval. A finding insert without that source fails. Verification on the source is one of `UNREVIEWED`, `CONFIRMED`, or `REJECTED`. A finding the dashboard presents as evidence cites a `CONFIRMED` source. `UNREVIEWED` and `REJECTED` rows stay stored so the retrieval is auditable, and they are not citations for that finding.

**founder_decision** is append-only. A decision `POST` inserts a row. It does not update a previous decision. A change of mind is a new row, which is what makes an `ADVANCE` reviewable after the fact.

**business_type** defaults to `PHYSICAL_PRODUCT`. The first product concepts are physical products. The column exists so a later type is a value, not a new table, and the default keeps the first path from blocking on a taxonomy discussion.

Opportunity, product, and decision tables are part of the initial schema even though their APIs wait until phase 6. Creating them in Flyway `V1` is what lets phase 6 add behavior without reshaping tables that already hold questionnaire and research rows.

## 5. Migration strategy

There is no user data and no production database. The strategy is create, not migrate.

When coding starts, Flyway `V1` creates the schema in [DATABASE_DESIGN.md](../architecture/DATABASE_DESIGN.md) on an empty PostgreSQL database. That script is the initial schema, including the opportunity, product, and decision tables. It is not a transformation of a previous system, and it is not a copy of the news-rater H2 database.

No destructive migration is authorized. A later Flyway version may add a column or a table if a phase discovers a real gap. It does not drop, rewrite, or truncate rows to restage the model. That constraint is cheap now because there are no rows, and it is the rule that keeps the evidence trail intact once founders start submitting questionnaires.

Phase 2's acceptance test applies `V1` to an empty Testcontainers database. A green run means the script is sufficient on its own. It does not mean a production cutover happened.

## 6. Angular design

Screen structure, standalone components, lazy routes, signals, and the generated client live in [FRONTEND_ARCHITECTURE.md](../architecture/FRONTEND_ARCHITECTURE.md).

The client is an Angular 22.2 standalone application. Feature routes are lazy. An auth guard sends an unauthenticated navigation on a protected route to login. A CSRF interceptor attaches `X-XSRF-TOKEN`. The API client is generated from the OpenAPI document so the dashboard does not keep a second, hand-written copy of the payloads.

Features are sliced in the order a founder actually moves:

- **dashboard** — the shell and the place a finding is reviewed
- **founders** — who is in the workspace
- **questionnaires** — submit, which stores the JSONB snapshot
- **alignments** — acceptance by at least two founders
- **directions** — the research direction those founders set
- **research** — start the job, poll every 2 seconds, read the finding

Phase 6 adds **opportunities**, **products**, and **decisions**. Those screens wait until a finding exists. An opportunity screen without a cited Census retrieval would ask founders to record `ADVANCE` on a story. The evaluation copy and the pass/fail bar for that step come from [EVALUATION_CRITERIA.md](../ai/EVALUATION_CRITERIA.md).

The dashboard review shows `factual_summary`, `ai_interpretation`, and unknowns as separate fields. The client must not concatenate them into one narrative. Founders need to see what Census returned, what `AIProvider` inferred, and what neither source established.

## 7. Implementation phases

Phases 2 through 7 start only after this document is approved. Phase 1 is already done by the docs set. Phases 4 and 5 ship as one path. A merged scaffold that cannot complete that path is not a milestone.

| Phase | When | Milestone |
| --- | --- | --- |
| 1 Architecture audit | Done | The docs set records an empty repo and nothing reusable in-tree. |
| 2 Backend foundation | After approval | The API process starts on PostgreSQL, rejects bad sessions, and publishes OpenAPI. |
| 3 Angular foundation | After the OpenAPI document exists | A guarded standalone app compiles the generated client and shows the dashboard shell. |
| 4 and 5 First working path | Together, after phases 2 and 3 | A founder session goes from questionnaire submit to a dashboard review of a Census-backed finding. |
| 6 Opportunity evaluation | After the first path has been used | Opportunity, product, and append-only decision behavior, with the evidence bar still visible. |
| 7 Integration and quality | After phase 6 | CI runs backend tests, frontend tests, and a Playwright pass of the slice. Docs match the code. |

### Phase 1 — Architecture audit

**Milestone.** The docs set is the deliverable. No application code is part of this phase.

**Why.** The folder is empty, and a neighboring product (news-rater) is easy to mistake for a starting point. The audit closes that mistake before anyone runs `git init` or adds a dependency.

**Acceptance.** [CURRENT_STATE.md](../architecture/CURRENT_STATE.md) states that the repo is empty and that nothing is reusable in-tree. That acceptance is met: the audit records an empty directory, no git repository, and no component, service, entity, migration, workflow, or config to lift.

### Phase 2 — Backend foundation

**Milestone.** After approval: initialize git, bring up Compose, and boot a Spring Boot 4.1.2 application whose schema, session security, and OpenAPI document are real.

**Why this is first.** Angular, jobs, and Census all sit on the session rule and the schema. Building screens before `V1` and the allowlist exist would freeze the wrong payloads. Package directories are created only where a class exists in this phase. Empty feature packages look like unfinished work and invite scaffolds ahead of the first path.

Work in this phase:

- `git init` in `/Users/nick/Desktop/git/ai-idea-generator`, as the first coding action after approval. History starts here so later phases have a diff.
- Compose runs PostgreSQL, the backend, and a same-origin proxy. The proxy is how the browser will see one origin for the app and `/api`.
- Flyway `V1` creates the schema in [DATABASE_DESIGN.md](../architecture/DATABASE_DESIGN.md), including opportunity, product, and decision tables.
- Spring Security uses Google OAuth2/OIDC, CSRF (`XSRF-TOKEN` / `X-XSRF-TOKEN`), and Spring Session JDBC. The session cookie is HttpOnly, Secure, and `SameSite=Lax`. `FOUNDER_EMAIL_ALLOWLIST` is the authorization check after Google identifies the email.
- springdoc publishes the OpenAPI document that must match [API_CONTRACTS.md](../api/API_CONTRACTS.md).
- JUnit, Mockito, and Testcontainers are the test stack. `@RestControllerAdvice` is the single error shape those tests assert.
- Base package `com.founderslab`. Directories exist only for packages that contain code in this phase.

**Acceptance.**

- The Spring context starts against a Testcontainers PostgreSQL instance.
- Flyway applies `V1` on an empty database.
- An unauthenticated call to `/api/v1/session` returns 401. No session means the caller is not authenticated.
- A caller whose email is outside `FOUNDER_EMAIL_ALLOWLIST` receives 403. Google may have identified them; this product has not authorized them.
- The published OpenAPI document covers the session contract the later client will generate from.

Live Google login is not an acceptance criterion for this phase. `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are not in the repo. Security tests prove 401 and 403 without a browser round trip to Google.

### Phase 3 — Angular foundation

**Milestone.** An Angular 22.2 standalone app with lazy routes, a login redirect, a CSRF interceptor, a generated client pipeline, and a dashboard shell.

**Why it follows the OpenAPI document.** The generated client compiles against the document phase 2 publishes. Starting the generator before that document matches [API_CONTRACTS.md](../api/API_CONTRACTS.md) would train the team to hand-edit generated types. Feature modules beyond the shell wait for phases 4 and 5 so this phase does not invent empty research screens.

**Acceptance.**

- Unauthenticated navigation to a protected route goes to login.
- The generated client compiles against the OpenAPI document.
- The dashboard shell renders for an authorized session and does not yet pretend that a finding exists.

### Phase 4 and 5 — First working path

**Milestone.** One working path, built and tested together:

questionnaire submit → alignment of at least two founders → research direction → approved Census source → evidence-backed finding → Angular dashboard review.

**Why these phases are one milestone.** A backend job with no review screen, or a dashboard bound to fixtures the server does not store, does not tell the founders whether the evidence bar holds. Shipping them together is how the team avoids unfinished scaffolds.

The path, once a founder session is allowlisted:

1. The founder submits a questionnaire. The server stores the JSONB snapshot.
2. At least two founders record alignment.
3. They set a research direction.
4. `POST /api/v1/directions/{id}/research` with an `Idempotency-Key` creates a `research_job` in `PENDING` and returns **202**.
5. The job moves through `RUNNING` to a terminal status: `SUCCEEDED`, `FAILED`, or `CANCELLED`.
6. While the job runs, `CensusCountyBusinessPatternsAdapter` retrieves County Business Patterns and the server stores a `research_source`. `AIProvider` returns `factualSummary`, `supportingEvidence`, `aiInterpretation`, and `unknowns` as text grounded in that retrieval. The server validates the object and inserts `research_finding` with `verification_status` `UNREVIEWED`. The model does not set `verification_status`. Unknowns include the County Business Patterns limit. No second external source is introduced here.
7. The Angular dashboard polls every 2 seconds while the status is `PENDING` or `RUNNING`, and stops on `SUCCEEDED`, `FAILED`, or `CANCELLED`. The review screen shows factual summary, interpretation, and unknowns separately. A founder sets `CONFIRMED` or `REJECTED` later, before `ADVANCE`. That review mark is not required to store the finding.

A repeated `POST /api/v1/directions/{id}/research` with the same `Idempotency-Key` returns **200** and the existing job. It does not call Census a second time. The 202 means a new job was accepted. The 200 means the key already names a job. That split is what makes a double submit safe.

**Acceptance.**

- A founder session can complete the path above through the Angular dashboard.
- Every finding cites a stored Census retrieval.
- `factual_summary`, `ai_interpretation`, and unknowns are stored and shown as separate fields.
- A repeated `POST /api/v1/directions/{id}/research` with the same `Idempotency-Key` does not call Census twice, and the repeat response is 200.
- An email outside `FOUNDER_EMAIL_ALLOWLIST` cannot read jobs (403).
- Automated tests use fixtures for Census payloads and for `AIProvider` output. They do not make paid model calls, and they do not call live Census. `AI_API_KEY`, `AI_MODEL`, and `CENSUS_API_KEY` stay configuration names. Test code supplies fixtures in their place.

### Phase 6 — Opportunity evaluation

**Milestone.** Opportunity APIs and screens, product concepts, and founder decisions, judged with [EVALUATION_CRITERIA.md](../ai/EVALUATION_CRITERIA.md).

**Why it waits.** `ADVANCE` is a founder commitment. It belongs after the first path has produced a finding a person has actually reviewed. The tables already exist from `V1`. This phase adds the behavior and the screens, not a new schema strategy.

Product concepts use `business_type` default `PHYSICAL_PRODUCT` when the founder does not choose a type. A decision `POST` appends a `founder_decision` row.

**Acceptance.**

- A decision `POST` appends a row. The previous decision row remains.
- The UI shows fact, interpretation, and unknowns before a founder can record `ADVANCE`.

### Phase 7 — Integration and quality

**Milestone.** The slice is covered by Playwright, usage limits are enforced, the audit trail can be reviewed, and the docs set is corrected to match the code.

**Why this is last.** End-to-end coverage of a path that does not exist yet would freeze the wrong journey. Usage limits matter once a real job can call Census and `AIProvider`. The audit review matters once login, job creation, source verification, and decisions are actually written.

Playwright runs the founder path through the same-origin proxy: login gate, questionnaire, alignment, direction, research job, and dashboard review of a fixture-backed finding. CI does not depend on Google, a paid model, or live Census.

**Acceptance.** CI runs backend tests, frontend tests, and the Playwright path. The docs set, including this plan, is updated where the code and the tests disagree with it.

## 8. Parallel development

How the three founders divide the work, and how they review it, is [TEAM_WORKFLOW.md](TEAM_WORKFLOW.md). Ownership below is the implementation boundary. The shared surface is [API_CONTRACTS.md](../api/API_CONTRACTS.md). A payload change is a change to that document first, then to the server and the generated client. That order is why parallel work does not mean parallel invention of DTOs.

**Nick** owns the backend, the schema, security, jobs, Census, OpenAPI, and CI. That includes Flyway `V1`, Spring Security, `research_job` idempotency, `CensusCountyBusinessPatternsAdapter`, springdoc, Testcontainers, and the pipeline that runs the three CI suites in phase 7.

**Paul** owns question content, alignment acceptance, dashboard review UX, and AI explanation quality. Question content lands in the questionnaire snapshot. Alignment is the step that requires at least two founders. The review UX keeps `factual_summary`, `ai_interpretation`, and unknowns visually separate. Explanation quality is whether `AIProvider` output stays an interpretation.

**Zach** owns the evidence bar and the evaluation criteria in [EVALUATION_CRITERIA.md](../ai/EVALUATION_CRITERIA.md). A finding that cites no `research_source`, or that folds Census counts and model prose into one field, fails that bar even if the screen looks finished. Phase 6 uses his criteria before `ADVANCE` is available.

They can work in parallel after approval where the contract already names the payload. Phases 4 and 5 still merge as one path. Nick does not hand Paul a job API with no stored source. Paul does not build a review screen that synthesizes a finding the API does not return. Zach's bar is a condition of that merge, not a later editorial pass.

## 9. Risks and tradeoffs

The decision log is [ARCHITECTURE_DECISIONS.md](../architecture/ARCHITECTURE_DECISIONS.md). The risks below are the ones that should change a founder's vote on this plan.

**Google credentials block live login.** `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are not in this repo and must not be committed. Phase 2 can prove 401 and 403 without them. A founder still cannot complete a real browser login until those values exist outside the tree, and `FOUNDER_EMAIL_ALLOWLIST` is set to the real founder emails. The tradeoff is deliberate: schema and job work are not blocked on a Google Cloud console setup, and a green security test is not treated as a production login.

**Census County Business Patterns does not prove customer pain.** `CensusCountyBusinessPatternsAdapter` can store establishment counts. Those counts belong in `factual_summary`. They do not show that a buyer feels the problem a product claims to solve. That limit belongs in unknowns. `AIProvider` may interpret the counts in `ai_interpretation` and must not upgrade them into proof. The tradeoff is to ship one real public source now, and to keep the evidence bar strict enough that a census table cannot masquerade as customer discovery.

**OpenAPI generation will churn.** springdoc output and the generated Angular client will change whenever controllers change. Diffs in generated files will look noisy. The tradeoff is to accept that churn so the client cannot drift from the server through hand-edited types. [API_CONTRACTS.md](../api/API_CONTRACTS.md) is the review surface. The generated client is a build product. Phase 3 acceptance is that the client compiles against the document, not that the generated files stay stable from week to week.

**Docs will need correction once code exists.** This plan is the gate before coding. It will be wrong in details once Flyway, the controllers, and the screens exist. Phase 7 updates the docs set to match the code and the tests. The tradeoff is to write the plan now so the stack can be rejected before `git init`, and to schedule a correction pass so the first docs do not outrank a failing test.

**No message bus and no multi-agent research until the single job path has been used.** The first runtime is one `research_job`, polled every 2 seconds, with one Census adapter and one `AIProvider`. Statuses stay `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, and `CANCELLED`. A bus, a second agent, or a parallel research topology waits until founders have used this path on a real workspace. The tradeoff is a slower-looking architecture in exchange for a failure a founder can see in one job row. Extra machinery before that use would hide whether the evidence bar works at all.
