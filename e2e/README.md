# Working on e2e tests using Playwright

### Starting server and client

* open a terminal in `./server`
* run `docker compose up`
* open a terminal in `./client`
* run `npm install` if needed
* run `npx grunt server`

Alternatively, `./e2e/scripts/e2e-up.sh` (from the repo root) brings up the whole stack with health checks and is idempotent; `./e2e/scripts/e2e-down.sh` tears it down.

### Parallel instances (slots)

Several e2e instances can run on one machine at the same time, for example when multiple agents author specs concurrently, each from its own git worktree. A slot shares elasticsearch, redis and mailcrab with every other slot but gets its own backend container, its own mongod (databases keep their default names, which the snapshot restore requires), an elastic index prefix, a redis DB, a client build and ports.

```
./e2e/scripts/e2e-up.sh --slot auto    # claim the first free slot (1-5) and bring it up
./e2e/scripts/e2e-up.sh --slot 3       # bring up slot 3 specifically
./e2e/scripts/e2e-down.sh --slot 3     # tear down slot 3 and release it
./e2e/scripts/e2e-down.sh --all        # tear down all slots, the default stack and shared services
```

Slot N uses api `:501N`, websocket `:511N`, client `:901N`, mongo on `:2701<7+N>`, and elastic indices prefixed `sd_e2e_s<N>`, all disjoint from the default stack (`:5002` / `:9000` / `:27017` / `superdesk_e2e`), so a manually started stack keeps working alongside slots. Claims are lock directories under `/tmp/superdesk-e2e`, and re-running `e2e-up.sh --slot auto` from the same checkout re-enters its slot.

On success the slot's environment is written to `e2e/client/.e2e-slot.env` (gitignored). `playwright.config.ts` auto-loads it, so `npx playwright test` from that checkout targets the slot without further setup. The file also points `storageState` at an origin-rewritten copy of the committed auth state, since localStorage is origin-scoped and each slot's client runs on a different port.

Notes for running several slots:

* One slot per checkout/worktree. The client build bakes the slot's backend URLs into `dist/`, and the slot env file lives in the checkout, so sharing a checkout between slots would clobber both.
* To seed a fresh worktree's dependencies quickly, clone them from the main checkout with a copy-on-write copy: `cp -Rc` on macOS (APFS), `cp -a --reflink=auto` on Linux (btrfs/XFS; falls back to a regular copy elsewhere). `npm ci` works everywhere but is much slower.
* Docker Desktop needs enough VM memory for the shared services plus one backend container (~0.8 GB) per active slot. For 4-5 slots, ~8 GB and a bigger elasticsearch heap (`ES_JAVA_OPTS` in `docker-compose.yml`) are recommended; every test run triggers a mongo-to-elastic reindex per slot.
* Recording snapshots (`storage:dump` / `storage:record`) writes to the shared `dump/` directory; do that from one slot at a time.
* Concurrent Chromium runs compete for CPU; parallel spec writing is free, but keep simultaneous test runs to 2-3 or expect timeout flakiness.

### Running tests

`npm run playwright` - runs all tests in headless mode
`npm run playwright-interactive` - starts playwright IDE that allows to run tests individually and inspect the timeline


### Test databases

Most tests run against `main` database snapshot (`e2e/server/dump/full/main`). When more data is needed, we can update it. If you need very specific data for a test and feel like it wouldn't belong in the main snapshot - it is possible to create a "record". A record is a patch that can be applied to a full dump when running a test, but does not change it.

### Managing database snapshots

Most tests run against `main` database snapshot (`e2e/server/dump/full/main`). That snapshot is quite minimal and it is likely that you will need to add more data for your tests. Here's how to do it:

1. ensure you have server and client started (following the steps above)
2. cd into `server`
3. create virtual environment `python3 -m venv env`
4. activate virtual environment `source env/bin/activate`
5. install python dependencies - `pip install -Ur requirements.txt`

