# E2E consolidation on Playwright — migration report

## Frameworks found in this repo
- Protractor (count: 26 spec files remaining, ~5437 lines)

## Totals
- Original non-Playwright specs (at the start of this branch): 26
- Migrated on this branch: 2
- Partially migrated (file kept because some scenarios are blocked / redundant): 1
- Blocked: 2 (one carried over from PR #5181, see below)
- Obsolete: 1
- Flaky: 0
- Redundant: 1

## Previously migrated (PR #5181, already merged to develop)
- Protractor `e2e/client/specs/workspace_spec.ts` -> `e2e/client/playwright/workspace.spec.ts`
- Protractor `e2e/client/specs/vocabularies_spec.ts` -> `e2e/client/playwright/vocabularies.spec.ts`
- Protractor `e2e/client/specs/subscribers_spec.ts` -> `e2e/client/playwright/subscribers.spec.ts`
- Protractor `e2e/client/specs/suggest_spec.ts` -> `e2e/client/playwright/suggest.spec.ts`

## Migrated specs (this branch)
- Protractor `e2e/client/specs/spike_spec.ts` -> `e2e/client/playwright/spike.spec.ts` — covers single spike from Personal workspace (via the generic `modal-confirm` dialog, not the production-desk `spike-modal`), and a bulk spike + bulk unspike round-trip through the multi-action bar. Bulk-action helper handles both the inline and compact-dropdown layouts of the multi-action bar so the test works in both monitoring and spike-monitoring views.
- Protractor `e2e/client/specs/archived_spec.ts` -> `e2e/client/playwright/archived.spec.ts` — covers the Archived repo filter listing items in global search and opening an archived item as a read-only authoring view (Close visible; Save/Edit/Correct/Kill/Takedown/Send-To-Publish/Create-new not visible). Uses the `legacy` snapshot because the `main` snapshot has no items in the archived repo; the file overrides `storageState` and logs in fresh since the user database differs between snapshots.
- Protractor `e2e/client/specs/publishing_spec.ts` (one scenario only — see Blocked/Redundant below) -> `e2e/client/playwright/publishing.spec.ts` — migrates the **publish queue search** scenario (search the queue by headline, then by unique name, with the clear-search button in between). The other two Protractor scenarios in the source file are classified separately below; the source file therefore stays until they are addressed too.

## Blocked
- Protractor `e2e/client/specs/notifications_spec.ts` — create a user mention and verify the mentioned user's unread badge clears after sign-in — current `main` snapshot no longer accepts the legacy `admin1` / `admin` credentials used by the spec, so migrating this scenario needs a maintained secondary-user test fixture or snapshot update. (Carried over from PR #5181; spec file kept until final cleanup.)
- Protractor `e2e/client/specs/publishing_spec.ts` *(one of three scenarios)* — `stops publishing if there are validation errors` expects a Sports Desk item in the third stage that fails publish validation with `SUBJECT is a required field` / `BODY HTML is a required field` toast messages, but the `main` snapshot has no such fixture and the rest of the spec already runs cleanly against `main`. Would need either a maintained validation-failing fixture (preferred) or a way to spike a temporary item that bypasses required-field enforcement during creation. The other two scenarios — publish-queue search (migrated) and send-and-publish from one desk to another (redundant; see below) — are addressed.
- Protractor `e2e/client/specs/saved_search_spec.ts` — covers two scenarios: (1) save a private search from the global-search filter panel and verify it appears in the user's saved searches, (2) save a global search, log out, log in as `admin1`, verify the global search is visible to that user. Scenario (2) hits the same `admin1` credentials issue as `notifications_spec.ts` — neither the `main` nor `legacy` snapshot has a working second test user — and migrating scenario (1) alone would require ~10 product-source `data-test-id` additions (priority filter list items, `save_search_init`, `save-search-panel`, `search_name`, `search_description`, `search_save`, `search_global`, `userSavedSearches`/`globalSavedSearches` rows, `.search-name`) while still leaving the file in place for scenario (2). Treating the whole spec as blocked until a maintained secondary-user fixture exists.

## Obsolete
- Protractor `e2e/client/specs/marked_desks_spec.ts` — the file declares a single test `displays the story in desk attention stage` and it is `xit` (skipped) in source with the inline comment `can't reproduce failures`. The scenario it would have covered (mark/unmark for desk from monitoring) is already exercised by `e2e/client/playwright/desks.spec.ts` (`can mark/unmark for desk`). The attention-stage saved-search workflow it would also have touched is not unique to this spec; the same wiring is exercised by other monitoring/saved-search tests. Migrating a disabled scenario whose original maintainers could not stabilise adds no coverage. File retained until final cleanup commit.

## Flaky
<!-- Format: <framework> <original path> — the Playwright code attempted — observed failure mode -->

## Redundant
- Protractor `e2e/client/specs/publishing_spec.ts` *(one of three scenarios)* — `can send and publish` is covered by `e2e/client/playwright/monitoring.publishing.spec.ts` (`publishing an article from a different desk`), which exercises the same send-then-publish-from-source-desk flow including the destination select and the resulting desk-output entry. The Protractor variant uses Politic Desk -> Sports Desk; the existing Playwright variant uses Sports Desk -> Education Desk. Functional coverage is equivalent.
- Protractor `e2e/client/specs/editor3_spec.ts` — covers two trivial editor3 operations: typing into the headline editor (`can edit headline`) and applying bold + link toolbar actions to body text (`can edit body with toolbar`). Both operations are exercised, more thoroughly and with deeper assertions, by the existing Playwright editor3 suite (`e2e/client/playwright/editor3.spec.ts` — embeds, tables with undo/redo at three cursor positions, custom-block vocabulary configuration; `e2e/client/playwright/editor3.spellchecker.running-mode.spec.ts`; `e2e/client/playwright/editor3.caret-scroll.spec.ts`). No unique coverage. File retained until final cleanup commit.

## Product source changes
- `scripts/apps/search/views/item-repo.html` — `data-test-id="repo--ingest"`, `repo--production`, `repo--published`, `repo--archived` added to the four repo-filter toggle buttons — for `e2e/client/playwright/archived.spec.ts`.
- `scripts/apps/publish/views/publish-queue.html` — `data-test-id="search"` on the queue search input and `data-test-id="search-close"` on the clear-search button — for `e2e/client/playwright/publishing.spec.ts`.

(Previously, in PR #5181, `data-test-id` attributes were added to `scripts/apps/publish/views/subscribers.html` and `scripts/apps/authoring/suggest/SuggestView.html`. Those changes are already on `develop`.)

## Frameworks removed
<!-- Filled in when the final cleanup commit lands -->
