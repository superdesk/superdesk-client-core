# Ukrainian Glossary

Use neutral, modern product Ukrainian. Prefer consistency over stylistic variation.

This glossary is a starting point for AI-assisted draft translations. Ukrainian terminology should still be reviewed by a fluent Ukrainian speaker before release. Where a term is already translated consistently in `po/uk_UA.po`, that existing form is preferred and reflected below.

## Core Terms

- article -> стаття
- item -> елемент
- content -> контент
- headline -> заголовок
- slugline -> слаглайн
- byline -> підпис автора
- desk -> стіл
- stage -> етап
- workspace -> робочий простір
- assignment -> завдання
- planning -> планування
- event -> подія
- coverage -> висвітлення
- template -> шаблон
- preview -> передперегляд
- publish -> оприлюднити
- unpublish -> зняти з оприлюднення
- schedule (noun) -> розклад
- schedule (verb) -> запланувати
- spike -> усунути
- save -> зберегти
- close -> закрити
- cancel -> скасувати
- delete -> видалити
- remove -> вилучити
- edit -> редагувати
- filter -> фільтр
- search -> пошук
- settings -> настройки
- user -> користувач
- language -> мова
- translation -> переклад
- ingest -> завантаження
- source -> джерело
- subscriber -> передплатник
- package -> пакет

## Tone

- Keep UI labels short and direct.
- Prefer imperative verbs for actions, for example `Зберегти`, `Закрити`, `Оприлюднити`.
- Prefer common product UI wording over literal translation.
- Keep product names such as `Superdesk` untranslated.
- Use the Ukrainian apostrophe form where required, for example `об'єкт`.
- Do not add spaces before punctuation marks.

## Consistency Rules

- Preserve established translations already present in `po/uk_UA.po` unless they are clearly wrong and separately approved for correction.
- Do not translate placeholders, field identifiers, internal codes, or product names.
- Preserve all `{{...}}` placeholders exactly, including spaces inside placeholders.
- Avoid adding spaces around placeholders unless the surrounding Ukrainian text requires it for readability.
- Respect Ukrainian plural rules: the catalog uses four plural forms (nplurals=4). Provide all required `msgstr[n]` slots for plural entries.
- If a source term is ambiguous, leave it for manual review instead of forcing a glossary match.

## Review-Required Terms

These terms are context-sensitive. Use the glossary default only when the UI context is clear; otherwise skip the entry for human review.

- vocabulary -> словник (ambiguous against `dictionary`; in Superdesk a controlled vocabulary, not a spell-check dictionary)
- dictionary -> словник (spell-check dictionary; disambiguate from `vocabulary` by context)
- desk -> стіл (editorial desk, not a physical desk)
- stage -> етап (workflow stage)
- coverage -> висвітлення (planning coverage)
- assignment -> завдання (planning assignment)
