# E2E consolidation on Playwright — migration report

## Frameworks found in this repo
- Protractor (count: 30)

## Totals
- Original non-Playwright specs: 30
- Migrated: 3
- Blocked: 0 (see below)
- Obsolete: 0 (see below)
- Flaky: 0 (see below)
- Redundant: 0 (see below)

## Migrated specs
- Protractor `e2e/client/specs/workspace_spec.ts` -> `e2e/client/playwright/workspace.spec.ts` [65a6ef935] — Given the authenticated user is on the dashboard, when they use the workspace hotkeys, then the app switches to monitoring, spiked, personal, search, and back to dashboard.
- Protractor `e2e/client/specs/vocabularies_spec.ts` -> `e2e/client/playwright/vocabularies.spec.ts` [4b719937a] — Given the vocabularies settings page is open, when the user edits the Categories vocabulary name and cancels, then the original vocabulary data is restored.
- Protractor `e2e/client/specs/subscribers_spec.ts` -> `e2e/client/playwright/subscribers.spec.ts` [pending] — Given the publish settings page is open, when the user inspects and edits the default subscriber from the snapshot, then the list shows that subscriber and the save button only enables after changing the target type and destination format.

## Blocked
- None yet.

## Obsolete
- None yet.

## Flaky
- None yet.

## Redundant
- None yet.

## Product source changes
- `scripts/apps/publish/views/subscribers.html` — `data-test-id` added to subscriber list rows — for `e2e/client/playwright/subscribers.spec.ts`

## Frameworks removed
- None yet.
