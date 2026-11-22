---
name: verify-founders
description: >-
  Launch Founders with fixture Census and e2e login, drive a mapped screen in
  Playwright by accessible name, and keep traces. Use when changing UI, routes,
  or founder-visible behavior, or when asked to prove a Founders change.
---

# Verify Founders

Founders is the Angular app behind Caddy on port 8080, with the Spring API and Postgres from Docker Compose. Verification uses fixture Census and fixture model output. It signs in with `POST /e2e/login`. It does not complete Google OAuth and it does not call live Census or a paid model.

Launch replaces this Compose project and deletes its database volume. It does not stop other project names. The default origin is `http://127.0.0.1:8080`. A second worktree sets `COMPOSE_PROJECT_NAME`, `FOUNDERS_HTTP_PORT`, and `POSTGRES_HOST_PORT` to values the first stack is not using, and sets `PLAYWRIGHT_BASE_URL` to that HTTP port.

## Launch

From the repo root:

```bash
sh e2e/scripts/launch.sh
```

That sets `FOUNDERSLAB_E2E_LOGIN=true`, `FOUNDERSLAB_E2E_FIXTURES=true`, and `FOUNDER_EMAIL_ALLOWLIST=ada@example.com,grace@example.com`, runs `docker compose down -v`, then `docker compose up --build -d`. The volume reset is required. A leftover questionnaire makes alignment show more than two checkboxes, and the mapped tests expect a fresh database. Launch waits until both of these succeed:

- `curl -sf http://127.0.0.1:8080/v3/api-docs`
- `curl -sf http://127.0.0.1:8080/`

Ready means the Caddy origin serves the Angular app and the API. A database health check is not enough.

## Doctor

```bash
sh e2e/scripts/doctor.sh
```

Doctor is read-only. It checks OpenAPI, the app origin, and that `POST /e2e/login` is not 404. A 404 means this process is the human Google stack. A 403 is expected: the route exists and still requires the CSRF header. Run doctor before driving whenever the app looks wrong.

## Drive

Playwright clicks by accessible name (`getByRole`, `getByLabel`). Do not click by coordinates.

From `e2e/`, with the stack from Launch:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 \
PLAYWRIGHT_TRACE=on \
PLAYWRIGHT_SCREENSHOT=on \
npx playwright test -g "feature: research"
```

Replace `research` with one feature title from the map: `login`, `questionnaires`, `alignments`, `research`, `opportunities`. One feature is enough for a proof. The title must stay `feature: <name>` so the grep does not run the rest of the suite.

Preconditions are inside each test. Do not weaken a test to skip a missing questionnaire, alignment, or finding. If a journey cannot start, the failure reason belongs in that feature's Gotchas.

## Evidence

Proof is the user-visible state after the action, not an HTTP 200. The research proof shows the fixture sentence `County Business Patterns lists 100 establishments.` plus the headings Factual summary, AI interpretation, and Unknowns, and the dashboard no longer says `No research findings yet`.

Artifacts:

- `e2e/test-results/` (trace and screenshot)
- `e2e/playwright-report/` when the HTML reporter writes one

Census and the model stay on the fixture adapters. A passing run that called `api.census.gov` or a paid model is not a proof.

## Cleanup

```bash
sh e2e/scripts/cleanup.sh
```

That runs `docker compose down -v` for this repo only. It does not kill processes by name and it does not delete `e2e/test-results/`. After cleanup, confirm the trace or screenshot is still there.

## Helpers

- `e2e/scripts/launch.sh` starts the fixture stack and waits until the origin is usable.
- `e2e/scripts/doctor.sh` checks that this origin is worth driving.
- `e2e/scripts/cleanup.sh` stops the stack and leaves evidence.

## Feature map

See [features/README.md](features/README.md). When the map drifts, use `/maintain-verification-skill`.
