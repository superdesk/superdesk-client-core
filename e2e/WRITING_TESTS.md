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
└── utils/
    ├── index.ts                <- restoreDatabaseSnapshot, login, helpers
    └── storage-state.ts        <- getStorageState
```

- Specs are flat files directly under `playwright/`. Do not create
  `<feature>/` subdirectories for specs. Name the file after the user-visible
  behaviour: `assign-coverage.spec.ts`, not `test1.spec.ts` or `bug-123.spec.ts`.
- Page Objects live in `playwright/page-object-models/<feature>.ts`, one class
  per feature area, methods named after user-facing operations.
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
password (the password is the username) and both are members of the Sports desk.
What separates them is privileges: `frodobaggins` holds none at all, which is
what makes it the negative half of a privilege test, while `samgamgee` carries
the `Sub Editor` role and so holds *some*, but not `send_to_personal` or
`unlock`. Only `samgamgee` can open the Sports monitoring view:
`/workspace/monitoring` is declared with `privileges: {monitoring_view: 1}`
(`scripts/apps/monitoring/config.ts`), which `frodobaggins` lacks, so that
account is limited to routes with no privilege gate, `/workspace/personal` and
`/settings/templates` among them.

`frodobaggins` also cannot create or edit any article: the archive resource
declares `privileges = {"POST": "archive", "PATCH": "archive", ...}`
(`apps/archive/archive.py` in superdesk-core), so every write answers 403 and no
authoring view ever opens for it. Any scenario that needs an article in the
editor under a user lacking some other privilege needs a new snapshot user that
holds `archive` and not that privilege.

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
- **Content templates:** `story`, `story 2` and `story 3`, all public and all
  owned by `admin`, plus the `kill` and `takedown` kill templates. There is no
  personal (`is_public: false`) template; a spec that needs one makes it in-test.

Other datasets are separate and loaded with
`restoreDatabaseSnapshot({snapshotName})`: `legacy`, `spellchecker`,
`editor3-tables`, `custom-blocks`, `availability-management`.

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
