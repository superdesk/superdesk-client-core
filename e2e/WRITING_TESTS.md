# Writing end-to-end tests for superdesk-client-core

How to write a Playwright end-to-end test in this repo. Read this before
authoring a spec. A companion doc exists in `superdesk-planning`; the two share
most conventions but differ in auth and state-reset, so do not copy planning's
patterns verbatim here.

## TL;DR

Every new spec:

- Lives flat under `e2e/client/playwright/` as `<scenario>.spec.ts` with a
  descriptive hyphenated name (`article-send-to.spec.ts`).
- Selects elements with `page.getByTestId('...')` and locator chaining. Never
  the legacy `s()` helper (see "Selectors" for why, and what to do when you
  copy an existing spec that uses it).
- Starts logged in via the committed `storageState`. No `login()` call unless
  the spec needs a non-default user or exercises the login flow itself.
- Resets state with `await restoreDatabaseSnapshot()` at the start of any test
  that mutates server data.
- Reuses Page Objects from `playwright/page-object-models/`.
- Asserts with web-first assertions (`await expect(locator).toBeVisible()`).
  Never `page.waitForTimeout(...)`.

## Where specs and helpers live

```
e2e/client/playwright/
├── <scenario>.spec.ts          <- specs are flat here, hyphenated names
├── page-object-models/
│   └── <feature>.ts            <- Page Object classes (Authoring, Monitoring, ...)
├── scenarios/
│   └── <flow>.ts               <- multi-feature flows shared by several specs
└── utils/
    ├── index.ts                <- restoreDatabaseSnapshot, login, helpers
    └── storage-state.ts        <- getStorageState
```

- Specs are flat files directly under `playwright/`. Do not create
  `<feature>/` subdirectories for specs. Name the file after the user-visible
  behaviour: `assign-coverage.spec.ts`, not `test1.spec.ts` or `bug-123.spec.ts`.
- Page Objects live in `playwright/page-object-models/<feature>.ts`, one class
  per feature area, methods named after user-facing operations.
- A flow that several specs drive end to end and that spans more than one
  feature area (so it fits no single Page Object) goes in
  `playwright/scenarios/<flow>.ts` as a function taking the `Page`. Scenarios
  may import Page Objects and utils; nothing imports a scenario except a spec.
  Keep the dependency direction one-way: specs -> scenarios -> Page Objects ->
  utils. A util must never import a Page Object.
- Import helpers and Page Objects with local relative paths:
  ```ts
  import {restoreDatabaseSnapshot} from './utils';
  import {Monitoring} from './page-object-models/monitoring';
  ```
  There is no published helpers package. Do not import from
  `@superdesk/end-to-end-testing-helpers` or any `@superdesk/...` path for e2e
  helpers; it does not exist.

## Selectors

The Playwright config sets `testIdAttribute: 'data-test-id'`, so `getByTestId`
matches Superdesk's `data-test-id` attributes directly.

### Primary selector: `getByTestId` with chaining

```ts
await page.getByTestId('save-button').click();

// "the child inside this specific parent": chain, do not build a CSS string
await page.getByTestId('action-bar').getByTestId('save').click();
```

### Do not use `s()` in new specs

Most existing specs use a local helper `s('a', 'b')` that builds a CSS selector
string (`[data-test-id="a"] [data-test-id="b"]`) passed to `page.locator(...)`.
It still works, but new specs use `getByTestId` instead, because:

- It is the standard, documented Playwright API. QA and AI agents can look it up.
- `planning` already uses it, so both repos share one idiom.
- It returns a real Locator that composes with `.filter()`, `.and()`, `.nth()`.

When you copy an existing spec for structure (see "Reference specs"), translate
its `s()` selectors to `getByTestId`. Do not carry `s()` into a new spec.

Translation reference:

