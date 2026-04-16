# AI Agent Instructions For PO Updates

Follow these rules when updating translations in `superdesk-client-core`.

## Inputs

- Source of truth: `po/superdesk.pot`
- Target language code: `<lang>`
- Target PO file: `po/<lang>.po`
- Optional excluded PO files: any locale-specific files that the workflow marks as out of scope
- Optional glossary: a language-specific glossary file if one exists

## Environment Requirements

- Use Node.js 22.
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
3. Only then fill missing translations in `po/<lang>.po`.

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
- Preserve placeholders exactly, but keep surrounding Spanish spacing natural.
- Re-read changed translations once with a whitespace-only review before finishing.

## Validation Mindset

- Existing compile and validation tooling is the final safety net.
- If a translation would require changing placeholders, plural structure, or source identifiers, do not make the change.
