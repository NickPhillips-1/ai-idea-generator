# Architecture decisions

Written 11 November 2026. Each record states the decision, why it was made, what was rejected, and the consequence.

These documents are decisions. They are not a claim that the system exists. The repository is an empty folder. Implementation starts only after the written plan is reviewed.

Related documents:

- [CURRENT_STATE.md](CURRENT_STATE.md)
- [TARGET_ARCHITECTURE.md](TARGET_ARCHITECTURE.md)
- [DATABASE_DESIGN.md](DATABASE_DESIGN.md)
- [FRONTEND_ARCHITECTURE.md](FRONTEND_ARCHITECTURE.md)
- [API_CONTRACTS.md](../api/API_CONTRACTS.md)
- [IMPLEMENTATION_PLAN.md](../development/IMPLEMENTATION_PLAN.md)

## ADR 1. Greenfield in this empty folder

**Date:** 11 November 2026

**Status:** Accepted

**Decision.** Build this product in `/Users/nick/Desktop/git/ai-idea-generator` as a new system. The user confirmed this folder is the project.

**Why.** An audit on 11 November 2026 found no git repository, no source, no database, no auth, and no CI. A migration preserves behavior that already runs. This directory has never run anything, so there is no behavior, schema, or login to carry forward. [CURRENT_STATE.md](CURRENT_STATE.md) records that evidence.

**Rejected.** A phased migration of an existing application. Copying the sibling project at `/Users/nick/Desktop/git/news-rater`, which uses package `com.newsrater`, H2, and a different domain.

**Consequence.** Later phases create Angular and Spring Boot in an empty tree. They do not translate screens, endpoints, or schema from a predecessor, and they do not import `com.newsrater` or that product's H2 database. Sibling folders on the same machine stay out of scope.

## ADR 2. Modular monolith

**Date:** 11 November 2026

**Status:** Accepted

**Decision.** One deployable backend. Request flow is Angular, then controller, then service, then repository, then PostgreSQL. Feature code lives in packages under `com.founderslab` so boundaries stay visible inside that single process.

**Why.** The first milestone is one product, one schema, and one team. A modular monolith keeps transactions, sessions, and jobs in one database without a network hop between layers. Package boundaries leave room to split a module later if a real operational boundary appears.

**Rejected.** Microservices. Kafka. RabbitMQ. WebSockets. Server-sent events for the first milestone.

**Consequence.** There is one Spring Boot process to build, configure, and deploy. Cross-cutting concerns stay in-process. Long-running research uses database-backed jobs (ADR 10). The browser learns job status by polling. A message broker and a push channel are not runtime dependencies of the first milestone.

## ADR 3. Java 21 and Spring Boot 4.1.2

**Date:** 11 November 2026

**Status:** Accepted

**Decision.** Java 21, Spring Boot 4.1.2, and Maven. Feature packages sit under `com.founderslab`.

**Why.** Spring Boot 4.1.2 requires Java 17 or newer and supports Java 21. Java 21 is the long-term release this project will compile and run on. Maven is the build tool for that stack. `com.founderslab` names this product.

**Rejected.** Spring Boot 3.5, which is on an end-of-life path. Copying an older sibling stack, including its package name and dependency generation.

**Consequence.** The backend starts on the current Boot line. Application code is written for Java 21 and Boot 4.1.2 when implementation begins. It is not lifted from a Boot 3.x sibling, and the base package is `com.founderslab`.

## ADR 4. Angular 22.2.x

**Date:** 11 November 2026

**Status:** Accepted

**Decision.** Angular 22.2.x, pinned to the stable 22.2.5 line published on 6 November 2026. Standalone components. Signals for local state. RxJS for HTTP. No NgRx.

**Why.** Pinning the 22.2.5 line keeps the client on a known stable release during the first slice. Standalone components are the current Angular structure, and this repository has no `NgModule` graph to preserve. Signals hold component state. `HttpClient` returns RxJS streams, so HTTP stays on RxJS. NgRx solves a global-store problem this product does not have yet. Further client structure is in [FRONTEND_ARCHITECTURE.md](FRONTEND_ARCHITECTURE.md).

**Rejected.** React. Next.js. `NgModule`s as the primary structure.

