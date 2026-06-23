---
name: translate-po
description: Use this when asked to update a PO translation catalog with GitHub Copilot. It uses the POT file already prepared on the branch, syncs the target PO file, fills safe untranslated entries, validates the result, and prepares a pull request.
---

# Translate PO catalogs

Use this skill when asked to update translations in `superdesk-client-core`.

## Inputs

- Target language code, for example `es`
- Target PO file, for example `po/es.po`
- Source of truth: `po/superdesk.pot`
- Optional glossary file, normally `docs/i18n/<lang>-glossary.md` when it exists
- Translation rules: `docs/i18n/translation-rules.md`
- Apply helper: `tasks/apply-po-translations.js` (writes a JSON translation map into the PO, filling only empty entries)
- Optional internal batch size for large translation sets (default 50, larger is fine when handled safely)

## Environment requirements

Before doing any translation work, ensure the environment is ready:

1. Use Node.js 20 or newer. Prefer the repo's configured Node.js version when it is easy to use, but do not spend time upgrading from Node.js 20+ only for this workflow.
2. Install project dependencies:

```bash
npm ci
```

3. Ensure GNU gettext tools are installed and available on PATH:
   - `msgmerge`

## POT preconditions

Assume `po/superdesk.pot` was prepared by a human developer in a complete local environment.

- Do not run `npm run gettext-extract` as part of the agent workflow.
- Use the existing `po/superdesk.pot` already present on the branch as the source of truth.
- If the POT on the branch looks incomplete or inconsistent, stop and explain the problem instead of regenerating it.

## Required workflow

1. Sync the PO file structurally from the template already present on the branch:

```bash
npm run gettext-update-po -- <lang>
```

2. Fill empty `msgstr` and `msgstr[n]` entries in `po/<lang>.po`. Use internal batches only when the number of pending entries is too large to handle safely in one pass. Prefer the apply helper over hand-editing the PO (see "Applying translations").

3. Validate the result:

```bash
grunt nggettext_compile
```

4. Prepare a pull request against `develop`.

## Applying translations

You can edit `po/<lang>.po` directly, but for any non-trivial set prefer the deterministic apply helper. It only fills empty entries, never overwrites existing translations, preserves placeholders and plural structures, and skips obsolete `#~` entries.

```bash
node tasks/apply-po-translations.js <lang> <translations.json> [po-file]
```

- `<lang>` is the PO filename stem, for example `uk_UA`, `ja`, or `es` (resolves to `po/<lang>.po`).
- `<translations.json>` is a JSON map keyed by source `msgid`:
  - singular: `"<msgid>": "<translation>"`
  - plural: `"<msgid>|plural": {"0": "<form0>", "1": "<form1>", ...}` with one entry per plural slot the target language requires (for example four forms for Ukrainian).
- The script reports how many entries it applied, how many it skipped because they were already non-empty, and the total it was given. It rewrites the file byte-for-byte when nothing matches, so it is safe to run repeatedly.

To inspect what still needs translating, list the next deterministic batch with `npm run gettext-next-batch -- <lang> --limit <n>`, translate those entries into a JSON map, then apply it. Always re-run validation after applying.

## Internal batching

The final result should be a single pull request, not one pull request per batch.

Use internal batches only when the pending translation set is large enough that one pass would reduce quality or risk context loss.

- use `npm run gettext-next-batch -- <lang> --limit <n>` to inspect the next deterministic batch when batching is needed
- `50` is a safe default batch size; larger batches such as `100` to `150` are acceptable when each batch still gets the per-batch re-checks below. Honour any batch size the prompt provides
- translate a batch into a JSON map and write it with `tasks/apply-po-translations.js` (see "Applying translations") rather than hand-editing many entries
- after each internal batch, re-check placeholders, plural structures, whitespace, and glossary consistency for the entries just changed
- run validation after each successful internal batch when practical, and fix only issues introduced in that batch
- commit each successful internal batch separately within the same pull request so review and rollback are easier
- continue with the next internal batch in the same agent session until there are no more safe empty entries, or until continuing would reduce quality
- if the session cannot safely finish the full file, keep the partial work in the same PR and report exactly where the agent stopped
- do not translate obsolete `#~` entries
- do not create separate PRs for each internal batch unless the user explicitly asks for that

For very large sets, batches can be translated in parallel (for example one agent per batch) and then merged into a single JSON map applied once with `tasks/apply-po-translations.js`. The same per-batch re-checks, single-PR rule, and validation still apply.

## Sync safety checks

After syncing `po/<lang>.po` from the POT:

- check that existing translations were not removed unexpectedly
- if a large number of entries suddenly become obsolete, stop and investigate before translating
- treat mass obsolescence of planning or analytics entries as a failure signal, not as a valid update

## Hard rules

- Never modify runtime JSON files directly.
- Never edit `msgid`.
- Never rewrite unrelated entries.
- Never overwrite existing non-empty translations.
- Do not prune obsolete entries during agent-driven PO sync.
- Preserve all `{{...}}` placeholders exactly, including spacing and nested expressions.
- Preserve plural structures exactly.
- Keep diffs minimal and reviewable.
- Follow the target-language glossary when one exists.
- Clean up unnecessary whitespace in translated strings before saving.

## Skip rules

Skip the entry and leave it unchanged if it is:

- HTML-heavy
- ambiguous without UI or product context
- unsafe because of unusual placeholders or formatting
- likely to require broader terminology review

## Whitespace and punctuation rules

- Do not introduce leading or trailing spaces in translated text.
- Do not introduce double spaces unless they are already required by the source.
- Do not add spaces before punctuation marks in the target language.
- Do not add unnecessary spaces inside parentheses, quotes, or around slashes.
- Preserve placeholder text exactly, but make the surrounding punctuation and spacing natural for the target language.
- Before saving, re-read each changed entry once focusing only on whitespace and punctuation.

When asked to update translations, use this skill together with `docs/i18n/translation-rules.md` and the glossary for the target language when one exists.