| Legacy `s()` | Native equivalent |
|---|---|
| `s('save-button')` | `page.getByTestId('save-button')` |
| `s('action-bar', 'save')` | `page.getByTestId('action-bar').getByTestId('save')` |
| `s('article-item=story 2')` | `page.getByTestId('article-item').filter({hasText: 'story 2'})` when the value is visible text, otherwise `page.getByTestId('article-item').and(page.locator('[data-test-value="story 2"]'))` |

The value-matched case (`s('id=value')`, which matches `data-test-value`) is
more verbose natively. Prefer `.filter({hasText})` when the value is the visible
text of the element (it is substring-based and whitespace-tolerant, so it is
also more robust than the old exact-attribute match). Fall back to
`.and(page.locator('[data-test-value="..."]'))` only when the value is a
non-text attribute.

### What not to use for primary selectors

- CSS class chains (`.sd-list-item .item-title`): brittle, drift-prone.
- Text matching for actionable elements (buttons, links): breaks under
  localization.
- XPath.

### Fine for assertions

- `getByRole('button', {name: '...'})` for accessibility-shape checks.
- `getByText(...)` / `toHaveText(...)` for asserting user-facing copy.
- Text matching where the text itself is the behaviour under test (a toast
  message, a validation error).

## Authentication

The browser starts logged in as the default admin user via a committed
`storageState` file (`playwright/.auth/user.json`), wired into the Playwright
config's project. That session is valid because it is also present in the `main`
database snapshot that `restoreDatabaseSnapshot()` restores. Most specs need no
login step.

To override application config while keeping the auth session, use
`getStorageState`:

```ts
import {getStorageState} from './utils/storage-state';

test.use({storageState: getStorageState({featureName: true})});
```

Exceptions that do need an explicit login:

- A different user role, or exercising the login flow itself. The repo has a
  `login(page)` helper in `./utils`, but note it is currently `s()`-based legacy
  code. If you write a new spec that needs a fresh login, prefer driving the
  login form with `getByTestId` directly rather than extending the legacy helper.

### Users in the `main` snapshot

| username       | password       | display name  | notes                                           |
| -------------- | -------------- | ------------- | ----------------------------------------------- |
| `admin`        | `admin`        | John Doe      | administrator, the committed `storageState`     |
| `frodobaggins` | `frodobaggins` | Frodo Baggins | ordinary user, member of the Sports desk        |
| `samgamgee`    | `samgamgee`    | Sam Gamgee    | Sports desk member with the `Sub Editor` role   |
| `janedoe`      | (unknown)      | Jane Doe      | ordinary user, no desk, password never recorded |

Use `frodobaggins` or `samgamgee` for anything that needs a second actor: a
two-user lock or mark-for-user flow, or a permission check. Both have a known
password (the password is the username) and both are members of the Sports desk,
so both can reach the Sports monitoring view. What separates them is privileges:
`frodobaggins` holds none at all, which is what makes it the negative half of a
privilege test, while `samgamgee` carries the `Sub Editor` role and so holds
*some*, but not `send_to_personal` or `unlock`.

`frodobaggins` has `user_type: "user"`, a `role` of `null`, and no `privileges`
field, so it holds **no** privileges at all. Keep it that way: do not assign a
role and do not add a `privileges` field. superdesk-core's `get_privileges`
returns the user's own privileges when there is no role, and merges the user's
over the role's when there is one, so either change grants something. The empty
state is deliberate, it is what makes the account usable for the negative half
of a privilege test, for example asserting that a user without `unlock` sees no
Unlock button on an item another user locked. If a future spec needs a user that
holds some privileges but not others, add a separate user carrying a role or its
own `privileges` rather than granting anything here, or the negative cases that
rely on this account will start passing for the wrong reason.

`samgamgee` is that separate user: same shape as `frodobaggins`, plus the
`Sub Editor` role, a default `desk` of Sports and a `workspace:active` preference
pointing at it (which is also a second reason the Sports desk cannot be deleted).
It is the account to reach for when a spec needs a user that holds *some*
privileges. Its `active_privileges` are exactly the role's, and
`send_to_personal` and `unlock` are set to `0` there on purpose, so it covers the
negative branch of those two while still being able to open the Sports monitoring
view and edit items.

