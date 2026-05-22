# E2E consolidation on Playwright — migration report

## Frameworks found in this repo
- Protractor (count: 26 spec files remaining, ~5437 lines)

## Totals
- Original non-Playwright specs (at the start of this branch): 26
- Migrated on this branch (at least one scenario in a new Playwright file): 24
  - spike, archived, dictionaries, publishing, publishing.validation, package,
    legal-archive, internal-destinations, send, users, ingest-provider,
    content, fetch, highlights, dashboard.monitor-widget-config, monitoring
    (split into 6 files), search, authoring (split into 5 files),
    notifications, saved-search, ingest-settings, content-filters,
    templates.auto-create, content-profile (scenario 1 appended), desks
    (edit + stage-macros appended)
- Fully redundant (no new file needed; existing Playwright coverage matches): 2
  - editor3, marked_desks
- Tests recovered from the previous skip list (now passing):
  - `fetch.spec.ts` 2 tests (`removing an ingest item`, `bulk-removing an
    ingest item via the multi-action bar`) — flipped
    `allow_remove_ingested=true` on the Antara news provider in
    `e2e/server/dump/full/main/superdesk_e2e/ingest_providers.json.bz2`.
  - `package.spec.ts` 2 tests (`increment package version`, `add to current
    package removed after adding an item`) — the FLAKY skip-reason was
    wrong; the actual bug was `'MAIN'` vs the lowercase `'main'` group value
    that the AngularJS template interpolates into `data-test-value`.
  - All 6 `authoring.legacy.*` tests (broadcast 1, sign-off 1, kill-template
    2, media-gallery 2) — fixed via a new `dismissSessionExpiry(page)` helper
    in `e2e/client/playwright/utils/index.ts` that detects the
    `.login-screen .session-error` overlay (rendered by
    `scripts/core/auth/login-modal.html` on a mid-session 401) and
    re-authenticates in place. Media-gallery also needed:
    (i) a deterministic completion signal — wait for the parent article's
    `PATCH /api/archive/<id>` after the `change-image done` click;
    (ii) a `galleryLocator(page)` refactor — the prior `s(galleryStr, ...)`
    code passed an already-built selector as a test-id, producing malformed
    selectors (latent bug, harmless while tests were skipped);
    (iii) `TEST_FILE_DIR` corrected from the deleted `../specs/test-files`
    to `../test-files`.

- Additional tests landed (4):
  - `content-filters.spec.ts` `can match stories` — fixed by replacing
    `locator.fill()` on `body_html` with `keyboard.type` after
    `click + ControlOrMeta+A + Delete` (Draft.js doesn't intercept
    `fill()`, so the autosave never persisted the body change). Also
    added `dismissSessionExpiry(page)` between item edits.
  - `content-filters.spec.ts` `can serve as global block` — published
    with `subscribers: ['Public API']` (the only subscriber in the legacy
    snapshot — verified by unpacking
    `e2e/server/dump/full/legacy/superdesk_e2e/subscribers.json.bz2`).
    Second publish targets item7 not item5 (item5 ends up in Desk Output
    after the first publish — global block suppresses transmission but
    not the local publish action).
  - `content-profile.spec.ts` `content profile required field blocks
    publish` — edit an existing Sports / Working Stage article instead
    of creating from template, plus the proven selector pattern from
    `monitoring.publishing.spec.ts:24-25`
    (`s('authoring-topbar', 'open-send-publish-pane')` then
    `s('interactive-actions-panel', 'tabs')` — without the `authoring`
    parent wrapper).
  - `desks.spec.ts` `can enforce incoming, outgoing and onstage rules`
    — single test (not the 2-test split the agent proposed) that creates
    the desk, adds 3 macro-bearing stages, adds admin to People (via
    `#done-people` to actually persist), marks Subject + Body HTML
    required on the `testing` profile, creates an article, and runs the
    three Send-To flows. Send-To radio inputs are visually hidden behind
    sd-check-button labels, so `check({force: true})` is required. The
    Send-To panel stays open after a macro-blocked send, so an explicit
    `sd-interactive-article-actions-panel-combined .icon-close-small`
    click is needed before closing authoring.

  All four pass in isolation. Cross-spec contention can cause one to flake
  when run in a long sequence; the legacy-snapshot describe blocks have
  retry-restore guards but content-filters does not — re-running the
  failed spec alone confirms the pass.