6. restore main dump `python manage.py storage:restore main`
7. remove the dump you just restored `rm -r dump/full/main`
8. open superdesk in the browser and do the changes you need(best not to remove/rename things because it might break other tests)
9. regenerate `main` dump from your existing database state `python manage.py storage:dump --name main`
10. in case you make a mistake, undo the removal of the main dump and continue from step 6.

To create records/patches do the following steps:

1. Do steps 1-6 from instructions above
2. start recording `python manage.py storage:record --base-dump main --name my-new-record-name`


### VSCode plugin

https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright

In most cases it's more convenient to work with tests using the plugin and further instructions will be assuming that a plugin is used. Also see https://playwright.dev/docs/getting-started-vscode

### Running and debugging tests

When VSCode plugin is installed, and test file ends with `.spec.ts`, there will be a green play button next to the line number where the test is defined. Click the play button next to the test you want to run. By default it will run in headless mode. In most cases you'll not want the headless mode. To change it - tick "show browser" checkbox in Playwright options that are available in the sidebar.

### Auto-generating new tests

Playwright has a function where it autogenerates test code as you perform actions in the browser. It doesn't work perfectly so you'll need to tweak the resulting code, but it's a good starting point.

To create a new test, copy one of the existing ones and change the name. Leave first few lines that restore database snapshot and login. Now we will use "record at cursor" feature that VSCode extension provides. The feature allows to continue auto-generating from any line you choose by putting a cursor there. That feature doesn't run the lines before your cursor, so you'll need to get the browser into the correct state yourself. The easiest way to do this is to put a breakpoint on a line that you want to start recording from, debug the tests and when breakpoint pauses at that line - stop the debugger. Make sure you have "show browser"(inside Playwright sidebar widget) selected too, or Playwright will close the browser when you stop the debugger. After you stop the debugger you're in a correct state and can click "record at cursor" option inside Playwright widget in the sidebar. It will get vs-code started browser in a recording mode where you will be able to click elements in the browser and auto generated code will be inserted in VSCode.

### Selectors

`data-test-id` selectors are used for stability. Example:

```typescript
await page.locator('[data-test-id="comments"]').click();
```

One problem is that they can get long and repetitive.

```typescript
await page.locator('[data-test-id="authoring"] [data-test-id="comments-widget"] [data-test-id="submit"]').click();
```

To improve readability, `s` function is used where only IDs are passed:

```typescript
await page.locator(s('authoring', 'comments-widget', 'submit')).click();
```

### Dos and don'ts

* Don't use dynamic test IDs like ```data-test-id={`filter-${bucket.key}`}```. It's easier to find code when IDs are static. Do use `data-test-value` if you need to attach dynamic data: ```data-test-id="filter" data-test-value={bucket.key}```

* Do use multiple selectors for tests to be more stable - `[data-test-id="comments-widget"] [data-test-id="submit"]` instead of `[data-test-id="submit"]`
* `data-test-id` attributes are not meant to be globally unique. They only have to be unique in their "scope". For example, if we have a comments widget marked with `[data-test-id="comments-widget"]` attribute - test IDs inside comments widget must be locally unique, but we can use test IDs that were already used in other parts of the application.

#### Viewport

Playwright VSCode extension seems not to respect viewport size that is set in `e2e/client/playwright.config.ts`. An easy workaround is adjusting browser size manually in development. It will work in CI.

#### Current desk

There is an issue with Superdesk that does not reproduce locally where upon opening monitoring view, a workspace is selected instead of a default "Sports" desk. If that happens, use the `selectDeskOrWorkspace` helper in your test to ensure a correct desk is selected.

### Utilities

#### Quickly replacing generated locators to use our `s` or `cs` helpers

Find regex: `locator\('\[data-test-id="(.+)?"\]'`
Replace regex: `locator(cs('$1')`

Will replace `locator('[data-test-id="abc"]')` with `locator(cs('abc'))`

### Known issues

`await monitoring.selectDeskOrWorkspace('Sports');`
* Playwright VSCode extension seems not to respect viewport size that is set in `e2e/client/playwright.config.ts`. An easy workaround is adjusting browser size manually in development. It will work in CI.
