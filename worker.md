# Founders worker

Read [AGENTS.md](AGENTS.md) before editing. This file is the extra rule for a delegate.

- One owner per PR. Open a stacked PR only when it needs the parent PR.
- Tests and Playwright use fixtures: `FOUNDERSLAB_E2E_FIXTURES=true` and `FOUNDERSLAB_E2E_LOGIN=true`. Do not call live Census or a paid model.
- Do not hand-edit `frontend/src/app/core/api/generated/schema.ts`.
- Do not start a second Compose project on port 8080 or Postgres host port 5433. Another worktree sets `COMPOSE_PROJECT_NAME`, `FOUNDERS_HTTP_PORT`, `POSTGRES_HOST_PORT`, and `PLAYWRIGHT_BASE_URL`, then uses `e2e/scripts/launch.sh`. Cleanup that same project name.
- UI proof is [.cursor/skills/verify-founders/SKILL.md](.cursor/skills/verify-founders/SKILL.md). Research-job proof is [.cursor/skills/verify-research-job/SKILL.md](.cursor/skills/verify-research-job/SKILL.md).
- Model roles stay in `/setup-pstack`. Do not pick a different model map here.