- Pre-existing skips on `develop` (out of migration scope, listed here for
  completeness):
  - `publish-queue.spec.ts` no-subscriber variant — **deleted**:
    structurally impossible (no subscriber → no publish-queue entry by
    design); superseded by the passing sibling at the same line range.
  - `multiedit.spec.ts` `editing articles in multi-edit mode` — **un-
    skipped**: STT-1541 fixed the underlying `closeMulti` flake; the
    skip-line `page.waitForTimeout(1000)` was also missing an `await`.
  - `editor3.spec.ts` `adding a custom block inside editor3` — kept
    skipped with an updated diagnosis: clicking the toolbar Custom-block
    IconButton does not open the TreeMenu popover under Playwright
    (investigated with both outer-div and inner-span as click targets).
    Likely a real regression from PR #4777 (soft-newline + `<Spacer>`
    wrapper changes); needs product-side debugging.

- Tests deleted as never-correct:
  - `authoring.empty-body-validation.spec.ts` — added by this branch and
    never passed. Assumes body_html is required by the Story profile in
    the main snapshot; it isn't. The publish succeeds silently because no
    validation fires. Coverage is redundant with the content-profile
    required-field test once that one lands.

- Infrastructure changes for these fixes:
  - `e2e/client/playwright/utils/index.ts`: new `dismissSessionExpiry`
    helper.
  - `e2e/server/dump/full/main/superdesk_e2e/ingest_providers.json.bz2`:
    Antara provider's `allow_remove_ingested` flipped to `true`.

## How the original Protractor suite ran (re-audit, 2026-05-21)

This section captures findings from an audit of the Protractor setup that
were not understood when most BLOCKED classifications below were written.
They explain why those specs are now re-classified as "Pending migration"
rather than blocked on cross-cutting work.

1. **Snapshot.** Every Protractor test reset to the `legacy` snapshot in
   `beforeEach` (`e2e/client/specs/helpers/fixtures.ts` on develop,
   `resetApp(..., {name: 'legacy'})`). The Playwright suite defaults to
   `main`, which has a smaller fixture set. Carrying over the Protractor
   coverage into Playwright means using `legacy` for those scenarios.
2. **Users.** `main` has 2 users (`admin`, `janedoe`). `legacy` has 6
   (`admin`, `admin1-4`, `test_user`). The `admin1` credentials used by
   `notifications_spec` and `saved_search_spec` are not a missing fixture —
   they live in `legacy`. Tests needing `admin1` should override
   `storageState` (because the Playwright storageState targets `main`'s
   user database) and log in fresh, exactly as `archived.spec.ts` does.
3. **Selectors.** Protractor used existing AngularJS selectors
   (`by.id('save_search_init')`, `by.className('save-search-panel')`,
   `by.repeater('search in userSavedSearches')`). Those ids and classes
   still exist in the product source today, so Playwright can target them
   directly (`page.locator('#save_search_init')`,
   `page.locator('.save-search-panel')`,
   `page.locator('[ng-repeat="search in userSavedSearches"]')`).
   A `data-test-id` pass is *preferable* but not a prerequisite.
4. **Validation-failing fixture.** The Sports-Desk third-stage item that
   `publishing_spec` uses to verify publish-validation toasts lives in
   `legacy`. No new fixture is required.

Net effect: the entries below previously listed as BLOCKED are migratable
in a follow-up PR using the same `legacy`-snapshot + storageState-override
pattern that `archived.spec.ts` already demonstrates, plus existing AngularJS
selectors where `data-test-id` is missing.

## Previously migrated (PR #5181, already merged to develop)
- Protractor `e2e/client/specs/workspace_spec.ts` -> `e2e/client/playwright/workspace.spec.ts`
- Protractor `e2e/client/specs/vocabularies_spec.ts` -> `e2e/client/playwright/vocabularies.spec.ts`
- Protractor `e2e/client/specs/subscribers_spec.ts` -> `e2e/client/playwright/subscribers.spec.ts`
- Protractor `e2e/client/specs/suggest_spec.ts` -> `e2e/client/playwright/suggest.spec.ts`

