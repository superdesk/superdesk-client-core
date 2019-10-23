# Superdesk Client Changelog

## [1.31.2] 2019-10-03

### Fixed

- Display notification on unpublish error/success.

## [1.31.1] 2019-09-11

### Fixed

- Display string fields with no related cv in media metadata editor.

## [1.31.0] 2019-08-26

### Added

- Add extension point for picture IPTC mapping.
- Show scheduled time for items in scheduled output stage.
- Add `Add to dictionary` action for external spellcheckers.
- Add priority switch to subscribers.
- Add desk sent output group type.
- List content marked for me.
- Add unpublish action for published content.
- Add select all functionality for user privileges.
- Add edit crop screen after image upload to body field.

### Fixed

- Media carousel breaks once the order of the items is changed.
- Annotations library stopped loading after a link was added.
- Search bar UI improvements.
- Save button is inactive after uppercase/lowercase operation.
- Item not being removed from workqueue on publish.
- When crop modal is opened it should not ask for save.
- Fix setting language in media metadata modal.
- Fix cropping not respecting crop size for ingested pictures.
- Fix dropdown position in authoring header.
- Fix scroll in Media contacts management.
- Fix cursor gets lost when typing caption for media gallery items.
- Fix errors not highlighted in authoring for custom fields.
- Spellchecker should respond to language change immediately.
- Save changes made to desk if user clicks save on confirmation box.
- Improve search list performance.
- Fix issues with copy and pasting media metadata.
- Fix issue with missing error messages on multi publishing.
- Avoid extending inline styles when pressing space at the end of block.
- Unlocking items from preview does not work if the item is opened in authoring.
- Edit image action on article should not modify original image.

### Changed

- Upgrade react to 16.8.

## [1.30.0] 2019-06-12

### Added

- Make delay of item creation via internal destination configurable.
- Add initial middleware support to authoring.
- Allow assignment notification to open the assignment on clicking.
- Display selected saved searches as shortcuts.
- Settings dashboard.

### Fixed

- Removing a filter statement from content filter does not enable save button.
- Changes in subscribers content API tab do not enable save button.
- Fix issue with infinite scroll on single stage view.
- Fix embeds in preview.
- Max characters counter not working for `body_html`.
- Can not create content API only subscriber.
- Fetch images from external source when dropped to editor3.
- Hide copy/paste metadata from `edit image` section.
- Fix issues saving changes on search after updating subscriptions.
- Prevent drag and drop of saved authoring item or ingested composite items to featured media field.
- Pasted metadata is lost if image is deselected and then selected again.
- Hide `edit in new window` action if the item is locked by current user.
- Image dropped next to table crashes editor3.
- Add missing error indicator for custom required fields.
- Remove publish button when an item in personal space is selected.
- Can't save changes in saved search.
- Text added before or after an annotation does not activate the save button.

## [1.29.0] 2019-04-30

### Added

- Add user preferences for default event and planning filters.
- Implement status filter for Subscribers settings.
- Add knowledge base feature.
- Support `readonly` and `default` attributes in ingest provider config.
- Allow async badge in authoring widgets.
- Add edit and crop button for media items in editor3.
- Extend search service support for custom queries.
- Allow slugline field in both header and content authoring sections.
- Add associated item type icons to list views.
- Add attachments in editor content section.
- Add desk routing config widget.
- Make it possible to override login template.
- Add abitlity to copy&paste media metadata.
- Allow configuring article metadata header to open/collapsed.
- Allow quickly fetching content without opening it.
- Show field type in field dropdown when editing content profile. 
- Add support for custom text/date fields in authoring header.
- Allow nesting of items in output stage.
- Add widgets config to content profile settings.
- Populate item authors with current user when author role is configured.
- Implement new swimlane view.
- Add author/editor role config to user roles.
- Add async publishing config to subscriber settings.
- As a user I want to add urls to a story.

### Changed

- Use geonames for dateline place search when available.
- Make HTML generated for media blocks in editor3 consistent with editor2.

### Fixed

- Ingest source Critical errors tab is not loaded properly.
- Fix publishing error although suggestions were resolved.
- Fix issues in authoring when user presses Save button twice.
- Fix related items handling media from external source.
- Fix find & replace feature in editor3.
- Hide field from both sections when used in content profile config.
- Fix shortcuts behaviour for widgets in authoring.
- Canceling changes in media metadata does not reset the usage terms field.
- Fix infinite scrolling in swimlane view.
- Templates which are not associated to any desk show up in all desks.
- Fix editing raw query in saved search.
- Fix editing of custom fields in templates.
- Fix empty confirm modals when using translated UI.
- Support search & replace in tables in editor3.
- Use `ingest_provider` instead of source for `go to items` link in ingest settings.
- Save button is enabled even when item is not added to media gallery due to limit.
- Hide Send To dropdown when uploading media to article.
- Opening an item by pasting the URL does not show all actions.
- Disable spell-checker if there is no dictionary for item language.
- Display latest properties for related items.
- Allow upload of multiple images on corrected items.
- Fix versions display on about screen.
- When moving preview from right to let the top part is partly visible.
- Fix error message when creating cv with existing ID.
- Fix gettext string extraction for ts files.
- Changes in ingest modal not enabling save button.
- Send params to search proxy in search.

## [1.28.0] 2019-01-18

### Added

