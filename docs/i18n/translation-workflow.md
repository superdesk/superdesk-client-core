# AI Translation Workflow

This is the manual GitHub Copilot agent workflow for AI-assisted translations in `superdesk-client-core`.

## Flow

1. A human developer refreshes `po/superdesk.pot` in a known complete local environment before invoking the agent.

2. Ask the GitHub Copilot agent to update translations for the target language using the repository skill in `.github/skills/translate-po/`.

3. The agent uses the existing `po/superdesk.pot` on the branch as the source of truth.

4. The agent syncs the target PO file from the template:

```bash
npm run gettext-update-po -- es
```

5. The agent fills empty `msgstr` and `msgstr[n]` entries in `po/es.po`, using `po/superdesk.pot` as the source of truth. If there are too many pending entries to handle safely in one pass, the agent works in internal batches during the same session, commits each successful batch separately when practical, and still prepares one PR.

6. The agent validates with existing tooling:

```bash
grunt nggettext_compile
```

7. The agent prepares a PR against `develop`.

8. Review the diff and the PR.

## AI Step Boundaries

- Read `po/superdesk.pot` as the source of truth.
- Update only `po/es.po`.
- Translate only empty entries in `po/es.po`.
- Use internal batches only when the pending translation set is large, but keep the result in a single PR.
- Do not prune obsolete entries during the agent-driven sync step.
- Never modify runtime JSON files directly.
- Never edit `msgid`.
- Never overwrite non-empty Spanish translations.
- Preserve placeholders and plural blocks exactly.
- Skip HTML-heavy, ambiguous, or unsafe entries.

## Notes

- `npm run gettext-update-po -- <lang>` is generic and can be reused for other existing top-level PO files later.
- `npm run gettext-next-batch -- <lang> --limit 50` can be used to inspect the next deterministic batch of untranslated entries when batching is needed.
- The current examples use Spanish (`es`), but the agent workflow and skill are designed to work for other supported languages too.
- The primary trigger is manual: ask the GitHub Copilot agent to perform the translation update.
- `npm run gettext-extract` is intentionally outside the agent flow and should be run by a human developer when the POT needs to be refreshed.
- The repository skill for this lives in `.github/skills/translate-po/SKILL.md`.
- `docs/i18n/ai-agent-instructions.md` contains the generic agent rules; this document defines the current Spanish run configuration.
