# AI-Assisted Spanish Translation Rules

This document defines the current rules for AI-assisted Spanish localization in `superdesk-client-core`.

## 1. Scope

- Source of truth for new and changed strings is `po/superdesk.pot`.
- Initial write target is `po/es.po` only.
- Do not modify runtime JSON files directly.
- Run `npm run gettext-update-po -- es` before asking AI to translate.
- Do not change extraction, compile, or validation tooling.
- Existing compile and validation steps remain the final safety net.

## 2. Translation Rules

- Translate only entries that exist in `po/superdesk.pot`.
- Update only matching entries in `po/es.po`.
- Let the sync step add or remove catalog entries structurally.
- Never modify `msgid`.
- Never rewrite unrelated entries.
- Do not overwrite existing non-empty Spanish translations.
- Only fill empty Spanish translations that are safe and clear.
- Keep wording neutral Spanish unless the source clearly requires a specific term.
- Keep diffs minimal and easy to review.

## 3. Placeholder Preservation Rules

- Preserve all `{{...}}` placeholders exactly as they appear in the source.
- Preserve placeholder spacing exactly, including forms like `{{name}}`, `{{ name }}`, `{{ $count}}`, and nested expressions such as `{{user.full_name}}`.
- Do not translate, rename, reorder, add, or remove placeholders.
- Preserve plural structures exactly: `msgid`, `msgid_plural`, and every `msgstr[n]` slot required by the target entry.
- Never collapse plural entries into singular entries or vice versa.
- Preserve inline markup and escaped characters exactly when translating around them.

## 4. Skip Conditions

Skip an entry if any of the following is true:

- The entry already has a non-empty `msgstr` or plural `msgstr[n]`.
- The entry is HTML-heavy or contains markup that makes safe translation unclear.
- The meaning is ambiguous without product or UI context.
- The entry contains unsafe or unclear placeholder usage.
- The entry has unusual formatting, broken source text, or translator notes suggesting manual review is safer.
- The entry would require changing anything outside the exact target message block.

When skipping, leave the entry unchanged.

## 5. Validation Steps

After preparing changes:

1. Refresh the template with `npm run gettext-extract`.
2. Sync the Spanish catalog with `npm run gettext-update-po -- es`.
3. Ensure AI changes are limited to translation content in `po/es.po`.
4. Ensure `msgid` values are untouched.
5. Ensure placeholders and plural structures still match the source exactly.
6. Run the existing compile/validation flow so current tooling can reject invalid placeholder changes:

```bash
npm run gettext-extract
npm run gettext-update-po -- es
grunt nggettext_compile
```

If a broader build check is needed, use the normal project build flow instead of editing generated JSON by hand.

## 6. Definition Of Done

The translation step is done when:

- `po/superdesk.pot` has been refreshed from source.
- `po/es.po` has been structurally synced from the POT via `npm run gettext-update-po -- es`.
- Only safe, empty Spanish entries in `po/es.po` were filled by the AI step.
- Runtime JSON files were not modified.
- No existing non-empty Spanish translations were overwritten.
- All placeholders, plural forms, and source identifiers were preserved exactly.
- The diff is small, targeted, and reviewable.
- Existing compile/validation tooling passes or remains the final blocker for anything invalid.