**Consequence.** There is one client framework. New screens are standalone components. Local state uses signals. A second hand-written store is not introduced. The version stays on 22.2.x until an explicit bump. The generated API client (ADR 14) is consumed from this Angular app.

## ADR 5. Spring AI 2.0.2 behind AIProvider

**Date:** 11 November 2026

**Status:** Accepted

**Decision.** Call models through Spring AI 2.0.2, behind an `AIProvider` interface. Select the provider with `AI_API_KEY` and `AI_MODEL`. Ship one implementation until a second provider is actually required.

**Why.** Spring AI 2.0.x supports Spring Boot 4.0 and 4.1, which matches ADR 3. An interface keeps vendor SDK types inside one implementation so services depend on this product's type. The key and model name stay in server environment variables, so the key never enters the frontend or the browser.

**Rejected.** Spring AI 2.1 release candidates.

**Consequence.** The classpath, once it exists, uses a stable 2.0.2 line rather than a release candidate. The Angular app never receives `AI_API_KEY`. Adding a second provider means a new `AIProvider` implementation on the server. That work waits until a second provider is required.

## ADR 6. PostgreSQL, Flyway, UUID primary keys, and optimistic locking

**Date:** 11 November 2026

**Status:** Accepted

**Decision.** PostgreSQL is the database. Flyway owns schema change. Primary keys are UUIDs. `founder`, `questionnaire`, `research_direction`, and `opportunity` carry `@Version` for optimistic locking.

**Why.** The domain is relational: workspaces, membership, questionnaires, research, findings, and decisions. Flyway gives an ordered, reviewable history of that schema, which matters because the database starts empty and should gain versioned migrations. UUIDs can be generated before insert and do not depend on a database sequence that was never created. `@Version` on the four aggregates that humans and jobs both update makes a conflicting write fail instead of silently overwriting the other writer's row. Table detail belongs in [DATABASE_DESIGN.md](DATABASE_DESIGN.md).

**Rejected.** Hibernate `ddl-auto` as the schema mechanism.

**Consequence.** Schema changes are Flyway migration files. `ddl-auto` does not create or alter the schema. Concurrent updates to `founder`, `questionnaire`, `research_direction`, and `opportunity` are checked with the version column. The first migration is an initial schema, because no production rows exist to transform.

## ADR 7. Google OAuth2/OIDC with server-side sessions

**Date:** 11 November 2026

**Status:** Accepted

**Decision.** Authenticate with Google OAuth2/OIDC. Store sessions with Spring Session JDBC. Set the session cookie `HttpOnly`, `Secure`, and `SameSite=Lax`. Use CSRF cookie `XSRF-TOKEN` and header `X-XSRF-TOKEN`. Serve the Angular app and the API on one origin through the Compose proxy. Admit only addresses on `FOUNDER_EMAIL_ALLOWLIST`. Read the Google client from `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

**Why.** Founders already have Google accounts, so the identity provider is Google. The session lives in PostgreSQL, which lets more than one application process share it once the database exists. `HttpOnly` keeps browser script from reading the session cookie. `Secure` sends it only over HTTPS. `SameSite=Lax` still sends the cookie on the top-level navigation back from Google. The CSRF cookie is readable by Angular so the client can echo it in `X-XSRF-TOKEN`. The same-origin Compose proxy makes that cookie pair work without a cross-origin token design. The allowlist exists because possession of a Google account is not an invitation. Client id and secret stay in the environment, outside the repository and outside the frontend.

There was no existing Google login to stay compatible with. Tests use Spring Security test support and do not call Google. Live login waits on a Cloud OAuth client.

**Rejected.** Tokens in `localStorage`. JWT in the browser as the default. Public self-signup.

**Consequence.** The browser does not hold an access token. An authenticated Google user who is absent from `FOUNDER_EMAIL_ALLOWLIST` still cannot enter. Automated tests never call Google. A live login cannot be exercised until a Cloud OAuth client exists and `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `FOUNDER_EMAIL_ALLOWLIST` are set outside the repo. No prior session format has to be preserved.

## ADR 8. Questionnaire answers as a JSONB snapshot

**Date:** 11 November 2026

**Status:** Accepted

