# Application verification — October 19, 2026

## v0.4.0 rescue-chart follow-up — October 22, 2026

Build 2026.10.22.1 adds the three owner-supplied rescue-chart references and custom-entry fallback. Albon has distinct first-day/subsequent-day arithmetic; all chart calculations require a valid weight within 24 hours. Baytril requires recorded vet-tech approval. All three chart entries remain drafts because product preparation and dose frequency were not provided. No actionable administration amount or given-dose logging is enabled for incomplete entries. Azithromycin mixing details were not invented.

Schema 7 preserves chart references. 55 automated tests and the production browser suite pass, including chart selection, incomplete-preparation blocking, approval requirements and custom entry. See `RESCUE-MEDICATION-CHART.md` for exact source rates and missing activation details. Firebase work is paused at the owner's request.

## v0.3.0 preview-preparation follow-up

Build 2026.10.19.2 adds fixed-time daily/multiple-daily, hourly, calendar-day interval, selected-weekday, one-time and PRN schedule entry. The due engine uses local calendar dates, explicit first-dose anchors for interval prescriptions, and given-dose logs; skipped/unable doses do not silently advance the schedule. Missing imported interval anchors are flagged for review. The care queue now includes medication, daily weight, weight-decrease and recorded-health review items.

43 domain/storage tests pass in five files, including 18 new schedule/queue cases and a health-observation validation case. Browser regression checks additionally cover weekday selection validation, hourly prescription persistence in UTC, and clearing actual amount/confirmation when the selected prescription changes. Prior layout, backup, storage failure, keyboard and offline cases remain covered.

Hosting-only Firebase preview configuration and an inspection/deployment runbook are prepared in `deployment/firebase-preview`. The official Firebase plugin is available but not yet installed or connected. Project/site inspection, backend migration, cloud auth/sync, and preview publication remain pending. The service worker bypasses Firebase's reserved `/__/` routes and authenticated requests.

The previous verification record below is retained for history; medication schedule entry/due logic and the daily-weight/health queues listed there as missing are now implemented. Shared litter medication overrides, remaining V3 parity, and Firebase authorization/data migration tests still prevent production replacement.

## v0.2.2 verification record

Target: migrated `/kitten-care/`, version 0.2.2, build 2026.10.19.1. GitHub main was fetched before changes. The existing V2 and V3 files were not changed.

## Results

| Area | Evidence | Result |
| --- | --- | --- |
| Feeding validation | Blank successful feed rejected; measured feed saved; refused attempts do not move next-feed time | Pass |
| Medication recording | Assigned plan, actual positive amount, and explicit confirmation required; stale/no-weight domain checks | Pass for implemented recording flow |
| Multiple kittens and prescriptions | Queue opens Nani rather than first kitten; second prescription row selects second plan | Pass after fixes |
| Counts and migration | Successful feeds and given doses counted; skipped doses excluded; departed legacy kittens stay inactive | Pass after fixes |
| Browser storage | Write failure and readback mismatch rejected; malformed JSON/schema rejected; failed form retains entry | Pass |
| Backup and recovery | Multi-litter export retains records; invalid file rejected; valid backup recovers corrupt storage | Pass after recovery fix |
| Selective handoff | Only checked active kitten appears in output; unchecked and archived kittens excluded | Pass |
| Layout | Standard layout at 320/390/1280 px; populated large text at 320/390/640/1280 px | No horizontal overflow |
| Scaling | Populated handoff screen at CSS zoom 200% and 1280 px | Pass; not an OS magnifier or full native browser zoom audit |
| Keyboard | Dialog Tab/Shift+Tab remain contained; Escape dismissal and focus return supported | Automated containment passed |
| Offline | Production worker installs and app reopens after network is disabled | Pass |
| Contrast | Primary pink and muted tokens darkened; white on primary pink now exceeds 4.5:1 | Token-level correction; full visual audit still pending |
| Build | TypeScript checking and Vite production generation | Pass |

Automated evidence: 24 domain/storage tests in four files plus `scripts/browser-check.cjs`. Browser tests use synthetic records in isolated Chrome contexts and Pacific/Honolulu timezone. No real caregiver data is uploaded.

## Changes prompted by verification

