---
name: superdesk-e2e
description: |
  Author a Playwright end-to-end test for Superdesk from a plain-language UI
  scenario. Works only inside `superdesk-client-core` or `superdesk-planning`.
  Brings up the local e2e stack, writes the spec following repo conventions,
  and iterates to a deterministic pass with a trace artifact for review.

  Invoke when the user describes a UI behaviour they want covered by a test,
  "write a test that...", "verify in e2e that...", "test the case where...",
  "I need a spec for...", "QA scenario: ...", or describes a flow and wants
  it turned into runnable Playwright code.

  Do not invoke for: running the existing suite (just `npm run playwright`
  from `e2e/client/`), diagnosing CI failures on already-merged specs,
  product code changes, unit tests, Protractor specs, or any non-Playwright
  e2e framework.
---

# Authoring an end-to-end test for Superdesk

You are translating a plain-language UI scenario into a passing Playwright
end-to-end test. The user may be a QA tester (often without programming
experience) or a developer writing a test for their own feature, communicate
the same way for both: concretely, no Playwright jargon unless asked, confirm
intent before exploring or writing code, and assume the user is going to watch
the test run and verify it does what they meant. Be disciplined about the
workflow, not creative about the conventions.

## Two mandatory checkpoints

This skill exists to keep a human in the loop. These two checkpoints are not
optional, do them even when the test looks obvious and even when the user is
technical:

1. **Before exploring the codebase or writing anything**, restate the scenario
   as Given / When / Then and get the user's confirmation (step 2). Do not start
   reading specs or writing code until they confirm.
2. **Before declaring the test done**, offer to open it in the browser (UI mode)
   so the user can verify it does what they meant (step 9). A green run, even a
   repeated one, is not the same as the user confirming intent.

Skipping either means the skill failed at its one job, however good the test
looks.

## Workflow (follow in order)

### 1. Identify which repo you're in

Check which Superdesk repo this skill is running against. Use whichever
marker is fastest:

- `package.json` at the repo root will name `superdesk-client-core` or
  `superdesk-planning`.
- Distinguishing directories: `e2e/client/` (client-core) vs
  `e2e/playwright/` at the repo root (planning).

The answer affects:

- **Bootstrap script path.** Client-core: `./e2e/scripts/e2e-up.sh`.
  Planning may live elsewhere, check `e2e/scripts/` first, then `scripts/`.
- **Where new specs go.** Differs by repo. Client-core: flat under
  `e2e/client/playwright/` (no per-feature subfolders). Planning: under
  `e2e/playwright/<feature>/` (`events/`, `planning/`, `assignments/`, ...),
  with cross-cutting specs at the `playwright/` root. Name the file per the
  repo's `WRITING_TESTS.md`.
- **Playwright invocation directory.** Client-core: `e2e/client/`. Planning:
  `e2e/`.
- **State reset differs by repo.** client-core: `restoreDatabaseSnapshot()`
  (restores the `main` snapshot via `/api/restore_record`); any extra state must
  already be in the snapshot. planning: `setup(page, 'planning_prepopulate_data',
  url)` then `addItems(...)` for extra fixtures (via `/api/prepopulate` and
  `/api/planning_prepopulate`). `addItems` is planning-only.
- **Auth differs by repo.** client-core starts from a committed `storageState`
  (no login call for the default user). planning logs in per test: `login(page)`
  after `setup(...)` in `beforeEach`. Follow whichever the repo's
  `WRITING_TESTS.md` documents; do not impose one repo's pattern on the other.
- **CI workflow names** (only relevant if you reference CI in your report):
  client-core uses `tests.yml`; planning uses `ci-e2e.yml`.

If you're not in one of these two repos, stop and tell the user, this
skill does not apply.

### 2. Restate the scenario as Given / When / Then

Before exploring the codebase or writing any code, restate what the user
described in this form:

> Given <preconditions / initial state>
> When <the user action(s)>
> Then <the observable outcome>

Show the restatement back to the user. Ask them to confirm or correct.

If something is ambiguous (which user role? which desk? what does "success"
look like in the UI?), use `AskUserQuestion` with concrete options. Ask one
high-impact question at a time, not three at once. Do not explore the codebase
or write code until the user has confirmed the Given/When/Then.

### 3. Bring up the stack

Run the bootstrap script identified in step 1 from the repo root. Wait for
the "ready" message. The script prints the URLs it verified; confirm both
the server (default `http://localhost:5002/api/`, overridable via
`SUPERDESK_URL`) and the client (`http://localhost:9000/`) responded. The
default port is 5002, not 5000, because macOS reserves :5000 for AirPlay
Receiver, which silently answers HTTP and would mask a missing server.