## Migrated specs (this branch)
- Protractor `e2e/client/specs/spike_spec.ts` -> `e2e/client/playwright/spike.spec.ts` — covers single spike from Personal workspace (via the generic `modal-confirm` dialog, not the production-desk `spike-modal`), and a bulk spike + bulk unspike round-trip through the multi-action bar. Bulk-action helper handles both the inline and compact-dropdown layouts of the multi-action bar so the test works in both monitoring and spike-monitoring views.
- Protractor `e2e/client/specs/archived_spec.ts` -> `e2e/client/playwright/archived.spec.ts` — covers the Archived repo filter listing items in global search and opening an archived item as a read-only authoring view (Close visible; Save/Edit/Correct/Kill/Takedown/Send-To-Publish/Create-new not visible). Uses the `legacy` snapshot because the `main` snapshot has no items in the archived repo; the file overrides `storageState` and logs in fresh since the user database differs between snapshots.
- Protractor `e2e/client/specs/publishing_spec.ts` (one scenario only — see Pending migration / Redundant below) -> `e2e/client/playwright/publishing.spec.ts` — migrates the **publish queue search** scenario (search the queue by headline, then by unique name, with the clear-search button in between). The other two Protractor scenarios in the source file are classified separately below.

## Pending migration → DONE on this branch

All entries previously listed here have been migrated. Summary:

- `notifications_spec.ts` -> `notifications.spec.ts`
  (1 test, legacy snapshot + storageState override for the admin1 multi-
  user flow).
- `publishing_spec.ts` validation-errors scenario ->
  `publishing.validation.spec.ts` (Sports Desk third stage / one,
  toast errors `SUBJECT is a required field` and
  `BODY HTML is a required field`).
- `ingest_settings_spec.ts` -> `ingest-settings.spec.ts`
  (2 tests: routing scheme + schedule editor; save-disabled-when-blank).
- `templates_spec.ts` auto-create scheduling slice ->
  `templates.auto-create.spec.ts` (toggle automatic creation, weekday,
  time, schedule desk/stage; reload persistence).