- Preserve clicked kitten and prescription identities in logging dialogs.
- Restore valid backups even when initial storage loading failed; keep failed settings saves open.
- Reject malformed current-storage schemas and backups from newer schema versions.
- Preserve archived status during V3 migration and normalize legacy medication defaults.
- Correct feed/dose counts and enforce the displayed maximum weight in application validation.
- Refresh care time displays every 30 seconds and when visibility changes.
- Show failed-save errors inside the care form so the modal cannot hide them.
- Increase primary pink and muted text contrast and expose version/build on screen.

## Release decision

**The migrated app remains a preview and must not yet replace the existing V3/Firebase app.** Verification is complete for the implemented areas listed above, not for the unimplemented four-phase requirements below.

Remaining implementation: shared litter plans and overrides; all medication schedule types and due calculations; guided feeding sessions; bulk weighing; photo cropper; weight insights; editable care history and archived-profile UI; full guided onboarding; daily-weight/concern queues; cross-tab and cross-device conflict handling.

Remaining validation: manual screen-reader testing, real device/OS text sizing, all-screen contrast testing, realistic service-worker upgrade/rollback testing, Firebase authorization/emulator tests and existing-data migration tests. No accessibility conformance certification is claimed.

Firebase project `a4a-kitten-tracker` is recorded. Its existing configuration, account permissions and data schema still need authenticated inspection. No Firebase data or deployment was changed in this verification pass.

## Albon update 0.4.1 / 2026.10.22.2

Confirmed once daily for 14 total days: day 1 at 0.5 mL/lb; days 2–14 at 0.25 mL/lb. Tests cover day 14/15, fresh weight, first-day history and duplicate daily administration. All 59 automated tests and the production build passed. Browser checks cover live day-1 calculation and plan review preserving IDs. Existing preview limitations above still apply.

## Medication clarity and completed-day correction: 0.4.2 / 2026.10.22.3

The calculated per-dose amount has a separate prominent label, distinct from the mL/lb rate and recorded weight. User-facing rescue-chart references were replaced with medication instructions. Stored records keep their internal field names for compatibility.

Completing day 1 outside the app does not invent a start date or advance the calendar. If the actual first date is today, the calculator and given-dose validation block another dose, while the plan can still be saved. The next scheduled dose moves to day 2. If the actual date is yesterday, today's calculation uses 0.25 mL/lb. Tests cover both cases and an early daily dose not reappearing at its later scheduled time. No external administration event is fabricated.

All 61 automated tests, the production build, and the browser regression checks passed.

## Administration instructions: 0.4.3 / 2026.10.22.4

The logging panel is titled How to give and describes dosing method and route without repeating the selected kitten or medication. Saved administration instructions and notes are now shown for all medications, alongside the distinct per-dose amount. Fixed prescriptions retain their prescribed amount. Dropdown selection and confirmation safeguards are unchanged.

All 62 automated tests and the production build passed. Browser checks verify Albon, Azithromycin and Baytril instructions in the logging panel, absence of redundant names, and continued blocking for incomplete preparations/frequencies. No medication rates, frequency assumptions, approval requirements or historical care records were changed.

## Confirmed medication frequencies: 0.5.0 / 2026.10.22.5

Owner-confirmed frequencies: Azithromycin once daily, 0.1 mL/lb per dose for 10 days; Baytril once daily, 0.022 mL/lb per dose for a prescribed 5–10 days; new Clavamox twice daily, 0.1 mL/lb per dose for a prescribed 5–7 days. These are owner-supplied instructions, not a general inference that course length determines frequency.

All four library entries calculate from recent weight after confirmation of the prepared rescue-supplied/confirmed product. Baytril still requires vet-tech approval. The incomplete azithromycin mixing note remains non-executable; no strength was guessed. Existing affected drafts require review and reconfirmation; ID and care history remain unchanged.

Clavamox stores two scheduled times and the selected dose slot with each given event. Duplicate slots and a third daily administration are blocked; reminder calculations preserve the second dose after the first is given. Course duration, existing notes, and approval references are preserved during plan review.

All 64 automated tests, the production build and browser regression checks passed. Browser checks include activated Azithromycin and approved Baytril calculations, Clavamox first/second dose logging and duplicate rejection, and unchanged Albon day-1 completion safeguards. V2 and legacy V3 assets were not modified. Existing preview limitations listed earlier remain.
