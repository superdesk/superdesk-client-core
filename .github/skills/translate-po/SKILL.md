---
name: translate-po
description: Use this when asked to update a PO translation catalog with GitHub Copilot. It refreshes the POT file, syncs the target PO file, fills safe untranslated entries, validates the result, and prepares a pull request.
---

# Translate PO catalogs

Use this skill when asked to update translations in `superdesk-client-core`.

## Inputs

- Target language code, for example `es`
- Target PO file, for example `po/es.po`
- Source of truth: `po/superdesk.pot`
- Optional glossary file, for example `docs/i18n/es-glossary.md`
- Translation rules: `docs/i18n/translation-rules.md`

## Required workflow

1. Refresh the source template:

```bash
npm run gettext-extract
```

2. Sync the PO file structurally from the template:

```bash
npm run gettext-update-po -- <lang>
```

3. Fill only empty `msgstr` and `msgstr[n]` entries in `po/<lang>.po`.

4. Validate the result:

```bash
grunt nggettext_compile
```

5. Prepare a pull request against `develop`.

## Hard rules

- Never modify runtime JSON files directly.
- Never edit `msgid`.
- Never rewrite unrelated entries.
- Never overwrite existing non-empty translations.
- Preserve all `{{...}}` placeholders exactly, including spacing and nested expressions.
- Preserve plural structures exactly.
- Keep diffs minimal and reviewable.
- Follow the target-language glossary when one exists.

## Skip rules

Skip the entry and leave it unchanged if it is:

- HTML-heavy
- ambiguous without UI or product context
- unsafe because of unusual placeholders or formatting
- likely to require broader terminology review

## Current Spanish configuration

For the current Spanish workflow:

- target language: `es`
- target file: `po/es.po`
- glossary: `docs/i18n/es-glossary.md`
- rules: `docs/i18n/translation-rules.md`

When asked to update Spanish translations, use this skill together with the Spanish glossary and rules.
