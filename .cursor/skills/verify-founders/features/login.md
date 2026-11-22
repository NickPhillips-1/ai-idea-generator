# Login

An anonymous founder who opens a protected route sees the Google sign-in link. Verification then creates an allowlisted session for Ada without completing Google OAuth.

## Sub-features

- Redirect from `/dashboard` to `/login` when there is no session.
- Show the link Continue with Google.
- `POST /e2e/login?email=ada@example.com` with `X-XSRF-TOKEN`, then the dashboard shows `Signed in as ada@example.com.`

## How to get to it (user POV)

Open `http://127.0.0.1:8080/dashboard` before signing in. The app sends you to `/login`.

## Driving it with Playwright

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 npx playwright test -g "feature: login"
```

Run from `e2e/` after `sh e2e/scripts/launch.sh`.

## Gotchas

The Google link is real (`/oauth2/authorization/google`). Do not click it in verification. `POST /e2e/login` returns 404 when `FOUNDERSLAB_E2E_LOGIN` is not true, and 403 when the CSRF header is missing. The allowlist must include `ada@example.com`.