- Hide fields from media editor based on picture profile.
- Add filtering to ingest sources settings.
- Add planning version to about modal.
- Add search to dictionaries settings.
- Embed featured image into email output.

### Changed

- Move target entity to publish panel.
- Move planning menu config to planning repo.
- Replace `gettextCatalog.getString` calls with `gettext`.
- Limit categories in vocabulary config modal to one.
- Advanced search panel UI refactoring.
- Improve user preferences page UI.

### Fixed

- Fix media not being saved without editing POI.
- Fix feature media confirmation modal layout.
- Activate save button after drag&drop to feature media field.
- Fix issue where macros ignored string fields in editor2.
- Fix `singleline:view` user preference not visible.
- Fix contnet profile editor header field detection.
- Maintain cursor position when undoing changes in tables.
- Fix for unpublished related items error for scanpix pictures.
- Once an image is cropped the result is not shown after saving.
- Send to desk operation keeps the item locked.
- Remove send and open buttons from authoring send to panel.
- Fix saving of user profile after changing password.
- Failed to generate image crops error is displayed when adding images to gallery.
- Display extension point pane only if extension point is configured.
- When creating a new routing scheme the cursor jumps out of the name field.
- When editing image crops once the save button is shown the button panel is partly hidden.
- Do not validate media gallery type of related items on publishing.
- Item sometimes keeps previous image custom renditions.
- To desk shortcut button does not work in authoring.
- Fix translations in settings.
- Save button should activate only when there are some changes in settings.
- Set toolbar width to match editor size when floating.
- Add missing fields to metadata widget.
- Fix cursor position after paste + undo + redo in editor3.
- Show notification when translated item is corrected.

## [1.27.0] 2018-12-14

### Fixed

- Fix media editor behaviour - only save crops when updated.
- Fix issue with subscriber creation in settings.
- Validate item type when dropping to media gallery field.
- Save button in authoring is not active when find&replace is finished.
- Display contact name properly when first or last name is missing.
- Configure sourcemap to work with sentry.
- Do not show send to desk for media upload in personal space.
- Saved search could not be updated twice without reload.
- When publishing all related items should be checked if published.
- Handle iframes and scripts when importing html to editor3.
- Generate picture crops even when poi validation is turned off.
- Ignore lock operations in item history tab.
- Fix type icon for media upload.
- Fix issue when opened article can't be closed.
- Fix related items icon not refreshing.
- User should not be able to make global search private when ther are subscribers.
- Fix macros not updating content in editor3.
- Show helper text for `keywords` in authoring if available.
- Sync table entity and table block data in editor3.
- Add missing dropdown for stage switching when stage is selected.
- Activate save button when at least one type is selected in related items field config.

### Added

- Show a warning when same item is added twice to related items.
- Implement new swimlane view.
- Detect local links based on `local_domains` cv.
- Add search to ingest settings.
- Add description and tags to vocabularies in metadata settings.
- Add option to hide vocabulary from content profile editor.
- Allow custom date shortcut buttons for custom date fields.

### Changed

- Ingest settings UI refactoring.
- Split article header and content configuration in content profile.

## [1.26.0] 2018-11-12

### TBD

## [1.25.0] 2018-09-20

### Fixed

- Fix fetching media from external source on drop to featured media.
- Date fields are not working in search.
- Add all 3 edit options for single image items.
- Fix ingest config bug for ftp move folder.
- Add feature flags to display editor widgets for attachments, inline comments and suggestions.
- Fix striping html tags when pasting content in image caption field.
- Only allow photogrid and compact views in media contacts.
- Fix pasting to editor when it's not html.
- Modified styles in editor so that body html and headline renders same in view and edit mode.
- Use editor3 internal clipboard to copy entities from open editors.
- Add validation to Image Crop sizes CV names.
- Fix typos in image editor.
- Fix error when users are unable to see selected categories in authoring.
- Fix error when go to items is called for second ingest source.
- Fix media metadata save issue and display fields based on validator config.
- Fix issue when send to panel is displaying fetch actions.
- Update etag of image item after updating crops.
- Place single or multi value dropdown based on the vocabulary settings.
- Enable all repos if no repos are selected in search panel.
- Some of ingest channel details are missing if opened from ingest dashboard.
- Fix searching for media contacts.
- Duplicate description field is presented when uploading a media to authoring item.
- Hide edit/crop tabs when editing video/audio items.
- After image editing don't reset current image in carousel.

### Added

- Managing of saved searches for other users.
- Allow moving package with all its items.
- Add config option for spike confirmations.
- Add support for abbreviations in editor3.
- Open or close preview header based on local storage settings.
- Add saved search subscriptions.
- Show product id when product is edited.
- Add content type filter to publish queue view.
- Typescript integration.

### Changed

- Improve rotate function in image editor.
- Allow custom fields and sorting in `sd-search-results` directive.
- Refresh button improvements in monitoring.
- Add empty block on pasting to editor3 only at the bottom.

## [1.24.0] 2018-08-20

### Fixed

- Update `item.associations` on save action.
- In custom text fields table controls are not visible when scrolled down.
- Wrong html output when saving story with inline styles.
- Fix issue with changing workspace flag.
- After media edit update etag for media items.
- Move block to drop area after dragging new image to body.
- Prevent dragging media around body when item is locked.
- Adding subnav for privacy and status filters.
- Search criteria set to last month for publish date is yielding improper results.
- Unordered list appears as plain list in the preview.
- Remove update button from edit/correct.
- After selecting text and adding comment/annotation the cursor jumps to the beginning of input field.

