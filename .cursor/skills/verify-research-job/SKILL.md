---
name: verify-research-job
description: >-
  Re-check the research job model and the retry table when a diff touches
  ResearchService, ResearchWorker, ResearchJob, or poll-status.ts. Use for a
  race, a retry, or a poll-stop change.
---

# Verify the research job

The check is `sh backend/formal/check.sh` from the repo root. It needs Java 21 and `lake` on `PATH` (`elan`, toolchain `leanprover/lean4:v4.14.0`). TLC is tla2tools 1.7.4, downloaded by `backend/formal/check-tla.sh`.

A green run means the safety invariants hold and TLC still prints a counterexample for `CancelDoesNotPublish`. That counterexample is a known finding. It is not a pass on the race. Read it with `/statechart`. Do not copy `/statechart` commands into this skill.

If the script says `CancelDoesNotPublish` held, stop. The model and this finding have drifted. Re-read `ResearchWorker.execute` before editing either one.

When the diff touches `frontend/src/app/core/research/poll-status.ts`, also run:

```bash
cd frontend && npm test -- --no-watch --no-progress
```

## What is proved

One direction, two idempotency keys (`k1`, `k2`), two workers (`w1`, `w2`), at most three attempts. Census payloads, model text, and cost-cap dollars are out of the model.

Each TLC step is one transaction: `ResearchService.start`, `ResearchWorker.claim`, the RUNNING read at the start of `ResearchWorker.execute`, the later write in that method, or a cancel.

- The same direction and the same idempotency key are one job.
- A direction never has two `RUNNING` jobs. `Claim` refuses a second claim while one job is `RUNNING`. Deleting the `CLAIM_ONE_RUNNING` conjunct in `Claim` is the mutation that lets TLC violate this.
- A job whose status is `CANCELLED` is not claimed. Its attempt count stays put while it stays `CANCELLED`.
- Two workers do not claim the same job.
- `FAILED` and `CANCELLED` are different statuses. The failure write stores `FAILED` or `PENDING`, never `CANCELLED`.
- `attempt_count` increases at claim. The third failed attempt is terminal `FAILED`.

The Lean file `backend/formal/retry/Founders.lean` proves that pure table: a failed attempt at count 3 or more is `failed`, a lower count is `pending`, and `succeeded`, `failed`, and `cancelled` have no retry edge. It does not prove the Java bytecode. `RetryTableTest` runs `ResearchWorker.execute` for attempts 1, 2, and 3 and checks claim ignores `SUCCEEDED`, `FAILED`, and `CANCELLED`.

The fast-check property in `poll-status.property.spec.ts` says `shouldPoll` is true only for `PENDING` and `RUNNING`.

## Known finding

Cancel during an attempt that has already passed the `RUNNING` check still publishes a finding and ends `SUCCEEDED`.

TLC's shortest path: start `k1`, claim it, pass the `RUNNING` check, cancel, then `FinishSuccess`. The finding is published and the status is `SUCCEEDED`.

`ResearchWorker.execute` returns immediately when the status is not `RUNNING`, then inserts the finding and sets `SUCCEEDED` with no second read. The pipeline doc says that second read keeps a cancelled attempt from publishing. This slice does not change the worker. Do not weaken `CancelDoesNotPublish` so the model passes.

## Coverage

Confirmed against `9e8467ce9a382dfcdcc2d694d2523245f5d85e72`, where the Java below already had this shape.

- `backend/src/main/java/com/founderslab/research/ResearchService.java` `start`
- `backend/src/main/java/com/founderslab/jobs/ResearchWorker.java` `claim`, `execute`
- `backend/src/main/java/com/founderslab/research/ResearchJob.java` status and `attemptCount`
- `frontend/src/app/core/research/poll-status.ts` `shouldPoll`
- `backend/formal/ResearchJob.tla`
- `backend/formal/retry/Founders.lean`

Move that commit forward only after you re-read those methods and the model still describes them. Use `/maintain-formal-verification-skill` when the code moved and this check was not re-run.
