# AI Agent Instructions For PO Updates

Follow these rules when updating translations in `superdesk-client-core`.

## Inputs

- Source of truth: `po/superdesk.pot`
- Target language code: `<lang>`
- Target PO file: `po/<lang>.po`
- Optional excluded PO files: any locale-specific files that the workflow marks as out of scope
- Optional glossary: a language-specific glossary file if one exists

## Required Workflow

1. Assume `npm run gettext-extract` has refreshed `po/superdesk.pot`.
2. Assume `npm run gettext-update-po -- <lang>` has structurally synced `po/<lang>.po`.
3. Only then fill missing translations in `po/<lang>.po`.

## Hard Rules

- Never modify runtime JSON files directly.
- Never edit `msgid`.
- Never rewrite unrelated entries.
- Never touch excluded locale files.
- Never overwrite existing non-empty translations.
- Only fill empty `msgstr` or empty plural `msgstr[n]` values when safe.
- Preserve all `{{...}}` placeholders exactly, including spacing and nested expressions.
- Preserve plural structures exactly.
- Keep diffs minimal and reviewable.
- Follow the glossary for the target language if one is provided.

## Skip Rules

Skip the entry and leave it unchanged if it is:

- HTML-heavy
- ambiguous without UI or product context
- unsafe because of unusual placeholders or formatting
- likely to require broader terminology review

## Validation Mindset

- Existing compile and validation tooling is the final safety net.
- If a translation would require changing placeholders, plural structure, or source identifiers, do not make the change.