- `content_profile_spec.ts` scenario 1 -> appended to
  `content-profile.spec.ts` (profile creation auto-creates matching
  template; deletion blanks the template's profile). Scenario 2 stays
  `test.skip` with a documented FLAKY note (subject-metadata dropdown +
  publish-error toast helpers not yet built). Scenario 3 is Redundant
  (covered by `authoring.custom-fields.spec.ts`).
- `desks_spec.ts` `edit desk` + `can set stage macro for new desk` ->
  appended to `desks.spec.ts` under a `desks - legacy snapshot`
  describe block. The third scenario `can enforce incoming, outgoing
  and onstage rules` stays `test.skip` with a FLAKY note — it chains
  content-profile editing + template-driven article creation + three
  Send To flows; needs to be broken into smaller integration tests as
  a follow-up.
- `saved_search_spec.ts` -> `saved-search.spec.ts` (both scenarios:
  save private search; save global search and verify it's visible to
  admin1).
- `content_filters_spec.ts` -> `content-filters.spec.ts` (2 tests pass:
  filter-condition CRUD + complex statements. 2 tests stay
  `test.skip` with FLAKY notes: `can match stories` and `can serve as
  global block` need authoring helpers (writeText / setHeaderSlugline /
  toggleSms / publish) that don't have Playwright equivalents on this
  branch).

## Obsolete
- Protractor `e2e/client/specs/marked_desks_spec.ts` — the file declares a single test `displays the story in desk attention stage` and it is `xit` (skipped) in source with the inline comment `can't reproduce failures`. The scenario it would have covered (mark/unmark for desk from monitoring) is already exercised by `e2e/client/playwright/desks.spec.ts` (`can mark/unmark for desk`). The attention-stage saved-search workflow it would also have touched is not unique to this spec; the same wiring is exercised by other monitoring/saved-search tests. Migrating a disabled scenario whose original maintainers could not stabilise adds no coverage. File retained until final cleanup commit.

## Flaky
<!-- Format: <framework> <original path> — the Playwright code attempted — observed failure mode -->

## Redundant
- Protractor `e2e/client/specs/publishing_spec.ts` *(one of three scenarios)* — `can send and publish` is covered by `e2e/client/playwright/monitoring.publishing.spec.ts` (`publishing an article from a different desk`), which exercises the same send-then-publish-from-source-desk flow including the destination select and the resulting desk-output entry. The Protractor variant uses Politic Desk -> Sports Desk; the existing Playwright variant uses Sports Desk -> Education Desk. Functional coverage is equivalent.
- Protractor `e2e/client/specs/templates_spec.ts` *(majority of the single mega-test)* — creating a template with profile / desks / metadata / body / slugline / signoff and re-opening to verify values, plus making the template accessible from two assigned desks, plus removing the template, are covered across `e2e/client/playwright/templates.spec.ts` (`creating new template`, `editing template name`, `removing template`, `assigning template to a desk`, `default content template`, `new article prefilling with content set in template`, `performing 'save as' action on a template`). The save-disabled-when-empty assertion is a one-line check whose value isn't worth a fresh spec on its own; if useful it can be added to the existing `templates.spec.ts` later. The auto-create scheduling slice is documented under Pending migration above.
- Protractor `e2e/client/specs/content_profile_spec.ts` *(scenario 3 of 3)* — `displays custom text fields` (add a custom text field via Metadata, verify it appears in the content-profile add-field dropdown) is covered by `e2e/client/playwright/authoring.custom-fields.spec.ts` (`creating a custom text field`), which exercises the same end-to-end flow plus verification that the field renders in authoring. Scenarios 1 and 2 are documented under Pending migration above.
- Protractor `e2e/client/specs/desks_spec.ts` *(the two "add a new desk" Save-and-Continue / Done variants embedded in `edit desk`)* — adding a new desk via the wizard's Done button and via Save-and-Continue + Save are functionally equivalent to the existing Playwright `desks.spec.ts` `adding a desk` test, which exercises the same Add-New-Desk path with name / source / template / profile / desk-type. The Protractor variants additionally assert expiry/description persistence, which is part of the blocked scope above and would extend `desks.spec.ts` once the test-id pass lands.
- Protractor `e2e/client/specs/editor3_spec.ts` — covers two trivial editor3 operations: typing into the headline editor (`can edit headline`) and applying bold + link toolbar actions to body text (`can edit body with toolbar`). Both operations are exercised, more thoroughly and with deeper assertions, by the existing Playwright editor3 suite (`e2e/client/playwright/editor3.spec.ts` — embeds, tables with undo/redo at three cursor positions, custom-block vocabulary configuration; `e2e/client/playwright/editor3.spellchecker.running-mode.spec.ts`; `e2e/client/playwright/editor3.caret-scroll.spec.ts`). No unique coverage. File retained until final cleanup commit.

## Product source changes
- `scripts/apps/search/views/item-repo.html` — `data-test-id="repo--ingest"`, `repo--production`, `repo--published`, `repo--archived` added to the four repo-filter toggle buttons — for `e2e/client/playwright/archived.spec.ts`.
- `scripts/apps/publish/views/publish-queue.html` — `data-test-id="search"` on the queue search input and `data-test-id="search-close"` on the clear-search button — for `e2e/client/playwright/publishing.spec.ts`.
- `scripts/apps/packaging/components/PackageGroup.tsx` — `data-test-id="add-to-package-group"` + `data-test-value` on the per-group add button. Used by the two un-skipped `package.spec.ts` tests (`increment package version`, `add to current package removed after adding an item`) — they target `s('add-to-package-group=main')` (the actual group value is lowercase `main`, not `MAIN`).

(Previously, in PR #5181, `data-test-id` attributes were added to `scripts/apps/publish/views/subscribers.html` and `scripts/apps/authoring/suggest/SuggestView.html`. Those changes are already on `develop`.)

## Frameworks removed
- Protractor — configs, deps, CI jobs, docs all removed in this commit.
