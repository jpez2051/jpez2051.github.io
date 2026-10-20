# Firebase preview preparation

Existing project supplied by owner: `a4a-kitten-tracker`.

Status: configuration prepared locally; Firebase account connection and project inspection pending. No hosting site, channel, database, auth provider, or rule has been changed.

The public folder points only to the built `kitten-care` application. Source files and other sites in the GitHub repository are excluded. This configuration contains Hosting only; it does not deploy Firestore, Storage, Authentication, or Functions.

## Before the first preview

1. Connect the official Firebase plugin using the Google account authorized for this project.
2. Confirm the project ID, Hosting site ID(s), existing preview/live releases, registered web apps, enabled auth providers and authorized domains.
3. Inspect the existing database/storage schema and access rules without changing them. Confirm a recoverable backup before data migration.
4. Select the intended existing Hosting site explicitly. If multiple sites exist, add its confirmed `site` value to this configuration before deploying.
5. Build and run domain/storage and browser checks for `kitten-care-app`.
6. Deploy to a preview channel named `kitten-care-dev`, with a seven-day expiration, using the confirmed project/site.
7. Refetch the deployed HTML, every referenced JS/CSS asset, manifest, icon and worker; verify their contents against the build. Test online/offline and expiry/update behavior on the preview origin.

Do not use the live-channel deploy or clone command for this preview. The following command is documentation for the authenticated CLI after the site has been verified, not an indication that deployment occurred:

```sh
firebase hosting:channel:deploy kitten-care-dev --expires 7d --project a4a-kitten-tracker --config deployment/firebase-preview/firebase.json
```

Run from the repository root with a verified site configured. Preview URLs are temporary and are not access-control boundaries. Hosting previews can share the project's real backend resources. The current build uses browser storage and does not initialize Firebase services. Add cloud accounts/sync only after backend inspection and authorization/emulator testing.

## Browser data migration

Browser storage does not cross origins. Records at `jpez2051.github.io` will not automatically appear at a Firebase preview or live URL. Download a backup from the old origin, keep the original, restore a copy on the preview, and compare kittens, litters, prescriptions, photos and care history. Do not test migration with the only copy of real records.

References: [Firebase preview channels](https://firebase.google.com/docs/hosting/test-preview-deploy), [Hosting configuration](https://firebase.google.com/docs/hosting/full-config).
