# Founders feature map

Drive one feature with Playwright. Titles are `feature: <name>`.

| Feature | Test | Proves |
| --- | --- | --- |
| [login](login.md) | `feature: login` | An anonymous visit to `/dashboard` stops at login, then Ada is signed in. |
| [questionnaires](questionnaires.md) | `feature: questionnaires` | Ada submits answers and sees the saved questionnaire. |
| [alignments](alignments.md) | `feature: alignments` | Ada and Grace submit questionnaires and Ada generates an alignment. |
| [research](research.md) | `feature: research` | A saved direction produces a fixture Census finding and the dashboard shows it. |
| [opportunities](opportunities.md) | `feature: opportunities` | A finding can be saved as an opportunity and marked ADVANCE without changing status. |

Shared gotchas: sign-in is `POST /e2e/login` after reading the `XSRF-TOKEN` cookie. Direction, job, and opportunity ids live in `sessionStorage` (`founderslab.directionId`, `founderslab.jobId`, `founderslab.opportunityId` in `frontend/src/app/core/research/path-state.ts`). A new browser context does not see another founder's ids. Alignment needs two founders. Research text comes from fixtures, not live Census.
