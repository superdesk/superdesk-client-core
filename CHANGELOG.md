# Superdesk Client Changelog

## [1.4] 2016-11-15

### Added

- Related item search preference added to session.
- Allow complex boolean queries in search.
- Add `thinkRows` configuration for more condensed monitoring view.
- Add swimlane view to monitoring.

### Changed

- SMS message is populated using abstract.
- Disable formatting for byline field.

### Fixed

- Monitoring queries optimizations.
- Preview in monitoring with ingest.
- Link to revisions on about modal are clickable.
- Date fields in search don't reset when value is cleared.
- Let user with `templates` privilege edit desk templates.
- Show `sign_off` field for routed items and items create from template.
- Fix url validation for links in editor.

## [1.3] 2016-10-17

### Added

- Update browser title with info where you are in superdesk.
- Add item history tab to preview pane.
- Add send and publish action.
- Add *pass throught* option to ingest providers.
- Add typeahead into desk select in send to pane.
- Add remove aggregate func in search.

### Changed

- Allow item to be duplicated to default desk or user private space.
- Report conflicting update in desk management.

### Fixed

- Fix saving of an item after failed publishing.
- Improve performance after scroll lock.
- Embargo datetime fields require embargo privilege.
- Fix *critical error* tabs in subscribers and ingest sources modals.
- Make vocabulary column headers fixed.
- Reload saved searches in monitoring config on update.
- Enable save button when picture is dropped on featured placeholder.
- Keep editor toolbar visible when scrolling.
- Fix search when using non english translations.
- Save image metadata updates when saving crop info.

## [1.2] 2016-10-05

### Added

- Highlight multiple spaces in spellcheck and suggest a single space instead.
- Add related item configuration to search slugline using exact match, prefix match or any word match.
- Add `useDefaultTimezone` for global search queries.
- Add ingest provider to search
- Add image metadata validation on publish
- Add url validation to editor anchor button
- Added `Send and Publish` so that item can be first send and published from different desk.

### Fixed

- Fix global search to include time part for date search.
- Fix related item search to look for exact slugline search.
- Fix refs in package were missing type.
- Fix spike view for custom workspace
- Activate save button after editing crops
- Fix aggregations not updating
- Disable crop editing for audio/video
- Fix image drag&drop in chrome

## [1.1] 2016-08-29

### Added

- Add `noTakes` config option to disable takes in ui
- Display more versions in history panel.
- Add config to hide takes related controls.

### Fixed

- Fix desk selection is monitoring if not default desk
- Fix elastic highlight config to use `features` key.
- Fix metadataview for slugline to display elastic highlight
- Fix elastic highlight for saved searches.
- Hide publish button for highlights packages.
- Fix layout issue with action menu in preview pane.
- Fix recursive calling of desk mentions query.
- Fix dashboard widget thumnails not being visible.
- Fix apply crop button not activating save button in authoring.
- Fix hyperlink plugin in authoring.
- Fix missing pagination buttons in publish queue.

## [1.0] 2016-08-17

### Fixed

- Fix undo/redo changes not being saved or autosaved
- Fix undo/redo for new item not reverting to empty body after save
- Fix undo/redo not working properly with complex fields (dateline, category, subject)
- Fix images uploaded into private space are not visible

## [1.0.0-beta1] 2016-04-26

- initial "public" release

## [0.3] 2014-02-24

- **users**: implement user form validation [ffdf478](https://github.com/superdesk/superdesk-client/commit/ffdf47834e5d7833098f03343b8d3e566df3e3d2)
- **users**: check if username exists when creating a user [87b0f03](https://github.com/superdesk/superdesk-client/commit/87b0f0333eec5cb10107d5848e759622dc03294e)
- **tests**: add protractor e2e test for login [d5bf1db](https://github.com/superdesk/superdesk-client/commit/d5bf1dbc2bfe4461090a6f575248b37532eb5813)

## [0.2] 2014-02-10

- feat(ingest): implement subject filtering
- feat(archive): implement filtering
- test(scratchpad): add tests
- fix(css): fix 'add widget' modal, ingest list, active menu items, ..

## [0.1] 2014-02-04

- **users**: list, create and edit users
- **ingest**: list and search items, fetch items into archive
- **archive**: list archived ingest items, edit
- **scratchpad**: drag ingest items into scratchpad
- **desks**: create and list desks, assign members
- **dashboard**: list available widgets, save user dashboard