### Roles in the `main` snapshot

| role           | privileges                                                          |
| -------------- | ------------------------------------------------------------------- |
| `Administrator`| every privilege set to `1`, for asserting an admin-level assignment  |
| `Sub Editor`   | desk editing, with `send_to_personal` and `unlock` set to `0`        |

Neither role is `is_default`, so users created through the API or the UI still
get no role. Only `samgamgee` is assigned one.

To read the privileges a user actually ends up with, `GET /api/preferences/<session id>`
and look at `active_privileges`. `GET /api/users/<id>` does not expose the field.

## State reset

If a test creates, edits, or deletes server data, restore the base snapshot
first:

```ts
import {restoreDatabaseSnapshot} from './utils';

test('sends an article to another desk', async ({page}) => {
    await restoreDatabaseSnapshot();          // restores the 'main' snapshot
    await page.goto('/#/workspace/monitoring');
    // ...
});
```

- `restoreDatabaseSnapshot()` defaults to the `'main'` snapshot. Pass
  `{snapshotName: 'legacy'}` only if you specifically need the legacy dataset
  (which has a known session-expiry quirk; see `dismissSessionExpiry` in
  `utils`).
- It posts to `/api/restore_record` on the backend. There is no per-test
  "add one item" API in client-core. Any state your test needs must exist in
  the snapshot. If it does not, add it server-side (see "Adding fixture data"),
  do not construct it through the UI in a setup step. The one narrow exception:
  a precondition created by a **single atomic UI action** may be built in-test
  (as `edit-embed.spec.ts` adds one embed). Building state through a **loop** of
  UI actions (several of something) is fragile and not allowed: the editor
  reflows between actions and the flakiness compounds, so anything you need more
  than one of belongs in a fixture.
- Pure-read tests that only assert on data already in the snapshot can skip the
  reset. When in doubt, reset.

## What's in the `main` snapshot

The base snapshot is small. Commonly used data (read existing specs for the full
set, this is not exhaustive):

- **Desks:** Sports (the default in most specs), Education, Finance, Politic Desk.
- **Sports monitoring groups:** Working Stage, Incoming Stage, desk output.
- **Articles:** "test sports story" and "story 2" in Sports / Working Stage,
  "Package Highlight 1" there too, and "Story 5" published in Sports desk output.
