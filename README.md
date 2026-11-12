# Founders

Founders helps a small set of founders turn a questionnaire into a shared alignment, a research direction, and a human-reviewed finding grounded in one authorized dataset.

The first source is [US Census County Business Patterns](https://api.census.gov/data/). A finding keeps four fields separate: what the source said (`factual_summary`, `supporting_evidence`), what the model inferred (`ai_interpretation`), and what neither established (`unknowns`). Census establishment counts describe market structure. They do not prove that a customer feels a problem. A founder reviews the finding before anyone records `ADVANCE`.

This is a modular monolith: one Angular app, one Spring Boot API, one PostgreSQL database, and three users.

## Stack

| Piece | Choice |
| --- | --- |
| Frontend | Angular 22.2, standalone components, lazy routes, signals |
| Backend | Java 21, Spring Boot 4.1.2, package `com.founderslab` |
| API docs | springdoc OpenAPI at `/v3/api-docs` |
| Database | PostgreSQL 17, Flyway, UUID primary keys |
| Auth | Google OAuth2/OIDC, Spring Session JDBC, founder email allowlist |
| Session | HttpOnly, Secure, `SameSite=Lax` cookie `FOUNDERSLAB_SESSION` |
| CSRF | Cookie `XSRF-TOKEN`, header `X-XSRF-TOKEN` |
| Local runtime | Docker Compose: PostgreSQL, backend, Angular, Caddy on port 8080 |

Angular talks only to Spring. Controllers delegate to services. Services use repositories. Census and the model are reached only through adapters (`CensusCountyBusinessPatternsAdapter` and `AIProvider`). Keys stay on the server.

## Run locally

You need Git, Java 21, Maven 3, Node.js 22, and Docker with Compose v2. PostgreSQL comes from Compose.

```bash
cp .env.example .env
docker compose up
```

Open [http://localhost:8080](http://localhost:8080). Caddy serves the Angular app and `/api` on one origin so the session cookie stays first-party.

Fill these in `.env` before a real Google login. Leave them empty for tests. Never commit `.env`.

| Name | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth client id. Server-side. |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret. Server-side. |
| `FOUNDER_EMAIL_ALLOWLIST` | Comma-separated founder Google emails. A Google account that is not on this list gets 403. |
| `AI_API_KEY` | Model provider credential. Server-side. |
| `AI_MODEL` | Model name. Server-side. |
| `CENSUS_API_KEY` | Census API key. Server-side. |
| `POSTGRES_DB` | Database name. Default `founderslab`. |
| `POSTGRES_USER` | Database user. Default `founderslab`. |
| `POSTGRES_PASSWORD` | Database password. |
| `DATABASE_URL` | JDBC URL. Compose overrides this to the `postgres` service. |
| `COOKIE_SECURE` | Set `false` for plain HTTP on localhost. Compose defaults it to `false`. |

The Google authorized redirect URI is the app origin plus `/login/oauth2/code/google`.

## Tests

CI runs both suites on push and pull request. Tests use fixtures. They do not call Google, live Census, or a paid model.

```bash
# backend (from backend/)
mvn -B test

# frontend (from frontend/)
npm ci
npm test -- --no-watch --no-progress
```

## Layout

```text
frontend/     Angular app
backend/      Spring Boot app and Flyway migrations
deploy/       Caddyfile for the same-origin proxy
docs/         Design set (architecture, API, research, workflow)
```

The first working path is questionnaire submit, alignment by at least two founders, a research direction, a Census-backed finding, and a dashboard review. Opportunity, product, and decision behavior comes after that path has been used. See [docs/development/IMPLEMENTATION_PLAN.md](docs/development/IMPLEMENTATION_PLAN.md).

## Docs

| Document | What it covers |
| --- | --- |
| [Target architecture](docs/architecture/TARGET_ARCHITECTURE.md) | Layers, packages, research job flow, security |
| [Architecture decisions](docs/architecture/ARCHITECTURE_DECISIONS.md) | Stack and security choices |
| [Database design](docs/architecture/DATABASE_DESIGN.md) | Tables, keys, locking |
| [Frontend architecture](docs/architecture/FRONTEND_ARCHITECTURE.md) | Routes, guards, generated client |
| [API contracts](docs/api/API_CONTRACTS.md) | HTTP contract. Change this before either side invents a field. |
| [Research pipeline](docs/ai/RESEARCH_PIPELINE.md) | Retrieval, prompts, evidence fields |
| [Evaluation criteria](docs/ai/EVALUATION_CRITERIA.md) | Bar before `ADVANCE` |
| [Implementation plan](docs/development/IMPLEMENTATION_PLAN.md) | Phases and acceptance |
| [Team workflow](docs/development/TEAM_WORKFLOW.md) | Who owns what |
| [Setup](docs/development/SETUP.md) | Tool versions and environment names |
| [Current state](docs/architecture/CURRENT_STATE.md) | Starting audit. Written before this code existed. |

## Ownership

| Person | Owns |
| --- | --- |
| Nick | Backend, schema, security, jobs, Census, OpenAPI, CI |
| Paul | Questionnaire content, alignment, dashboard review, explanation quality |
| Zach | Evidence bar and evaluation criteria |
