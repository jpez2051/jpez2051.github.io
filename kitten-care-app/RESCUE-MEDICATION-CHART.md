# Rescue medication chart — initial reference entries

Version 0.4.0 / Build 2026.10.22.1. Source: rescue-owner transcription supplied October 22, 2026. This is a reference library, not a list of medications to administer together or a diagnosis/prescribing feature.

## Supplied entries

| Medication | Supplied chart rate | Course | Status |
| --- | --- | --- | --- |
| Albon | First treatment day 0.5 mL/lb; subsequent days 0.25 mL/lb | First day plus 13 more days | Liquid preparation and dose frequency unconfirmed |
| Azithromycin | 0.1 mL/lb | 10 days; no automatic extension | Pill strength, final liquid preparation and frequency unconfirmed |
| Baytril (enrofloxacin) | 0.022 mL/lb | Rescue-approved 5–10 days | Liquid preparation and frequency unconfirmed; recorded vet-tech approval required |

The owner clarified that the chart name was written “Baryril (enrofloxacin)” and authorized correcting the spelling. The brand is displayed as Baytril (enrofloxacin); the numeric rate was not changed. The azithromycin note “add 5 mL water to pill and dissolve” is retained as an incomplete source note, not an executable mixing recipe.

## Implemented

- Dropdown with the three source entries and a custom free-text prescription option.
- Read-only source rates, indications, notes, course dates and duration selection.
- Exact grams-to-pounds conversion using 453.59237 grams/lb.
- First-day/subsequent-day calculation phases; local calendar course days and end dates.
- Weight validity, future-timestamp and 24-hour recency checks at calculation and administration.
- No older-weight override for rescue-chart calculations.
- Baytril approval reference captured and required before saving a chart plan.
- Incomplete preparations saved only as visible chart drafts. No calculated administration amount, automatic dose reminder or “given” record is permitted while required chart details are missing.
- First treatment-day history must be recorded or explicitly confirmed as already completed outside the app before later-day Albon rates can be used.
- No automatic extension beyond the approved course; no use of today's chart calculation for backdated administration on a different treatment day.
- Schema 7 preserves the chart reference/revision and prevents older clients from silently interpreting this mode as a manual prescription.

## Details needed from the rescue before activating automatic amounts

1. Product name, route, and exact liquid strength/preparation that each mL/lb rate refers to.
2. How often doses are given, and confirmation that the rate is per administration rather than a daily total.
3. For azithromycin, tablet/pill strength and the complete preparation instructions, including the intended final volume and any supplied storage/expiry instructions.
4. For Baytril, approval for the kitten, formulation, rate and exact course duration.
5. Appropriate measuring-device precision for the resulting volumes.

The 24-hour weight limit follows the application's existing medication-weight policy; the rescue can require a stricter limit. No product concentration, mixing recipe or frequency was inferred from external product labels.

Tests cover conversion, loading/maintenance phases, local course boundaries, missing/old/future weights, incomplete preparation blocking, course expiry, approval and custom-entry preservation. Browser tests cover selection, source display, draft persistence, blocked administration and missing approval.
