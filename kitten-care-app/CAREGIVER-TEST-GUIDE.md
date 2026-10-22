# Private caregiver testing guide

Medication automation remains enabled. Use made-up kittens and synthetic care records for these tasks. A passing software test is not approval to administer a medication. Shelterluv remains the official rescue record.

## Before a session

Download a backup, verify that the file exists, and close any older-version app tabs. Use the same current app version on both tabs when testing synchronization. Do not clear the browser's real foster records merely to prepare a test. Prefer a separate browser profile with made-up records.

Invite caregivers with a mix of ages, vision needs and technical experience. Test on their own phones where possible, including a smaller screen and larger text. Ask permission before recording observations; avoid collecting kitten medical details, personal contact information or private screenshots.

Say: “We are testing the app, not you. Please tell me what you think each screen means.” Give a goal without naming the button. Do not coach until the participant is stuck; record where help was needed. Stop any task that could be confused with real medication administration.

## Tasks

1. **Create a litter with two kittens.** Find where to add the second kitten, check that the DOB carries across, and change one kitten's DOB. Success: both kittens belong to the correct litter without assistance.
2. **Log and undo a feeding.** Record a measured feed, then a refused feed with a reason. Success: the user can explain which entry changes the next-feed time and can correct a mistake.
3. **Find today's care.** From a kitten profile, return to Care Now and open a review item. Success: the user knows where they are and the review action opens the relevant plan directly.
4. **Explain the medication panel.** Use a synthetic Albon plan and fresh synthetic weight. Ask “Which number is the rate? Which is the amount per dose? What was last given, and when is the next dose?” Success: no guessing or help. Then expand the full instructions and calculation.
5. **Exercise safety warnings.** Use explicitly synthetic device limits, a weight outside the configured range, a very small calculated volume, a different actual amount and a dose earlier than the configured interval. Success: warnings are noticed, automation still displays the calculation, and weight warnings require rechecked grams and saving exceptions requires a reason/contact or “testing only” and explicit acknowledgment. The participant must not interpret the exception as veterinary approval.
6. **Test two daily doses.** Record one synthetic Clavamox slot, try it again, then select the other slot. Success: the duplicate is rejected, the other remains available, and an early/too-close dose needs review. No third given dose can be recorded for that treatment day.
7. **Check product identity.** Enter a test bottle label, preparation, approving contact and measuring-device details in plan review. Save a test dose and inspect a downloaded backup: the plan, weight, instruction revision, warnings and exception are preserved in the dose record.
8. **Test two tabs.** Leave a draft open in tab A and save care in tab B. Success: A updates, medication confirmations reset when relevant data changes, and a stale in-flight save cannot overwrite B. A rejected draft remains available to review and resubmit.
9. **Backup and restore.** Download the current and previous saved copies. In the separate test profile, restore a known-good file after reviewing its record counts. Try an invalid file and a newer unsupported schema. Success: invalid files do not replace records; valid restoration is explicit.
10. **Accessibility pass.** Repeat key tasks with larger app text, browser/OS text scaling, keyboard only, and an actual screen reader. Check visible focus, announced labels/errors, scroll access to all controls, contrast and targets on the real device. Automated keyboard checks do not substitute for this task.

## Record results

| Item | Result |
| --- | --- |
| Date, app version, device/browser | |
| Preferred text size / accessibility tools | |
| Task number and goal | |
| Completed without help / with help / not completed | |
| What the participant expected | |
| Where hesitation, wrong turns or guessing occurred | |
| Exact confusing label, number or warning | |
| Safety misunderstanding or data-loss issue | |
| Recommended correction and retest result | |

Treat any misunderstanding of the per-dose amount, duplicate administration, lost record, or inability to reach urgent help as a blocking finding for wider rollout. Fix and retest it. Do not declare usability testing complete based on automated results or a guide alone.

## What still needs people

Actual caregiver sessions, physical measuring-device validation, rescue-approved clinical limits and real screen-reader/device testing must be performed by participants and the rescue. This guide prepares that work; it does not claim those sessions have happened.
