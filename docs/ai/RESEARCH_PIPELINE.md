# Research pipeline

This document specifies the founder research pipeline. It is a design. The pipeline is not implemented. This repository has no `AIProvider`, no Census adapter, no research job worker, no research tables, and no Angular research screen. Names below are the contract for later code. They are not classes or rows that exist today.

Related documents:

- [DATABASE_DESIGN.md](../architecture/DATABASE_DESIGN.md) — tables the pipeline reads and writes
- [ARCHITECTURE_DECISIONS.md](../architecture/ARCHITECTURE_DECISIONS.md) — stack and boundary decisions this pipeline depends on
- [API_CONTRACTS.md](../api/API_CONTRACTS.md) — HTTP shapes for the endpoints named here
- [EVALUATION_CRITERIA.md](EVALUATION_CRITERIA.md) — how a finding is judged once a human reviews it
- [IMPLEMENTATION_PLAN.md](../development/IMPLEMENTATION_PLAN.md) — when this pipeline is scheduled to be built

The audit of the empty tree is in [CURRENT_STATE.md](../architecture/CURRENT_STATE.md).

## Why a pipeline exists

A founder needs a record that separates three things: a published dataset, a model’s reading of that dataset, and a human decision to treat the reading as evidence. County Business Patterns can describe how many establishments a NAICS query returns. A model can summarize that payload. A person decides whether the summary is strong enough to ADVANCE. The pipeline exists so those three steps cannot collapse into one unsourced paragraph.

Each control below exists to keep that separation intact under retries, double-clicks, concurrent workers, hostile text, and metered API calls.

## One provider

The model boundary is one interface:

`AIProvider.generateStructuredResponse(String prompt, Class<T> responseType)`

The caller passes the full prompt and the response type it expects. The method returns an object of that type. There is no second model client, chat method, or tool-calling entry point in this pipeline. One method means every call site can be wrapped with the same validation, usage capture, timeout, and secret handling. A later feature that needs a model uses this method so it cannot skip those controls.

The specified library is Spring AI 2.0.2. Spring AI 2.1 release candidates are outside this contract. The pipeline is pinned to the 2.0.2 release so structured responses target a shipped API during implementation, and so a release candidate cannot move the method’s behavior under an unreleased version.

The server reads `AI_API_KEY` and `AI_MODEL` from the environment. The key selects the provider account. The model id is configuration so changing models does not require a code change and does not put the id in the Angular build. Both values stay on the server. The browser never receives the provider client, the key, or a proxy that would let page script call the model directly. That split exists because a key in Angular can be read by anyone who loads the app, and a browser-side model call would bypass job accounting, the source catalog, and validation.

## One adapter

The only research adapter in this design is `CensusCountyBusinessPatternsAdapter`. It calls `https://api.census.gov/data/` for County Business Patterns. The server reads `CENSUS_API_KEY` from the environment.

The adapter returns establishment counts and the related fields County Business Patterns publishes for a NAICS query. That is the whole success payload. Interviews, prices, and proof that a customer has a problem are outside what this dataset publishes. The pipeline writes that limit into `research_finding.unknowns` on every finding, in application code, including when the model text already contains an unknowns section. The write is server-side so the limit is still present when the model omits it. The limit is stored on the finding so a later reader sees the gap next to the evidence, and so a census count is recorded as market structure.

A second adapter is out of scope until this Census path has been used for real. The first path has to be exercised against recorded fixtures, then against live Census by a person, before another source is added. A second adapter before that would add another key, another payload shape, and another way to skip the catalog.

## Approved catalog

The Census source is a row in `approved_research_source`. The worker may call only that catalog. The allowlist is the control that makes “which sources exist” a data decision checked on the server. A prompt, a direction description, or a client-supplied URL cannot add a fetch.

Scraping is outside the worker. Scraping would accept arbitrary pages, with no published schema, no stable query, and no catalog review. The Census adapter calls the Census API for the approved row. It does not browse the web.

Column-level schema for the catalog, jobs, sources, and findings belongs in [DATABASE_DESIGN.md](../architecture/DATABASE_DESIGN.md). This document names the fields the pipeline requires.

## Job statuses

