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

## Medication instruction and profile repair: 0.5.1 / 2026.10.22.6

Exact known legacy built-in instruction lines are no longer retained as additional caregiver notes in current-template display or subsequent reviews. Custom instructions, distinct caregiver notes, old unreviewed instruction revisions and administration history are preserved. Repeated review is idempotent. The volume/rate disclaimer was replaced with the actual grams-to-pounds multiplied by mL/lb calculation.

Profile medication actions now have distinct primary/secondary treatments, a 12-pixel gap and at least 48-pixel height. At narrow widths each card and its actions stack. Kitten-card secondary text is white on navy (approximately 12.49:1 for this specific pair).

All 67 automated tests and the production build passed. Browser regression checks passed, including exact duplicate cleanup, note preservation, current dose equation, button gaps/heights and no document overflow at 320/390/1280 pixels. Phone close-up screenshots of medication buttons, dose calculations and kitten-card contrast were visually inspected. No dosing rates, schedule policies, medication logs, legacy V2 or V3 files were changed.

See USABILITY-REVIEW-2026-10-22.md for the candid release assessment and remaining safety/usability priorities. Passing these tests is not clinical validation or an accessibility certification.

## Safety foundation and private testing: 0.6.0 / 2026.10.22.7

Medication automation remains enabled at the owner's request. No medication rates, frequencies or course lengths were changed. The testing build is not a clinically validated prescribing or administration system; Shelterluv remains the official rescue record.

Implemented:

- Rescue-configured weight bounds and change thresholds, DOB/age and previous-weight context, weight-loss warnings, and required rechecked grams when weight warnings apply. Configured, fresh, in-range weights do not require unnecessary repeat weighing for every dose.
- Product/preparation/approving-contact and measuring-device metadata; reliable minimum and graduation checks, actual-dose discrepancy and prescribed-unit checks, configured spacing checks on both sides of historical doses, and early-slot warnings. No clinical thresholds, preparation strengths or spacing intervals were invented.
- Explicit reason, approving contact or testing-only marker, and acknowledgment for warning exceptions. A testing exception is not veterinary approval. Calculations remain visible; exception details are retained with the record.
- Per-dose plan, instruction revision, product/device policy, weight/date, DOB/age, warning and exception snapshots. Atomic validation rejects changed plans, weights or warning reviews before committing.
- Dose/route/next/last given first; full instructions and arithmetic expandable. Profiles explicitly label once/twice daily and overdue times. Care-queue review actions open the relevant plan. Visible keyboard focus and focused error summaries improve error recovery.
- Separate logging, dose panel, profile and settings components; scoped button styling; separately stored caregiver notes. Existing mixed instruction text remains readable through compatibility cleanup.
- Serialized Web Lock saves with captured-revision conflict detection and live cross-tab updates; IndexedDB read/write transaction fallback. Rejected drafts remain open. Medication plan and Settings edits compare their original values before replacing newer edits.
- A previous verified saved copy, recovery export, current backup export, last-download-request timestamp, daily backup reminder and explicit restore record counts. No local copy survives intentional browser-data deletion; independent downloaded backups remain necessary.
- Second-level care timestamps and deterministic ordering of equal-time records, so a newly recorded same-minute weight is not silently ignored.
- Schema 8 migration and backup validation for safety metadata. Older clients reject newer-schema data on load. Previously open old-version tabs must be closed because old running code does not honor the new locking protocol.

Verification: 82 automated tests and the production build passed. Local Chrome browser checks passed for phone/desktop and larger-text reflow, keyboard dialog focus, feeding/medication validation, confirmation resets, failed-save draft retention, legacy migration/recovery, invalid backups, offline reopening, all four medication examples, duplicate dose slots, configured tiny-volume/out-of-range/discrepancy warnings, active calculations, saved snapshots, previous-copy export, forced two-tab stale-write rejection, retained draft/retry/merge, live weight updates and confirmation reset, and two-tab saves through the IndexedDB fallback. Phone dose/profile screenshots were inspected. No V2 or legacy V3 files changed.

Human/clinical work not claimed complete: caregiver participant sessions, real screen-reader/device sessions, physical syringe validation and rescue approval of actual products and safety limits. CAREGIVER-TEST-GUIDE.md provides tasks, success criteria and a results sheet and is linked in Settings. These limitations do not turn off automation in this private testing build. No Firebase migration, cloud login or wider foster rollout occurred.

## Plan setup versus dose readiness: 0.6.1 / 2026.10.29.1

84 automated tests and the production build passed. Added domain regressions distinguish setup from given-dose validation, including missing/stale weights, future starts, product confirmation, and skipped/unable entries. Chrome regressions create and review Albon plans with no weight and with a 25-hour-old weight, verify exactly one saved plan and no dose records, and confirm given-dose submission remains disabled. Existing regression coverage remains in place. No schema change, clinical rate change, Firebase work, V2 edit or legacy V3 edit.