### Added

- Use can set default planning agenda if planning is enabled.
- Add functionality to edit metadata for single files.

### Changed

- Retrieve validator media metadata from backend.

## [1.23.0] 2018-08-07

### Fixed

- Dragging an item to custom media field with multiple items enabled adds the item twice.
- Cannot edit links or attachments.
- Description line for custom vocabulary has drifted from the parent control in authoring UI.
- Fix required config on subject field in content profile editor.
- After embed editing move the cursor right before the edited embed.
- Strip html tags from headline.
- Add close button to 3 dots menu in sidebar preview.
- After clear format action set the cursor after the selected text.
- Improve single media items display.
- UI problems on add to dictionary dialog when select all is applied to the text.
- Dashboard widget modal UI improvements.
- Improvements and bug fixes for multi metadata editor.
- Tab sequence is broken in authoring ignoring the order from content profile.
- Fix required highlight for custom fields.
- Disable recovery of deletes characters when the same characters are added.
- Fix events preview for event type ingest sources.
- After pressing submit or cancel when editing embed code focus jumps to the beginning of the body.
- Hide media blocks in preview when hide images is on.
- Restrict popup width field to categories and cvs.
- Unable to move images within the body.
- Add missing data to suggestion history.
- Fix console error in `password-strength` directive.
- Audio and video title is displayed twice if show title is set in content profile.
- Activate metadata editing only for media files.
- Display field names instead of ids in filter conditions editor.
- Activate save button after an image is dragged on feature media field.

### Added

- Show custom text and custom date fields in sidebar preview.
- Support for publish date filtering in search.
- Add Preview API support.
- Added aspect ratio buttons to media fields.

### Changed

- Use semver for superdesk ui framework.
- Modified `extensionpoint` directive to call a callback.

## [1.22.0] 2018-07-17

### Fixed

- Fix cursor reset when an embed is edited.
- Disable media editing when item is locked.
- Fix drop event not handling regular files on editor3.
- Disable send to menu action when item is locked.
- Reduce line spacing before h5 in editor3.
- Fix `popup_width` handling in metadata.
- Fix `isLinkExternal` with data protocol.
- Preserve highlights on spellchecker changes.
- Fix user avatar modal.
- Fix adding insert suggestion on superscript text.
- Fix macros listing on desk creation.
- Apply Tansa spellchecker on media description.
- Remove local path from ftp destination config.
- Hamburger menu is not translated after changing the language.

### Added

- Add support for password expiry after given period.
- Add fields for copyright and usageterms to lists.
- Support inline styles on tables.
- Allow editing of video metadata.
- Add confirmation when closing media editing with unsaved changes.
- Check if template is set as default before removing it.
- Specify qcode type in vocabulary schema.
- Add preview endpoint URL to subscriber configuration.
- Add RTL languages support to the editor.

### Changed

- Make grid item content fully configurable.

## [1.21.0] 2018-06-25

### Fixed

- Support undo on table editing.
- Esc key does not exit any of the modals.
- Format is removed when subscript or superdesk is copied and pasted to editor3.
- Show multi media items on item preview.
- Disable drag for mouse and touch on media carousel.
- Handle places with qcode in geonames places component.
- Display commented text on unresolved comments inside widget.
- It is not possible to edit video embed code.
- Fix photo grid view.
- Prevent the reset of custom data on paste.
- Allow comment author to edit his reply.
- Truncate content in suggestion widget.
- Fix missing expand icon in preview.
- Change background color for spaces in remove suggestions to red.
- Improve visibility of the word character count in authoring.
- Fix annotations editing.
- Fix labels in the editor not being translatable.
- Fix removing of insert suggestion when part of the inserted text is deleted.
- Fix scheduled label text in item lists.
- Fix reset highlight data on regular paste in editor3.
- After pressing submit/cancel when editing embed code the cursor jumps to the beginning of the body.
- Improve positioning of editor popups.

### Added

- Add width config to metadata settings.
- Create tooltips for organisation and personal media contacts icons.
- Add image editor UI.
- Add new fields to authors profile.
- Configure feed parser restrictions for certain feed services in ingest.

### Changed

- Settings page UI improvements.
- Dashboard widgets UI improvements.
- On correction if there are any suggestions inform user and let him confirm the action.
- Improve numbering and showing annotations in the preview.
- Rename Monitoring widget to Monitor.
- Update Norwegian translation.
- Update pot file for superdesk.
- Media Contants UI refactoring.
- Update UI framework version.

## [1.20.0] 2018-06-11

### Fixed

- Fix schedule time tooltip in item lists.
- Add selected text to clipboard on ctrl+x in editor3.
- Display error message when required field is missing in metadata settings.
- When clicking on a link in annotations a new window should open the destination url.
- Editor3 crash when clicking on annotation after reloading the page with article opened.
- Show "with" value on multiple blocks replace suggestion.

### Added

- Show annotations on item print preview.
- Use autocomplete for places field if available.
- Add unresolved comments to sidebar comments widget.
- Add unit tests for editor3.

### Changed

- Order vocabularies by name in metadata settings.
- UI improvements for `sd-typeahead` component.
- It should be possible to restrict feed parsers for certain services.

## [1.19.0] 2018-05-31

### Fixed

