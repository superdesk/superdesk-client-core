# AI Translation Workflow

This is the manual GitHub Copilot agent workflow for AI-assisted translations in `superdesk-client-core`.

## Flow

1. Ask the GitHub Copilot agent to update Spanish translations using the repository skill in `.github/skills/translate-po/`.

2. The agent refreshes the source template:

```bash
npm run gettext-extract
```

3. The agent syncs the target PO file from the template:

```bash
npm run gettext-update-po -- es
```

4. The agent fills empty `msgstr` and `msgstr[n]` entries in `po/es.po`, using `po/superdesk.pot` as the source of truth.

5. The agent validates with existing tooling:

```bash
grunt nggettext_compile
```

6. The agent prepares a PR against `develop`.

7. Review the diff and the PR.

## AI Step Boundaries

- Read `po/superdesk.pot` as the source of truth.
- Update only `po/es.po`.
- Translate only empty entries in `po/es.po`.
- Never modify runtime JSON files directly.
- Never edit `msgid`.
- Never overwrite non-empty Spanish translations.
- Preserve placeholders and plural blocks exactly.
- Skip HTML-heavy, ambiguous, or unsafe entries.

## Notes

- `npm run gettext-update-po -- <lang>` is generic and can be reused for other existing top-level PO files later.
- The current workflow remains Spanish-only for AI translation.
- The primary trigger is manual: ask the GitHub Copilot agent to perform the translation update.
- The repository skill for this lives in `.github/skills/translate-po/SKILL.md`.
- `docs/i18n/ai-agent-instructions.md` contains the generic agent rules; this document defines the current Spanish run configuration.