| Status | Meaning | Why it exists |
| --- | --- | --- |
| `PENDING` | The job is stored and has not been claimed | The HTTP request can end before any Census or model call |
| `RUNNING` | A worker claimed this attempt | Other workers leave the row alone, and a second key for the direction conflicts |
| `SUCCEEDED` | A validated finding was inserted and usage was stored | The client can load findings for the direction |
| `FAILED` | The attempt ended in error and the retry limit is exhausted, or the attempt failed in a way the job records as terminal | The founder sees a recorded failure, and the worker stops spending calls on it |
| `CANCELLED` | Cancellation was recorded | A job still waiting is not claimed, and a result from a cancelled attempt is not published |

`FAILED` and `CANCELLED` stay distinct. An outage and a founder stop are different facts. A cancelled job is not retried as a transient error. A failed job is not reported as a cancellation.

## Flow

### 1. The founder starts research in Angular

The founder acts on a direction in the Angular app. The browser’s only job is to ask the server to enqueue work and, later, to display status and findings. Angular does not call Census, does not call the model, and does not hold `CENSUS_API_KEY` or `AI_API_KEY`. Keeping the start action in the app, and the work on the server, is what makes the catalog, the cost cap, and the source row enforceable.

### 2. The browser posts the job

Angular sends:

`POST /api/v1/directions/{id}/research`

The request carries:

- `Idempotency-Key`
- `approvedResearchSourceId`
- the session cookie
- `X-XSRF-TOKEN`

The session cookie is the HttpOnly session. It identifies the founder. `X-XSRF-TOKEN` echoes the `XSRF-TOKEN` cookie. The POST changes server state and can spend Census quota and model budget, so a cross-site page that can trigger a cookie-bearing request must still fail the CSRF check. The browser can attach the session cookie without script reading it. Script in the Angular origin can read the CSRF cookie and set the header. A foreign origin can do the first and not the second.

`approvedResearchSourceId` names the catalog row the founder intends to use. The client does not send a URL. Sending an id, and resolving it on the server, is what keeps the request from becoming an open fetch.

The idempotency key is the client’s identity for this start action. A double-click or a retried POST uses the same key so the server can recognize one action.

Payload details beyond this contract belong in [API_CONTRACTS.md](../api/API_CONTRACTS.md).

### 3. The controller authorizes the start

Before a job row is created, the controller checks three things:

- The caller is authenticated.
- The caller is a member of the workspace that owns the direction.
- `approvedResearchSourceId` is the approved Census source.

Authentication establishes who is calling. Workspace membership establishes that this founder may act on this direction. A valid session is membership in the workspaces the founder belongs to, not in every workspace. The source check rejects any id other than the approved Census row, so a caller cannot point a job at an unapproved catalog row.

The worker repeats the catalog rule at execution time. The controller check exists so the client gets a refusal before a job exists. The worker check exists so a job that reached the queue by any path still cannot call anything outside the catalog.

### 4. The service admits the job or refuses it

Admission has four outcomes:

- A new job is inserted with status `PENDING` and the response is `202` with `{ jobId, status: PENDING }`.
- The same idempotency key is presented again for that direction. The service returns the existing job with `200`. It does not insert a second job.
- A different idempotency key is presented while a job for that direction is `RUNNING`. The response is `409`.
- The rate cap or the cost cap is already exceeded. The response is `429`. No job is inserted.

The `202` means the server accepted work and has not finished it. The browser must not wait on this HTTP call for Census or the model.

The `200` replay exists so a retried start is one job, one Census series, and one model charge. The key is stored on `research_job` for that direction. Retries of the worker are attempts on that same job. They do not allocate a new key and do not look like a new POST. The key identifies the founder’s action. `attempt_count` identifies how many times the worker has claimed it.

The `409` exists because a `RUNNING` job has already taken the direction’s research slot and is spending an external call. A second key must not start overlapping work for that direction.

The `429` exists because each admitted job can spend Census quota and model tokens. The cap is applied before insert so the server does not promise work it is not allowed to pay for. Rate limits a burst. Cost limits accumulated `estimated_cost`. Both are required: a cheap call can still be repeated too fast, and a slow series of expensive calls can pass a rate limit.

### 5. The HTTP request ends

The request thread returns after admission. It does not call Census and it does not call `AIProvider`. Research waits on networks the server does not control. Doing that work on the request thread would hold a server thread for the whole attempt, would tie cancellation to the browser connection, and would make a proxy timeout look like a lost job. The `research_job` row is the handoff. The founder’s POST and the worker’s attempt are different processes in the logical sense even when they run in one application.

### 6. A poller claims pending work

