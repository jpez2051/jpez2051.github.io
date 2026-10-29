# A4A Kitten Care application migration

This is the parallel TypeScript application that will replace the current V3 static implementation after feature-parity testing.

## Commands

- `pnpm dev` — local development
- `pnpm test` — domain and migration tests
- `pnpm build` — type-check and build the static site into `../kitten-care/`

The local repository automatically imports existing `a4a-kitten-care-v3` browser data into the new schema on first load. The current V3 files remain the production fallback during migration.

## Readiness foundation

- Care-entry validation is implemented in domain modules and covered by automated tests.
- Refused or unsuccessful feedings do not reset the next-feeding schedule.
- Medication administration requires an assigned plan, an actual amount, and explicit confirmation. Weight-based doses block stale weights unless rescue approval is recorded.
- Calendar-only values use local dates so Hawaii care dates do not shift through UTC conversion.
- Local saves are written and read back for verification; failures are shown persistently.
- `CareRepository` remains the storage boundary. A future authenticated Firebase repository can replace `LocalStorageRepository` without moving care rules into Firebase code.
- The production build includes a web app manifest and service worker for installability and offline reopening.

Firebase authentication, authorization rules, cloud backup, and multi-device conflict handling are intentionally deferred until the Firebase deployment phase.

## Foster companion (0.7.0)

Use My journey to record past care, grouped past litters, departures and returns. Open a kitten for its stay timeline and filterable care history. Historical dates may remain unknown or be marked approximate; counts describe personal fostering activity rather than official rescue records. Departures stop active care tasks without deleting records. Returns reuse the existing kitten identity and require review of care plans. Save a backup before updating and close older tabs.

Run scripts/browser-check.cjs and scripts/journey-check.cjs with Playwright available for production-build browser verification. AI and background delivery remain future work; current next-action suggestions use the tested care queue.
