# Development setup

Local setup for the Founders tree. Backend tests use Testcontainers and do not need a host database. Playwright needs PostgreSQL, the API, and the Angular dev server, with fixture adapters instead of live Census or a paid model.

Java 21 is required. On this machine Maven may pick up a newer JDK unless `JAVA_HOME` points at a Java 21 home. Angular 22 needs Node 22, 24, or 26. A host Node 23 install cannot run the frontend toolchain.

Decisions and contracts live in:

- [Current state](../architecture/CURRENT_STATE.md)
- [Architecture decisions](../architecture/ARCHITECTURE_DECISIONS.md)
- [Implementation plan](IMPLEMENTATION_PLAN.md)
- [API contracts](../api/API_CONTRACTS.md)

## What to install

Check each tool with the version command. Install only what is missing.

| Tool | Target | Check |
| --- | --- | --- |
| Git | Any current Git | `git --version` |
| Java | 21 | `java -version` |
| Maven | A current Maven 3 that can build Java 21 | `mvn -version` |
| Node.js | Node 22 LTS or newer (compatible with Angular 22.2.x) | `node -v` |
| Angular CLI | A CLI release matching Angular 22.2.x | `ng version` |
| Docker | Docker Engine with Compose v2 | `docker compose version` |

PostgreSQL is not a required install on the host. Compose will provide it once `docker-compose.yml` exists.

### Git

This folder is not a repository yet. The first implementation step is:

```bash
git init
```

Run that in `/Users/nick/Desktop/git/ai-idea-generator`. This guide does not run it.

### Java 21

Install a Java 21 JDK (Temurin or another current distribution). `java -version` should report 21. From `backend/`:

```bash
mvn test
```

### Maven

Install Maven on the machine. The backend is a Maven project in `backend/` and uses the `mvn` on your path. There is no Maven Wrapper.

### Node.js and the Angular CLI

Install Node 22 LTS, Node 24, or Node 26. Angular 22.2 rejects Node 23. From `frontend/`:

```bash
npm install
npx ng test --watch=false
npx ng serve
```

`ng serve` proxies `/api`, `/e2e`, `/oauth2`, `/login`, and `/logout` to `http://localhost:8080`.

### Docker Compose v2

Install Docker, including Compose v2. `docker compose version` should succeed. The legacy `docker-compose` binary is not the target.

No host PostgreSQL service is required. The database will come from Compose.

## Environment variables

`.env.example` lists the names. Copy it to `.env` and fill in local values:

```bash
cp .env.example .env
```

Never commit `.env`. Never put these values in Angular environment files. The exception is non-secret public config, such as the API origin when the app is same-origin and the client can use a relative URL.

Names only. Leave the values empty until you have real credentials outside this repository. This document does not supply any.

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FOUNDER_EMAIL_ALLOWLIST=
AI_API_KEY=
AI_MODEL=
CENSUS_API_KEY=
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
DATABASE_URL=
```

| Name | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth client id for the Google Cloud client the backend uses at login. Server-side. |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret for that same client. Server-side. |
| `FOUNDER_EMAIL_ALLOWLIST` | Comma-separated founder Google email addresses. A Google login is not enough; the account must be on this list. Server-side. |
| `AI_API_KEY` | Credential for the model provider the backend calls. Server-side. |
| `AI_MODEL` | Model name the backend should use with that provider. Server-side. |
| `CENSUS_API_KEY` | Key for the Census API. Server-side. See below. |
| `POSTGRES_DB` | Database name for the Compose PostgreSQL service. |
| `POSTGRES_USER` | Database user for that service. |
| `POSTGRES_PASSWORD` | Database password for that service. |
| `DATABASE_URL` | JDBC URL the Spring Boot backend uses to reach that database. |

## Google login

Live login needs a Google Cloud OAuth client. Create the client in Google Cloud when you are ready to sign in for real. Set the authorized redirect URI to the app origin plus the Spring Security OAuth2 redirect path. Spring Security's default callback is `/login/oauth2/code/{registrationId}` on that origin. The registration id is `google`. The callback path is `/login/oauth2/code/google`.

Automated tests do not call Google. Until `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` exist, the UI cannot complete a real login. That is expected.

## Census

The first research source is Census County Business Patterns, under `https://api.census.gov/data/`. The backend calls that API with `CENSUS_API_KEY`. The key stays on the server. Do not place it in the Angular app.

## Local processes

`docker-compose.yml` runs PostgreSQL, the backend, the Angular dev server, and Caddy on port 8080. The browser should use that proxy so the session cookie and the API share one origin.

Playwright does not use Google, Census, or a paid model. Start PostgreSQL, then the API with `FOUNDERSLAB_E2E_LOGIN=true`, `FOUNDERSLAB_E2E_FIXTURES=true`, `COOKIE_SECURE=false`, and `FOUNDER_EMAIL_ALLOWLIST=ada@example.com,grace@example.com`. Serve the Angular app and run `npx playwright test` from `e2e/`.

## Commands

### Compose

```bash
docker compose up
```

### Backend tests

From `backend/`:

```bash
mvn test
```

Testcontainers starts PostgreSQL. The suite does not call Census or a model.

### Frontend unit tests

From `frontend/`, on a supported Node version:

```bash
npx ng test --watch=false
```

### Playwright

From `e2e/`, with the API and `ng serve` already running:

```bash
npx playwright test
```
