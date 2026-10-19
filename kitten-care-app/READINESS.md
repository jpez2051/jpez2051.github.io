# Readiness status

This release is a tested migration preview. It is not a feature-complete replacement for V3.

## Verified in this release

- Positive amounts for successful feedings; attempts do not reset feeding timers.
- Explicit confirmation and positive actual amounts for medication administration.
- Stale-weight approval checks, invalid-weight rejection, local date input helpers.
- Verified local writes, visible failures, serialized saves, corrupt-storage protection.
- Invalid backup rejection; missing and duplicate record checks.
- Readable primary text, larger-text settings, labeled navigation, keyboard dialog containment.
- Urgent contact settings and direct call links; clearer background-alarm limits.
- Selective handoff summaries and undo for new care entries.
- Scoped offline shell and install manifest, with browser offline reopening verification.
- Automated domain/storage tests and repeatable production-browser regression script.

## Required before replacing V3

- Finish shared litter medication plans with individual overrides and every schedule type.
- Bring feeding sessions, bulk weighing, photos/cropper, weight insights, editable care history, and archived profiles to parity.
- Complete onboarding through starting weights, prescription review, contacts and backup.
- Implement medication due scheduling, daily-weight and concern queues, including timezone boundary tests.
- Complete screen-reader, 200% zoom, large-text and contrast audits across populated screens.
- Verify backup restore and offline update recovery with realistic multi-litter records.

## Firebase integration prerequisites

Inspect the existing Firebase project and data schema before implementing accounts, authorization rules, photo storage, cross-device conflict resolution, and migration. Do not overwrite the existing deployment or user records until a migration is tested against a backup.