Further source review and the proposed design/automation/AI roadmap are in POST-UPDATE-REVIEW-2026-10-29.md. Findings there are recommendations, not claims of completed implementation or human/clinical validation.

## Foster companion and care stays: 0.7.0 / 2026.10.29.2

Schema 9 adds care stays per kitten. Existing kittens retain their identity, care events, medication plans, settings and photos. Imported records receive an open or closed stay based on existing in-care status, with unknown dates/outcomes explicitly retained. No arrival date is inferred from DOB or the first log.

- My Journey: unique kitten count, current count, number of stays, inclusive calendar days per stay, departure totals, name/litter/marking search and current/past/outcome filters. Date estimates and missing durations are visible. Transfers and Petco departures remain distinct from adoption.
- Add past care to a new or existing kitten, or enter a past litter together. Earlier stays do not create feeding/medication events. Record a return under the existing kitten ID. Return requires review of existing care plans and preserves medication start/end dates.
- Departure closes the stay and removes the kitten from active lists, logging options and care queues while preserving records. Corrections require a reason and retain previous stay details; stale edits and overlapping/duplicate-open stays are rejected. Same-day departure/return boundaries are allowed.
- Profiles show stays and filterable chronological care history, with progressively loaded records. Past profiles preserve history without daily logging controls. Handoff summary now uses the most recent successful feeding rather than a refused attempt.
- Warmer responsive visual design, prominent next-action card, kitten overview, clearer six-destination navigation, large text and reduced-motion support. Optional locally resized photos for new kittens and historical entries.
- Fixed Save & add another: reads the clicked submit button, waits for saving, clears the next kitten form and preserves the litter DOB.

92 domain/migration/storage tests passed. Production type-check/build passed. Browser coverage includes existing medication, failed-save, migration, offline, accessibility/reflow and simultaneous-tab regressions, plus a dedicated journey suite for historical entries, approximate dates, bulk litter entry, photo import, return without duplicate kitten, departures, correction history, care-history filters, phone/desktop reflow, reload and full backup preservation. Screenshot review covers phone and desktop Today/Journey views. Browser scripts: scripts/browser-check.cjs and scripts/journey-check.cjs.

This is a working companion foundation, not a complete guided-round or AI release. No AI provider, automatic clinical advice, background push notifications, cloud accounts or external messaging was added. Older tabs must be closed before using schema 9. Human caregiver/screen-reader sessions and clinical validation remain outstanding.

## First-use walkthrough: 0.7.1 / 2026.10.29.3

Five-step introduction covers the app role, litter setup, Care Now and medication logging, history/handoffs, browser storage/backups and the lack of background phone alerts. Includes step count/progress, Back/Next/Skip, close/Escape as skip, and Replay walkthrough in Settings. Final action opens litter setup if no kittens are recorded, otherwise Care Now. A separate saved preference avoids treating legacy onboardingComplete as completion of the new guide. Existing users see it once too. Failed saves keep the tour open with a retry message. Storage-load failures keep recovery accessible rather than opening the tour. Existing care records are preserved; schema remains 9.

Dedicated scripts/walkthrough-check.cjs covers first use, existing records, back/next focus, skip and completion persistence across reload, Settings replay, both destinations, larger-text reflow at 320/390/1280 px, failed-save retention/retry and Escape dismissal. The phone screenshot was visually inspected. Existing browser and journey suites remain part of regression verification. The preference is included in backups and validated on restore.
Verification result: 93 automated tests, production build, walkthrough browser suite, existing full browser suite and journey browser suite passed.

## Rescue-branded Option C: 0.8.0 / 2026.10.29.4

Applied the selected design to the working app: original rescue logo, navy/violet/pale-blue palette, consistent SVG icons, live care metrics, next-care card, photo/initial kitten cards, and recent care entries. A desktop sidebar replaces the bottom navigation at wide widths. Phones use five labeled destinations; More retains Handoff and Needs Attention, plus settings and care logging. The top Log care action opens the existing care forms. Profiles, history, medication panels, walkthrough and Settings use the same visual system. No sample data from the mockups is shipped.

Photo controls now offer Choose photo and Take photo (rear-camera capture hint on supported mobile browsers), preview/removal, local resizing, invalid-replacement retention and a browser image-decoding fallback. Real phone hardware launch/permission behavior remains to be checked. The original rescue logo is bundled, cached offline, and used in the app manifest/favicon. Backup schema remains 9; existing care records and medication automation are retained. No legacy V2/V3 files changed.

