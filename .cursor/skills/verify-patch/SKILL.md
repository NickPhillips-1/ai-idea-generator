---
name: verify-patch
description: >-
  Independently verify a Founders change and post PASS, PASS+NOTES, or FAIL
  with the git patch-id. Use when a PR needs a fresh runtime check. The author
  of the change does not run this.
---

# Verify a patch

You are not the author. If this chat wrote the diff, stop and ask for a fresh agent.

1. The worktree is clean (`git status --porcelain` is empty). A dirty tree is not the patch under verdict. Stop.
2. Name the base. For a PR, use the PR base branch. The patch-id is:

```bash
sh e2e/scripts/patch-id.sh <base>
```

That is `git diff <base>...HEAD | git patch-id --stable`, first field.

3. If the change is a bug fix, reproduce it on the base first. Say what failed there.
4. Drive the mapped screen with [verify-founders](../verify-founders/SKILL.md). One feature is enough. Name which one.
5. If the diff touches `ResearchService`, `ResearchWorker`, `ResearchJob`, or `poll-status.ts`, also run [verify-research-job](../verify-research-job/SKILL.md). A green formal run still includes the cancel-vs-publish finding. `PASS+NOTES` when that finding is unchanged and the new change does not depend on it being fixed. `FAIL` when the change makes that finding worse or breaks another invariant.
6. Verdict is one of `PASS`, `PASS+NOTES`, or `FAIL`.
7. Post it with `gh pr comment` when a PR number exists. The body is:

```
Verdict: PASS
patch-id: <id>
feature: research
```

Replace the verdict, the id, and the feature. Add a short note under `PASS+NOTES` or `FAIL`.

If `gh pr view` fails, print that body and stop. Do not open a PR and do not merge.

A later rebase that changes the patch-id makes this comment stale. `founders-shipping` treats a mismatch as no verdict.
