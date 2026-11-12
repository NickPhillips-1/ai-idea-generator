# Current state

Audit of `/Users/nick/Desktop/git/ai-idea-generator` on 11 November 2026, before implementation. The sections below are that audit. The application now lives in this repository: a Spring Boot API, an Angular app, Flyway migrations, and CI.

Related documents:

- [TARGET_ARCHITECTURE.md](TARGET_ARCHITECTURE.md)
- [DATABASE_DESIGN.md](DATABASE_DESIGN.md)
- [FRONTEND_ARCHITECTURE.md](FRONTEND_ARCHITECTURE.md)
- [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md)
- [IMPLEMENTATION_PLAN.md](../development/IMPLEMENTATION_PLAN.md)
- [API_CONTRACTS.md](../api/API_CONTRACTS.md)

## Current architecture

There is no application architecture because there is no application.

Evidence from the audit:

- `ls` of the repo root shows only `.` and `..`.
- `find` returned 0 files.
- `git status` fails: not a git repository.
- No `package.json`, `pom.xml`, `angular.json`, `docker-compose`, `.github` workflows, `.env`, migrations, or tests.

The working tree is therefore an empty directory. There is no process boundary, no module layout, no build, and no runtime.

Other folders on the same machine are out of scope:

- `/Users/nick/Desktop/git/news-rater` is a different product (Angular + Spring, package `com.newsrater`, H2). It must not be copied. Its package, database, and features are not this product's baseline.
- `RE-Booking` and `no-more-brainrot` are also present on disk and are out of scope.

The wrong-folder risk is closed. The user confirmed this folder is the project.

## Existing functionality

There is no existing functionality. There is no UI, API, persistence, authentication, background job, or test suite to inventory.

The spec asked for a phased migration and to preserve Google login and existing features. That request does not apply. A migration preserves behavior that already runs. This directory has never run anything: no source, no deployed service, and no user data. There is nothing to preserve.

Phases 2 and 3 therefore create the stacks rather than port a legacy app. They introduce Angular and Spring Boot into an empty tree. They do not translate screens, endpoints, or schema from a predecessor, and they do not import `com.newsrater` or the H2 database from news-rater.

## Database structure

There is no database structure.

No database server is configured for this repo. No schema, migration directory, entity model, or seed data exists. No production data exists, so no destructive migration exists either. Nothing has to be backed up, transformed, or cut over before new tables are introduced.

Decided for the future, and not present today: PostgreSQL, Flyway, and UUID primary keys. Those choices are recorded so later design does not invent a second store or integer keys by default. They are not tables, scripts, or a running instance.

## Authentication flow

There is no authentication flow.

No login route, session store, OAuth client, cookie, CSRF filter, or user table exists. Google credentials do not exist yet. An allowlist cannot be enforced because there is no process that reads one. Nothing exists to migrate: there is no prior session format, password hash, or identity provider configuration to carry forward.

Decided for the future, and not present today:

- Google OAuth2/OIDC.
- An HttpOnly, Secure, `SameSite=Lax` session cookie.
- CSRF cookie `XSRF-TOKEN` and header `X-XSRF-TOKEN`.
- Allowlist `FOUNDER_EMAIL_ALLOWLIST`.
- Spring Security and Spring Session JDBC on the backend.

The session cookie is HttpOnly so browser script cannot read it. `SameSite=Lax` is the default cross-site policy for a first-party login redirect back from Google. The CSRF cookie is readable by the Angular client so it can echo the token in `X-XSRF-TOKEN`; the session cookie stays HttpOnly. The allowlist exists so possession of a Google account is not enough to enter the product. None of that wiring is in the tree today.

## External integrations

There are no external integrations.

No HTTP client, adapter, API key, or outbound call exists. No `.env` file is present, so no secret is stored in the repo and none should be invented here.

Decided for the future, and not present today: the first research adapter is `CensusCountyBusinessPatternsAdapter`, for US Census County Business Patterns at `https://api.census.gov/data/`. The key belongs in the environment variable `CENSUS_API_KEY`. The adapter name is a contract for later code; the class is not in this repository.

Census County Business Patterns can describe establishment counts. It does not, by itself, prove that a founder’s customer feels a problem. That limit is a product risk, not a reason to call the adapter implemented.

Spring AI 2.0.2 is the decided model-integration library (not 2.1 RCs). It is not on the classpath, because there is no classpath.

## Technical risks