- **Users:** `admin`, `frodobaggins`, `samgamgee`, `janedoe` (see "Users in the
  `main` snapshot" under Authentication).
- **Roles:** `Administrator` and `Sub Editor`, neither of them the default role.
- **Saved searches:** "Malaysia" and "Technology", both global, both owned by
  `admin`. There is no private one; use the `saved-search-private` snapshot.
- **Story profile `body_html` toolbar:** `h2`, bold, italic, underline, quote,
  link, embed, media, table. Nothing else; use the `editor3-formats` snapshot
  for the rest.

Every article in `main` is text, apart from "Package Highlight 1", which is a
package attached to a highlight. There is no picture, graphic, video or audio
item, and no plain package; use the `media-items` snapshot for those.

Other datasets are separate and loaded with
`restoreDatabaseSnapshot({snapshotName})`: `legacy`, `spellchecker`,
`editor3-tables`, `custom-blocks`, `availability-management`, `media-items`,
`editor3-formats`, `editor3-suggestions`, `authoring-extras`,
`saved-search-private`, `publishing`, `required-headline`,
`association-fields`, `editor3-comments`.

### Publishing config in the `main` snapshot

`main` ships one subscriber, "Subscriber 1", whose single destination
("Destination 1") formats as `email` and delivers by email. Its product
("Product 1") carries a *blocking* content filter on the sluglines `Football`
and `Basketball`, so those two never reach it. The subscriber is targetable, so
`Authoring.publish({subscribers: ['Subscriber 1']})` restricts a publish to it
and produces exactly one queue entry; `publish({subscribers: []})` fans out to
every subscriber whose products match.

There is no NINJS destination in `main`. Use the `publishing` snapshot for
anything that asserts on the payload a subscriber is actually sent.

### The `media-items` snapshot

`restoreDatabaseSnapshot({snapshotName: 'media-items'})` gives you everything in
`main` plus one item of each media type, all in Sports / Working Stage:

- "Rivendell picture" - a picture with all renditions, for image editing (crop,
  rotate, flip) and for the picture branch of the media widgets.
- "Moria graphic" - a graphic. `graphic` is a distinct item type in the UI and
  the type filters treat it separately from `picture`. It is a picture whose
  `type` was flipped in mongo, and it keeps `profile: "picture"` because the
  snapshot carries no graphic content profile. Type filtering therefore behaves
  as documented, but graphic-specific authoring behaviour is not represented: a
  spec that needs real graphic authoring must not rely on this item.
- "Isengard video" and "Lothlorien audio".
- "Shire package" - a plain package (no `highlight`) containing the picture.
  `main`'s only package belongs to a highlight, so package behaviour that must
  not depend on highlights needs this one.

Reach for it when a spec asserts something about a non-text item: the monitoring
type filter buttons, media metadata, the crop/rotate editor, the media carousel.
Do not reach for it otherwise, because it also shifts every item count in the
Sports groups relative to `main`.

### The `editor3-formats` snapshot

`restoreDatabaseSnapshot({snapshotName: 'editor3-formats'})` gives you `main`
plus the full editor3 toolbar on the Story profile. Two things change:

- `body_html` gets every heading level, strikethrough, subscript, superscript,
  `pre`, both list types and the formatting-marks toggle on top of the nine
  options `main` ships. Reach for it for any spec about a format `main`'s
  toolbar does not offer.
- A custom editor3 text field, "Sample rich text" (vocabulary id
  `sample_rich_text`, `field_type: "text"`), is added to the content section with
  the same format options. `main` has no custom text field at all, so this is the
  only snapshot where a formatting case can be repeated against one.

Format option names are the `RICH_FORMATTING_OPTION` strings from
`scripts/core/superdesk-api.d.ts`, and several contain spaces: `ordered list`,
`unordered list`, `formatting marks`. Preformatted text is `pre`.

A toolbar button exposes two handles. The legacy one is
`data-test-id="formatting-option"` with the option name in `data-test-value`, so
`s('editor3', 'formatting-option=strikethrough')` finds it, but it sits on the
inner `<i>` icon rather than on the outer `<span>` that carries the click
handler. The outer span carries `data-test-id="formatting-option-button"` with
the same `data-test-value`, and that is the handle to use: reach for it through
`getEditor3FormattingButton(field, 'strikethrough')` in
`playwright/utils/editor3.tsx`, alongside `getEditor3Field(page, 'body_html')`
for the field itself and `getEditor3TextRun(field, text)` for the Draft.js leaf
an inline style lands on.

The formatting-marks button is the exception: the toolbar passes it the
internal label `invisibles`, which has no entry in the option map, so
`data-test-value` is absent and it has to be found by its
`data-sd-tooltip="Toggle formatting marks"`. `link`, `embed`, `media` and `table`
are a different component again, found with `getByRole('button', {name})`.

The Angular authoring view keys custom fields by display name, so the field is
`s('authoring', 'authoring-field=Sample rich text')`, not by its vocabulary id.

### The `editor3-suggestions` snapshot

`restoreDatabaseSnapshot({snapshotName: 'editor3-suggestions'})` gives you the same
toolbar as `editor3-formats` with `suggestions` added, on `body_html` and on the
custom text field alike. It is the only snapshot that offers the option at all:
`main` and `editor3-formats` enable it on no field, so suggestions mode is
unreachable under either.

The toggle is a `StyleButton` like bold or italic, so it is found the same way, by
`data-test-value="suggestions"`, and it carries `Editor3-activeButton` while
suggestions mode is on.

It also carries "story with suggestions" on the Sports desk, an article whose body
reads `alphabravocharliedeltaechofoxtrot`: six words run together with no separators
between them, with `bravo` and `foxtrot` as insertion suggestions and `delta` as a
deletion suggestion, all made by `admin` and all unresolved. Assert on the individual
words, not on a spaced sentence. Reach for it whenever a case starts from an article
that already has suggestions rather than from making them. A suggestion is draft.js
editor state under `fields_meta`, not markup, so it is recorded like any other field
the browser writes; there is nothing special about putting one in a snapshot.

Three things about suggestions themselves are worth knowing before writing a spec:

- An insertion suggestion that directly touches a deletion suggestion is reported as
  a single "Replace X with Y" suggestion, and accepting or rejecting it resolves both
  halves at once. Leave plain text between them if you want two.
- The detail popup renders only while the caret sits inside a suggestion, and it is
  re-rendered only when the caret *moves* (`HighlightsPopup.shouldComponentUpdate`).
  A click that lands where the caret already sits, which is where accepting or
  rejecting one leaves it, shows nothing, so park the caret on plain text first.
- The same re-render tears the popup down again, so a popup that was found open can
  be gone by the time the next assertion runs. Retry the opening clicks and the
  assertions on the popup as one `toPass` unit, not the clicks alone.
### The `association-fields` snapshot

`restoreDatabaseSnapshot({snapshotName: 'association-fields'})` gives you `main`
plus two association fields on the Story content profile and the items to put in
them:

- **"Shire related items"** - vocabulary `shire_related_items`,
  `field_type: "related_content"`, accepting text and picture items.
- **"Shire gallery"** - vocabulary `shire_gallery`, `field_type: "media"`,
  accepting pictures.

Both allow in-progress and published items and up to five items each. `main`
carries no vocabulary with a `field_type` at all, so neither kind of field can
render under it; the only comparable one anywhere else is "Image gallery 33" on
`legacy`'s editor3 profile.

The content is three text items ("Bree bulletin", "Rohan dispatch",
"Weathertop note") and three pictures ("Gondor picture", "Mirkwood picture",
"Fangorn picture"), all in Sports / Working Stage. The text items are here
because the publish-time refusal for a locked association is worded
`<headline>: ...`, and `main`'s other Sports items carry only a `slugline`, so a
refusal naming one of them reads as a raw item id or as an empty string. The
three pictures share one set of renditions, so they render the same image.

Two things to know before writing against the fields:

- **Address both fields by display name, drop on the inner element.** `article-edit.html`
  marks the media and related-content blocks alike with `data-test-id="authoring-field"`
  and the display name in `data-test-value`. The gallery carousel inside exposes
  `media-gallery--upload-placeholder`, `media-gallery-image` and
  `media-gallery-image--remove`. The related-content block's inner drop zone (the
  `[sd-related_items]` element, which is where the drop listener binds) has no test id
  of its own: descend to it from the block for drops, and count its rows by the
  `field--slugline` each row renders.
