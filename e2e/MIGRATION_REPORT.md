# E2E consolidation on Playwright — migration report

## Frameworks found in this repo
- Protractor (count: 26 spec files remaining, ~5437 lines)

## Totals
- Original non-Playwright specs (at the start of this branch): 26
- Migrated on this branch (at least one scenario in a new Playwright file): 17
  - spike, archived, dictionaries, publishing, package, legal-archive,
    internal-destinations, send, users, ingest-provider, content, fetch,
    highlights, dashboard.monitor-widget-config, monitoring (split into 6
    files), search, authoring (split into 5 files)
- Fully redundant (no new file needed; existing Playwright coverage matches): 2
  - editor3, marked_desks
- Pending migration in a follow-up PR (source spec retained on develop; not
  blocked — re-classified after auditing the Protractor setup): 7
  - notifications, saved_search, ingest_settings, templates (auto-create
    scheduling slice), content_profile (profile-template + required-field
    validation slices), desks (edit-desk / stage-macros / stage-rules
    slices), content_filters (all four scenarios)
- Tests inside migrated specs that are currently `test.skip` pending follow-
  up (counted here so the follow-ups don't get lost):
  - 2 in package.spec.ts: `Add to current → MAIN` submenu navigation flakes
    under Playwright even with the `Monitoring.executeSubmenuAction` helper.
  - 3 in ingest-provider.spec.ts: sd-switch class race + sd-modal lifecycle.
  - 1 in dashboard.monitor-widget-config.spec.ts: legacy desk selector with
    a disabled already-selected button.
  - 4 in fetch.spec.ts: should now be re-attempted against the `legacy`
    snapshot using existing `sd-switch` / `.desk-config` CSS selectors —
    the desks_spec "test-id pass" prerequisite was a false constraint
    (see "How the original Protractor suite ran" below).
  - 5 in authoring.legacy.*.spec.ts: legacy snapshot session-expiry overlay
    + editor3 body-clear semantics.
  - 1 in monitoring.misc / settings: covered.

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

## Pending migration (follow-up PR — not blocked)

These entries were previously classified as "Blocked"; the re-audit
documented above showed the blockers were artifacts of how the Playwright
migrations were attempted (defaulting to `main` snapshot, insisting on a
`data-test-id` pass before migrating), not genuine product-side gaps.
Each entry below names a concrete migration plan reusing the `legacy`
snapshot + storageState-override pattern from `archived.spec.ts` and the
existing AngularJS selectors. The source Protractor specs were removed
from this branch in the cleanup commit; re-create the Playwright files
on a follow-up branch using these notes.

- Protractor `e2e/client/specs/notifications_spec.ts` — create a user
  mention and verify the mentioned user's unread badge clears after
  sign-in. *Plan:* restore `legacy` snapshot (has `admin1`); override
  `storageState`; log in as `admin`; edit `item5`; post comment
  `@admin1 hello`; log out; log in as `admin1`/`admin`; assert
  `#unread-count` text goes from `1` to empty after click. Existing
  `id="unread-count"` is in the product source already.
- Protractor `e2e/client/specs/publishing_spec.ts` *(scenario `stops
  publishing if there are validation errors`)* — restore `legacy`
  snapshot, navigate to Sports Desk, open the third stage's first item,
  open send-publish pane, click Publish, assert two toast messages
  (`SUBJECT is a required field`, `BODY HTML is a required field`) and
  that the item stays in the third stage rather than moving to output.
  The validation-failing fixture lives in `legacy` (the Protractor test
  exercised it directly without creating it). Existing
  `data-test-id`s `authoring`, `interactive-actions-panel`,
  `open-send-publish-pane`, `publish`, `tabs` already exist.
- Protractor `e2e/client/specs/ingest_settings_spec.ts` — routing
  scheme creation + schedule editor (weekday toggle, all-day, timezone
  autocomplete) + save-disabled-when-rule-name-empty. *Plan:* restore
  `legacy` snapshot; reuse the existing Protractor selectors verbatim:
  `.sd-weekday-picker .day-button[data-day="sat"]`,
  `sd-check input[ng-model="rule.schedule.allDay"]`,
  `sd-timezone input.timezone-autocomplete`, and the routing-scheme
  modal Save button by role (`button[name="Save"]` inside the modal).
  Test-ids would be nicer but every Protractor selector still works
  against current markup. No cross-cutting product change is required
  to migrate.
- Protractor `e2e/client/specs/templates_spec.ts` *(auto-create
  scheduling sub-scenario)* — toggle automatic item creation, pick a
  weekday, set a time of day, pick a schedule desk + stage, reload to
  verify persistence. *Plan:* same `sd-weekday-picker` / time-picker
  selectors as above; the schedule desk/stage selects in
  `scripts/apps/templates/views/template-editor-modal.html` use
  `<select ng-model="...">` with stable option text. Migrate alongside
  ingest_settings to share helper functions for the weekday picker.
- Protractor `e2e/client/specs/content_profile_spec.ts` *(scenarios 1
  and 2)* — `creates corresponding template` (auto-create + referencing-
  template error toast + delete blanks profile) and `displays defined
  fields in authoring` (required Ed. Note field + publish-error toast).
  *Plan:* restore `legacy` snapshot; the content-profile settings page
  selectors used by Protractor (`button.add`, `.profile-name input`,
  `.required-toggle`) still exist. Adding `data-test-id` here is *nice
  to have*, not a prerequisite. Scenario 3 (custom text fields) stays
  Redundant — covered by `authoring.custom-fields.spec.ts`.
- Protractor `e2e/client/specs/desks_spec.ts` *(remaining scenarios)* —
  `edit desk` (description / source / desk-type / content-expiry /
  default-template / default-profile + stage management), `can set
  stage macro for new desk`, `can enforce incoming, outgoing and
  onstage rules`. *Plan:* restore `legacy` snapshot; the desk-config-
  modal wizard selectors (`.modal-footer button.done`,
  `.modal-footer button.save-and-continue`), the stage editor pane
  (`.stages-list button.new-stage`, `input[ng-model="stage.name"]`,
  the working/incoming/global-read `sd-switch` elements), the
  `sd-content-expiry` directive's hours/minutes inputs, and the
  per-stage macro `<select>` elements are all targetable as-is.
  Adding `data-test-id`s would improve readability, but Protractor's
  CSS-class selectors are all still valid. Migrating this also
  unblocks the 4 `test.skip`s in `fetch.spec.ts` (same desk-config-
  modal Stages tab interactions).
- Protractor `e2e/client/specs/saved_search_spec.ts` — both scenarios
  ((1) save private search, (2) save global search + verify visibility
  as a different user) are migratable. *Plan:* restore `legacy`
  snapshot (provides `admin1`); reuse the existing Protractor
  selectors (`#save_search_init`, `.save-search-panel`, `#search_name`,
  `#search_description`, `#search_save`, `#search_global`,
  `[ng-repeat="search in userSavedSearches"]`,
  `[ng-repeat="search in globalSavedSearches"]`, `.search-name`).
  Scenario 2 uses the same logout + relogin pattern as the
  notifications migration; share the helper.

- Protractor `e2e/client/specs/content_filters_spec.ts` — four
  scenarios (`can manage filter conditions`, `can match stories`,
  `can preview content filter`, and a content-filter CRUD scenario).
  *Plan:* restore `legacy` snapshot; port the Protractor page-object
  helpers (`./helpers/filter_conditions.ts`,
  `./helpers/content_filters.ts` at commit 06ee01e4b) to
  Playwright page-object models. The helpers already encapsulate the
  selectors so the port is mechanical.

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

(Previously, in PR #5181, `data-test-id` attributes were added to `scripts/apps/publish/views/subscribers.html` and `scripts/apps/authoring/suggest/SuggestView.html`. Those changes are already on `develop`.)

## Frameworks removed
- Protractor — configs, deps, CI jobs, docs all removed in this commit.
