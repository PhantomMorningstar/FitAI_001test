# HTTPS and error monitoring

## What is implemented

- Production requests are redirected to HTTPS with status `308`.
- HSTS and baseline browser security headers are enabled only in production.
- `GET /healthz` returns a small readiness response.
- Server errors are written as structured JSON with a request ID.
- Browser JavaScript errors and unhandled promise rejections are sent to
  `POST /api/monitor/client-error`.
- Client reports deliberately exclude messages, stack traces, email addresses,
  form values, food names, and health data.
- Repeated client reports are rate limited.

Localhost remains HTTP during development because browsers treat localhost as a
secure development context.

## Deploy the Express app with Cloud Run

Firebase Hosting alone only serves static files and cannot execute this
Express/EJS server. Firebase App Hosting primarily supports framework adapters,
so this plain Express app uses Cloud Run in the same Google Cloud/Firebase
project. Cloud Run provides a managed HTTPS URL and Cloud Logging.

1. In Google Cloud Console, select project `fitai-test1-2c5b8`.
2. Enable billing and set a small budget alert before deploying.
3. Install and sign in to Google Cloud CLI.
4. Store API keys in Secret Manager; do not pass or commit `.env`.
5. From the project directory, deploy:

```powershell
gcloud run deploy fitai `
  --source . `
  --project fitai-test1-2c5b8 `
  --region asia-southeast1 `
  --allow-unauthenticated `
  --set-env-vars NODE_ENV=production,APP_RELEASE=cloud-run
```

6. Attach `GEMINI_API_KEY` and `FDC_API_KEY` from Secret Manager in Cloud Run →
   Edit & deploy new revision → Variables & secrets.
7. Add the generated `*.run.app` domain in Firebase Console → Authentication →
   Settings → Authorized domains.
8. Visit `https://YOUR_RUN_APP_DOMAIN/healthz`; expect
   `{"status":"ok",...}`.

Cloud Run has no-cost quotas, but requires a billing account and can charge when
usage exceeds them. Keep `minInstances` at zero and configure a budget alert.

## Check production errors

In Google Cloud Console, select the Firebase project and open Logging → Logs
Explorer. Search for:

```text
textPayload:"server_error"
```

```text
textPayload:"client_error"
```

Each server error page displays a reference ID. Search that value in logs to
find the matching request without logging the user's health data.