Never skip this step "to save time." If the stack is already up from
another session, the script detects that and exits quickly — but that
shortcut is also a trap. When the client is **already reachable** the script
skips the client build entirely (it logs `client already reachable; skipping
client server start`) and keeps serving the *old* bundle. So if you changed
product source (e.g. added a `data-test-id` in step 6) while the stack was
already up, the change is NOT compiled in. Force it:
`./e2e/scripts/e2e-up.sh --rebuild`.

**Verify a product-source change actually took in the live DOM, not in
`dist`.** Angular HTML templates are compiled into a JS `$templateCache`
bundle, so a stale build renders the old template even though the attribute is
present in the source file — and grepping `dist/` can mislead (a hit may be a
sourcemap, and `grep ... | head && echo FOUND` always prints FOUND because
`head` exits 0). The ground truth is the rendered page: open the item and check
`document.querySelector('[data-test-id="..."]')`, or let the locator fail and
read the DOM snapshot. If a new `data-test-id` "doesn't resolve" despite being
in source, suspect a skipped rebuild first.

**Drive the environment ONLY through `e2e-up.sh`.** Do not run `npm run
build`, `docker compose up`, `npm run start-client-server`, or any other
sub-step by hand. The script holds the env contract (it exports
`SUPERDESK_URL` so the correct backend port is baked into the client
bundle); running a sub-step directly bypasses that and silently produces a
broken stack (e.g. a client that points at the wrong port). One blessed
entry point, no improvising.

**If the script exits non-zero, it tells you what to do, relay that, do not
work around it.** The script fails loud and actionable: it verifies the app
bundles were actually built and that the client serves them, not just that a
port answers. Its most common recovery instruction is to re-run with
`--rebuild` (`./e2e/scripts/e2e-up.sh --rebuild`). Run that once. If it still
fails, surface the script's plain-English error message to the user verbatim;
do not paste raw stack traces or webpack output at a QA user, and do not try
to repair the build yourself. A non-technical user only needs the one-line
instruction or a clear "this needs a developer because X."

**Ensure the test browser is installed.** Once the stack is up, from the
Playwright invocation directory (step 1) run `npx playwright install chromium`.
This is the test-runner half of getting ready; the bootstrap script
deliberately stays out of it. The command is idempotent (a no-op when the
correct browser is already present) and version-locked to this repo's
Playwright. Do not rely on the user having Google Chrome installed: Playwright
uses its own bundled build, not the system browser, and the two are unrelated.
Skipping this surfaces a "browser not installed" error that looks like a broken
stack even though the stack is fine, the exact false signal a QA user cannot
diagnose.

### 4. Read the conventions doc

Read `e2e/WRITING_TESTS.md` in this repo (each repo has its own). Internalize:

- Selector pattern: `page.getByTestId(...)` with locator chaining. Never the
  legacy `s()` helper. In client-core, where existing specs use `s()`, the doc
  has a translation table.
- Auth and state reset, which differ by repo (the doc spells out which applies
  here): client-core uses `storageState` + `restoreDatabaseSnapshot()`; planning
  uses per-test `login(page)` + `setup(...)`/`addItems(...)`.
- Page Objects location and that helpers are imported via local relative paths,
  not a `@superdesk/...` package (none exists).

### 5. Find the closest existing spec

First check the **Reference specs** section of `WRITING_TESTS.md`. Those are
curated native examples; prefer them as your structural template.

If none fits, search the existing Playwright specs for the closest scenario.
Read it end to end and use it as the template for file location, imports,
fixture pattern, and assertion style. Pattern-match; do not invent.

**Before writing, check whether the scenario is already covered.** The same
search that finds a template also tells you whether an existing spec already
tests this behaviour. Classify the closest match:

- **Same behaviour** (exercises the same flow and asserts the same outcome):
  stop. Show the user what that spec actually asserts and ask whether to skip,
  extend that spec, or write a deliberate variant. Do NOT silently decide
  "already covered" and skip, a wrong match leaves the scenario untested with
  nobody aware, which is worse than a duplicate. The user makes the call.
- **Adjacent or partial** (same area, different assertion or path): write the
  new spec and note the overlap in your hand-off.
- **No match**: write fresh.

Use the match as a template only once you have decided to write.