A poller claims `PENDING` jobs with `SELECT ... FOR UPDATE SKIP LOCKED`, sets the job to `RUNNING`, and increments `attempt_count` in that claim.

`FOR UPDATE` makes the claim exclusive for the rows the statement locks. `SKIP LOCKED` lets another poller take a different `PENDING` row while this one holds its lock. The design assumes more than one application process can run, which matches the decision to keep sessions in PostgreSQL. An in-memory queue in one process would drop or double-run work as soon as a second process started polling.

The lock covers the claim transaction. It does not stay held for the Census call or the model call. After commit, the row’s `RUNNING` status is what keeps other pollers from claiming it. They select `PENDING` only. `attempt_count` increases at claim time so a crash during the external call still counts as an attempt.

A job in `CANCELLED` status is not eligible for claim. Cancellation of a job that is still `PENDING` is how a stop takes effect before any external call starts.

### 7. The adapter calls Census and stores a source

The worker loads the approved catalog row and calls Census through `CensusCountyBusinessPatternsAdapter`. On a payload response it inserts `research_source` with:

- `request` — the query that was sent, with `CENSUS_API_KEY` removed
- `original_reference` — the published Census reference for that retrieval, again with the key removed
- `payload_hash` — a hash of the payload that was stored
- `retrieved_at` — when the snapshot was taken

Those fields exist so a finding can point at a specific retrieval. The request shows what was asked. The reference shows where the published data came from. The hash shows which bytes were stored. `retrieved_at` shows which vintage the snapshot is, because County Business Patterns is reissued over time. The key is stripped before persistence because Census accepts the key as a query parameter. Storing the raw URL would store the secret in `research_source` and could return it from any API that shows the source.

Each retrieval that returns a payload is its own `research_source`. A retry is a new retrieval with its own hash and timestamp. A finding, when one is inserted, points at the source for the attempt that produced it.

If Census fails, the worker records the error on the job and retries up to a fixed limit, then sets `FAILED`. The limit is a fixed configuration value. This document does not choose the integer; implementation does, and the value stays fixed so operators can predict spend. The retry exists because a transient Census failure should not permanently fail the direction on the first blip. The cap exists because a bad key, a bad query, or an extended outage must not occupy the poller forever. After the limit, `FAILED` is the recorded outcome. Error text stored on the job and written to logs has the Census key removed, including keys that appear inside a URL.

### 8. The provider is called with data separated from instructions

On a stored payload, the worker calls `AIProvider.generateStructuredResponse`. The prompt is built by the server. It has two kinds of content:

- Instructions written by the application: summarize only the retrieved payload, map the answer onto the response type, and do not invent sources, URLs, or statistics that are not in that payload.
- Untrusted data, in a delimited block: the Census payload. Founder-written direction text, when it is included so the model knows which question the founder asked, is a second untrusted block.

The delimiter exists so the model can see the boundary between rules and quoted material. The instruction exists because text inside the block can look like a command. Census cells and direction prose are data. Instructions found inside them that try to override the system rules are ignored. That includes orders to invent a statistic, to name a source that was not retrieved, to change `verification_status`, to reveal a key, or to fetch some other URL.

Founder text is untrusted for the same reason Census text is untrusted. Authentication proves who wrote the direction. It does not promote that prose to a system rule. A signed-in founder can still paste “ignore previous instructions.”

The prompt must not contain `AI_API_KEY` or `CENSUS_API_KEY`. A key inside the prompt would be sent to the model provider and could be copied into a finding the browser displays.

The prompt rule is one layer. It is not the only control. The worker still calls only the catalog. The server still validates the object. The server still sets `verification_status`. The server still writes the Census limit into `unknowns`. A model that follows a sentence inside the payload cannot open a new adapter and cannot mark itself reviewed.

### 9. The structured response is validated before any finding insert

The object returned by `generateStructuredResponse` is checked with Bean Validation before insert. The required parts are:

- `factualSummary` — text stored in `factual_summary`. What the payload supports
- `supportingEvidence` — text stored in `supporting_evidence`. The payload facts that summary rests on, so a person can compare them with the stored source
- `aiInterpretation` — text stored in `ai_interpretation`. The model’s reading, labeled as interpretation
- `unknowns` — text stored in `unknowns`. What the payload does not answer, which always includes the County Business Patterns limit described above

