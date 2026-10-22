# Medication library

Version 0.5.0 / Build 2026.10.22.5. Source: rescue-owner instructions and frequency confirmations supplied October 22, 2026. The app tracks prescribed care; it does not select treatments.

| Medication | Volume per dose | Frequency | Course |
| --- | --- | --- | --- |
| Albon | Day 1: 0.5 mL/lb; days 2–14: 0.25 mL/lb | Once daily | 14 total days |
| Azithromycin | 0.1 mL/lb | Once daily, confirmed by owner | 10 days; serious-condition extensions require updated rescue/veterinary instructions |
| Baytril (enrofloxacin) | 0.022 mL/lb | Once daily, confirmed by owner | Select prescribed duration, 5–10 days; recorded vet-tech approval required |
| Clavamox | 0.1 mL/lb | Twice daily | Select prescribed duration, 5–7 days |

The app uses supplied volume rates directly with 453.59237 grams per pound. No mg/mL concentration or pill strength has been invented. Each plan requires confirmation of prepared liquid supplied or confirmed by the rescue for these instructions. The incomplete azithromycin pill-in-5-mL note is not a mixing recipe. This release does not introduce a rule that unspecified frequencies always mean daily: the daily frequencies above were explicitly supplied/confirmed by the owner.

Calculations and administration require a valid weight no older than 24 hours, without a stale-weight override. Course ends are inclusive. Albon retains first-day history checks and blocks another dose when day 1 was already completed today. Courses do not extend automatically.

Clavamox has two distinct planned times. A given entry records its scheduled dose time as well as its actual administration time; duplicate slots and a third daily dose are rejected. Reminder calculations keep the second dose available after the first. Skipped/unable entries do not count as given. Legacy given entries without a slot occupy the earliest available slot so they cannot disappear from daily counts.

Existing Azithromycin and Baytril drafts require Review medication plan and reconfirmation; review preserves medication IDs, care history, selected duration and additional instructions while updating the built-in instructions. Internal reference field names remain unchanged for storage compatibility. Custom prescriptions remain available.