**Decision.** Store questionnaire answers as a JSONB snapshot tied to `questionnaire_template`.

**Why.** The question set will change. A submission has to stay interpretable after questions are added, removed, or reworded. The snapshot records what the founder answered. The link to `questionnaire_template` records which question set those answers belonged to.

**Rejected.** A fully normalized answer-row model as the first schema.

**Consequence.** Old submissions remain readable against the template they used. Filtering or aggregating a single question is less direct than it would be with one row per answer. A normalized answer model waits until a query needs it. The first schema favors a stable history of submissions over convenient per-question reporting.

## ADR 9. Census County Business Patterns as the first research source

**Date:** 11 November 2026

**Status:** Accepted

**Decision.** The first research source is US Census County Business Patterns, fetched by `CensusCountyBusinessPatternsAdapter` from `https://api.census.gov/data/`. The key is `CENSUS_API_KEY`. Approved sources live in `approved_research_source`. Each call is stored as a `research_source` row.

**Why.** One official API and one adapter are enough to prove the research path: approve a source, call it, and record the call. County Business Patterns is public, structured, and citable. Recording every call as a `research_source` row gives later findings something to point at (ADR 11). Restricting calls to `approved_research_source` keeps the set of allowed upstreams explicit.

**Rejected.** Scraping. Multiple adapters. Autonomous research agents before one path works.

**Consequence.** Counts of establishments are not customer pain. Unknowns must say so. A census row can describe market structure. It cannot show that a specific buyer feels the problem a product claims to solve. Pipeline and scoring rules are in [RESEARCH_PIPELINE.md](../ai/RESEARCH_PIPELINE.md) and [EVALUATION_CRITERIA.md](../ai/EVALUATION_CRITERIA.md). A second adapter waits until this path works.

## ADR 10. Database-backed jobs

**Date:** 11 November 2026

**Status:** Accepted