Verification: 93 automated tests and production type-check/build passed. Full browser suite passed for feeding and medication validation, stale weights, duplicate doses, overrides, safety snapshots, offline opening, failed saves, recovery, selective handoff, contrast, reflow and simultaneous-tab saving. Journey suite passed including photo import, past care, return/departure, corrections, filters and backups. Dedicated brand suite passed at 320/390/768/1280/1440 px with standard/larger text, original logo loading, mobile More destinations, desktop sidebar, Log care routing, library/camera-file selection, invalid-photo retention and saved photo. Phone/desktop screenshots were inspected. Walkthrough remains covered by its dedicated browser suite.

## Existing-kitten photo editing: 0.8.1 / 2026.10.29.5

Profiles now offer Add photo / Edit photo for current and past kittens. The dedicated editor starts with the saved image and supports device selection, mobile camera capture hint, removal, explicit Save photo, and cancel. Updates change only the selected kitten photo, preserve care stays/medications/history, and reject stale photo edits. Failed saves retain the selection for retry.

Care Now uses contain sizing rather than cover cropping. Explicit zero-minimum grid tracks and constrained image bounds prevent tall images from growing beyond their fixed frame despite object-fit. Portrait and landscape test images include distinct edge markers; phone screenshots confirm both ends remain visible. Full-photo fitting also applies to editor previews, profile photos and list/history thumbnails. Saved image content is not recropped; space around a photo is intentional when its shape differs from the frame.

96 automated tests and production build passed. The dedicated photo browser suite covers current/past profiles, library/camera file inputs, invalid replacements, cancel, removal, failed-save retry, persistence, unchanged care entries and sibling photos, and actual image bounds at 320/390/430 px. Brand and journey regressions passed. Full care/medication browser regression remains included. Physical phone camera hardware/permission behavior is not simulated. No schema change, V2/V3 edit or Firebase work.

## Kitten names: 0.8.2 / 2026.10.29.6

Each current or past kitten profile now includes Edit name. The editor preloads the current name, trims surrounding whitespace, rejects blank/overlong names, offers explicit save/cancel, and retains the draft after failed saves. Updates retain the kitten ID and only change its name; care events, medications, stays, photos, status and sibling records are preserved. Stale name edits from another tab are rejected without overwriting the newer name. Shared names are allowed without merging records.

Verification: 100 automated tests and production build passed. Dedicated name browser suite passed for profile editing, validation, cancellation, failed-save retry, live Care Now/handoff labels, reload, actual two-tab stale-edit rejection, past kittens and unchanged care records. Brand/phone/desktop/photo navigation regressions passed. No schema change, clinical rule change, or legacy V2/V3 edit.

## Litter medications and scrolling fixes: 0.9.0 / 2026.10.29.7

1. Routine medication setup no longer displays product/device/safety-limit entry fields, and missing optional metadata no longer creates dose exceptions. A custom mL/lb rate calculates volume directly from grams converted to pounds, without a concentration field. Existing explicitly configured limits, dose discrepancies, weight changes, duplicate doses, prescription dates and stale-weight checks remain enforced. Existing optional metadata is preserved rather than erased on plan review.
2. Real litter cards expose Medication plans. Choose members, enter the shared prescription once, and use Log litter doses to review individual calculated amounts and record selected kittens in one atomic save. Unchecked kittens receive no entry; skipped/unable entries require reasons. Individual edits become overrides; parent changes preserve them, and Use litter plan resets a copy explicitly. Plan IDs and history remain stable. Matching overlapping individual plans are adopted as overrides rather than duplicated. Removing members preserves care history; departed kitten plans are retained standalone. Batch validation rejects stale plans/weights, changed membership, duplicate doses and partial writes. Shared Albon and custom mL/lb calculations are tested separately.
3. View medication instructions uses an explicit accessible disclosure and always shows saved instructions or a clear fallback, plus route, dose, schedule and course.
4. Full instructions and calculation uses the same reliable disclosure, with available individual weight/math or a clear unavailable message. It does not depend on a non-empty free-text instructions field.
5. Every Dialog locks the background body position, traps focus and restores the original scroll position on close. The header stays stationary and only dialog-body scrolls, with overscroll containment and narrow-phone input sizing.

Schema 10 protects linked plans and new rate units from older clients; close older tabs before testing. Existing schema-9 data migrates and is retained. Backups validate shared-plan membership and preserve links. No legacy V2/V3 or Firebase changes.

Verification: 109 automated tests and the production build passed. Litter browser checks cover the five requested workflows, .15 mL/lb arithmetic for distinct weights, shared Albon day-1 amounts, stale-weight exclusion, selected-only atomic logs, duplicate round rejection, individual override/sync/reset, non-empty disclosures, modal-only scrolling with restored page position, saved/reloaded plans and 320/390/1280 px modal reflow. Existing full care/medication, journey, walkthrough and branding browser checks remain covered. Existing configured safety-limit regression fixtures are seeded as legacy data, without reintroducing manual configuration fields into the app.