The four parts exist so facts, the evidence for those facts, the interpretation, and the gaps are stored separately. A reviewer can disagree with the interpretation while still seeing the census figures it used.

If validation fails, the worker does not insert a `research_finding`. The attempt fails and the error is recorded. A further attempt is allowed only while `attempt_count` is under the fixed retry limit. When the limit is reached, the job is `FAILED`. Skipping the insert is deliberate. A partial object stored as a finding would look like a result. The database is not the first validator. A finding row is created only for a response that already has the required parts.

### 10. A finding is inserted only with a source, then the job succeeds

On a valid response the worker inserts `research_finding` with `research_source_id` set and `verification_status` set to `UNREVIEWED`. `research_source_id` is required. A finding without a persisted source is a defect, not a feature. There is no successful path that publishes an unsourced claim. If the source row was not stored, the finding is not inserted and the attempt fails.

`verification_status` is set by the application. The model response is not allowed to supply it. The only value this pipeline writes is `UNREVIEWED`. Human review is required before a founder treats a finding as evidence for ADVANCE. ADVANCE is a product decision about the direction. An automatic label would let the model promote its own output. Review criteria live in [EVALUATION_CRITERIA.md](EVALUATION_CRITERIA.md). This pipeline stops at an unreviewed finding tied to a source.

The same transaction stores `token_usage` and `estimated_cost` on the job and sets status `SUCCEEDED`. Usage is the measured token count from the provider call. Estimated cost is the charge derived from that usage. Both live on the job so the next admission check can sum spend, and so the founder can see cost on the job resource. They are recorded when the attempt that produced the finding finishes, because that is when the numbers are known.

The insert of the finding and the move to `SUCCEEDED` re-read the job status in the same transaction. If the job is `CANCELLED`, the finding is not published and the status stays `CANCELLED`. That check is the race control between a late cancel and a finishing attempt.

### 11. Angular polls, then loads findings

While the job is `PENDING` or `RUNNING`, Angular polls:

`GET /api/v1/research-jobs/{id}`

every 2 seconds.

Two seconds is the specified interval. It is short enough that the screen updates during a normal attempt, and long enough that a room of open browsers does not poll in a tight loop. The poll stops when the status is `SUCCEEDED`, `FAILED`, or `CANCELLED`. Those states are terminal for the client loop. Waiting will not move them.

On `SUCCEEDED`, Angular loads:

`GET /api/v1/directions/{id}/findings`

The job resource is status, attempt information, and cost. The findings resource is the evidence. Splitting them keeps a status poll from returning the full payload on every tick, and keeps findings addressable for review after the job is done.

`GET /api/v1/research-jobs/{id}` must not echo `CENSUS_API_KEY` or `AI_API_KEY`. The response may carry job id, status, safe error text, `token_usage`, and `estimated_cost`. It must not carry environment secrets, request URLs that still contain the Census key, or provider credentials. The same redaction applies to the findings response and to any source reference shown from `original_reference`.

## Operational controls

### Retry limits

Census failures and failed attempts retry up to a fixed limit, then `FAILED`. `attempt_count` is the record of claims already made. The limit exists so transient failures recover and permanent failures stop. The limit is configuration, fixed for a deployment, and is not “retry until someone notices.”

A `CANCELLED` job is not retried. Scheduling another attempt would undo the cancellation.

### Timeouts

The Census call and the model call each have a timeout. A hung peer must not hold a worker and a `RUNNING` row with no end. On timeout the attempt records an error and follows the retry limit.

The row lock from the claim does not cover the external call, so a worker that dies after setting `RUNNING` leaves a row that no lock holder still owns. An attempt deadline covers that case. When the deadline passes, a poller may reclaim the job if `attempt_count` is under the limit, or set `FAILED` if the limit is exhausted. A `CANCELLED` job is not reclaimed. Without the deadline, one dead process would leave the direction `RUNNING` and the `409` rule would block new work.

Timeout durations are fixed configuration. They are chosen at implementation. They are shorter than the deployment’s proxy idle time so the worker records its own timeout, and the founder’s poll observes `FAILED` or a new attempt.

### Idempotency

The `Idempotency-Key` on the POST is stored with the job for that direction. The same key returns the same job with `200` and the job’s current status. A new execution is not started. Worker retries reuse the job id and increment `attempt_count`. They are not new idempotency keys.

The key exists because the network between Angular and the server can deliver the POST more than once, and because the founder can activate the control twice. The server’s definition of “once” has to be a stored key, not a hope that the browser sent a single request.

