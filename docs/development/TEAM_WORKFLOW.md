# Team workflow

Paul, Nick, and Zach work in parallel after the API contract exists. The contract is the shared surface. Each person owns a stream that can move without the others' internals, and the streams meet in pull requests to `main`.

This repository is not a git repository yet. `git init` is an implementation step in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). This document does not initialize git, create branches, or add GitHub configuration.

## Related documents

- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- [SETUP.md](SETUP.md)
- [API_CONTRACTS.md](../api/API_CONTRACTS.md)
- [ARCHITECTURE_DECISIONS.md](../architecture/ARCHITECTURE_DECISIONS.md)
- [EVALUATION_CRITERIA.md](../ai/EVALUATION_CRITERIA.md)
- [RESEARCH_PIPELINE.md](../ai/RESEARCH_PIPELINE.md)

## Ownership

| Person | Owns                             | Depends on                                           |
| ------ | -------------------------------- | ---------------------------------------------------- |
| Paul   | AI quality                       | Questionnaire and finding fields in the API contract |
| Nick   | Technical, data, and integration | The same contract, published as OpenAPI              |
| Zach   | Market and product intelligence  | His rubric in the evaluation criteria                |

### Paul

Paul owns questionnaire content, alignment acceptance criteria, what a good AI explanation is, and the dashboard review experience.

He does not need Spring internals. His work uses the questionnaire and finding fields in [API_CONTRACTS.md](../api/API_CONTRACTS.md). He can draft that content before the backend exists, using only fields the contract already names.

### Nick

Nick owns the technical, data, and integration work:

- Java 21 and Spring Boot 4.1.2, package `com.founderslab`
- PostgreSQL and Flyway
- REST
- `CensusCountyBusinessPatternsAdapter`
- Security: Google OAuth, an HttpOnly session, and CSRF
- GitHub Actions
- OpenAPI and the Angular/backend contract

He publishes the OpenAPI document. Decisions that fix the stack are in [ARCHITECTURE_DECISIONS.md](../architecture/ARCHITECTURE_DECISIONS.md). Local setup of the runtime is in [SETUP.md](SETUP.md).

### Zach

Zach owns the customer-problem bar, market evidence, competitor analysis, feasibility, pricing, differentiation, and commercial scoring. His rubric is [EVALUATION_CRITERIA.md](../ai/EVALUATION_CRITERIA.md). He can draft those criteria before the backend exists.

Census findings are establishment counts, not demand. Zach's criteria define what remains unproven. Opportunity and product screens are phase 6.

## How the three streams run together

Start from a contract that already names the questionnaire and finding fields. Then:

1. Paul drafts questionnaire content, alignment acceptance criteria, the standard for a good AI explanation, and the dashboard review experience on `paul/questionnaire-content`. He writes against the contract fields. He reviews explanations and the dashboard against criteria a reviewer can apply.
2. Zach drafts the evaluation rubric on `zach/evaluation-criteria`: the customer-problem bar, market evidence, competitor analysis, feasibility, pricing, differentiation, and commercial scoring. He states what County Business Patterns establishment counts can support, and he leaves the rest marked unproven. The research limit is described in [RESEARCH_PIPELINE.md](../ai/RESEARCH_PIPELINE.md).
3. Nick builds the foundation on `nick/backend-foundation`: the Spring Boot application, PostgreSQL and Flyway, REST resources that match the contract, `CensusCountyBusinessPatternsAdapter`, Google OAuth with an HttpOnly session and CSRF, and GitHub Actions. He publishes the OpenAPI document from the contract.

Paul and Zach do not wait for controllers or a running database. Nick does not wait for final questionnaire prose or final scoring copy before the foundation can be reviewed. Each stream opens a pull request when its slice is reviewable.

A missing field stops the stream that needs it. Paul or Zach requests the field. The contract changes in a pull request first. Only after that pull request lands do the backend and the Angular client use the new field. Neither side invents a payload on a side branch and reconciles it later.

## Branches and review

Use short-lived branches and integrate through pull requests into `main`:

- `nick/backend-foundation`
- `paul/questionnaire-content`
- `zach/evaluation-criteria`

Once git exists, nobody commits directly to `main`. Open a pull request, review it, and merge it. Keep branches short. Further work starts from an updated `main`.

Review by stream:

- Paul's pull requests are content and acceptance criteria. Check that every field exists in the contract and that "a good explanation" is concrete enough to accept or reject.
- Zach's pull requests are criteria. Check that Census stays establishment counts and that unproven claims stay unproven.
- Nick's pull requests are the foundation, security, OpenAPI, and CI. Check authorization tests, mocked external calls, a single research adapter, and a generated client that matches the contract in that pull request.

## Contract changes

The shared contract is [API_CONTRACTS.md](../api/API_CONTRACTS.md). Change it in a pull request before either side invents fields.

Nick publishes the OpenAPI document from that contract. The Angular generated client is regenerated in the same pull request that changes the contract. The server, the OpenAPI document, and the generated client land together.

## Authorization

Backend authorization tests are the gate for any UI that looks protected. Angular guards are UX only. A route that hides a screen still needs a server test that rejects an unauthenticated or unauthorized call.

## Secrets

Do not store secrets in git. Refer to these names only:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FOUNDER_EMAIL_ALLOWLIST`
- `AI_API_KEY`
- `AI_MODEL`
- `CENSUS_API_KEY`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`

Values live in the environment or in a local untracked file. [SETUP.md](SETUP.md) is where local setup is described. Pull requests contain the names, never the values.

## Tests

Tests mock AI and Census. CI makes no paid calls. A green workflow does not require a live `AI_API_KEY` or `CENSUS_API_KEY`.

## Slice limits

Keep one research adapter until the slice is validated: `CensusCountyBusinessPatternsAdapter`. Do not add a second source or a message bus in a side branch.

Phase 6 routes in the contract are not an invitation to implement them during the slice. Opportunity and product screens stay specified. They are not built on a feature branch during this slice.