- **Drop one item at a time.** Both fields derive a new association key from the
  ones already on the item, asynchronously, so two drops in a row compute the
  same key and the second replaces the first. Wait for each dropped item to
  appear before dropping the next.
### The `editor3-comments` snapshot

`restoreDatabaseSnapshot({snapshotName: 'editor3-comments'})` gives you `main`
plus `comments` in the Story profile's `body_html` format options, which is what
puts the Comment button on the editor3 toolbar and makes inline comments
reachable at all. Nothing else changes, so item counts and every other profile
match `main`.

Reach for it for any spec about inline comments: adding, editing, replying,
resolving, the Inline comments widget, the mention notification. No content
profile in `main` or in any other record based on it enables the option, and the
only other snapshot that does is `legacy`, whose separate user database rules out
a two-user flow.

### The `authoring-extras` snapshot

`restoreDatabaseSnapshot({snapshotName: 'authoring-extras'})` gives you `main`
with "test sports story" carrying `keywords` (`Rivendell`, `Mordor`) and an
`expiry` of 2099-12-31. The Info widget renders both lines only when the item has
the values (`ng-if="item.expiry"`, `ng-if="item.keywords.length"`), and in `main`
only the spiked items have an expiry, so neither line is reachable there on an
editable item. The date is far future on purpose: snapshot dates are absolute and
are never relativised at restore, and an item past its expiry is a candidate for
the content-expiry job.

