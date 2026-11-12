# Frontend architecture

Target design for the Founders Angular client. Audit date: 11 November 2026.

No Angular application exists in this repository. There is no `frontend/` tree, no `package.json`, and no UI to run. Paths in this document are the layout to create when implementation starts. They are decisions, not a description of files on disk.

This client is the view in the dependency rule in [TARGET_ARCHITECTURE.md](TARGET_ARCHITECTURE.md): Angular calls Spring REST and does not talk to PostgreSQL, Census, or the model. Recorded decisions live in [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md). HTTP shapes live in [API_CONTRACTS.md](../api/API_CONTRACTS.md). Sequencing lives in [IMPLEMENTATION_PLAN.md](../development/IMPLEMENTATION_PLAN.md).

## Stack

Angular 22.2.x, with the stable 22.2.5 release (6 November 2026) as the version to pin. TypeScript is strict. Components are standalone. The application starts with `bootstrapApplication`. Providers live in `frontend/src/app/app.config.ts`. An `NgModule` is allowed only when the CLI generates one that standalone bootstrap cannot replace.

Angular signals and `HttpClient` are the state and HTTP tools. A third-party client store is not part of the design. NgRx is out of scope. React is out of scope.

Why this stack: the platform is one Angular client and one Spring Boot service, maintained by a small team. Angular 22.2 is the current stable line, and standalone bootstrap is how that line starts an application. `NgModule` declarations would add a second composition model the first slice does not need. Strict TypeScript, including Angular template type-checking, is what makes generated API types and view models fail the build when a field drifts. NgRx solves large cross-cutting client state. This product's client state is screen-local, and RxJS already covers HTTP. Adding a store library before those built-ins are insufficient would put two state models in every feature. React would split the client from the Angular conventions the rest of this document depends on.

## Where code lives

```text
frontend/src/
  environments/                 build-time public config only
  styles/                       global shell styles
  app/
    app.config.ts               bootstrapApplication providers
    app.routes.ts               root route table
    core/
      auth/                     session API, login redirect
      guards/                   authGuard
      interceptors/             credentials, 401 handling
      api/generated/            OpenAPI-generated TypeScript
    shared/
      components/
      directives/
      pipes/
      models/
    layout/                     responsive dashboard shell
    features/
      dashboard/
      founders/
      questionnaires/
      alignments/
      directions/
      research/
```

`core` owns session policy and the generated client. `shared` owns presentation that has no session rules. Feature code does not import another feature's store. Cross-feature navigation uses the router and the API.

`src/environments` holds public build settings only. Secrets, Google client secrets, Census keys, and model keys stay on the server. The browser calls same-origin relative URLs under `/api/v1`. A second API origin in the environment file would make the session cookie third-party. See deployment below.

`src/styles` is for the shell: type, color, and layout tokens. Feature components keep their own styles so a finding's fact, interpretation, and unknowns cannot collapse into one shared card style.

The root route table is `app.routes.ts`. Feature routes are lazy:

```typescript
{
  path: 'research',
  loadChildren: () =>
    import('./features/research/research.routes').then((m) => m.researchRoutes),
}
```

Why lazy `loadChildren`: the first bundle should carry the shell and the slice a founder walks. Phase 6 screens stay out of that bundle until those features exist. Eager imports would also let unfinished features leak into the nav.

## Features in the first slice

Feature folders under `frontend/src/app/features`:

- `dashboard`
- `founders`
- `questionnaires`
- `alignments`
- `directions`
- `research`

`opportunities`, `products`, and `decisions` are added when phase 6 starts. They are not created as empty shells, and the first-slice nav does not link to them.

Why these six: they are the vertical slice. A founder sees the dashboard, founder profiles, a questionnaire, an alignment of at least two founders, a research direction, and the findings for that direction. A folder is added when that feature is implemented, and it arrives with its pages, components, API service, signal store, routes, and tests together. An empty directory would look like a feature that has no API and no behavior. Phase 6 has schema and later screens; shipping the folders early would advertise routes the API does not serve yet. The implementation plan owns when each folder is created.

