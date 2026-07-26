# FitAI release backlog

## P0 — required before real users

| Item | Current status | Completion criteria |
|---|---|---|
| Deploy HTTPS and monitoring | Code ready; deployment pending | Cloud Run HTTPS URL, `/healthz` works, Cloud Logging receives a controlled test error |
| Rotate exposed USDA key | Action required | Revoke the previously shared key and store the replacement in Secret Manager |
| Protect Firestore in production | Code ready; deployment verification required | Emulator security suite passes and deployed rules match the repository |
| Protect server APIs from abuse | Done in code | Nutrition/profile/chat/photo endpoints enforce request-size and rate limits |
| Privacy policy and explicit consent | Not done | Bilingual policy explains Firebase, Gemini, USDA, retention, deletion, and health-data limits |
| Export and delete account data | Not done | User can download their records and permanently delete all owned documents plus Firebase Auth account |
| Production secret validation | Done in code | Production refuses to start with missing/demo USDA credentials |
| End-to-end release test | Not done | Playwright or equivalent covers auth, onboarding, diary, weight, language, offline and accessibility on deployed HTTPS |

## P1 — needed for a reliable weight-management product

| Item | Why it matters |
|---|---|
| Verified-email policy for cloud writes | Reduces fake/abusive accounts; requires a migration-friendly UX |
| Data freshness and sync indicators | Users need to know whether a value is local, synced, stale, or offline |
| Backup/import recovery | Prevents accidental loss and supports moving accounts |
| Adherence and data-quality score | Plan calibration should explain when food logs or weigh-ins are insufficient |
| Maintenance-mode transition | Reaching a target should change the plan from loss/gain to maintenance safely |
| Plateau workflow | Detect a sustained 3–4 week trend, then check adherence before suggesting a small change |
| Measurement reminders by schedule | Weight should be compared under consistent conditions, not indiscriminately every day |
| Metric/imperial units | Needed before broader release; calculations must retain one canonical unit internally |
| Error and empty-state consistency | Replace remaining alerts and technical Firebase codes with accessible in-page feedback |

## P2 — useful after the release foundation is stable

| Item | Why it matters |
|---|---|
| Optional waist measurement | Adds context that BMI and scale weight alone cannot provide |
| Meal templates and favorites | Reduces repeated data entry without inventing nutrition values |
| CSV/PDF progress report | Helps users review trends with a dietitian or clinician |
| Push notification backend | Required for reliable reminders after the browser is fully closed |
| Admin-free support diagnostics | A user-controlled diagnostic export can help debug without exposing health content |
| Automated dependency and security updates | Keeps Express/Firebase packages patched |

## Product safety rules that should remain

- Do not diagnose disease or promise a specific amount of fat loss.
- Do not automatically reduce calories from one weigh-in or a short plateau.
- Do not generate automated weight-change plans for minors, pregnancy,
  breastfeeding, eating-disorder history, or clinician-supervised conditions.
- Treat AI photo recognition as food-name assistance only; measured portion and
  a verified food database remain required.
- Keep sleep, stress, steps, and waist measurements as context rather than proof
  of causation.

## Definition of “near complete”

The app is near release-ready when every P0 item is complete on the deployed
HTTPS environment, no secrets exist in source/history, production monitoring is
verified, account deletion/export works, and the end-to-end release suite passes
on desktop and mobile.