The keywords row is not labelled "Keywords". `metadata-widget.html` gives it the
"Word Count" label, an upstream mislabel, and the row directly above it carries
the same label under `ng-if="item.word_count"` and is the real word count, which
`main` already renders. Locate the keywords row by position or by its content,
never by its label.

The recorded API write also re-versioned the item: `versioncreated` moved to
2026-08-08 and `_current_version` went from 2 to 3. Under this snapshot "test
sports story" therefore sorts to the top of Sports / Working Stage (monitoring
sorts `versioncreated:desc`) and shows one version more than it does under
`main`.

Note that `expiry` is not writable through the archive API, it is derived from
desk settings server-side. The value in this snapshot was set in mongo directly.

### The `required-headline` snapshot

`restoreDatabaseSnapshot({snapshotName: 'required-headline'})` gives you `main`
with one change: the Story content profile marks `headline` as required and
non-empty (schema and editor both). In `main` the Story profile requires
nothing, so no publish-validation failure is reachable there; the `validators`
collection does not apply because every item carries a profile. Reach for this
snapshot when a spec needs publishing to be blocked by a missing field on the
standard Sports items: publishing with an empty headline fails with
"HEADLINE empty values not allowed". Saving is unaffected; required fields only
gate publishing.

### The `saved-search-private` snapshot

`restoreDatabaseSnapshot({snapshotName: 'saved-search-private'})` gives you
`main` plus "Shire drafts", a saved search with `is_global: false` owned by
`admin`, so the private saved-search list is not empty for the default session.
`main` ships two global searches and no private one.

It is a record rather than part of `main` because the monitoring-settings spec
that covers the saved searches tab seeds its own private search through the UI
and asserts the list holds exactly one. Once that spec switches to this snapshot
and drops the seeding, the search can be promoted into `main`.

### The `publishing` snapshot

`restoreDatabaseSnapshot({snapshotName: 'publishing'})` gives you `main` plus a
second subscriber, "Public API", and the unfiltered product it points at, "All
content". Its one destination, "NINJS Email", formats as `ninjs`, so this is the
snapshot to reach for when a spec asserts on the payload a subscriber is sent
rather than on the fact that a publish happened.

The payload is read back through the item history's transmission details, which
render the queue entry's `formatted_item` verbatim: publish, open the item from
the Publish Queue page (`/#/publish_queue`, `publish-queue-table` /
`publish-queue-item`), then *Item history* and expand the transmission details.
That panel (`versioning/history/views/publish_queue.html`) carries no
`data-test-id` on develop; the attachments branch adds the ones a spec needs.

Three things to know before using it:

- **Two queue entries per publish.** Nothing here is targeted, so an untargeted
  publish reaches "Subscriber 1" and "Public API" both. A queue locator keyed on
  the headline alone therefore matches two rows, and a `toBeVisible()` on it
  fails as a strict-mode violation. Narrow by the Subscriber or Destination
  column.
- **The transmission succeeds.** Delivery is by email into the stack's mailcrab,
  not by HTTP push. The email transmitter sends `formatted_item` verbatim when it
  is not email-formatted, so the body stays NINJS and the entry settles at
  `state: "success"`. `legacy`'s "Public API" pushes to `http://localhost:5050`,
  which nothing in the stack answers, so its entries never leave `retrying`. Only
  reach for `legacy` if a spec needs the rest of that dataset.
- **The queue view does not live-update.** `/#/publish_queue` reads the queue
  only when it loads, so a spec already sitting on that page when a publish
  happens will not see the new row without navigating again. Navigating there
  after publishing needs no retry loop: transmission runs inline on this stack
  (`CELERY_ALWAYS_EAGER`), so the row and its final state already exist by the
  time the publish request returns, which is why `publishing.spec.ts` and
  `publish-queue.spec.ts` both assert once.