- Pasting links swaps the order of lines in editor3.
- Cannot paste table into editor3.
- Don't close highlights popup when clicking on a modal.
- Refactor generation of annotations to not include removed annotations.
- Fix photo desk configurable fields data type.
- Add classes to fields in user management which should be hidden in liveblog.
- Make new vocabularies available in `metadata.cvs`.
- Description of embed not visible in editor2.
- Text annotations do not show last updated time.
- Fix fetching of external item on double click in search.
- Fix pasting from Google Docs on Windows to editor3.
- Fix delete of multiple paragraphs in editor3.
- Display and edit embeds from editor2 in editor3.
- Apply new ui format to suggesting inline comments annotations widget.
- Fix undo issue when pasting html to editor3.
- Don't reload carousel if items don't change.
- Display and edit images from editor2 in editor3.
- Update angular embed to latest version.
- Fix duplicate sub-menu position in grid view.
- Add norwegian planning translation.
- On delete multiple paragraphs create a single delete suggestion.
- Fix creating links in editor2.

### Added

- Edit embed codes in editor3.
- Add plus button to add media to carousel.
- Add preferred cv values to user profile/desk settings.
- Add unit tests for editor3.

### Changed

- Show assignment page to all users if planning is enabled.
- Feeding service labels and fields should be set server side.
- Move planning UI components to core.

## [1.18.0] 2018-05-14

### Fixed

- Feature media is not visible right after upload.
- Always handle pasted html in editor3 to be consistent.
- Fix turning on formatting marks reverts text selection in editor3.
- Fix importing embeds from editor2 to editor3.
- Fix importing links from editor2 to editor3.
- Fix paste suggestion on first block in editor3.
- Fix editor3 issues on pasting text from buffer into custom fields or body.
- Fix pasting of formatted text in suggestion mode.
- Fix `ctrl+z` not working in image caption field.
- Link insert button should not be active if no action is taken.
- Make h1-h6 formatting work consistently in abstract and body fields.
- Error on adding media to custom media field.
- Add metadata to remove link suggestion.
- Set background color for suggested spaces.
- Fix stretching of text-highlights into another line.
- Error on editing and saving certain CVs.
- Wait for media loaded event in multi items media fields before rendering carousel.
- Fix editor3 table toolbar position.
- Keep selected text when pasting in suggestion mode.
- Fix editor3 popup position on undo.
- When toggling style on editing remove suggestion if any.

### Added

- Add support for merge paragraph suggestion.
- Implement new design for editor3 popups.
- Provide type-ahead search for contact organisation.

## [1.17.0] 2018-05-02

### Fixed

- On insert in editor mode don't split already existing suggestions.
- Pasted text won't include disabled styles in editor3. 
- Disable autocompletion on password fields in feeding services config.
- Video preview size is too big in the editor.
- Fix editor3 freezing on del at the end of paragraph.
- Don't open media popup when drag&drop happens when planning is enabled.
- On multiple block selections don't apply the block style to blocks without any character selected.
- Allow editing of suggestions in edit mode.
- Empty qcode was not checked for when editing vocabulary items.
- Fix cursor position after undoing comments/annotations.
- Fix html import when switching content profile from editor2 to editor3.
- Prevent infinite loops in highlights processing.
- On add suggestion add new characters using current style.
- Once undo/redo is aplied to comment/annotation text the same option cannot be applied again.
- Show highlight popup only if the cursor is inside highlighted text.
- Fix unresolved suggestions validation on publishing.
- Fix issues on preview for spiked items.
- Restore focus before adding a highlight so selection is visible on undo.
- Fix search providers menu showing closed providers.
- Extract strings for translations from jsx files.

### Added

- Support edit/remove link suggestions.
- Add missing format options to editor3 (subscript, superdeskcript, strikethrough, preformatted).
- Warn user when publishing an item with unresolved comments.
- Add button to remove all formating to editor3 toolbar.
- Handle suggestions when using ctrl+i/b/u keys in suggestion mode. 
- Only support users can see support users.
- Support add link suggestion.
- Support standalone editor3 not connected to an item.
- Add config option for field in grid view.
- Add support for split paragraph suggestion.

### Changed

- Change email address field validation not to be case sensitive.
- On style suggestion remove the suggestion when toggled again.
- Disable pasting media in editor3.

## [1.16.0] 2018-04-13

### Fixed

- Fix paste performance on editor3 in suggestion mode.
- Fix the reject suggestion that contain a list.
- Fix absdate/reldate directives not having isolate scope.
- Improve UI for Contant info cards.
- Remove all suggestions when pressing DELETE key in suggestion mode.
- Email link in media contacts should invoke mail agent.
- Fix scrolling while dragging media in firefox on editor3.
- Remove highlight object after resolving a suggestion.
- Fix invalid HTML tag in generated html for blockquote.
- Fix missing search parameters for scanpix.
- Fix wrong permission checked for Send to action.
- Fix validating unresolved suggestions on publishing.
- Make search provider labels consistent.
- Typing inside editor highlights should expand the highlight and not split it.
- Fix missing vocabularies.
- UI improvements for image carousel.
- Fetch all content types and custom fields when needed.
- Fix the conversion from html to draftjs.
- Show correctly the replace suggestion on replace list.
- Fix the reject suggestions on editor3.

### Added

