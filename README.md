# FitAI

FitAI is a Node.js application for tracking nutrition and weight-management progress. The current product is an early-stage prototype built with Express, EJS, Firebase, and browser-side JavaScript.

## Requirements

- Node.js 20 or newer
- npm
- A Firebase project with appropriate Authentication and Firestore security rules
- A USDA FoodData Central API key for nutrition lookup

## Getting started

```bash
npm install
copy .env.example .env
# Edit .env with your Firebase Web app config and USDA key first.
npm run dev
```

Open `http://localhost:3000`.

## Nutrition data

Food lookup uses USDA FoodData Central on the server across Foundation, FNDDS survey, Branded, and SR Legacy records. After a user selects a result, the server retrieves its Food Details record by `fdcId` and exposes household or label portions when available. The API key remains server-side. Set `FDC_API_KEY` in `.env`; `DEMO_KEY` is suitable only for limited development.

Values are calculated from the selected food's nutrients per 100 g and the portion weight entered by the user. A meal photo is only a visual reference; users must choose a database match and provide a measured portion.

## AI meal-photo recognition

Set `GEMINI_API_KEY` in `.env` to enable server-side meal-photo recognition with Google Gemini. The app sends inline image data to Gemini and requests structured JSON with up to three visible-food suggestions. The API key is never sent to the browser, images are limited to 5 MB, and the endpoint is limited to five attempts per IP per minute.

AI suggestions never supply calories, nutrient values, or portion weight. The user must confirm the food and enter a measured portion; only then does the app retrieve nutrition data from USDA FoodData Central.

## Weight history

Signed-in users can save one weight measurement per local calendar date from the Profile page. Saving the same date updates the existing entry. Firestore stores the owner UID, date key, measured timestamp, and weight in kilograms. The UI shows the chronological chart, total change, and an average weekly rate only when the history spans at least seven days.

The chart also shows a rolling 7-calendar-day weight average. Each point uses measurements from that date and the previous six dates, and is displayed only when at least three measurements exist in that window. This avoids presenting a single or two-point value as a meaningful weekly average.

Short-term scale changes should not be treated as proof of fat loss or gain. The feature presents the recorded trend and leaves health interpretation to the user and their healthcare professional.

## Daily activity

The Profile page stores one step and active-minute entry per local calendar day. A rolling seven-day summary reports average steps, total active minutes, an observed activity category, and an activity-adjusted TDEE estimate after at least four recorded days. This estimate is informational and never changes the calorie plan automatically; users should review a persistent mismatch before updating their profile activity level.

## Sleep and stress

The Profile page also stores one sleep-duration and self-rated stress entry per day. Seven-day summaries are shown only as behavioral context, with pattern insights withheld until at least four days have been recorded. These values do not diagnose a health condition and never alter calories, macros, or TDEE automatically.

## Commands

- `npm start` — run the production entry point
- `npm run dev` — run with Node's watch mode
- `npm run check` — syntax-check the server modules

## Project structure

```text
FitAI/
├── public/
│   └── assets/
│       ├── css/             # Browser styles
│       └── js/              # Browser application code
├── src/
│   ├── config/              # Environment and path configuration
│   ├── controllers/         # HTTP request handlers
│   ├── middleware/          # Express middleware
│   ├── routes/              # Route definitions
│   └── app.js               # Express application composition
├── views/
│   └── pages/               # EJS page templates
├── .env.example             # Documented environment variables
├── server.js                # Process entry point
└── package.json
```

## Architecture conventions

- `server.js` only starts the HTTP process.
- `src/app.js` composes Express and is importable for future automated tests.
- Controllers render pages; routes only map URLs to controllers.
- Static files are served from `public/assets`.
- Secrets and machine-specific settings belong in `.env`, which is ignored by Git.

## Firebase Authentication setup

Enable the Email/Password provider in the Firebase console before running the app.
Set `FIREBASE_PROJECT_ID` and the Firebase Web app values in `.env`. These browser configuration values (`FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, and `FIREBASE_APP_ID`) are intentionally delivered to the browser and are not server secrets; keep USDA and Gemini API keys server-side.

Guest mode is local-only and does not read or write Firestore. The onboarding draft remains on the current device; creating an account copies that draft into the new account's local onboarding state so it can be completed and saved to Firestore. Food, weight, activity, and wellness history require a signed-in account. Signed-in users store cloud data under their Firebase UID. Legacy anonymous users can still be upgraded by linking email/password credentials, but Anonymous Authentication is not required for new sessions.

Do not use shared fallback identifiers for guest data. Firestore rules authorize cloud documents by `request.auth.uid` and their `ownerId` field.

## Account data and privacy

Signed-in users can download a versioned JSON export from the Profile page. It includes the profile and the user's food diary, weight, activity, wellness, and diary-completion records, including legacy food-diary records associated with that UID. The export is generated on request and downloaded by the browser.

The Profile page also provides permanent account deletion. The user must re-enter their email/password credentials; FitAI then deletes records belonging to that UID from the supported Firestore collections and device-local account state before deleting the Firebase Authentication account. A network or permission failure can interrupt this multi-step deletion, so the UI explicitly reports that the account may remain and that some records may already have been removed. Retry while signed in to finish cleanup.

## Firestore Security Rules

Rules are defined in `firestore.rules` and deny all unmatched collections by default.

To run the real Firestore Emulator test suite, install Java 11 or newer and make sure `java` is available on `PATH`, then run:

```bash
npm run test:firestore-rules
```

Run both the static policy checks and the emulator attack suite with:

```bash
npm run test:security
```

The emulator suite verifies that unauthenticated clients and a second signed-in user cannot list, read, create, update, or delete another user's profile, food diary, weight, activity, or wellness records. It also verifies that unrestricted collection queries and unknown collections are denied.

Before deploying, configure the same Firebase project in `.env` and `.firebaserc`; the server verifies tokens against `FIREBASE_PROJECT_ID`, and the browser receives the Firebase Web app configuration from that project. Copy `.firebaserc.example` to `.firebaserc` and replace the placeholder with your Firebase project ID. Deploy only the rules with:

```bash
npm run firebase:deploy:rules
```

The diary query filters by `ownerId` and a local-day timestamp range. Deploy both rules and the required composite index with:

```bash
npm run firebase:deploy:firestore
```

## Important product note

Camera and food-assistant nutrition values come from USDA FoodData Central. They remain estimates that depend on selecting the correct database record and measuring the portion accurately. Manual label entry remains available when the external service is unavailable.

## Verification before release

Run the automated checks from the project root:

```bash
npm run check
npm test
npm run test:e2e
npm run test:security
```

The Firestore Emulator suite requires Java 11 or newer. Before deploying, configure the production Firebase project and its Web app values plus the private USDA key in the environment, review the Firebase Authentication providers and deployed Firestore rules/indexes, and verify account export/deletion using a non-production test account. The built-in request limiters are process-local; use a shared rate-limit store before running multiple server replicas. `npm start` checks required production settings when `NODE_ENV=production`; the health endpoint is `/healthz`.

Both E2E commands start the Firebase Authentication and Firestore emulators with the `demo-fitai` project. The authenticated journey exercises emulator-backed account/profile/health-data persistence; USDA nutrition responses are stubbed so the test does not depend on external services.
