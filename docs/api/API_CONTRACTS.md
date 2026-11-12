# API contracts

Human-readable HTTP contract for Founders. The springdoc document at `/v3/api-docs` is the generated client source. Where this file and the running controllers disagree, the notes in [Document boundary](#document-boundary) record the code.

The first implementation covers session, questionnaires, alignment generation, directions, research jobs, findings, and the phase 6 opportunity, product, and decision routes that have controllers. Routes named below that have no controller are still contract-only.

Related documents:

- [Target architecture](../architecture/TARGET_ARCHITECTURE.md)
- [Database design](../architecture/DATABASE_DESIGN.md)
- [Architecture decisions](../architecture/ARCHITECTURE_DECISIONS.md)
- [Research pipeline](../ai/RESEARCH_PIPELINE.md)
- [Implementation plan](../development/IMPLEMENTATION_PLAN.md)

The Angular client must be generated from the springdoc document that matches this contract. Hand-copied TypeScript types are not the client.

## Conventions

- Base path: `/api/v1`. The logout path is the exception and is documented under Session.
- JSON field names are camelCase. Path, query, and header names are the literal strings in each route.
- Identifiers are UUID strings.
- Timestamps are ISO-8601 strings in UTC (`2026-11-11T12:00:00Z`). A timestamp that has not happened yet is JSON `null`.
- Request and response bodies are `application/json`.
- Every `/api/v1` read and write is limited to the caller's workspace. An id that is missing, or that belongs to another workspace, is `404`. The research-source catalog exception is stated on that route: a source that exists and is outside the caller's catalog is `403`.
- Enum values that are not in the set named for that field are `400`, with a `fieldErrors` entry for that field.
- A required string that is missing or blank after trimming is `400`, with a `fieldErrors` entry for that field.
- No response in this contract includes `source_config`, provider credentials, or raw API keys.

## Authentication

Spring Security is authoritative for authentication and authorization. This contract does not define a JSON login resource. Establishing a session is the Spring Security Google OAuth2/OIDC login flow, which is outside `/api/v1`.

Session cookie:

- The browser stores the session in an HttpOnly, Secure, `SameSite=Lax` cookie.
- Script cannot read that cookie.
- Clients send it by including credentials on every request (`credentials: include`, Angular `withCredentials: true`).
- This contract does not name the session cookie. The configured Spring Security cookie name is the name the browser sends.

CSRF:

- Spring Security issues a readable cookie named `XSRF-TOKEN`.
- Every mutating request sends that value in the header `X-XSRF-TOKEN`.
- Mutating methods in this contract are `POST` and `PATCH`, including `POST /logout`.
- `GET` does not send the CSRF header.
- A missing or invalid CSRF token on a mutating request is `403`.

Authorization, evaluated by Spring Security:

| Condition | Status |
| --- | --- |
| No session | `401` |
| The Google account is not on `FOUNDER_EMAIL_ALLOWLIST` | `403` |
| The Google account is not a `workspace_member` | `403` |
| Mutating request without a valid `X-XSRF-TOKEN` | `403` |

`401` means there is no session. `403` means a session exists and Spring Security rejected the caller or the CSRF token. Allowlist rejection and membership rejection both use `403`. Clients do not send a bearer token. A bearer token is not a substitute for the session cookie.

## Status codes

| Code | Meaning in this contract |
| --- | --- |
| `200` | The read succeeded, or an idempotency replay returned the job that already existed. |
| `201` | A resource was created. The body is that new resource. `Location` is the GET path of the new resource. |
| `202` | A new research job was accepted. Used only when `POST /api/v1/directions/{id}/research` creates a job. |
| `204` | Logout succeeded. No body. |
| `400` | The request is malformed: bad JSON, a missing `Idempotency-Key`, a query value outside its range, or a value outside an enum. |
| `401` | No session. |
| `403` | The session is not on `FOUNDER_EMAIL_ALLOWLIST`, the account is not a `workspace_member`, or the CSRF token is missing or invalid. |
| `404` | The resource is missing, or it is not visible in the caller's workspace. |
| `409` | Optimistic-lock version conflict, idempotency key reused with a different body, or a different key while a research job for that direction is `RUNNING`. |
| `422` | The JSON is well formed and fails a domain rule. Questionnaire answers do not satisfy the template, or alignment generation represents fewer than two distinct founders. |
| `429` | The founder exceeded the research rate or the research cost cap. |

## Error body

`@RestControllerAdvice` renders this JSON body for `400`, `401`, `403`, `404`, `409`, `422`, and `429`:

| Field | Type | Rule |
| --- | --- | --- |
| `timestamp` | string | ISO-8601 UTC time of the error |
| `status` | integer | The HTTP status code |
| `error` | string | The HTTP reason phrase for that status |
| `message` | string | One human-readable sentence. No secrets, cookie values, or API keys |
| `path` | string | The request path, without the query string |
| `fieldErrors` | array | Always present. Empty when the error is not tied to a field |

Each `fieldErrors` element:

| Field | Type | Rule |
| --- | --- | --- |
| `field` | string | Request field, query parameter, header name, or answer path such as `answers.industry` |
| `message` | string | Why that field failed |

Shape:

```json
{
  "timestamp": "2026-11-11T12:00:00Z",
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Answers do not satisfy the template.",
  "path": "/api/v1/questionnaires",
  "fieldErrors": [
    { "field": "answers.industry", "message": "required" }
  ]
}
```

`409` and `429` use the same object. Their `fieldErrors` array is empty unless a specific field is named in the route. `429` may include a `Retry-After` header when the limiter has a delay. The body still carries no key material and no provider payload.

## Collections

A collection that can grow accepts:

| Query | Type | Rule |
| --- | --- | --- |
| `limit` | integer | Default `20`. Minimum `1`. Maximum `100`. Outside that range is `400` on field `limit`. |
| `offset` | integer | Default `0`. Minimum `0`. A negative value is `400` on field `offset`. |
| `sort` | string | `field,asc` or `field,desc`. One field. An unknown field or a missing direction is `400` on field `sort`. |
| filters | named per route | Exact match. A filter that is not named on that route is `400`. |

Page body:

| Field | Type | Rule |
| --- | --- | --- |
| `items` | array | The page, possibly empty |
| `limit` | integer | The limit that was applied |
| `offset` | integer | The offset that was applied |
| `total` | integer | The count of matching rows before limit and offset |

An offset past the end is `200` with `items: []` and the real `total`. `GET /api/v1/founders` is a workspace member list and does not use this envelope. Every other collection in this document does.

Default sort, when `sort` is omitted:

| Collection | Default |
| --- | --- |
| Questionnaires | `createdAt,desc` |
| Alignments | `createdAt,desc` |
| Directions | `createdAt,desc` |
| Findings | `retrievedAt,desc` |
| Opportunities | `createdAt,desc` |
| Products | `createdAt,desc` |
| Decisions | `createdAt,asc` |

Allowed `sort` fields are listed on each route. Decisions default to ascending `createdAt` so an append-only history reads in order. Clients may pass `createdAt,desc`.

## Shared enums

| Name | Values |
| --- | --- |
| Questionnaire `status` | `DRAFT`, `SUBMITTED` |
| Alignment `status` | `DRAFT`, `READY` |
| Direction `origin` | `AI`, `FOUNDER`, `EXTERNAL` |
| Direction `status` | `DRAFT`, `ACTIVE`, `ARCHIVED` |
| Research job `status` | `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELLED` |
| Finding `verificationStatus` | `UNREVIEWED`, `CONFIRMED`, `REJECTED` |
| Opportunity `businessType` | `PHYSICAL_PRODUCT`, `SERVICE`, `SOFTWARE`, `OTHER` |
| Opportunity `status` | `DRAFT`, `UNDER_REVIEW`, `ADVANCED`, `ARCHIVED` |
| Decision `decision` | `ADVANCE`, `INVESTIGATE`, `REDESIGN`, `ARCHIVE` |

`PHYSICAL_PRODUCT` is the default `businessType` when the field is omitted. `POST /api/v1/alignments/generate` persists `READY` only. The table also allows `DRAFT` for an alignment that does not yet have its explanation. This contract does not expose a route that creates a `DRAFT` alignment.

## Session

### `GET /api/v1/session`

Requires a session. No CSRF header.

`200` body:

| Field | Type | Rule |
| --- | --- | --- |
| `founderId` | uuid | The caller's founder id |
| `email` | string | The Google account email on the session |
| `name` | string | Display name |
| `workspaceId` | uuid | The caller's workspace |
| `role` | string | The caller's `workspace_member` role in that workspace |
| `pictureUrl` | string | Omitted when the Google account has no https profile image. Otherwise that image URL |

`401` when there is no session. The error body is the object in [Error body](#error-body).

### `POST /logout`

Spring Security logout. This path is not under `/api/v1`.

CSRF header required. Credentials included. Spring Security clears the session.

`204` with no body.

A missing or invalid CSRF token is `403` with the error body. Spring Security remains authoritative for the logout processing URL.

## Founders (slice)

Unimplemented. Workspace members of the caller's workspace only.

### `GET /api/v1/founders`

`200` body: a JSON array. Each element:

| Field | Type |
| --- | --- |
| `id` | uuid |
| `name` | string |
| `email` | string |

The array is every member of the caller's workspace. It is not the page envelope. No query parameters.

### `GET /api/v1/founders/{id}`

`200` founder profile:

| Field | Type | Rule |
| --- | --- | --- |
| `id` | uuid | |
| `name` | string | |
| `email` | string | |
| `role` | string | That member's `workspace_member` role in the caller's workspace |

`404` when `{id}` is not a member of the caller's workspace.

## Questionnaires (slice)

Unimplemented. Resource name: `/api/v1/questionnaires`.

A founder may have a `DRAFT`. This slice does not create drafts. `POST` creates a submitted questionnaire so the milestone stays small. A later milestone may add draft create and update on this same resource name. The collection path stays `/api/v1/questionnaires`.

The founder is the authenticated session. The body does not contain `founderId`.

### `POST /api/v1/questionnaires`

CSRF required.

Request body:

| Field | Type | Rule |
| --- | --- | --- |
| `templateId` | uuid | Required. Unknown template is `404`. |
| `answers` | object | Required JSON object. Keys are template field ids. |

`201` when `answers` satisfy the template. The questionnaire `status` is `SUBMITTED`. `Location` is `/api/v1/questionnaires/{id}`.

`422` when `answers` do not satisfy the template. `fieldErrors` names each failing answer path (`answers.<fieldId>`). No questionnaire is created.

Response body:

| Field | Type | Rule |
| --- | --- | --- |
| `id` | uuid | |
| `founderId` | uuid | The session founder |
| `templateId` | uuid | |
| `templateVersion` | integer | The template version applied at submit time |
| `status` | enum | `SUBMITTED` for this slice |
| `answers` | object | The submitted answers |
| `submittedAt` | timestamp | Set when status is `SUBMITTED` |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

### `GET /api/v1/questionnaires`

Query: `founderId` (optional uuid), `limit`, `offset`, `sort`.

Allowed sort fields: `createdAt`, `updatedAt`, `submittedAt`.

`200` page of the questionnaire object above. Rows are limited to the caller's workspace. When `founderId` is set, the page is limited to that founder. `404` when `founderId` is not a member of the caller's workspace.

### `GET /api/v1/questionnaires/{id}`

`200` with the questionnaire object above.

`404` when the id is missing or outside the caller's workspace.

## Alignments (slice)

Unimplemented. An alignment is a workspace-scoped comparison of submitted questionnaires. `aiExplanation` is model text. It is an explanation, not a verified fact.

### `GET /api/v1/alignments`

Query: `limit`, `offset`, `sort`. No other filters.

Allowed sort fields: `createdAt`.

`200` page. Each item uses the alignment object below. The page contains alignments for the caller's workspace.

### `POST /api/v1/alignments/generate`

CSRF required.

Request body:

| Field | Type | Rule |
| --- | --- | --- |
| `questionnaireIds` | uuid[] | Required. Each id must be a questionnaire in the caller's workspace. |

`201` alignment. `Location` is `/api/v1/alignments/{id}`.

`422` when the ids represent fewer than two distinct founders. Duplicate ids and two questionnaires from the same founder do not count as two founders. `fieldErrors` contains `{ "field": "questionnaireIds", "message": "At least two distinct founders are required." }`. No alignment is created.

`404` when any id is missing or outside the caller's workspace.

Response body:

| Field | Type | Rule |
| --- | --- | --- |
| `id` | uuid | |
| `status` | enum | `READY` |
| `participatingFounderIds` | uuid[] | Distinct founders represented by the questionnaires |
| `questionnaireIds` | uuid[] | The questionnaires that were compared |
| `sharedInterests` | string[] | |
| `complementarySkills` | string[] | |
| `aiExplanation` | string | Explanation produced by the model. Not a verified fact |
| `createdAt` | timestamp | |

The list item on `GET /api/v1/alignments` is this same object. `sharedInterests` and `complementarySkills` are JSON arrays of strings stored in the `shared_interests` and `complementary_skills` jsonb columns.

## Directions (slice)

Unimplemented.

Direction object:

| Field | Type | Rule |
| --- | --- | --- |
| `id` | uuid | |
| `alignmentId` | uuid | The alignment this direction came from |
| `title` | string | |
| `description` | string | |
| `origin` | enum | `AI`, `FOUNDER`, or `EXTERNAL` |
| `status` | enum | `DRAFT`, `ACTIVE`, or `ARCHIVED` |
| `version` | integer | Optimistic-lock version. Starts at `1`. |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

### `GET /api/v1/directions`

Query: `status`, `origin`, `limit`, `offset`, `sort`.

`status` and `origin` are optional exact-match filters.

Allowed sort fields: `createdAt`, `updatedAt`, `title`, `status`.

`200` page of direction objects in the caller's workspace.

### `POST /api/v1/directions`

CSRF required.

Request body:

| Field | Type | Rule |
| --- | --- | --- |
| `alignmentId` | uuid | Required. Must be an alignment in the caller's workspace. |
| `title` | string | Required, non-blank |
| `description` | string | Required, non-blank |
| `origin` | enum | Required. `AI`, `FOUNDER`, or `EXTERNAL` |

The body does not set `status` or `version`. The created direction has `status` `DRAFT` and `version` `1`.

`201` with the direction object. `Location` is `/api/v1/directions/{id}`.

`404` when `alignmentId` is missing or outside the caller's workspace.

### `GET /api/v1/directions/{id}`

`200` with the direction object.

`404` when the id is missing or outside the caller's workspace.

### `PATCH /api/v1/directions/{id}`

CSRF required.

Request body:

| Field | Type | Rule |
| --- | --- | --- |
| `title` | string | Optional. When present, non-blank. Omitted means unchanged. |
| `description` | string | Optional. When present, non-blank. Omitted means unchanged. |
| `status` | enum | Optional. `DRAFT`, `ACTIVE`, or `ARCHIVED`. Omitted means unchanged. |
| `version` | integer | Required. The version the client last read. |

`200` with the updated direction. A successful patch increments `version` by `1`.

`409` when `version` does not match the stored version. `fieldErrors` is empty. The message states that the direction version conflicts. The body is the error object, not the direction. The client reloads `GET /api/v1/directions/{id}`.

`404` when the direction is missing or outside the caller's workspace.

`400` when `version` is missing, or when a present field fails its type or enum rule.

## Research (slice)

Unimplemented. Job creation is asynchronous. Findings are records retrieved for a direction. `aiInterpretation` is model text, not a verified fact. Responses never include `source_config` or raw API keys.

Research job object, returned by `GET /api/v1/research-jobs/{id}` and by an idempotent replay:

| Field | Type | Rule |
| --- | --- | --- |
| `id` | uuid | |
| `directionId` | uuid | |
| `status` | enum | `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, or `CANCELLED` |
| `attemptCount` | integer | `0` or greater |
| `startedAt` | timestamp or null | Null until the job starts |
| `completedAt` | timestamp or null | Null until the job reaches a terminal status |
| `error` | string or null | Safe failure text. Null when there is no error. No provider payload and no key |
| `tokenUsage` | object or null | Null until known. Object fields: `promptTokens` (integer), `completionTokens` (integer), `totalTokens` (integer) |
| `estimatedCost` | number or null | Decimal cost in USD. Null until known |

Finding object:

| Field | Type | Rule |
| --- | --- | --- |
| `id` | uuid | |
| `directionId` | uuid | |
| `researchSourceId` | uuid | The `research_source` retrieval row. Not the catalog id and not the job configuration |
| `originalReference` | string | Public locator stored on that retrieval |
| `retrievedAt` | timestamp | |
| `factualSummary` | string | Text. What that retrieval supports |
| `supportingEvidence` | string | Text. Passages from that retrieval |
| `aiInterpretation` | string | Text. Model interpretation. Not a verified fact |
| `unknowns` | string | Text. What the retrieval does not establish |
| `verificationStatus` | enum | `UNREVIEWED`, `CONFIRMED`, or `REJECTED` |

### `POST /api/v1/directions/{id}/research`

CSRF required.

Header:

| Header | Rule |
| --- | --- |
| `Idempotency-Key` | Required. A non-empty opaque string, at most 200 characters. Unique per direction: `(direction_id, idempotency_key)`. |

Request body:

| Field | Type | Rule |
| --- | --- | --- |
| `approvedResearchSourceId` | uuid | Required |

Outcomes, in this order:

| Outcome | Status | Body |
| --- | --- | --- |
| `Idempotency-Key` missing or blank | `400` | Error body. `fieldErrors` is `[{ "field": "Idempotency-Key", "message": "required" }]`. |
| Direction missing, or outside the caller's workspace | `404` | Error body |
| `approvedResearchSourceId` does not exist | `404` | Error body. The catalog is global. There is no per-workspace source list |
| The same key was already stored for this direction with the same body | `200` | The existing research job object. This is the original job, including its current `status`. Any workspace member retrying that key gets that job |
| The same key was already stored with a different body | `409` | Error body. `fieldErrors` is empty. |
| A different key, and a job for this direction is already `RUNNING` | `409` | Error body. `fieldErrors` is empty. |
| The founder exceeded the research rate or the research cost cap | `429` | Error body |
| A new job is created | `202` | `{ "jobId": "<uuid>", "status": "PENDING" }` |

`202` is used only when a new job is created. A repeated key with the same body is `200` even if that job is still `PENDING`. `Location` on `202` is `/api/v1/research-jobs/{jobId}`.

`PENDING` does not by itself produce `409`. The running-job conflict applies when the existing job's status is `RUNNING`. `SUCCEEDED`, `FAILED`, and `CANCELLED` do not block a new key.

The `202` body has exactly `jobId` and `status`. The `200` replay body is the full research job object, not the `202` shape.

### `GET /api/v1/research-jobs/{id}`

`200` with the research job object.

`404` when the job is missing or outside the caller's workspace.

The body does not include `source_config`, request headers sent to a provider, or raw API keys.

### `GET /api/v1/directions/{id}/findings`

Query: `limit`, `offset`, `sort`.

Allowed sort fields: `retrievedAt`, `verificationStatus`.

`200` page of finding objects for that direction.

`404` when the direction is missing or outside the caller's workspace.

## Phase 6 routes

These routes use the same authentication, CSRF, error body, and workspace visibility rules as the rest of this contract.

Opportunity object:

| Field | Type | Rule |
| --- | --- | --- |
| `id` | uuid | |
| `title` | string | |
| `customerProblem` | string | |
| `targetCustomer` | string | |
| `businessType` | enum | `PHYSICAL_PRODUCT`, `SERVICE`, `SOFTWARE`, or `OTHER` |
| `findingIds` | uuid[] | Findings in the caller's workspace, in request order, duplicates rejected |
| `status` | enum | `DRAFT`, `UNDER_REVIEW`, `ADVANCED`, or `ARCHIVED` |
| `evaluationSummary` | string | Workspace prose. Not a founder decision |
| `version` | integer | Optimistic lock |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

Product object:

| Field | Type | Rule |
| --- | --- | --- |
| `id` | uuid | |
| `opportunityId` | uuid | |
| `description` | string | |
| `targetBuyers` | string | |
| `differentiation` | string | |
| `estimatedCosts` | string | Notes, not verified cost |
| `feasibility` | string | Notes, not verified feasibility |
| `businessType` | enum | `PHYSICAL_PRODUCT`, `SERVICE`, `SOFTWARE`, or `OTHER`. Default `PHYSICAL_PRODUCT` |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

Decision object:

| Field | Type | Rule |
| --- | --- | --- |
| `id` | uuid | |
| `opportunityId` | uuid | |
| `decision` | enum | `ADVANCE`, `INVESTIGATE`, `REDESIGN`, or `ARCHIVE` |
| `rationale` | string | |
| `founderId` | uuid | The session founder who appended the row |
| `createdAt` | timestamp | |

Decisions are append-only. This contract has no update or delete for a decision.

### `GET /api/v1/opportunities`

Query: `status`, `limit`, `offset`, `sort`.

`status` is an optional exact match of `DRAFT`, `UNDER_REVIEW`, `ADVANCED`, or `ARCHIVED`.

Allowed sort fields: `createdAt`, `updatedAt`, `title`, `status`.

`200` page of opportunity objects in the caller's workspace.

### `POST /api/v1/opportunities`

CSRF required.

Request body:

| Field | Type | Rule |
| --- | --- | --- |
| `title` | string | Required, non-blank |
| `customerProblem` | string | Required, non-blank |
| `targetCustomer` | string | Required, non-blank |
| `businessType` | enum | Optional. Defaults to `PHYSICAL_PRODUCT`. |
| `evaluationSummary` | string | Optional. Empty string when omitted. Not a founder decision |
| `findingIds` | uuid[] | Required. May be empty. Each id must be a finding in the caller's workspace. Duplicate ids are `400` on field `findingIds`. |

`201` with the opportunity object. `status` is `DRAFT`. `evaluationSummary` is an empty string when the client omits it. `version` is `1`. `Location` is `/api/v1/opportunities/{id}`.

`404` when any finding id is missing or outside the caller's workspace.

### `GET /api/v1/opportunities/{id}`

`200` with the opportunity object.

`404` when the id is missing or outside the caller's workspace.

### `GET /api/v1/opportunities/{id}/products`

Query: `limit`, `offset`, `sort`.

Allowed sort fields: `createdAt`.

`200` page of product objects.

`404` when the opportunity is missing or outside the caller's workspace.

### `POST /api/v1/opportunities/{id}/products`

CSRF required.

Request body:

| Field | Type | Rule |
| --- | --- | --- |
| `description` | string | Required, non-blank |
| `targetBuyers` | string | Required, non-blank |
| `differentiation` | string | Required, non-blank |
| `estimatedCosts` | string | Required, non-blank. Notes, not a verified cost |
| `feasibility` | string | Required, non-blank. Notes, not verified feasibility |
| `businessType` | enum | Optional. Defaults to `PHYSICAL_PRODUCT` |

`201` with the product object. `Location` is `/api/v1/opportunities/{opportunityId}/products/{id}`. This contract does not define a separate GET-by-id for a product. The created product is read back through the products collection.

`404` when the opportunity is missing or outside the caller's workspace.

### `GET /api/v1/opportunities/{id}/decisions`

Query: `limit`, `offset`, `sort`.

Allowed sort fields: `createdAt`.

`200` page of decision objects. Default order is `createdAt,asc`.

`404` when the opportunity is missing or outside the caller's workspace.

### `POST /api/v1/opportunities/{id}/decisions`

CSRF required. Append-only.

Request body:

| Field | Type | Rule |
| --- | --- | --- |
| `decision` | enum | Required. `ADVANCE`, `INVESTIGATE`, `REDESIGN`, or `ARCHIVE`. |
| `rationale` | string | Required, non-blank |

`201` returns the new decision row. The body is the decision object. It is not an updated opportunity. `Location` is `/api/v1/opportunities/{opportunityId}/decisions/{decisionId}`. This contract does not define a separate GET-by-id for a decision. The row is read back through the decisions collection.

A decision does not change `opportunity.status`. Founders can disagree, so one founder's `ADVANCE` or `ARCHIVE` is not the workspace lifecycle. Status stays whatever it already was. This contract has no route that moves an opportunity between `DRAFT`, `UNDER_REVIEW`, `ADVANCED`, and `ARCHIVED`.

`404` when the opportunity is missing or outside the caller's workspace.

## Document boundary

This markdown is the contract. The Angular client in `frontend/src/app/core/api/generated/schema.ts` is generated from `/v3/api-docs`.

Implemented differences from the tables above:

- A new `@Version` row starts at `0`. Direction and opportunity responses return that stored value.
- `POST /api/v1/questionnaires` returns `id`, `founderId`, `templateId`, `status`, `answers`, and `submittedAt`. It does not yet return `templateVersion`, `createdAt`, or `updatedAt`.
- `POST /api/v1/directions` returns `id`, `title`, `status`, and `version`.
- `GET /api/v1/founders`, `GET /api/v1/alignments`, `GET /api/v1/directions`, and `PATCH /api/v1/directions/{id}` are not implemented.
- Collection `limit`, `offset`, and `sort` query parameters are not validated yet. The implemented collections return the matching rows for the caller's workspace.
- `tokenUsage` and `estimatedCost` stay null until a provider reports them. The fixture path does not invent token counts.
- `POST /e2e/login` exists only when `FOUNDERSLAB_E2E_LOGIN=true`. It is how Playwright signs in without Google. It is absent when that flag is false.
- `AIProvider` throws when `AI_API_KEY` is unset. `FOUNDERSLAB_E2E_FIXTURES=true` supplies fixture Census and model adapters so tests and Playwright do not call live Census or a paid model. Spring AI is not on the classpath.