Each feature uses the same shape. Research is the template:

```text
features/research/
  research.routes.ts
  research-api.service.ts
  research.store.ts
  pages/research-page/
  components/research-list/
  components/research-details/
  components/research-findings/
  components/research-status/
  *.spec.ts
```

`research-page` orchestrates the route. `research-list`, `research-details`, `research-findings`, and `research-status` present. `research-api.service.ts` performs HTTP and maps wire types to view models. `research.store.ts` holds the signals for that screen. `research.routes.ts` is what `loadChildren` loads. Tests sit next to the behavior they lock: polling, status display, and the finding layout.

The same split applies to the other first-slice features. The questionnaire feature adds a reactive form on its page. The dashboard feature is the home inside the shell, not a second application.

## Components, change detection, and services

Components use `ChangeDetectionStrategy.OnPush`. A component presents and orchestrates. It reads a store or a signal, binds a form, and calls a feature service. Complex logic lives in services: request mapping, poll loops, error normalization, and rules for when a screen may submit.

Client validation exists so the founder gets immediate feedback. Server validation is the source of truth. The client does not re-implement Spring Validation rules as the authority for what may be stored.

Why OnPush: the research screen polls every two seconds. Default change detection would recheck the whole application on each tick and on every unrelated signal write. OnPush, with signals and the `async` pipe, refreshes the view that actually changed. Why the split: a component that both renders and owns HTTP is hard to test and tends to grow a second copy of the API types. Why validation stops at UX: a founder should see a missing answer before submit, and a failed submit must show the server's field errors. Duplicating the server's rules in TypeScript would drift the moment the questionnaire template or a DTO constraint changes. The stored answer snapshot is whatever the API accepts.

## State

Local and feature UI state uses signals. Derived state uses `computed()`. HTTP, cancellation, and multi-step composition use RxJS. Components consume streams with `toSignal` or the `async` pipe. Manual subscriptions are avoided.

A feature store is a small injectable: `signal()` for loading, error, and the current view model; `computed()` for flags such as "poll in progress" or "submit disabled". It is not a global store and it is not shared across features.

Why signals for UI state: loading flags, the selected row, and the last job status are synchronous values the template reads. `computed()` keeps a derived flag tied to those values so a component does not recompute them in ways that disagree. Why RxJS stays on the wire: `HttpClient` is observable, a poll loop needs `switchMap` and a timer, and leaving a route must cancel the in-flight request. Why `toSignal` and the `async` pipe: they bind the subscription to the component or injector lifetime. A hand-written `subscribe` on a two-second poll survives navigation and keeps calling the API after the founder has left the page.

## HTTP types

Generated OpenAPI types live in `frontend/src/app/core/api/generated`. The generator is the only writer of that directory. Feature services map those types into view models. Templates bind to view models.

Java DTOs are not hand-copied into TypeScript.

Why generation: [API_CONTRACTS.md](../api/API_CONTRACTS.md) and the published OpenAPI document are the contract. A hand-copied interface will miss a rename or a new `verification_status` value, and the template will still compile. Regeneration makes that drift a build failure. Why a view model on top: wire JSON uses the API's field names and nullability, which change as the contract moves. A view model gives the template a stable shape and a place to keep presentation decisions, including which finding text is fact and which is interpretation. The mapping is the only place that knows both names.

## Session, CSRF, and the guard

The session cookie is `HttpOnly`, `Secure`, and `SameSite=Lax`. JavaScript cannot read it. The client does not store an access token in `localStorage`, `sessionStorage`, or a cookie it can read.

The CSRF cookie is named `XSRF-TOKEN`. JavaScript can read it. It is not an access token. `provideHttpClient` uses `withXsrfConfiguration` so Angular copies that cookie into the `X-XSRF-TOKEN` request header. The HTTP client sends credentials so the browser attaches the session cookie.