One hard rule when copying in client-core: **existing specs use the legacy
`s()` selector helper; new specs must not.** Translate every `s(...)` selector
to `page.getByTestId(...)` per the translation table in `WRITING_TESTS.md` as
you copy. Never carry `s()` into the new spec. (planning specs are already
native, so there is nothing to translate there.)

If there's no close spec, find the closest Page Object instead and pattern the
new spec around how that PO is used in existing specs.

### 6. Write the spec

File location: under the playwright directory identified in step 1, named
per WRITING_TESTS.md.

If the scenario uses an interaction not covered by an existing Page Object
method, add the method to the relevant PO rather than inlining the
interaction. The user is going to read the test; keep it readable.

If you need a `data-test-id` that doesn't exist in product source, add one.
Use a kebab-case id consistent with neighbors. **No other product source
changes**, if more is needed, see "Failure modes" below.

### 7. Run the spec with --headed

From the playwright invocation directory identified in step 1:

```
npx playwright test playwright/<scenario>.spec.ts --headed
```

Watch it execute. The user is probably watching too, that's the point of
`--headed`.

For interactive, step-by-step verification, the user can run the spec in UI
mode, which shows a per-action timeline and the DOM snapshot at every step:

```
npx playwright test playwright/<scenario>.spec.ts --ui
```

UI mode is for the user to watch (see step 9 for how to use it to confirm
intent). It is long-running and interactive, so if you start it for them, launch
it as a background process; never run it in the foreground, that blocks.

Do **not** run the full suite (`npm run playwright`) to validate one spec; it's
slow and may surface unrelated existing flakes. Do **not** run `npm test` at the
repo root, that target is unit tests + lint, not e2e.

### 8. Iterate until it passes deterministically

If it fails, diagnose with the trace (from the same directory):

```
npx playwright show-trace test-results/<run-id>/trace.zip
```

Fix the spec, not the product, unless the failure exposes a missing
`data-test-id` (in which case add the attribute, see step 6, and remember
the next `e2e-up.sh` invocation will rebuild the client because the script
detects source newer than the last build).

If you cannot make it pass in three runs without changes between them,
stop. Tell the user the test appears flaky and ask whether to investigate
the underlying race or to leave the spec out for now.

### 9. Hand off, confirm intent, deliver artifacts, do not commit

After the spec passes deterministically:

- **Make the user verify it in the browser before declaring done.** A passing
  spec can still exercise the wrong code path (an assertion on a toast that
  appeared for an unrelated reason; a click that hit a different button than
  intended). The most reliable check is Playwright UI mode. Offer to open it for
  them, ask something like "Do you want me to open the test in UI mode so you can
  verify it?", and if they accept, launch it as a **background** process (it is
  long-running and interactive; in the foreground it would block):

  ```
  npx playwright test playwright/<scenario>.spec.ts --ui
  ```

  The UI window opens on their screen (this assumes the skill is running locally,
  which it is). Tell them what to look for: press play, then scrub the per-action
  timeline and confirm, on the DOM snapshot at each step, that it clicked the
  controls they meant, typed the right data, and landed on the expected screen.
  If they would rather run it themselves, give them the command instead. (A
  `--headed` re-run or the trace viewer also work.) The signal you trust is the
  user saying "yes, that matched what I meant", not the green check.
- **Summarise for them**, in plain language: which file you created, what
  it tests, where the trace is (`test-results/.../trace.zip`), and any
  `data-test-id` attributes you added to product source. Call the product
  source changes out explicitly, those need developer review.
- **Do not commit, do not open a PR.** Leave the spec uncommitted. A
  developer reviewing it before it lands is part of the workflow; the
  skill's job ends at "the test passes and the user confirmed intent." If
  the user explicitly asks you to commit, follow their instruction, but
  default to not.

The trace is the user's QA artifact, not just a debug aid.

## Failure modes

The workflow above is the happy path. These are the off-ramps, explicit
so you don't improvise under pressure.

### The stack won't start

`e2e/scripts/e2e-up.sh` exits non-zero or never reaches "ready". Read the
error, the script names the failure mode.

- **Port conflict** on 27017 / 6379 / 9200 / 5002 / 9000: the script's
  preflight names the holder via `lsof`. Tell the user; do not kill their
  processes.
- **Docker not running:** ask the user to start Docker Desktop.
- **Incomplete or stale build (blank app):** the script fails with a message
  about missing app bundles or the client not serving `app.bundle.js`. This is
  the "page loads blank" case, and the script catches it rather than declaring
  a false "ready." Recovery: re-run `./e2e/scripts/e2e-up.sh --rebuild` once.
  The script also auto-rebuilds when the cached build was made for a different
  backend port, so you should rarely hit this.
