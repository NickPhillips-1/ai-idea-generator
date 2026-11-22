# Founders feature map

Drive one feature with Playwright. Titles are `feature: <name>`.

| Feature | Test | Proves |
| --- | --- | --- |
| [login](login.md) | `feature: login` | An anonymous visit to `/dashboard` stops at login, then Ada is signed in. |

Shared gotchas: sign-in is `POST /e2e/login` after reading the `XSRF-TOKEN` cookie. A new browser context does not see another founder's session.