### Publishing an item that has associations

`e2e/server/settings.py` sets `PUBLISH_ASSOCIATED_ITEMS = True`, which
superdesk-core defaults to `False` (its own test suite turns it on). It is
process-level app config with no runtime override, so it applies to every spec
and every snapshot; it cannot be opted into per test. Two consequences to write
against:

- Publishing an item **publishes its associations too**. The associated item
  moves to `published`, leaves the working stage for the desk output group and
  gets its own publish queue entries. Any count assertion taken after publishing
  an item that carries feature media, a related item or a gallery has to account
  for that.
- The "There are unpublished related items that won't be sent out..." publishing
  warning **never appears**. `_raise_if_unpublished_related_items` returns early
  when the setting is on, so there is no confirmation step to drive.

In exchange, publishing validates the locks on associations, which is what the
locked-item publishing cases need. Publishing an item whose association is locked
fails with HTTP 400 and a validator exception naming the association:

- locked by someone else:
  `<headline>: packaged item is locked by another user`
- locked by the publisher:
  `<headline>: packaged item is locked by you. Unlock it and try again`

Which of the two you get depends on the button, not on who holds the lock. The
validator compares the association's `lock_user` with the *publishing item's*,
and the send/publish pane releases the publishing item's lock first
(`$scope.beforeSend`), so anything published through that pane is refused as
"locked by another user" even when the tester holds the lock themselves. Send
Correction is a topbar button that publishes without releasing anything, so a
correction is the only route to the "locked by you" wording.

No item in any committed snapshot carries `associations`, so a spec that needs
one has to build it (attach feature media, a related item or a gallery item
through authoring) before publishing. The `association-fields` snapshot carries
the related-content and gallery fields to build it in.

### Adding fixture data