- **Build failure (real):** if `--rebuild` still fails, the script dumps the
  build output. If it is a genuine product-source error, tell the user in plain
  language, this skill does not fix product code. Do not paste raw build/stack
  output at a non-technical user; give them the one-line cause.
- **Stack reachable but tests get auth errors:** the AirPlay false-positive
  may be back if someone set `PORT=5000`. Check `lsof -i :5002` and
  `lsof -i :5000`. Default is 5002.
- **Stack up but a whole feature area fails (e.g. every upload dies with a
  bare "Upload Error:"):** suspect client/server version skew before product
  bugs or test bugs. The server Docker image (`...-e2e-server:ci`,
  `pull_policy: never`) is built once and reused forever — `e2e-up.sh` only
  builds it when missing — so a months-old image silently lacks API resources
  a freshly-pulled client branch calls (watch for 404s on `/api/<resource>` in
  the browser console). **Diagnose with a control run**: an in-repo,
  CI-passing spec for the same feature. If the control fails too, the stack is
  broken, not your test. Recovery: `docker compose stop server && docker
  compose rm -f server && docker rmi superdesk-client-core-e2e-server:ci`,
  then re-run `e2e-up.sh`, which rebuilds the image from current sources.

Do not "work around" a broken stack by mocking the server or skipping
setup. The skill only produces real tests against the real stack.

### The scenario needs state not in the base snapshot

The base state contains a fixed set of users, desks, content templates, see
WRITING_TESTS.md for what's in it. If the scenario assumes state that isn't
there ("a desk archived 30 days ago", "a user with 5 unread notifications"),
the path depends on the repo:

- **In `superdesk-planning`:** use `addItems(...)` after `setup(...)` to add the
  state via the prepopulate API.
- **In `superdesk-client-core`:** there is no per-test add. `restoreDatabaseSnapshot()`
  only restores a snapshot as-is, so the state must live in a snapshot. If the
  base `main` snapshot lacks it, create a dedicated **record** (a diff on top of
  `main`) and restore it by name — this is the documented fixture mechanism
  (WRITING_TESTS.md "Adding fixture data", README "Managing database snapshots"),
  and the right call whenever the alternative is building the setup by clicking
  through the UI in the test (which a reviewer will rightly reject as slow and
  fragile). A record alters a shared fixture: flag it in the hand-off for review
  and add an entry to `e2e/server/dump/records/README.md`. See "Creating a
  record" below for the operational traps. If creating it is out of scope, stop
  and tell the user a developer needs to add the fixture.

Do not try to mutate state via the UI in `beforeEach` to reach the
preconditions, that makes the test slow, brittle, and not actually a test
of the scenario the user described.

### Creating a record (client-core fixture data)

The mechanism is `storage:record`, **not** `storage:dump`. Getting this wrong
wastes a lot of time because the failure is silent:

- **Use `storage:record --base-dump main --name <name> --collection <c> ...`**:
  it restores `main`, then records a diff of the collections you name.
  `storage:dump` instead writes a *full* dump; `restoreDatabaseSnapshot({snapshotName})`
  posts to `/api/restore_record`, which only resolves **records**, so restoring a
  dump fails with HTTP 500 — *"There is no record at &lt;name&gt;"*.
- **`restoreDatabaseSnapshot()` ignores the HTTP response**, so a failed restore
  is silent. The tell-tale symptom is a test that **passes once and fails on
  every rerun**: the first run inherits the state you just built by hand; later
  runs never reset because the restore 500s. After creating a record, verify by
  hand that the restore returns 201 and actually resets state (e.g.
  `curl -X POST .../api/restore_record -d '{"name":"<name>"}'`).
- **`storage:record` runs until interrupted.** It records live DB changes until
  it gets SIGINT, when it flushes the record file. Run `manage.py` inside the
  already-running server container (the `dump/` dir is volume-mounted, so the
  record lands in the repo). Build the fixtures while it records — a throwaway
  setup spec that drives the UI, or direct API calls — then send SIGINT to the
  **python** process, not the `sh` wrapper, or nothing is written. Pass one
  `--collection` per collection you touched so session/auth/activity churn stays
  out of the record.
- **Then rewrite the test** to `restoreDatabaseSnapshot({snapshotName: '<name>'})`
  and do only the behaviour under test — no UI setup.

### The change required exceeds adding a `data-test-id`