| Risk | Status | Why it matters |
| --- | --- | --- |
| Wrong folder | Closed | The user confirmed `/Users/nick/Desktop/git/ai-idea-generator` is the project. news-rater, RE-Booking, and no-more-brainrot stay out of scope and must not be used as a source tree to copy. |
| No version control yet | Open | `git status` fails because this directory is not a git repository. Without history, later edits have no baseline, no review diff, and no remote backup. |
| No contracts | Open | [API_CONTRACTS.md](../api/API_CONTRACTS.md) is the place those contracts belong. They are not implemented, and this empty tree has no OpenAPI document, DTO, or consumer test that could drift from a spec. Building UI and server against unstated payloads will fork the two stacks. |
| Google credentials do not exist yet | Open | OAuth cannot be exercised until a Google client id and secret exist outside the repo. The allowlist `FOUNDER_EMAIL_ALLOWLIST` is also unset. Documenting the cookie and CSRF names does not create a login. |
| Census data does not prove customer pain | Open | County Business Patterns is a public industry census. Using `CensusCountyBusinessPatternsAdapter` as the first research adapter can ground market structure. It cannot show that a specific buyer has the problem the product claims to solve. Treating census rows as validation would overstate evidence. |

## Reusable components

None in this repo.

There is no component, service, entity, migration, workflow, or config to lift. Reuse has to wait until this repository contains code worth reusing.

news-rater is not a component library for this product. Its Angular app, Spring code, package `com.newsrater`, and H2 database belong to a different system. Copying them would import the wrong domain and the wrong database.

## Frontend migration considerations

The frontend is greenfield Angular, not a rewrite.

A rewrite implies an existing client whose routes, components, and state must be replaced while behavior stays the same. This repo has no `package.json`, no `angular.json`, and no templates. There is no router tree to map, no NgRx store to unwind, and no screen to preserve.

Decided for the future, and not present today:

- Angular 22.2.x, with stable 22.2.5 as of 6 Nov 2026.
- Strict TypeScript.
- Standalone components.
- Lazy routes.
- Signals.
- RxJS.
- `HttpClient`.
- Reactive forms.
- `OnPush` change detection.
- No NgRx.
- No React.

Standalone components and lazy routes are the starting structure because there is no `NgModule` graph to keep. Signals are the decided local state model, with RxJS kept for streams such as HTTP. `OnPush` is the default change-detection policy so new components do not rely on broad default checking. NgRx is excluded because this product does not start with a global store to maintain. React is excluded because the client stack is Angular.

The Angular client will call the Spring API with `HttpClient`, send `X-XSRF-TOKEN` from the `XSRF-TOKEN` cookie, and rely on the HttpOnly session cookie rather than storing an access token in script-readable storage. That client does not exist yet. Details belong in [FRONTEND_ARCHITECTURE.md](FRONTEND_ARCHITECTURE.md).

## Backend migration considerations

The backend is greenfield Spring Boot, not a port.

There is no `pom.xml`, no `com.founderslab` source tree, and no running JVM service. Spring Web MVC, Security, Data JPA, Validation, Spring Session JDBC, and springdoc OpenAPI are selected libraries, not dependencies already declared. Maven is the decided build tool and is not installed into this directory by this audit.

Decided for the future, and not present today:

- Java 21.
- Spring Boot 4.1.2.
- Spring Web MVC, Spring Security, Spring Data JPA, Validation, Spring Session JDBC, and springdoc OpenAPI.
- Maven.
- Base package `com.founderslab`.
- Spring AI 2.0.2, not 2.1 RCs.
- PostgreSQL via Flyway, with UUID primary keys.
- Google OAuth2/OIDC, the session cookie, the CSRF cookie and header, and `FOUNDER_EMAIL_ALLOWLIST`, as described under Authentication flow.
- `CensusCountyBusinessPatternsAdapter` as the first research adapter, with `CENSUS_API_KEY`.

Phase 2 and phase 3 create this backend. They do not lift controllers or repositories from news-rater, and they do not point JPA at that product’s H2 database. `com.founderslab` is a new package because `com.newsrater` names a different product.

Spring Session JDBC is the decided session store so the session survives more than one application process once PostgreSQL exists. Flyway is the decided schema history because the database starts empty and should gain versioned migrations rather than an implicit Hibernate export. UUID primary keys avoid guessing at a sequence that was never created. springdoc OpenAPI is how the server will publish the contracts that do not exist yet.

No production data means the first Flyway migration is an initial schema, not a destructive change against live rows. Until that migration and the Spring Boot application are actually added, this repository still has no backend.
