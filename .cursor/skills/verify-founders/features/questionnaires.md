# Questionnaires

A signed-in founder submits interests, skills, resources, and goals. The page shows the saved questionnaire id.

## Sub-features

- Form labels Interests, Skills, Resources, Goals.
- Button Submit questionnaire.
- Text `Submitted questionnaire` and a link Continue to alignment.

## How to get to it (user POV)

Sign in, then open Questionnaires in the workspace nav or go to `/questionnaires`.

## Driving it with Playwright

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 npx playwright test -g "feature: questionnaires"
```

Run from `e2e/` after launch. The test signs Ada in, fills the four fields, and expects the submitted id.

## Gotchas

The page calls `LabApi.submitQuestionnaire`. There is no second founder in this test. The id is whatever the API returns; assert the submitted text, not a hard-coded UUID.