### Failure logging

Each failed attempt logs the job id, the attempt number, and an error category, and stores a safe error on the job. Logs omit `AI_API_KEY`, `CENSUS_API_KEY`, `Authorization` headers, and any query string or URL that contains the Census key. Census puts the key in the query, so an access log of the outbound URL is a secret leak unless the key is redacted first. Provider error bodies are stored only after the same redaction. Logging exists so a `FAILED` job can be explained after the HTTP request that created it is gone. Redaction exists so that explanation does not become a copy of the credentials.

### Safe concurrent execution

Three rules stack:

- `SELECT ... FOR UPDATE SKIP LOCKED` so two pollers do not claim the same `PENDING` row.
- Status `RUNNING` so a second poller does not claim a job that is already in an attempt.
- `409` when a different idempotency key arrives while that direction already has a `RUNNING` job.

Together they allow many directions to proceed at once and keep two workers off the same job. The claim is safe across processes because the lock is in the database, not in a single JVM.

### Cost limits

Admission returns `429` when the rate cap or the cost cap is exceeded, and it does not insert a job. After a model call, the job stores `token_usage` and `estimated_cost`. The admission check can sum `estimated_cost` for prior jobs because the number is on the row, not only in a log line. The cap exists because a founder action would otherwise be an unbounded series of metered calls. Recording usage on the success path, and on failed attempts that already spent tokens, is what makes the next check true.

### Cancellation

Cancellation of a job that is still `PENDING` marks it `CANCELLED` so the poller does not claim it. No Census call and no model call start.

Cancellation of an attempt that is already in flight does not require killing the external call. Cancellation of an in-flight HTTP call is best-effort. The local client may abort the socket, and it may not. The remote Census or model request can run to completion either way. The pipeline does not treat a hard cancel of that socket as the correctness condition. The attempt is allowed to finish. If the job is `CANCELLED` when the attempt finishes, the new finding is discarded and the job remains `CANCELLED`. It is not moved to `SUCCEEDED`.

Best-effort abort exists as an optimization so a cancelled attempt can stop reading a response early. Discarding the finding is the control that protects the product. Depending on a killed socket would be wrong: the provider may already have done the work, and a partial response is not a validated finding.

## Security summary

- `AI_API_KEY`, `AI_MODEL`, and `CENSUS_API_KEY` are server environment values. Angular does not receive them. Logs, `research_source`, job errors, `GET /api/v1/research-jobs/{id}`, and findings responses do not echo them.
- The worker calls only the approved Census catalog row. Founder text and Census text cannot add a URL or a second adapter.
- Instructions and untrusted data are separated in the prompt. Census payload and founder-written direction text are untrusted. Embedded instructions that try to override the system rules are ignored.
- A finding is inserted only with a persisted `research_source_id`, and only after Bean Validation of `factualSummary`, `supportingEvidence`, `aiInterpretation`, and `unknowns`.
- The application sets `verification_status` to `UNREVIEWED`. The model does not set it. A founder treats a finding as evidence for ADVANCE only after human review.
- Every finding’s `unknowns` includes the standing limit of County Business Patterns: the payload is establishment counts and related published fields, and it is not interviews, prices, or proof that a customer has a problem.

## Tests

Tests for this pipeline use recorded Census fixtures and a fake `AIProvider`. The fixture is a saved County Business Patterns payload, including the request shape with the key already redacted. The fake provider returns a structured object, or an invalid one, without calling a network.

CI must not call the live model or live Census. Live calls cost money, change as the provider and the census change, fail when those services are down, and can print a key into a CI log if a URL is captured raw. A fixture freezes the bytes that validation, hashing, and the prompt boundary are tested against. A fake `AIProvider` lets a test assert that an invalid object does not insert a finding, that a valid object inserts one `UNREVIEWED` finding with `research_source_id` set, and that the Census limit is present in `unknowns`.

A test that needs to prove the real Census contract or the real model is a manual run outside CI, after this path exists, and it is not a substitute for the fixture tests.

## What this document does not do

This file does not implement the pipeline, add a dependency, or create a schema. Spring AI 2.0.2, `CensusCountyBusinessPatternsAdapter`, the poller, and the Angular screens are specified here and are absent from the repository. Build order belongs in [IMPLEMENTATION_PLAN.md](../development/IMPLEMENTATION_PLAN.md).