- Add photo grid view to global search.
- Allow custom z-index in three-dot-menu popup (planning).
- Add search provider config for opening advanced search by default.
- Add default view to desk settings.
- Add default calendar to user preferences (planning).
- Add `authoring:publish` extension point in send to panel.
- Add tooltip to subject dropdown.
- Add `Send to` to action menu.
- Include annotations in html generated from editor3.
- Hide authoring container if `flags.authoring` is `false`.
- Add support for block style suggestions.

### Changed

- Make desk monitoring view setting use radio buttons instead of dropdown.
- Make suggestions work on any custom text field.
- Refactor vocabulary items UI using React.
- Show absolute date on inline comments history.

## [1.15.0] 2018-03-28

### Fixed

- Handle errors when generating HTML from editor state.
- Fix default sort of contacts.
- Fix website on media contacts link.
- Show if custom embed fields as required in authoring.
- Display translate action in item history.
- Prevent publishing of items with unresolved suggestions.
- Scroll up/down while dragging media in editor3.

### Added

- Add icon for coverage in authoring and preview.
- Allow selecting multiple terms from vocabulary without reopening.
- Add ingest config panel for Associated Press.
- New icons for comments/annotations/suggestions.
- Add suggestions history widget to authoring.
- Add photodesk view to monitoring.
- Add API for workspace sidenav menu items.
- Add carousel func to multi item media fields.
- Add inline comments history widget to authoring.
- Add language filter to search if languages are configured.
- Add new contact form.
- Add coding conventions.

### Changed

- Update react to v16.

## [1.14.0] 2018-03-05

### Fixed

- Fix position of custom text fields in preview.
- Keep dropdown in the viewport.
- Fix reply date on comment update.
- Show JID field in user profile only if XMPP auth is enabled.
- Fix time to read for japanese.
- Fix the order of items in full preview.
- Remove html tags from opened articles bar.
- Avoid opening upload modal on paste to editor2.
- Fix styles for editor3.
- Prevent formating via keyboard shortcuts if it's disabled in field config.

### Added

- Add param to Ritzau ingest config to override the URL.
- Remove the comment after it's resolved and put it to the comments history.
- Add search provider dropdown to search top bar.
- Add clear button to embed fields.
- Initial version of multiple highlights.

### Changed

- Use preferences for monitoring swimlane/list view.
- Preview pane CSS improvements.
- Hide keywords in metadata if they are not enabled in content profile.
- Update dependecies (angular, jquery, webpack).

## [1.13.0] 2018-02-19

### Fixed

- Reload list of internal destinations on delete.
- Fix UI issues in table toolbar for editor3.
- Fix youtube embeds in editor3.
- Reduce some internal timeouts in editor2.
- Fixing the content type for event and adding event type based on planning privilege.
- Preserve data when dragging and dropping an image item to body.
- Make events valid content type for ingest.
- Spike action should check for planning privilege to prompt the user.

### Added

- Add display non-printable characters feature to editor3.
- Display widget for accepting/rejecting suggestions in editor3.
- Add support for pasting content in suggestion mode.
- Add twitter ingest config panel.
- Add option to select source field for SMS.
- Add image metadata fields to editor3.
- Add config panel for Ritzau ingest.
- Add support to create add/delete suggestions.
- Add drag&drop support for moving media in editor3.
- Add remove button to embed block in editor3.

### Changed

- Close item header by default in preview.
- Ask for confirmation when spiking items.

## [1.12.0] 2018-02-02

### Fixed

- Make image fit to size and not stretch in preview.
- Fix instagram embeds and facebook videos display.
- Avoid using uppercase for keywords, save them as written.
- Fix label for publish confirm modal.
- Fix annotations type select box styling in editor3.
- Fix text decoration in editor3.
- Extend editor3 service to allow spellchecking on all fields.
- Use attachment name as link title in editor3.
- Sync word count method with backend implementation.
- Automatic creation switch in templates is causing save button to malfunction.
- Fix issue with save button always active in vocabularies management.
- Fix issue when using tabs in user create form disables save button.

### Added

- Add support for multiple items on custom media fields.
- Allow labels on stories in a package.
- Add `importApps` config option.
- Allow transmitters to be added dynamicaly.
- Support for multiple items on custom media fields.

### Changed

- Insert empty line before/after embed only if the embed is frist or last item in editor3.
- Update pot file.

## [1.11.0] 2018-01-19

### Fixed

- Fix arrow button to move preview is not visible.
- Fix session error message alignment.
- Fix image drop on editor3 in firefox not working.
- Display meta sub-label even if it's disabled.
- Publish queue item history missing scrollbar.
- Correct the metadata of type list&image on preview.
- Limit input height in inline comments popup.
- Display translations for metadata values in preview.
- Fix text selecting in table displays wrong toolbar in editor3.
- Make inline comments dropdown scrollable.
- Show correct created timestamp on package item preview.
- Fix position of password reset window in user profile.
- Fix cancel button saving changes in metadata management.
- Fix publish confirmation dialog displayed for "send to desk" action.
- Close inline comments popup on resolve.
- Display custom fields in item preview.
- Fix missing avatars in activity list.
- Fix link editing in editor3 not being preserved.
- Fix editor3 up/down and home/end buttons behaviour on spellcheck errors.
- Change word counter on frontend to match backend.
- Use current item desk in send to/publish panel to detect if desk is authoring.

### Added

- Add edit/remove actions to inline comment replies.
- Add support for language in item lists.
- Add support for custom date field.
- Run spellcheker on annotation body in editor3.
- Add editor3 e2e tests.
- Enable user mentions in replies to inline comments.

