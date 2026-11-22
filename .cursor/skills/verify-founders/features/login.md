# Login

An anonymous founder who opens a protected route sees the username and password form. Verification then creates an allowlisted session for Ada with `POST /e2e/login`. It does not submit the password form.

## Sub-features

- Redirect from `/dashboard` to `/login` when there is no session.
- Show the Username and Password fields and the Sign in button.
- `POST /e2e/login?email=ada@example.com` with `X-XSRF-TOKEN`, then the dashboard shows `Signed in as ada@example.com.`

## How to get to it (user POV)

Open `http://127.0.0.1:8080/dashboard` before signing in. The app sends you to `/login`.

## Driving it with Playwright

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 npx playwright test -g "feature: login"
```

Run from `e2e/` after `sh e2e/scripts/launch.sh`.

## Gotchas

`POST /e2e/login` returns 404 when `FOUNDERSLAB_E2E_LOGIN` is not true, and 403 when the CSRF header is missing. The allowlist must include `ada@example.com`. The local password account is username `nick` and password `password`. Verification does not use that account.
