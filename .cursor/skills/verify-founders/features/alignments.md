# Alignments

Two founders submit questionnaires. One of them selects both and generates an alignment. The explanation is the model's reading, not a verified fact.

## Sub-features

- Two checkboxes, one per submitted questionnaire.
- Button Generate alignment.
- Heading AI explanation.

## How to get to it (user POV)

After both founders submit, open `/alignments`, check both rows, and choose Generate alignment.

## Driving it with Playwright

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 npx playwright test -g "feature: alignments"
```

Run from `e2e/` after launch. The test uses separate browser contexts for `ada@example.com` and `grace@example.com`.

## Gotchas

One founder is not enough. The API rejects alignment until two questionnaires are selected. Each context has its own `sessionStorage`, so Grace's page does not see Ada's ids. The explanation comes from the fixture model when `FOUNDERSLAB_E2E_FIXTURES=true`.
