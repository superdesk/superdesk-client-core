# Measuring client code coverage from the e2e suite

Tooling for one-off V8 coverage runs: which `scripts/` code the Playwright suite
actually executes, mapped per file and per line. It lives on the
`hg/e2e-v8-coverage-tooling` branch rather than develop because a coverage run is
an occasional survey, not part of CI: the numbers inflate easily (booting the app
executes top-level code everywhere) and are unsuitable as a gate. Use the report to
find product areas no test enters, not to chase a percentage.

## Running a survey

Everything below from the repo root, stack requirements as for any e2e run
(`--workers=1`, one stack).

```sh
git checkout hg/e2e-v8-coverage-tooling
git merge develop                          # bring the branch up to date first
E2E_COVERAGE_SOURCEMAP=1 ./e2e/scripts/e2e-up.sh --rebuild
cd e2e/client
node generate-covspecs.mjs                 # writes one gitignored .covspec.ts twin per spec
npx playwright test --config playwright.coverage.config.ts --workers=1
npx monocart show-report coverage-report/index.html
```

The pieces:

- `webpack.config.js` gains an opt-in `devtool: 'source-map'` under
  `E2E_COVERAGE_SOURCEMAP=1`; without the variable, builds are unchanged. The
  source-mapped build is noticeably slower and the bundle map is ~33 MB.
- `playwright/utils/coverage-test.ts` wraps `test` so the main `page` fixture
  collects V8 coverage and hands it to monocart. Contexts a spec opens itself
  (second-actor sessions) are not collected.
- `generate-covspecs.mjs` writes a `.covspec.ts` twin per spec that imports `test`
  from the wrapper; twins and `coverage-report/` are gitignored and disposable.
- `playwright.coverage.config.ts` runs only the twins and maps the bundle back to
  `scripts/` through the source maps (`v8` + `v8-json` + console summary reports).

## Reading the result

`coverage-report/coverage/coverage-report.json` has per-file summaries for
scripting; the HTML report has per-line highlighting. Survey of 2026-08-20
(develop + #5330, 265 tests): 55.6% of statements overall; largest gaps
`apps/authoring-react` (49.8%), `core/editor3` (42.4%); darkest areas
`apps/contacts` (24%), `apps/master-desk` (22%),
`extensions/availability-manager` (20%).

A few tests can fail under the survey that pass normally: the source-mapped
bundle is slower and coverage collection adds overhead. Ignore small failure
counts; the map is unaffected.