# Changed

- Use backend config to override editor note.
- Allow leading and trailing spaces in find and replace.
- Make word count in authoring header dynamic to reflect latest changes.

## [1.10.0] 2018-01-05

### Fixed

- Fix Publish From panel visible on authoring desk.
- Fix missing links in annotation editor.
- Fix display issue with user password modal.
- Fix turning spellchecker on/off for editor3.

### Added

- Make font size configurable in editor.
- Add delete/resolve/edit/reply editor3 inline comment actions.
- Add feedback link to lefthand panel if configured.

## [1.9.0] 2017-12-13

### Fixed

- Fix check spelling shortuct not working when body html has the focus.
- Lists for ingest saved searches are not refreshed in monitoring when preview is open.
- Siplay custom error message on item lock failure. 
- Fix the refresh for monitoring widget when item is ingested/updated.
- Load Tansa module in async mode when used.
- Fix the need to save twice in upload form.
- Fix drag&drop from external folder to feature media field.
- Allow removing of highlight from spiked item.
- Fix edit crops button in multi edit.
- Add image metadata to item lists.
- Fix upload input fields.
- Fix reset password button.
- Fix missing content templates in desks settings.
- Fix highlights issues in preview.
- Fix weekdays toggle styles.
- Remove authoring and side navigation from Publish Queue.
- Fix `sd-splitter` issues.
- Fix priority/urgency fields styles.
- Refactor send panel - add scroll on small screens.
- Filter condition field name improvements.

### Added

- Add annotations to editor3.
- Add support for translations of vocabularies in authoring.
- Add pagination to ingest providers settings.
- Add Contacts management view.
- Add Slack channel setting to Desks and Slack user name to User profile.
- Allow custom schema/editor config for core types.
- Add confirm dialog to quick publish buttons.
- Add secret token field to HTTP Push subscriber settings.
- Allow usage of custom cvs in filter conditions.
- Add time to read to authoring.
- Add Author field to authoring header.
- Arabic translation added.
- Add text helper field for custom fields.
- Add author flag to user management.
- Add title to image preview in authoring.
- Allow hiding of certain user profile fields via config.
- Add Attachments authoring widget.
- Support custom fields in content profiles.
- Re-instance the subscriber tab in products management.
- Save dateline in user preferences.
- Add app extension points to authoring.
- Display notifications via desktop notifications.
- Add env var setting for environment name.
- Show scheduled date/time for scheduled content.
- Support language field in authoring header.
- Add name for custom workspace to monitoring.
- Allow new vocabulary creation.
- Add SAML auth support.
- Add Compare versions view. 
- Support object type fields in vocabulary schema.
- Add move path to FTP ingest settings.
- Add editor3 option to content profiles.

### Changed

- Disable publishing from desks type authoring.
- Make Sign-off field in user profile not required.
- Avoid Tansa when publishing.
- Improve content profile management UI.
- Refactor Settings UI.
- Takes are removed from core.

## [1.8.2] 2017-10-12

### Fixed

- Strip whitespace characters before saving and publishing.
- Fix the content expiry label.
- Fix the query for 'not category' filters.
- Byline is not populated from user preferences.
- Date should not clear when manually edited in Global advanced filter.
- Use specific version of superdesk ui framework.
- Fix the query for missing link.
- Allow initial crops available to be saved on new images.
- Use macro name if no label is defined for ingest routing.
- Cancel confirmation was hidden behind edit crop modal.
- Fix item history for scheduled items.
- Fix broken ingest routing modal.
- Fix problem where user can't publish stories when featured media is locked.
- Fix issue with mark for desk in authoring.
- Fix issue with non-updating highlights on authoring.
- Fix issue with single line input field.

### Added

- Add genre and desk to related item list.
- Add the action progress indicator in the grid view.
- Add config to enable edit in new window and open in new window actions.
- Make display crops for featured media configurable.

## [1.7.3] 2017-07-10

### Fixed

- Fix issue with single line input for editor block description.

## [1.7.2] 2017-07-04

### Fixed

- Make tansa language profile ids configurable.
- Make authoring widget shortcuts global.
- Stop on error when publishing.
- Fix issue with authoring shortcuts.
- Fix jumping cursor on image caption field.
- Allow tansa to run multiple times.

## [1.8.1] 2017-06-14

### Fixed

- Fix drag and drop to feature media from archived collection.
- Fix duplicate not working if default desk is not set.
- Fix UI issue with search providers.

## [1.8.0] 2017-06-09

### Fixed

- Cancel changes after attempting to kill or correct an item.
- Fix authoring shortcuts issue after route change.
- Fix jumping cursor on image caption.
- Display content expiry based on system settings.
- Fix template editor button not active after metadata changes.
- Fix related item query to look for both published and not published items.
- Queue items get preselected.
- When creating first stage on a new desk it does not appear.
- Fix markup for preview and export views.
- New subscriber is not available in item metadata dropdown.
- Show error message when saving an item on readonly stage.
- Prevent list updates when scrolled in legal archive.
- Send button should not be active for current desk and stage.
- Disable editor toolbar on headline field.
- Order content profiles by name in desk settings.
- Fix associate metadata to only copy fields defined in target item profile.
- Fix required fields in authoring are not marked required.
- Ignore whitespace when counting characters in authoring.
- Disable related item widget if slugline field is not enabled in content profile.
- Sort content profile fields by field order.
- Count of records vs aggregate numbers are inconsistent when takes are off.
- Changing day in schedule does not enable save button in template editor.
- Remove rearrange groups action from personal workspace.
- When crating new desk and stage, macros are not available.
- Only display legal archive if enabled.
- Fix template lookup to allow any public one.

