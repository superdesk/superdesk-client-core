# E2E consolidation on Playwright — migration report

## Frameworks found in this repo
- Protractor (count: 26 spec files remaining, ~5437 lines)

## Totals
- Original non-Playwright specs (at the start of this branch): 26
- Migrated on this branch: 0
- Blocked: 1 (carried over from PR #5181, see below)
- Obsolete: 0
- Flaky: 0
- Redundant: 0

## Previously migrated (PR #5181, already merged to develop)
- Protractor `e2e/client/specs/workspace_spec.ts` -> `e2e/client/playwright/workspace.spec.ts`
- Protractor `e2e/client/specs/vocabularies_spec.ts` -> `e2e/client/playwright/vocabularies.spec.ts`
- Protractor `e2e/client/specs/subscribers_spec.ts` -> `e2e/client/playwright/subscribers.spec.ts`
- Protractor `e2e/client/specs/suggest_spec.ts` -> `e2e/client/playwright/suggest.spec.ts`

## Migrated specs (this branch)
<!-- Format: <framework> <original path> -> <new playwright path> [commit sha] — scenario -->

## Blocked
- Protractor `e2e/client/specs/notifications_spec.ts` — create a user mention and verify the mentioned user's unread badge clears after sign-in — current `main` snapshot no longer accepts the legacy `admin1` / `admin` credentials used by the spec, so migrating this scenario needs a maintained secondary-user test fixture or snapshot update. (Carried over from PR #5181; spec file kept until final cleanup.)

## Obsolete
<!-- Format: <framework> <original path> — why it is obsolete -->

## Flaky
<!-- Format: <framework> <original path> — the Playwright code attempted — observed failure mode -->

## Redundant
<!-- Format: <framework> <original path> — covered by <existing playwright path> -->

## Product source changes
<!-- Format: <product file> — `data-test-id` added — for which migrated spec -->

(Previously, in PR #5181, `data-test-id` attributes were added to `scripts/apps/publish/views/subscribers.html` and `scripts/apps/authoring/suggest/SuggestView.html`. Those changes are already on `develop`.)

## Frameworks removed
<!-- Filled in when the final cleanup commit lands -->
