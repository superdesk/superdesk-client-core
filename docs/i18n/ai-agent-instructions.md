# AI Agent Instructions For PO Updates

Follow these rules when updating translations in `superdesk-client-core`.

## Inputs

- Source of truth: `po/superdesk.pot`
- Target language code: `<lang>`
- Target PO file: `po/<lang>.po`
- Optional excluded PO files: any locale-specific files that the workflow marks as out of scope
- Optional glossary: `docs/i18n/<lang>-glossary.md` if one exists
- Optional internal batch size for large translation sets

## Environment Requirements

- Use Node.js 20 or newer. Prefer the repo's configured Node.js version when it is easy to use, but do not spend time upgrading from Node.js 20+ only for this workflow.
- Install project dependencies with `npm ci`.
- Ensure GNU gettext tools are installed and available:
  - `msgmerge`

## POT Preconditions

Assume `po/superdesk.pot` was prepared outside the agent flow.

- Do not run `npm run gettext-extract` as part of the agent flow.
- Use the existing `po/superdesk.pot` already present on the branch as the source of truth.
- If the POT on the branch looks incomplete or inconsistent, stop and explain the problem instead of regenerating it.

## Required Workflow

1. Use the existing `po/superdesk.pot` on the branch as the source of truth.
2. Assume `npm run gettext-update-po -- <lang>` has structurally synced `po/<lang>.po`.
3. Only then fill missing translations in `po/<lang>.po`. Use internal batches only when the number of pending entries is too large to handle safely in one pass.

## Internal Batching

The expected output is one pull request for the target language.

- Use internal batches only when the pending translation set is large enough that one pass would reduce quality or risk context loss.
- Use `npm run gettext-next-batch -- <lang> --limit 50` to inspect the next deterministic batch when batching is needed.
- If batching is needed, process at most `50` safe active untranslated entries at a time unless the prompt provides a different batch size.
- After each internal batch, review only the entries just changed for placeholder preservation, plural structure, whitespace, punctuation, and glossary consistency.
- Run validation after each successful internal batch when practical, and fix only issues introduced in that batch.
- Commit each successful internal batch separately within the same pull request so review and rollback are easier.
- Continue in the same agent session until no more safe empty entries remain, or until continuing would reduce quality.
- If the full file cannot be completed safely, keep the partial work in the same PR and report where translation stopped.
- Do not translate obsolete `#~` entries.
- Do not create separate PRs per internal batch unless explicitly requested.

## Sync Safety Checks

- After PO sync, verify that existing translations were not removed unexpectedly.
- If many entries suddenly become obsolete, especially in planning or analytics areas, treat it as an extraction-environment problem and stop.

## Hard Rules

- Never modify runtime JSON files directly.
- Never edit `msgid`.
- Never rewrite unrelated entries.
- Never touch excluded locale files.
- Never overwrite existing non-empty translations.
- Only fill empty `msgstr` or empty plural `msgstr[n]` values when safe.
- Do not prune obsolete entries during agent-driven PO sync.
- Preserve all `{{...}}` placeholders exactly, including spacing and nested expressions.
- Preserve plural structures exactly.
- Keep diffs minimal and reviewable.
- Follow the glossary for the target language if one is provided.
- Remove unnecessary whitespace before saving translated strings.

## Skip Rules

Skip the entry and leave it unchanged if it is:

- HTML-heavy
- ambiguous without UI or product context
- unsafe because of unusual placeholders or formatting
- likely to require broader terminology review

## Whitespace Rules

- Do not add leading or trailing spaces.
- Do not add double spaces unless the source requires them.
- Do not add spaces before punctuation marks.
- Do not add unnecessary spaces inside parentheses, quotes, or around slashes.
- Preserve placeholders exactly, but keep surrounding spacing natural for the target language.
- Re-read changed translations once with a whitespace-only review before finishing.

## Validation Mindset

- Existing compile and validation tooling is the final safety net.
- If a translation would require changing placeholders, plural structure, or source identifiers, do not make the change.
