---
name: founders-shipping
description: >-
  Decide whether a Founders pull request may land. Requires a patch-id verdict
  and green CI. Use when asked to ship or merge a stack.
---

# Ship a Founders change

An approving bot review does not replace the independent verdict.

1. CI jobs `backend`, `frontend`, `e2e`, and `formal` are green on the head.
2. A `verify-patch` comment on the PR says `PASS` or `PASS+NOTES` and includes a `patch-id`. Compute `git diff <base>...HEAD | git patch-id --stable`. If the first field differs from the comment, the verdict is stale. Stop and run `verify-patch` again.
3. For a stack, land bottom-up. Stop at the first PR whose verdict is missing or whose patch-id does not match. Do not merge the ones above it.
4. Merge only when the operator asked, or when `founders-autopilot` is explicitly in `full` mode and this skill's checks passed. Default is not to merge.
5. There is no canary after merge. See [docs/operations/RELEASE_CHECKS.md](../../../docs/operations/RELEASE_CHECKS.md).