### Added

- Add content API search page.
- Add option to move files on FTP after ingestion.
- Add login via google option.
- Add edit in a new window action.
- Allow item removal from vocabularies.
- Allow desks and templates to deselect a profile.
- Display errors in ingest provider configuration.

### Changed

- Add character limit for filter conditions.
- Enable save button in content filters when there is at least one filter defined.
- Limit name for content filter to 80 characters.
- Changing label for content labels in preview.
- Settings UI refactoring using UI framework.
- Add keywords field to authoring header section.
- Simplify workflow for corrent and kill actions.
- Limit content profile and template name length.
- Integrate Superdesk UI framework.
- Use templates instead of profiles for content creation.

## [1.7.1] 2017-06-06

### Fixed

- Fix updating `_etags` when item is locked/unlocked.
- Fix aggregation criteria reseting on single query when refresh frame is `ON`.

## [1.7.0] 2017-05-23

### Fixed

- Fix `null` value set for item profile if not enabled on desk.
- Fix monitoring stage running multiple queries on item open/close.
- Remove create content from spike and highlights views.
- Fix tansa running twice.
- Fix issue when template header is not visible.
- Hide company codes if not activated via content profile.
- Remove duplicate action on killed items.
- Fix tansa checking on feature media.
- Fix translate action not performed on items in the list view.
- Increate stage max size from 15 to 40.
- Enable template save button on change.
- Show profile dropdown for text items only.
- Close send to pane when an item is spiked.
- Hide spinner when saving area of interest fails.
- Update angular-embed to version supporting angular 1.6.
- Use specific versions of dependencies.
- Fix tooltips in duplicate tab and related item tab.
- No duplicate option on items in read-only stage.
- Enable mark for desk on text items only.
- Handle missing desk in templates settings.
- Correct and Kill buttons missing when workqueue item is opened.
- Modify versions tooltip in the editor.
- Disable save button when area of interest is opened.
- Improve ui in settings sections.
- Fix tooltips in metadata preview for type, priority and urgency.
- Enable save button when template is valid.
- Hide duplicates and used tab in metadata if empty.
- Fix slugline and take key fields editing in template editor.
- Fix missing fields when item is created from template.
- Fix reseting for subscriber type filter.
- Fix macros handling in action picker.
- Hide *Send and Continue* when `noTakes` config is enabled.
- Constant spinning sheel on item unspiking.
- Sort highlights by name.
- Only show format options on fields using editor in content profile.
- Remember last duplicate to destination.
- Fix moment timezone related console errors.
- Hide Global Read off stages from send to pane.
- Setting an item not for publication does not disable publish panel.
- Reopen does not work in the all opened items dialog.
- Double click on external source doesn't fetch item.
- Remove duplicates and history tabs from preview for external items.
- Image preview does not keep aspect ratio.
- Don't show footer helpline for multimedia items while editing.
- Fix headers issue after eve upgrade to 0.7.2.
- Fix query when fetching items from queue.
- Rewrite monitoring widget using React.
- Creator dropdown in global search has inconsisten user names.
- Add missing date search tags.
- Fix max height issue when monitoring group widget is configured for 25 items.
- Save and validate before send & publish action.
- Only display plugins if user has privileges.
- Fix fetching from external source to custom workspace.
- Minimize amount of prepopuplate requests when testing.
- Sign off field doesn't reflect updated value.
- Missing footers in print preview.
- Trigger search via enter on search providers parameters.
- Fix keyboard shortucts which were not working across browsers.
- Fix modal closing via keyboard.
- Enable scrolling in highlights/desk lists.

### Added

- Add option to disable missing link warning.
- Add cancel button to monitoring settings modal.
- Add *Used* tab for media items if they are used in a story.
- Add feature media metadata to metadata tab.
- Provide distinct caption and description for images.
- Add product types to products.
- Add *Get from external source to* action to external items.
- Add tables support in editor3.
- Allow duplication to different desk/stage.
- Add file extention config for ftp transmissions.
- Add option to clear publish schedule date and time on send.
- Support featured media in templates.
- Add progress indicator when item is fetched from external repo.
- Add internal destinations management.
- Add stage dropdown to monitoring view.
- Add filter to content profiles for active/inactive.
- Test case for word counts.
- Item history view.
- Multi-view of item version history.
- Added Wufoo service provider config.
- Export and download feature for items.
- Support parent based search for subject tree field.
- Show email list subscription form.
- Support for elasti 2.x.

### Changed

- Change spellcheck shortcut to `ctrl+shift+y`.
- Hide related items widget for picture items.
- Order settings alphabetically.
- Remove groups settings.
- Only allow text items to be added to highlights.
- Update angular to 1.6.3.
- Add maxlength validation for multimedia metadata.
- Removing paranthesis from search bar keywords.
- Exclude SMS, Abstract, Dateline, Footer and Sign Off on multi-media items.
- Display marked for desk items as a separate group in monitoring.
- Show take key, related item count and missing link in authoring header.
- Allow spiked content in global search.
- Analytics has its own repository.
- Override values using content profile default when profile is changed.
- Improve related item widget - display links.

## [1.6.2] 2017-04-06

