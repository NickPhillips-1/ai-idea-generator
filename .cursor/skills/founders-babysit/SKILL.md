---
name: founders-babysit
description: >-
  Check Founders CI and review threads for one pull request. Use when asked to
  babysit a PR. Does not merge.
---

# Babysit a Founders pull request

Do not merge.

1. Read the PR with `gh pr view` and `gh pr checks`. The CI jobs that must be green are `backend`, `frontend`, `e2e`, and `formal`. A missing job is a failure, not a skip.
2. Read review threads with `gh api`. For each Bugbot finding, open the cited lines. Keep the finding only when the diff still does the thing it describes. Drop it when the code does not.
3. Stop and tell the operator, instead of pushing a fix, when the diff touches any of these: Google or session auth, CSRF, the session cookie, `CENSUS_API_KEY`, `AI_API_KEY`, the email allowlist, or the research cost cap.
4. Report which of the four jobs are green, which threads are still open, and which bot findings you kept.
