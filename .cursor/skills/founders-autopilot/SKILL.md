---
name: founders-autopilot
description: >-
  Prepare or land Founders pull requests with one owner each. stack leaves
  merge to a human. full merges only after founders-shipping passes.
---

# Autopilot

Pick one mode and say which one you are in.

## stack

Prepare pull requests for a human to land. One owner per PR. Use a separate git worktree per PR. Set `COMPOSE_PROJECT_NAME`, `FOUNDERS_HTTP_PORT`, and `POSTGRES_HOST_PORT` so two stacks do not share 8080 or 5433. Stack a PR on another only when the second needs the first. Run `verify-patch`. Do not merge.

## full

Merge only after [.cursor/skills/founders-shipping/SKILL.md](../founders-shipping/SKILL.md) passes for that head. Do not turn this mode on for a real PR unless the operator named `full`.

## Wake-ups and the trail

Use `/loop` to recheck CI and the verdict. This skill does not sleep on its own. Record decisions with `/show-me-your-work` so the operator can commit the trail.
