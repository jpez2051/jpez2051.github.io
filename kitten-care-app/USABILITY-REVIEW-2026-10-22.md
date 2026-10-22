# Candid usability and safety review

## Follow-up implementation: v0.6.0 / Build 2026.10.22.7

Medication automation remains enabled for private testing. The original findings below are retained as the review history, not a claim that those software controls remain absent.

| Recommendation | Implemented follow-up |
| --- | --- |
| Weight plausibility | Configurable rescue-defined range and change threshold; DOB/age and previous-weight context; warnings for missing policy, weight loss and out-of-range readings. Weight warnings require rechecked grams; configured, fresh, in-range weights do not require repeated reweighing. |
| Measuring precision | Product/device details, reliable minimum and graduation size; explicit warnings for missing precision, tiny volumes and amounts between marks. Calculations remain active; no automatic rounding to a syringe mark. |
| Actual-dose discrepancies | Live prescribed-versus-actual comparison and unit checking. Warnings require a reason, contact or “testing only” and explicit acknowledgment before a given entry can save. |
| Timing | Rescue-defined minimum spacing, previous/following-dose checks for historical entries, and early-slot warnings. Existing daily counts and duplicate-slot protection remain. |
| Product identity and audit | Per-dose snapshots retain the complete plan, product/preparation/device policy, instruction revision, weight/date, DOB/age, warnings and recorded exception. Later plan changes do not rewrite older snapshots. |
| Tab conflicts and recovery | Web Locks with an IndexedDB transaction fallback, captured-revision checks, live storage updates, stale medication/settings edit checks, previous-save recovery export, backup reminders and recorded download-request time. |
| Simpler navigation | Dose/route/next/last given first, expandable full details, direct care-queue review actions, explicit once/twice-daily profile labels and visible keyboard focus. Logging, dose review, profile and settings are separate components; caregiver notes are separate from built-in instructions. |
| Caregiver testing | A task-based guide and result sheet are linked in Settings. Actual participant, physical-device and real screen-reader sessions remain outstanding. |

Safety limits are user-supplied, not invented clinical defaults. A testing exception records what was reviewed; it is not veterinary approval. Unknown safety information is displayed as unknown rather than silently assumed safe. The software does not validate the rescue's prescription or the physical accuracy of a measuring device.

Schema 8 preserves these controls and prevents older clients from loading a newer-schema backup. Close previously open older-version tabs before testing: old running code cannot be made to honor a newer locking protocol. Local recovery copies are not independent backups and can disappear with browser data. No cloud migration or public foster rollout was performed.

See `VERIFICATION.md` for test results and `CAREGIVER-TEST-GUIDE.md` for the human checks that must not be represented as completed by automation.

## Release assessment

The app is useful for supervised foster-care tracking, but the current medication workflow should not be treated as a validated medication administration system. A polished calculated number can create more confidence than the underlying checks warrant. Shelterluv remains the official rescue record.

Scope: source review of medication setup, calculation, validation, schedules, logging, profile layout, care queue and browser storage; automated regression checks and local Chrome layout inspection. This is not a clinical review, accessibility certification, real-device study or full re-verification of the original V3 feature set.

## Fixes in 0.5.1 / Build 2026.10.22.6

- Known historical built-in instructions were being retained as additional notes and appended to current instructions. Exact known duplicate lines are now filtered from current-plan presentation and future reviews. Individual caregiver notes and historical administration logs are preserved. Unreviewed instruction revisions are not silently activated.
- The vague volume/rate disclaimer was replaced with the actual conversion: recorded grams divided by 453.59237 grams/lb, multiplied by the prescribed mL/lb rate. The result is mL per dose.
- Profile medication buttons have separate primary/secondary styles, at least 48-pixel height, a 12-pixel gap and a stacked phone layout.
- Kitten-card details use white on navy instead of inherited muted gray. The measured foreground/background contrast is approximately 12.49:1 for this specific pair; this is not an all-screen contrast audit.

## Recommended work, in priority order

### Before expanding medication automation

1. **Validate weight plausibility.** A positive, recent number is not necessarily a correct kitten weight. The current validation accepts positive weights up to 12,000 g; the calculator has no age-based plausibility check. Show weight, time and unit prominently and require a recheck when rescue-approved plausibility rules are triggered. Have the rescue define the thresholds rather than inventing them in code.
2. **Validate measurability and rounding.** Displaying 0.013 mL to three decimal places does not establish that the supplied device can measure it. Record the approved device/precision and preparation; require rescue confirmation when the result is below that device's reliable range. Do not silently round a tiny dose to a different dose.
3. **Flag actual-versus-calculated discrepancies.** The given-dose validator accepts any positive actual amount once confirmation is checked. A major mismatch can pass without a specific explanation. Add a second review with the difference displayed and an authorized reason, rather than treating the checkbox as sufficient.
4. **Review timing, not just dose counts.** Two different Clavamox slots can be logged close together. Slot uniqueness prevents duplicates, not inappropriate spacing. Add rescue-defined timing checks and distinguish recording historical care from administering now. Do not assume that every twice-daily prescription automatically means an exact interval.
5. **Make product identity auditable.** A product-match checkbox is broad. Store the exact prescribed product/preparation, approval and instruction revision with the plan and administration snapshot. Keep incomplete mixing instructions out of actionable preparation guidance.

### Before broad foster rollout

6. **Prevent multi-tab overwrites and prove recovery.** Browser storage saves the full state and notifies only listeners on that repository instance; there is no cross-tab reconciliation. Two open tabs can overwrite each other's changes. Add stale-write detection and test backup/restore and interrupted updates before cloud migration. Cloud hosting alone does not solve this.
7. **Reduce reading and navigation effort.** Prioritize the current dose, route, next due time and most recent given dose. Put the full course history and arithmetic behind clear details controls. Every care-queue review issue should link directly to its correction screen. Show once/twice daily explicitly rather than calling both an automatic daily dose.
8. **Test with actual caregivers.** Run observed tasks with older and less technical users, on real phones with larger text and screen readers. A user who guesses what a number means is evidence of a design failure. Help guides should support an understandable workflow, not compensate for ambiguous controls.
9. **Stop accumulating presentation overrides.** The contrast problem came from broad button styles competing with card-specific styles. Use scoped components and shared button/card states. Store template instructions, caregiver notes and historical snapshots separately; cleanup of mixed text is a compatibility repair, not the ideal data model.

## Verification and remaining limits

67 automated tests and the production build passed. Browser checks cover known legacy duplication, caregiver-note preservation, repeat review, all medication examples, dose-slot protection, button separation at 320/390/1280 pixels, profile text colors, large-text reflow, keyboard dialog behavior, save failures and offline reopening. Dedicated phone screenshots were captured for inspection.

These checks do not verify clinical dosing suitability, medication formulations, physical measuring devices, every accessibility requirement or every legacy V3 workflow. Firebase remains paused. Do not equate this release's passing tests with readiness for unrestricted medication use.