```typescript
provideHttpClient(
  withXsrfConfiguration({
    cookieName: 'XSRF-TOKEN',
    headerName: 'X-XSRF-TOKEN',
  }),
  withInterceptors([sessionInterceptor]),
);
```

The interceptor sets `withCredentials: true` on API calls. On a 401 response it sends the founder to login. A 403 is an authorization failure on a session that may still be valid; the screen shows that error and does not pretend the founder is logged out.

`authGuard` calls `GET /api/v1/session` before activating a protected route. A failed session check routes to login. The guard is a UX check. Spring Security is the authority on every API request. Hiding a route in Angular does not grant access.

Login itself is Spring Security's Google session flow. The Angular app does not run OAuth and does not hold Google tokens. After the browser returns from Google, the session cookie is what later API calls present.

Why the session cookie is `HttpOnly`: script that runs in the page cannot exfiltrate it. A token in `localStorage` is readable by any script on the origin, which is the wrong place for the credential that authorizes research jobs and founder data. Why `Secure`: the cookie is only sent on HTTPS, which is how the deployed proxy is served. Why `SameSite=Lax`: a cross-site POST will not include the session cookie, and a top-level return from the Google login redirect still will.

Why the CSRF cookie is readable: the browser must let the client copy it into `X-XSRF-TOKEN`. That is the cookie-to-header check Spring Security expects, and it is what `withXsrfConfiguration` does. The CSRF value does not authenticate the founder. The session cookie does. Naming both values in one place keeps the Angular configuration matched to the server. Treating the CSRF cookie as a bearer token would invert that split.

Why the guard calls `GET /api/v1/session`: the session cookie is invisible to JavaScript, so the client cannot decide authentication by inspecting storage. The session endpoint is the readable fact. Why the guard is still only UX: anyone can navigate around a client route. Spring Security rejects the API call. The guard exists so an anonymous founder sees login instead of an empty shell full of failed requests. Why 401 goes to login: the session is gone or was never there, and there is no refresh token to exchange. Why credentials are sent explicitly: the session cookie has to be attached to `HttpClient` calls, including the session check and the poll.

## Same-origin deployment

The Compose reverse proxy serves the Angular app and `/api` on one origin. The browser treats the session cookie and the CSRF cookie as first-party.

Why: `SameSite=Lax` and current browser rules drop or restrict cookies on a cross-site API. A dev setup that puts Angular on one port and Spring on another, and then calls the API by absolute URL, would break login even if every header were correct. Relative `/api/v1` URLs keep the client correct when the proxy is the only host the browser sees.

## Layout

`frontend/src/app/layout` is a responsive dashboard shell: navigation, a content outlet, and a session-aware header. `app.routes.ts` mounts feature routes inside that shell. The shell's links are the first-slice features only.

Why a shell: founders move from questionnaire to alignment to research on the same session, on small and large screens. One layout keeps that path in one navigation model. Why it is responsive: review happens on different devices, and the finding fields still have to stay visually separate when the width changes. The shell is a layout, not a feature store. Feature state stays in the feature that owns the screen.

## Questionnaire

The questionnaire uses reactive forms. Each field has validation, an accessible label, and an error association. The page shows loading and submission feedback. Unsaved answers stay in the form state until submit succeeds.

The form is the draft. A failed submit leaves every answer in place and surfaces the server's error. A successful submit is what clears or replaces that draft with the server's stored questionnaire. The client does not keep a second copy of the draft in `localStorage`.

Why reactive forms: the questionnaire is a set of answers with per-field validity, dirty state, and a single submit. `FormGroup` is that model. Copying the same answers into signals would create two drafts that can disagree. Why the values survive a failed submit: a 400 or a network error must not wipe a long set of answers. Why not `localStorage`: the stored questionnaire, including the template version and the answer snapshot, is server state. A browser draft would be a second source of truth and another place a future change might put a credential. Why accessible labels: this is the main data-entry screen. An error that is only a red border is invisible to a founder using a screen reader, so each control has a label and its error is associated with the control.

