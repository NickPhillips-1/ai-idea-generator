# Opportunities

From a fixture finding, a founder saves an opportunity and a product concept, then records ADVANCE. The opportunity status stays DRAFT. A decision does not rewrite the finding.

## Sub-features

- The finding's Factual summary is visible on `/opportunities`.
- Opportunity fields Title, Customer problem, Target customer. Button Save opportunity.
- Product fields Description, Target buyers, Differentiation, Estimated costs, Feasibility. Button Save product concept.
- Rationale and button ADVANCE. The page shows `Opportunity status: DRAFT`.

## How to get to it (user POV)

Finish research in the same browser, then open Opportunity in the nav or go to `/opportunities`.

## Driving it with Playwright

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 npx playwright test -g "feature: opportunities"
```

Run from `e2e/` after launch. The test builds the alignment, direction, and finding first, in Ada's context.

## Gotchas

The product form stays hidden until an opportunity id is in `sessionStorage` (`founderslab.opportunityId`). ADVANCE is not proof of customer pain. If the factual summary is missing, research did not finish in this context. Do not change the assertion to accept a status other than DRAFT.
