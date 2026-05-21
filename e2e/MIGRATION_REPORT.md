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
- Blocked / obsolete / flaky (file deleted in the cleanup commit; coverage
  documented below for follow-up): 7
  - notifications, saved_search, ingest_settings, templates (auto-create
    scheduling slice), content_profile (profile-template + required-field
    validation slices), desks (edit-desk / stage-macros / stage-rules
    slices), content_filters (all four scenarios)
- Tests inside migrated specs that are currently `test.skip` pending follow-
  up (counted here so the FLAKY/BLOCKED follow-ups don't get lost):
  - 2 in package.spec.ts: `Add to current → MAIN` submenu navigation flakes
    under Playwright even with the `Monitoring.executeSubmenuAction` helper.
  - 3 in ingest-provider.spec.ts: sd-switch class race + sd-modal lifecycle.
  - 1 in dashboard.monitor-widget-config.spec.ts: legacy desk selector with
    a disabled already-selected button.
  - 4 in fetch.spec.ts: desk-config-modal Stages tab needs additional
    shared-component test-ids (see desks Blocked entry for the full pass).
  - 5 in authoring.legacy.*.spec.ts: legacy snapshot session-expiry overlay
    + editor3 body-clear semantics.
  - 1 in monitoring.misc / settings: covered.

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
- Protractor `e2e/client/specs/ingest_settings_spec.ts` — covers ingest routing scheme creation and the schedule editor (toggle weekdays, all-day, set timezone via autocomplete) plus save-disabled-when-rule-name-empty. Migration would require data-test-id additions to: (1) the shared `sd-weekday-picker` directive template (`scripts/core/ui/views/weekday-picker.html`) which is also used by `templates_spec`, edit-time-interval, and others; (2) the `sd-timezone` directive's timezone-autocomplete input/list; (3) the routing-scheme modal save button and name inputs in `scripts/apps/ingest/views/settings/ingest-routing-content.html`; and (4) the `sd-check` `allDay` checkbox. Each step is just adding test-ids, but the spread across shared UI components (sd-weekday-picker, sd-timezone, sd-check) makes the change set larger than appropriate for a single spec migration in isolation. Treating as blocked on the shared-component test-id pass that would also unblock the auto-create scheduling slice of `templates_spec`.
- Protractor `e2e/client/specs/templates_spec.ts` *(one of three sub-scenarios in the single mega-test)* — the auto-create scheduling slice (toggle "automatic item creation", pick a weekday, set a time of day, pick a schedule desk and stage, and reload to verify the values persist) depends on the same shared-component test-id additions as `ingest_settings_spec` (`sd-weekday-picker`, time picker, schedule desk/stage selects in `scripts/apps/templates/views/template-editor-modal.html`). Treating as blocked along with `ingest_settings_spec`. The other two sub-scenarios (most of template create / edit / desk-assign / prefill — covered by the existing Playwright `templates.spec.ts` — and `save disabled when template name is empty`) are covered/redundant; see `Redundant` below.
- Protractor `e2e/client/specs/content_profile_spec.ts` *(scenarios 1 and 2 of 3)* — `creates corresponding template` (verifying that creating a content profile auto-creates a matching template, disabling a profile that has referencing templates shows an error toast, and deleting a profile blanks the referencing template's content profile) and `displays defined fields in authoring` (creating a profile with a required Ed. Note field and verifying publish fails with `ED. NOTE is a required field` toast). Migration would require data-test-ids across the legacy AngularJS content-profile settings page (add/edit/save/update/delete buttons, the per-field "Required" row, the field name binding), plus the authoring subject-metadata dropdown and the publish-error toast contract. The third scenario (custom text fields appearing in the field picker) is fully redundant with `authoring.custom-fields.spec.ts` — see Redundant. Treating profile-template-linkage and required-field-validation as blocked on a larger test-id pass over the legacy content-profile settings UI.
- Protractor `e2e/client/specs/desks_spec.ts` *(scenarios remaining after redundant ones)* — `edit desk` (persist edited description / source / desk-type / content-expiry / default-template / default-profile, plus stage management: add stage, toggle working/incoming/global-read flags, delete stage), `can set stage macro for new desk` (per-stage incoming/onstage/outgoing macro pickers), and `can enforce incoming, outgoing and onstage rules` (validating macro on send between stages). All three scenarios depend on a coordinated data-test-id pass across the desk-config-modal wizard footers (currently `done` / `save-and-continue` are ambiguous across modal steps), the stage editor pane (`new-stage`, `save-new-stage`, `stage-name`, `stage-description`, working/incoming/global-read switches, per-stage macro selects, per-stage delete button), the shared `sd-content-expiry` directive (hours / minutes inputs reused by System / Desk / Stage), the People tab (user search + add), plus per-desk-card `desk-actions--edit` and `desk-stage-count` test-ids in `scripts/apps/desks/views/settings.html`. The desk-creation Save-and-Continue / Done variants in `edit desk` overlap with the existing Playwright `desks.spec.ts` "adding a desk" test and are covered there (see Redundant). Treating the remaining scenarios as blocked on the coordinated shared-component test-id pass.
- Protractor `e2e/client/specs/saved_search_spec.ts` — covers two scenarios: (1) save a private search from the global-search filter panel and verify it appears in the user's saved searches, (2) save a global search, log out, log in as `admin1`, verify the global search is visible to that user. Scenario (2) hits the same `admin1` credentials issue as `notifications_spec.ts` — neither the `main` nor `legacy` snapshot has a working second test user — and migrating scenario (1) alone would require ~10 product-source `data-test-id` additions (priority filter list items, `save_search_init`, `save-search-panel`, `search_name`, `search_description`, `search_save`, `search_global`, `userSavedSearches`/`globalSavedSearches` rows, `.search-name`) while still leaving the file in place for scenario (2). Treating the whole spec as blocked until a maintained secondary-user fixture exists.

## Obsolete
- Protractor `e2e/client/specs/marked_desks_spec.ts` — the file declares a single test `displays the story in desk attention stage` and it is `xit` (skipped) in source with the inline comment `can't reproduce failures`. The scenario it would have covered (mark/unmark for desk from monitoring) is already exercised by `e2e/client/playwright/desks.spec.ts` (`can mark/unmark for desk`). The attention-stage saved-search workflow it would also have touched is not unique to this spec; the same wiring is exercised by other monitoring/saved-search tests. Migrating a disabled scenario whose original maintainers could not stabilise adds no coverage. File retained until final cleanup commit.

## Flaky
<!-- Format: <framework> <original path> — the Playwright code attempted — observed failure mode -->

## Redundant
- Protractor `e2e/client/specs/publishing_spec.ts` *(one of three scenarios)* — `can send and publish` is covered by `e2e/client/playwright/monitoring.publishing.spec.ts` (`publishing an article from a different desk`), which exercises the same send-then-publish-from-source-desk flow including the destination select and the resulting desk-output entry. The Protractor variant uses Politic Desk -> Sports Desk; the existing Playwright variant uses Sports Desk -> Education Desk. Functional coverage is equivalent.
- Protractor `e2e/client/specs/templates_spec.ts` *(majority of the single mega-test)* — creating a template with profile / desks / metadata / body / slugline / signoff and re-opening to verify values, plus making the template accessible from two assigned desks, plus removing the template, are covered across `e2e/client/playwright/templates.spec.ts` (`creating new template`, `editing template name`, `removing template`, `assigning template to a desk`, `default content template`, `new article prefilling with content set in template`, `performing 'save as' action on a template`). The save-disabled-when-empty assertion is a one-line check whose value isn't worth a fresh spec on its own; if useful it can be added to the existing `templates.spec.ts` later. The auto-create scheduling slice is documented as Blocked above.
- Protractor `e2e/client/specs/content_profile_spec.ts` *(scenario 3 of 3)* — `displays custom text fields` (add a custom text field via Metadata, verify it appears in the content-profile add-field dropdown) is covered by `e2e/client/playwright/authoring.custom-fields.spec.ts` (`creating a custom text field`), which exercises the same end-to-end flow plus verification that the field renders in authoring. Scenarios 1 and 2 are documented as Blocked above.
- Protractor `e2e/client/specs/desks_spec.ts` *(the two "add a new desk" Save-and-Continue / Done variants embedded in `edit desk`)* — adding a new desk via the wizard's Done button and via Save-and-Continue + Save are functionally equivalent to the existing Playwright `desks.spec.ts` `adding a desk` test, which exercises the same Add-New-Desk path with name / source / template / profile / desk-type. The Protractor variants additionally assert expiry/description persistence, which is part of the blocked scope above and would extend `desks.spec.ts` once the test-id pass lands.
- Protractor `e2e/client/specs/editor3_spec.ts` — covers two trivial editor3 operations: typing into the headline editor (`can edit headline`) and applying bold + link toolbar actions to body text (`can edit body with toolbar`). Both operations are exercised, more thoroughly and with deeper assertions, by the existing Playwright editor3 suite (`e2e/client/playwright/editor3.spec.ts` — embeds, tables with undo/redo at three cursor positions, custom-block vocabulary configuration; `e2e/client/playwright/editor3.spellchecker.running-mode.spec.ts`; `e2e/client/playwright/editor3.caret-scroll.spec.ts`). No unique coverage. File retained until final cleanup commit.

## Product source changes
- `scripts/apps/search/views/item-repo.html` — `data-test-id="repo--ingest"`, `repo--production`, `repo--published`, `repo--archived` added to the four repo-filter toggle buttons — for `e2e/client/playwright/archived.spec.ts`.
- `scripts/apps/publish/views/publish-queue.html` — `data-test-id="search"` on the queue search input and `data-test-id="search-close"` on the clear-search button — for `e2e/client/playwright/publishing.spec.ts`.

(Previously, in PR #5181, `data-test-id` attributes were added to `scripts/apps/publish/views/subscribers.html` and `scripts/apps/authoring/suggest/SuggestView.html`. Those changes are already on `develop`.)

## Frameworks removed
- Protractor — configs, deps, CI jobs, docs all removed in this commit.
