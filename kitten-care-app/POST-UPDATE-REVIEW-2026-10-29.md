# Kitten Care review and next direction

Reviewed October 29, 2026 against the current React application. This is a source and automated workflow review, not observed caregiver or clinical validation. Medication automation remains enabled for private testing.

## Assessment

The app is becoming a capable log, but it still asks the caregiver to understand too much of its internal medication model. More warnings and menus will not fix that. The next release should make the next action obvious, make past actions easy to inspect, and explain why an action is unavailable. A visually attractive app that presents the wrong next action is a worse product.

## Fix shipped in 0.6.1

Preset plan creation and editing validate the prescription configuration separately from administration readiness. Missing or stale weights no longer block plan saving. Recording a preset dose as given still requires a valid recorded weight within 24 hours. Skipped/unable records remain available with a reason. Product confirmation, schedules and required Baytril approval remain required. Saving a plan never records a dose. An intended start date must be reviewed if actual treatment starts later.

## Priorities before expanding the medication library

1. **Treatment lifecycle:** startDate currently drives course day even if no first dose was recorded. Add planned, active, paused, completed and stopped states; distinguish intended start from actual first administration. Show how delayed starts and approved extensions are handled.
2. **Overlapping prescriptions:** duplicate-dose checks are scoped to a plan ID. Two separate plans for the same medication can bypass that protection. Add an overlap review with explicit replacement/continuation, backed by product/ingredient identity rather than name matching alone.
3. **Readable history and corrections:** the main navigation has no full care-history view. Stored snapshots are useful internally, but caregivers need a chronological history, filters and a correction/void trail. The short Undo action currently removes an event; it is not an audit trail.
4. **Timing consistency:** nextMedicationDue does not incorporate configured minimumSpacingHours. A late dose can leave the next scheduled time conflicting with the spacing warning. Show the conflict and request instruction review; do not silently rewrite a prescription.
5. **Stable dose slots:** recorded slots use clock strings. Editing the clock times can make old slot assignments ambiguous. Introduce stable slot identities and versioned schedules.
6. **Consistent medication rules:** custom weight-based plans retain an older-weight approval path, while presets have a hard 24-hour limit. Date, slot and duplicate protections also differ. Document and consolidate these rules, retaining only deliberate exceptions.
7. **Late records:** presets intentionally prevent historical given entries using today's calculation. Caregivers still need a safe late-entry workflow based on the prescription and weight applicable at that time, with the actual administered amount.
8. **Handoff accuracy:** the handoff summary can label an unsuccessful feeding attempt as the last feeding. It lists assigned medications without a clear active/ended distinction and needs last/next-dose details.
9. **Storage and migration completeness:** test realistic months of events/photos and storage exhaustion. Previous copies share the same browser and are not independent backups. Confirm the modern app covers required legacy features, especially litter plans/overrides and care history, before treating it as a replacement.

## Make it feel like a care companion

Start with a visual prototype, then implement and test it with caregivers. Use a warm neutral background, restrained accent colors, generous spacing, clear typography and consistent card hierarchy. Avoid making every card blue or every action equally prominent. Keep strong contrast, large labels and touch targets, visible focus, and reduced-motion support.

The Today screen should answer: Who needs care next? What do I do? What did I just finish? Use kitten photos, a clear next-action card, time-grouped tasks, an understandable completion state and a visible last-saved indicator. Provide a compact optional litter overview for experienced users and a guided single-kitten flow for beginners. Keep safety instructions visible without filling every screen with repeated boilerplate.

## Useful automation, in order

| Capability | Benefit | Required foundation |
| --- | --- | --- |
| Guided care round | Step through selected kittens for feeding, weight and prescribed medication; retain progress on interruption | Reliable drafts, lifecycle, history and explicit per-kitten confirmation |
| Reminder queue | Group related reminders, acknowledge/snooze, suppress completed tasks | Tested schedule engine, time-zone handling and delivery-state visibility |
| Weight trends | Show change and missing measurements using rescue-approved rules | Correct units, data quality and configured thresholds |
| Handoff summary | Generate a factual summary of feeds, weights, given/missed doses and outstanding tasks | Complete history, clear date range and reviewed export |
| Phone/calendar reminders | Offer user-controlled reminders and calendar export | Permission flow, privacy-conscious text, update/cancel behavior; calendars alone cannot confirm care happened |

Automatic dose arithmetic and reminder scheduling should remain deterministic and testable. A language model should not decide a drug, dose, duration, concentration or whether another dose is safe.

## AI worth exploring

1. **Draft care notes from speech:** caregiver says what happened; AI proposes structured fields. Show kitten, time, amount and units for confirmation. No background auto-save and no automatic medication administration record.
2. **Ask about this kitten's records:** factual answers such as last successful feeding or seven-day weight change, linked to the exact dated records. Say when data is missing. Use direct calculations for numbers rather than model arithmetic.
3. **Draft handoffs and mentor updates:** AI turns selected records into a readable summary. Caregiver reviews before sharing; no automatic messages.
4. **Explain the app:** contextual help in plain language, optional read-aloud and translation. Medication text must retain the approved meaning and original units; clinical instructions require review rather than free paraphrasing.
5. **Import instructions as a draft:** photo/document extraction can reduce typing, but flag unreadable strength, route, units and frequency. Require human confirmation before creating an actionable plan. Uploaded text is data, never instructions for the AI to execute.

Before enabling AI, decide who can access records, what leaves the device, retention/deletion rules, consent, cost limits and offline behavior. Keep credentials on a protected backend. Add an evaluation set for wrong-kitten selection, hallucinated amounts, missing records, ambiguous speech and malicious imported text. Cloud hosting alone does not provide identity, authorization, audit history or safe synchronization.

## Recommended sequence

First fix lifecycle, overlap, history and timing consistency. Then prototype the Today/guided-round redesign and test interrupted and overnight care with both older and experienced caregivers. Next build reminder/handoff automation. Add one AI feature last: reviewed note drafting or factual record questions. Expand only after measuring completion time, errors, recovery success and caregiver understanding. Real-device accessibility sessions and physical measuring-device validation remain outstanding.