Examples: the element you need has no stable identity and can't get one
without restructuring product code; the scenario depends on a feature flag
that's off in e2e; the assertion requires state that isn't exposed in the
DOM. Stop. Produce a written handoff:

- The confirmed Given/When/Then.
- One paragraph describing what product change is needed (no code).
- Rough Playwright pseudo-code showing what the test would look like once
  unblocked.

Hand this to the user. Do not write a workaround spec that "kind of" tests
the scenario.

### The test passes but might be testing the wrong thing

A spec can pass while exercising a code path the user didn't intend, a
toast that appears for unrelated reasons, an assertion that matches by
accident. The defense is step 9: the user watches the headed run or scrubs
the trace and confirms it matched their Given/When/Then. If they say "the
assertion passed but that's not what I meant", treat the spec as broken
even though Playwright says green. Iterate. The signal you trust is the
user's confirmation, not the colour of the run.

A stronger, self-contained defense is **mutation testing**: break the behaviour
the test claims to protect, one change at a time (remove the action under test,
disable the routing rule, skip a publish), run, and confirm the test goes *red*;
then revert. A mutation that leaves the test green means that assertion protects
nothing. This is also how you catch the **vacuously-passing negative control**:
an assertion like `toHaveCount(0)` ("X did not reach Y") passes for free if X was
never produced at all. Pair every negative assertion with a positive one that
proves the thing genuinely happened — e.g. before asserting the item did *not*
reach the filtered subscriber, assert it *did* reach a catch-all subscriber, so
the negative is only evaluated once the item is really in play. Reviewers may ask
for mutation testing by name; do it and note the mutations in the hand-off.

### The scenario reveals a product bug

If the headed run shows the product behaving differently from what the
user expected, and it looks like a real bug, not a test-code error,
stop. Tell the user. Do not "make the test pass" by changing what it
asserts to match the buggy behaviour. Do not file an issue or change
product code yourself. The user decides whether to file the bug or
proceed with a failing test that documents the expected behaviour.

## Common pitfalls, avoid these without being told

- **No `page.waitForTimeout(...)` to paper over a race.** Use
  `await expect(locator).toBeVisible()` or similar.
- **No CSS class chains or text matching for primary navigation.** Always
  `data-test-id` via `page.getByTestId(...)`.
- **No `s()` in new specs.** It is the legacy client-core selector helper.
  Existing specs use it; new ones do not. Translate it to `getByTestId` when
  copying (see step 5 and WRITING_TESTS.md).
- **No product source changes beyond adding `data-test-id` attributes.** If
  something larger is needed, stop and tell the user.
- **No "I'll just inline this" if there's a Page Object for the area.** Add
  a method to the PO.
- **No skipping the bootstrap script.** Always run it. It's idempotent.
- **No hand-running env sub-steps.** Never `npm run build` / `docker compose up`
  / `start-client-server` directly. Only `e2e-up.sh`. Bypassing it bakes the
  wrong backend port into the client and produces a silently broken stack.
- **No claiming the test passes if it doesn't.** Three deterministic passes
  is the bar.
- **No narrating comments.** Comment only the non-obvious *why* (workarounds,
  async timing, app quirks, an unusual selector); never narrate steps or restate
  the scenario, the test title carries that. See WRITING_TESTS.md "Comments".
- **Publishing closes the interactive actions panel asynchronously.** A second
  publish in the same test races it: the still-closing overlay intercepts the
  next "open send/publish pane" click (it hangs), or a reused stale panel
  publishes the wrong, already-changed item — *"Item has changed since it was
  opened."* Have the publish Page-Object method wait for the panel to be hidden
  (`await expect(panel).toBeHidden()`) before returning, so the next interaction
  starts clean. (This is also why `publish()` should own the "Save and send"
  confirm rather than each caller re-handling it.)
- **The publish queue — and any list read only on page load — will not show a
  row that lands after navigation.** Reload-poll instead of waiting out a stale
  page: `await expect(async () => { await page.goto(url); await expect(row).toBeVisible({timeout: 2000}); }).toPass()`. A single long `toBeVisible` just
  burns its timeout on a page that never refreshes itself.

## When to ask vs when to proceed

- Ambiguity about *what* the user wants tested → ask with
  `AskUserQuestion`.
- Ambiguity about *how* to translate to Playwright → don't ask, pattern-
  match from existing specs.
- A genuinely new product behaviour with no existing test pattern → ask
  before writing structure from scratch.
- A failing spec where the failure is in the test code → fix it, don't ask.
- A failing spec where the failure looks like a product bug → stop, tell
  the user. Do not file an issue or change product behaviour.
