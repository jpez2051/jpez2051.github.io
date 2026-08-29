# A4A Kitten Care application migration

This is the parallel TypeScript application that will replace the current V3 static implementation after feature-parity testing.

## Commands

- `pnpm dev` — local development
- `pnpm test` — domain and migration tests
- `pnpm build` — type-check and build the static site into `../kitten-care/`

The local repository automatically imports existing `a4a-kitten-care-v3` browser data into the new schema on first load. The current V3 files remain the production fallback during migration.
