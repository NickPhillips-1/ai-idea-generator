# Research

A founder saves a direction, starts Census research, and reviews a finding that keeps fact, interpretation, and unknowns apart. The dashboard then shows that finding.

## Sub-features

- Direction fields Title and Description, button Save direction.
- Button Start Census research. The page polls with `pollJob` every 2 seconds.
- Headings Factual summary, AI interpretation, and Unknowns.
- Link Open the dashboard review. The empty-state sentence `No research findings yet` is gone.

## How to get to it (user POV)

Generate an alignment, continue to a research direction, save it, open Start research, then Start Census research. When the finding is on the page, open the dashboard review.

## Driving it with Playwright

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 \
PLAYWRIGHT_TRACE=on \
PLAYWRIGHT_SCREENSHOT=on \
npx playwright test -g "feature: research"
```

Run from `e2e/` after launch and doctor. This is the proof path for the verify skill.

## Gotchas

`founderslab.directionId` and `founderslab.jobId` are in `sessionStorage` for Ada's context only. The fixture finding text is `County Business Patterns lists 100 establishments.` Unknowns include `cannot support willingness to pay`. If the button Start Census research is missing, the direction was not saved in this context. Do not point the test at live Census. A 404 on `/e2e/login` means fixtures and e2e login were not enabled.
