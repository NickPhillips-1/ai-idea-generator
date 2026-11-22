# Release checks

Founders has no canary, no feature flag, no metrics, and no tracing. Shipping ends when the pull request is merged, CI is green, and an independent verdict names the patch-id of the change. `autopilot-full` does not watch production, because there is no production signal to watch.

Before that playbook could watch a deploy, three things would have to exist:

- A health check beyond `GET /v3/api-docs`, one that shows the app can serve a founder session.
- A flag that can turn research off without a new deploy.
- Logs that do not contain `CENSUS_API_KEY` or `AI_API_KEY`.

This note does not add those controls.