### Fixed

- Fix moment-timezone version to 0.5.11.

## [1.6.1] 2017-03-09

### Fixed

- Fix build after new angular release.
- Fix issue where renditions were not saved after original was modified.
- Fix lost scroll position when user opens an item in authoring.
- Pick item when select box is clicked.
- Fix preview is not closed when an item is opened for authoring.
- Hilite featured placeholder on dragover event.
- Fix grouping of macros when group is missing.
- Fix esc key handling in modal directives.
- Fix bad schema settings in content profiles when using min length.
- Disable reseting of items when performing multi select.
- Filter profiles by desk in authoring.
- Fix issue with scrolling in monitoring widget.
- Fix tansa proofing.
- Fix related widget to show state and display results when widget is opened.
- Fix typos and grammar in UI.

### Added

- Prefix `Archived from` to desk info for archived items.

### Changed

- Make `singleLine` a new config.

## [1.6.0] 2017-02-16

### Fixed

- Fix media captions are checked by Tansa but changes are not saved.
- Updated translations.
- Fix missing styles for item preview.
- Make word counts consistent with server.
- Fix missing items in monitoring widget.
- Remove unwanted tags in item headline.
- Fix scrolling when selecting an item.
- Fix error in image crops editing when selected are is smaller than rendition.
- New crop of original image should not be less than crops defined.
- Keep items selected when going to single desk view and back.
- Wrap guid in metadata panel.
- Fix selecting default content profile in authoring.
- Fix workqueue items not being unlocked after spiking.
- Disable some widgets when item is spiked.
- All renditions and metadata updates should be saved together.
- Disable post button when there is no text in comment form.
- Use user settings to load locales data.
- Correct highlight behaviour based on user desk privileges.
- Fix fetching of items from external source.
- Cache fetch all queries in desks service.
- Fix multiselecting when using keyboard shortcut.
- Fix cursor position issues when editing tables.

### Changed

- Change spike view of desk to show more items.
- Spellchecker should not mark capitalized words as mistakes.
- Change initial number of items in single group monitoring to 50.
- `thinRown` config is now a user preference.

### Added

- New editor based on draft-js (experimental).
- Let pluggins add items to side nav menu.
- Display queue errors for published items.
- Group macros in authoring view.
- Add desk/stage info to item preview.
- Add tooltips to associate indicators.
- Add mark for desk feature.
- Validate data in routing scheme form.
- Mark required fields when adding/editing subscriber.
- Add `ctrl+shift+#` shortcut for spiking an item.
- Allow config changes without rebuild.
- Add password-less authentication via jabber.
- Add remove link to other stories item action.
- Allow selecting of items via `x` shortcut.
- Add filter for items with featured media.
- Add content api token management for subscribers.
- Allow specific narrow view config when there is both preview and authoring opened.

## [1.5.2] 2017-01-18

### Fixed

- Sort content filter `field` drop down.
- Avoid translation of field names in content filters.
- Fix editing of content profiles with custom fields.

### Changed

- Update ukranian translation.
- Reduce item height by half for thinRows config.
- Only `text` type items in `archived` collection can be duplicated.

### Added

- Add `BCC` config for email subscribers.

## [1.5.1] 2017-01-03

Includes changes from 1.4.8 plus:

### Fixed

- Make scrollbar always visible in swimline view.
- Pull actions menu for related items to the right.

### Changed

- Use po files for translations from customer repo if any.
- Update russian translation.

## [1.5] 2016-12-21

### Fixed

- Fix takes link on monitoring and preview.
- Fix translations in widgets list.
- Scroll to highlighted and active text when using macro prev/next.
- Fix desk dropdown in send to panel.
- Cache spellchecking dictionaries.
- Fix UI in routing schema modal.
- Keep selected repositories when clearing search filters.
- Serve duplicate server requests from cache.
- Fix weekday picker active state style.
- Add error notification for duplicate unique name when publishing.
- Target type of routing scheme rule is always negative.
- Fix UI for swimlane view.
- Cache vocabularies to reduce api calls.
- Prevent monitoring widgets to grow in size.
- Add support for HTML in confirmation headline and body.
- Do not limit to 25 when fetching users desks.
- Add version to app.bundle on build.
- Fix filter UI when switching between presets and dates.
- Scroll to active text position when in find and replace.
- Turn off automatic spellchecking if there is no dictionary.

### Changed

- Use projections in search results.
- Use prefered desk in send to panel.

### Added

- Add `ctrl+k` shortcut for spike action.
- Add duplicate action to text archive items.
- Add live suggestions modal.
- Add styles for `blockquote` in editor.

## [1.4.7] 2016-12-20

### Fixed

- Fix user profile link to mentioned users for users with `.` in username.

## [1.4.6] 2016-12-09

### Fixed

- Fix raven lib version.
- Fix angular lib version.

## [1.4.5] 2016-12-06

### Fixed

- Style fixes for the editor.

## [1.4.4] 2016-12-05

### Added

- Add desk language picker.

## [1.4.3] 2016-12-05

### Changed

- Improve look of html tables in the editor.

### Fixed

- Fixed issue when switching between search providers and superdesk.

## [1.4.2] 2016-11-30

### Fixed

- Make tansa min urgency configurable.
- Unordered list is not shown with bullets points.

## [1.4.1] 2016-11-29

### Added

- Add support for graphic type.

### Fixed

- Fix translation issue for publish.

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