**Decision.** Long-running work is a database-backed job. The create endpoint returns HTTP 202. The poller claims a row with `FOR UPDATE SKIP LOCKED`. Status values are `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, and `CANCELLED`. Clients send `Idempotency-Key`. Angular polls every 2 seconds.

**Why.** Census and model calls are slower than a request thread should block. A row in PostgreSQL is the job queue, which matches the modular monolith (ADR 2) and avoids a broker. `FOR UPDATE SKIP LOCKED` lets one worker claim a pending row while another worker skips it. The status set covers the life of a job, including cancellation. `Idempotency-Key` makes a retried POST return the original job. A 2-second poll is the completion signal because the first milestone has no push channel.

**Rejected.** Blocking HTTP for the duration of research. Kafka.

**Consequence.** The API accepts work and returns immediately. Completion is visible by reading job status, and the Angular client polls every 2 seconds. Duplicate submits that reuse an `Idempotency-Key` must not create a second job. Kafka is not deployed for this milestone. Job rows are the operational record.

## ADR 11. Findings separate fact, evidence, interpretation, and review

**Date:** 11 November 2026

**Status:** Accepted

**Decision.** A finding stores `factual_summary`, `supporting_evidence`, `ai_interpretation`, `unknowns`, and `verification_status`. Status values are `UNREVIEWED`, `CONFIRMED`, and `REJECTED`. A finding requires a `research_source`. A human reviews a finding before it supports a consequential decision.

**Why.** A model paragraph can sound like a cited fact. Separate columns force the summary, the evidence, the interpretation, and the gaps to stay distinct. `verification_status` records whether a person has accepted or rejected that split. Requiring `research_source` ties the finding to a recorded call (ADR 9). Human review is the gate before the finding is used to advance, invest, redesign, or archive (ADR 12).

**Rejected.** A confidence column used as evidence. A single undifferentiated text blob. A finding with no `research_source`.

**Consequence.** There is no confidence-as-evidence column. A model score is not a source and is not stored as one. New findings start `UNREVIEWED`. `CONFIRMED` and `REJECTED` are human acts. The API and UI have to present interpretation and unknowns separately from the factual summary. A finding cannot be stored without a `research_source`.

## ADR 12. Founder decisions are append-only

**Date:** 11 November 2026

**Status:** Accepted

**Decision.** Founder decisions are append-only. Allowed values are `ADVANCE`, `INVESTIGATE`, `REDESIGN`, and `ARCHIVE`. The current decision is the latest row for that founder.

**Why.** The sequence of judgments is part of the product record. Appending a row keeps every earlier choice. Reading the latest row per founder answers "what is the current decision" without destroying the path that led there.

**Rejected.** A single mutable status column updated in place.

**Consequence.** Changing a decision inserts a row. It does not overwrite or delete the previous one. Current state is a query for the latest row per founder. History remains available for review. Opportunity, product, and decision HTTP APIs still wait for phase 6 (ADR 16), even though the decision table is part of the foundation schema.

## ADR 13. business_type as a column

**Date:** 11 November 2026

**Status:** Accepted

**Decision.** Represent business type with a `business_type` column. The default is `PHYSICAL_PRODUCT`. Allowed values are `PHYSICAL_PRODUCT`, `SERVICE`, `SOFTWARE`, and `OTHER`.

**Why.** The first concrete case is a physical product. A column with an explicit default records that case on every row. The other allowed values are named so a later type does not require a schema invention, while behavior stays shared until it actually diverges.

**Rejected.** A class hierarchy per business type before a second type exists.

**Consequence.** Early rows are `PHYSICAL_PRODUCT` unless a caller sets another allowed value. Adding a type is a new allowed value. Separate types, tables, or class trees wait until a second business type is actually exercised and its behavior differs.

## ADR 14. OpenAPI and a generated TypeScript client

**Date:** 11 November 2026

**Status:** Accepted

**Decision.** Publish the HTTP contract with springdoc OpenAPI. Generate the TypeScript client into `frontend/src/app/core/api/generated`.

**Why.** The Angular app and the Spring API must share one description of each payload. springdoc derives that description from the server. Generating the client from it gives the frontend types and call sites that follow the server. The contract itself is specified in [API_CONTRACTS.md](../api/API_CONTRACTS.md).

**Rejected.** Hand-maintained duplicate DTO interfaces.

**Consequence.** When the contract changes, regenerate the client. Expect churn in `frontend/src/app/core/api/generated` during the slice. Application code imports the generated client. A second, hand-written copy of the same DTOs is not kept beside it.

## ADR 15. One workspace seed and a FOUNDER membership

**Date:** 11 November 2026

**Status:** Accepted

**Decision.** Seed one workspace. Membership is a `workspace_member` row with role `FOUNDER`.

**Why.** Authorization is membership in the workspace, not the mere fact of a Google login (ADR 7). One seeded workspace is enough for the founders who will use the first milestone. A role column on `workspace_member` can gain further roles later without a new identity model.

**Rejected.** Hardcoding three user tables.

**Consequence.** Unknown Google accounts get no membership. An authenticated user who is not a `workspace_member` cannot use the product. The first seed creates one workspace and founder memberships for allowlisted people. There is no public signup path and no per-role user table to keep in sync.

## ADR 16. Docs before application code

**Date:** 11 November 2026

**Status:** Accepted

**Decision.** Write the architecture, data, frontend, API, and implementation documents before application code. Package directories are created only when they contain real code. Opportunity, product, and decision HTTP APIs wait for phase 6, even though their tables are in the foundation schema.

**Why.** An empty folder is easy to mistake for a designed system once documents exist, and easy to fill with placeholder packages that look like progress. The documents in this set record decisions so implementation can be reviewed against them. [IMPLEMENTATION_PLAN.md](../development/IMPLEMENTATION_PLAN.md) is the order of that later work. Review of the written plan comes first. Code comes after that review. Tables can exist in the foundation schema before the HTTP surface that mutates them, because the schema is the shared record and the APIs arrive with the phase that needs them.

**Rejected.** Treating these documents as evidence that the system exists. Creating empty package directories as placeholders. Exposing opportunity, product, and decision HTTP APIs before phase 6.

**Consequence.** Readers use [CURRENT_STATE.md](CURRENT_STATE.md) for what is on disk and this document for what was chosen. Nothing here is implemented by being written down. A package directory appears only with the code that belongs in it. The foundation migration may create opportunity, product, and decision tables while their HTTP APIs remain unbuilt until phase 6.
