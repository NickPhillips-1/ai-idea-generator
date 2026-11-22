# Founders agent guide

Founders is an Angular 22 app, a Spring Boot API (`com.founderslab`), and Playwright. It is not Electron. Prefer the live tree and [README.md](README.md). [docs/architecture/CURRENT_STATE.md](docs/architecture/CURRENT_STATE.md) is the empty-repo audit from 11 November 2026.

## Where code belongs

| Path | Belongs here |
| --- | --- |
| `frontend/src/app/features/` | One screen. HTTP goes through `LabApi` or `SessionApi` in `core/api/`. Job polling goes through `pollJob` in `core/research/poll-job.ts`. A feature may import `findings/finding-review` and no other feature. |
| `frontend/src/app/core/` | Session, generated API types, guards, interceptors, research polling. |
| `backend/src/main/java/com/founderslab/<feature>/` | That feature. Controllers do not import `integration.sources` or `integration.ai`. Jobs call `ResearchSourceAdapter`, not `CensusCountyBusinessPatternsAdapter`. |
| `e2e/` | Playwright. Click by accessible name. |
| `docs/api/API_CONTRACTS.md` | The HTTP contract. Change it before adding a field. |

## Finish a change

- Backend: `cd backend && mvn -B test`
- Frontend tests: `cd frontend && npm test -- --no-watch --no-progress`
- Frontend lint: `cd frontend && npx ng lint`
- UI behavior: drive the mapped feature with [.cursor/skills/verify-founders/SKILL.md](.cursor/skills/verify-founders/SKILL.md). A unit test is not a substitute.

A bug fix names the check that fails on the parent and passes on the change.

## Contract and secrets

Regenerate `frontend/src/app/core/api/generated/schema.ts` with `npm run generate:api` from `frontend/` while the API is serving `/v3/api-docs`. Do not hand-edit that file and do not hand-copy DTOs.

Secrets stay in the environment. Tests and Playwright use fixtures (`FOUNDERSLAB_E2E_FIXTURES=true`). Do not call live Census or a paid model. Verification signs in with `POST /e2e/login` when `FOUNDERSLAB_E2E_LOGIN=true`. It does not complete Google OAuth.

## pstack

Install the Cursor plugin with `/add-plugin pstack`, then run `/setup-pstack` once to pin model roles. Those commands are Cursor UI. This repo does not vendor the plugin.

- `/poteto-mode` for non-trivial work
- `/correct` when the same mistake shows up twice. Prefer a lint or a test over another paragraph here.
- `/reflect` when the lesson is about workflow, not a check the compiler can enforce
- `/maintain-verification-skill` when the feature map drifts

## What a check enforces

| Rule | Enforced by |
| --- | --- |
| Feature code does not import `HttpClient`, `timer`, or another feature (except `findings/finding-review`) | `npx ng lint` |
| Controllers do not import Census or AI packages; jobs do not import `CensusCountyBusinessPatternsAdapter`; Java does not depend on the Angular app | `mvn -B test` (ArchUnit) |
| A mapped screen works for a founder | `.cursor/skills/verify-founders` |