If your scenario needs data the snapshot lacks, add it server-side rather than
building it through the UI. Full steps are in `e2e/README.md` ("Managing database
snapshots"); both run from `e2e/server` in a Python venv:

- **A record (patch)** for test-specific data that should not bloat `main`:
  `python manage.py storage:record --base-dump main --name <name>`, then load it
  with `restoreDatabaseSnapshot({snapshotName: '<name>'})`.
- **Regenerate `main`** for broadly useful data: `storage:restore main`, make the
  change in the browser, then `storage:dump --name main`.

This alters shared fixtures, so treat it like a product-source change: call it
out in your hand-off for review.

## Page Objects

Reuse the classes in `playwright/page-object-models/`. They take a `Page` in the
constructor and expose methods named after user operations:

```ts
import {Monitoring} from './page-object-models/monitoring';

const monitoring = new Monitoring(page);
await monitoring.selectDeskOrWorkspace('Sports');
```

When an interaction is not covered by an existing method, add a method to the
relevant Page Object rather than inlining it in the spec. Keep Page Objects
stateless beyond holding the `Page`; they are interaction wrappers, not models.
New Page Object methods use `getByTestId`, not `s()`.

An interaction with **known flakiness** (settling waits, a retry/`toPass`, a
network stub) especially belongs in a Page Object: write the robustness once so
the next spec inherits it instead of re-deriving it from scratch.

## Running tests

The bootstrap script runs from the repo root. Playwright runs from `e2e/client/`.
Do not run `npm test` at the repo root; that is unit tests and lint, not e2e.

```sh
# From the repo root: bring up the stack (idempotent; rebuilds the client if
# product source changed since the last build).
./e2e/scripts/e2e-up.sh

# From e2e/client/: run one spec
cd e2e/client
npx playwright test playwright/<scenario>.spec.ts

# Watch it execute in a real browser
npx playwright test playwright/<scenario>.spec.ts --headed

# After a failure, open the trace
npx playwright show-trace test-results/<run-id>/trace.zip

# From the repo root: tear down
./e2e/scripts/e2e-down.sh
```

The backend defaults to `http://localhost:5002/api` (override via the
`SUPERDESK_URL` env var, from which the bootstrap script derives the port). Port
5000 is avoided because macOS AirPlay Receiver answers on it and silently masks
a missing server.

Prefer `e2e-up.sh` even when the servers already respond: "servers up" does not
imply "deps installed." If you run a spec against an already-running stack and
hit a module-not-found error, note that `e2e/client` resolves some deps (e.g.
`request`) from the **repo-root** `node_modules`, so both root and `e2e/client`
need `npm ci`, and the browser needs `npx playwright install chromium`. The
bootstrap script does all three.

## Common pitfalls

- `page.waitForTimeout(N)` to paper over a race is almost always wrong. Wait for
  the actual condition: `await expect(page.getByTestId('result')).toBeVisible()`.
  Web-first assertions auto-retry until they pass or time out.
- Order-dependent selectors (`.nth(2)`) only when order is the behaviour under
  test. Otherwise find the item by a stable value.
- "Passes solo, fails in a suite" is a shared-state problem. Add
  `restoreDatabaseSnapshot()`.
- The only acceptable product-source change from a test is adding a
  `data-test-id` attribute. Anything more, including renaming an existing
  `data-test-id`, belongs in a separate PR with product review.
- Do not import product modules from `scripts/` into specs. Tests depend on the
  `data-test-id` contract and the e2e helpers, nothing else.
- A single green run is not proof of stability. Before calling a new spec done,
  run it under repeat: `npx playwright test playwright/<scenario>.spec.ts
  --repeat-each 5` (more for fast specs). Flakiness from async UI churn often
  shows only on repeat.
- Find a `data-test-id` by grepping the feature's source
  (`grep -rn 'data-test-id' scripts/...`); there is no central catalog.

## Comments

Comment the non-obvious *why*, not the *what*. A reader can see what
`getByTestId('save').click()` does; they cannot see why you had to
`dispatchEvent('mousedown')` instead of `click()`, or why a third-party call is
stubbed. Reserve comments for that: workarounds, async timing, app quirks, an
unusual selector shape.

Do not narrate the steps (`// hover the embed`) or restate the QA case
(`// Expected: Cancel discards`). The scenario mapping belongs in the
`describe`/`test` titles, which are the first thing a reviewer reads. The
reference spec below (`edit-embed.spec.ts`) follows this: every comment in it
explains a non-obvious decision, and the flow itself is left to read as code.

## Reference specs

When writing a new spec, start from the closest of these curated native
examples, copy its structure, and adapt. These use the current conventions
(`getByTestId`, `storageState`, `restoreDatabaseSnapshot`, Page Objects):

- `playwright/edit-embed.spec.ts` - the canonical native reference. Built from a
  real QA case ("Edit embed", SDESK-4441/4213). It opens an article from
  Monitoring, edits the Body field, drives a dialog, and verifies persistence
  across save and reopen. It demonstrates, in order:
  - `restoreDatabaseSnapshot()` plus the committed `storageState` (no `login()`).
  - `getByTestId` with locator chaining, and the value-matched field case
    (`authoring-field=body_html`) written natively with
    `.and(page.locator('[data-test-value="body_html"]'))`.
  - building a precondition through the UI as the narrow exception allowed by
    "State reset": no snapshot fixture carries an embed, so the spec adds one
    through the stable add-embed flow before editing it.
  - `page.route(...)` to stub a third-party call (iframe.ly) so the test is
    deterministic and offline.
  - an escape hatch used deliberately and only where justified, with a comment
    explaining why: `dispatchEvent('mousedown')` for a hover-revealed control on
    a frequently re-rendering element (a plain `click()` flakes on the
    visible+stable check).

The only product-source change it required was adding `data-test-id` attributes
to the embed controls and the prompt dialog (`EmbedBlock.tsx`,
`ModalPrompt.tsx`). That is the one product change a spec may carry; see "Common
pitfalls".