Client checks cover empty required answers and obvious format so the founder gets feedback before the round trip. The API decides whether the submission is stored.

## Research

Starting research is asynchronous.

1. The client sends `POST /api/v1/directions/{id}/research`.
2. A 202 response means a job was accepted. The body carries the job id defined in the API contract.
3. While `GET /api/v1/research-jobs/{id}` reports `PENDING` or `RUNNING`, the client polls that endpoint every 2 seconds.
4. Any other status stops the poll. The page then shows findings.

The poll is an RxJS `timer` composed with `switchMap` onto the job GET. `toSignal` (or the `async` pipe) keeps it tied to the page. Destroying the page or starting a new job cancels the previous loop. The status component shows the job state. It does not render findings as if they were finished while the job is still `PENDING` or `RUNNING`.

The POST sends the `Idempotency-Key` header required by [API_CONTRACTS.md](../api/API_CONTRACTS.md). A double click reuses the same key so the server can return the existing job.

Findings render these fields as separate regions, with separate headings and styles:

- `factual_summary`
- `supporting_evidence`
- `ai_interpretation`
- `unknowns`
- `verification_status`

`verification_status` is the review state from the API. The UI does not replace it with a model confidence score.

Census establishment counts are market-structure facts from County Business Patterns. They are not proof of customer pain. The findings view does not label those counts as demand, pain, or validation. Limits of the source stay visible in `unknowns`, and `ai_interpretation` stays visually distinct from `factual_summary` so a narrative cannot be read as a Census result.

Why poll: the server accepts the job and returns 202 because Census retrieval and the model run after the response. The page cannot hold one HTTP call open until that work finishes. WebSockets, server-sent events, and a message bus are out of the first milestone; a cancellable two-second poll matches a job whose status changes slowly and keeps the client on the same HTTP stack as every other call. Why stop outside `PENDING` and `RUNNING`: a finished or failed job that is still polled hides the outcome and keeps hitting the API. Why the five fields stay distinct: founders have to tell a retrieved fact from the model's interpretation and from what nobody has established yet. If those strings share one visual treatment, an interpretation will be used as evidence. County Business Patterns counts establishments by industry and geography. A count can inform how large a market's structure looks. It does not show that a buyer has the problem under study. Showing that limit in `unknowns`, rather than in a tooltip on a confident summary, is what keeps the screen honest. `verification_status` stays a human review state so a model score cannot be mistaken for a founder decision.

## Tests

Each feature carries tests for the behavior that is easy to break and expensive to misread:

- the session guard routes to login when `GET /api/v1/session` fails, and it allows the route when the session succeeds
- API calls send credentials and the CSRF header, and a 401 leaves the current flow for login
- a failed questionnaire submit keeps the entered answers and shows the error
- the research poll runs every 2 seconds for `PENDING` and `RUNNING`, then stops
- findings render `factual_summary`, `supporting_evidence`, `ai_interpretation`, `unknowns`, and `verification_status` as distinct regions

Tests use fixtures. They do not call Census or a paid model. Those boundaries are server concerns.

Why the tests live in the feature: the poll interval, the form draft, and the finding layout are product behavior, not an afterthought in a single end-to-end script. A unit test can force a 202, emit `RUNNING` then a terminal status, and assert the poll stopped. That is the check that a later refactor did not start treating establishment counts as customer pain or collapse interpretation into the factual summary.

## What this client does not do

The browser does not call Census or the model, and it never sees those credentials. It does not decide authorization. It does not invent a research source. It does not ship phase 6 screens early. It does not keep access tokens in web storage.

Those limits are what make the session cookie, the generated types, and the finding layout sufficient for the first slice.
