---
name: sr-glossary
description: Serbian Cyrillic glossary for AI-assisted translations. Reviewed and confirmed by Serbian language expert.
type: reference
---

# Serbian Cyrillic Glossary

Use neutral Serbian Cyrillic (Вукова ћирилица). Prefer consistency over stylistic variation. This glossary will later be transliterated to Latin (`sr_Latn`) using a standard Вук mapping.

## Core product terms

| English | Serbian Cyrillic | Notes |
|---|---|---|
| article | чланак | |
| item | ставка | |
| news item | ставка вести | also acceptable: `вест` |
| content | садржај | |
| headline | наслов | |
| subhead | поднаслов | |
| abstract | сажетак | |
| body | тело | article body |
| lead | увод | article lead paragraph |
| byline | потпис | |
| dateline | датумска линија | |
| caption | натпис | for media/images; alternative: `потпис слике` |
| keyword | кључна реч | |
| tag | ознака | |
| slugline | слаглајн | transliterated journalist jargon |
| desk | деск | editorial unit (e.g. politics desk, sports desk) |
| stage | фаза | workflow stage |
| workspace | радни простор | |
| assignment | задатак | work assignment |
| planning | планирање | |
| event | догађај | |
| coverage | извештавање | reporting coverage of an event |
| story | прича | |
| package | пакет | bundled content |
| template | шаблон | |
| preview | преглед | |
| publish | објавити | imperative: `Објави` |
| unpublish | повући објаву | "retract publication" |
| schedule | заказати | imperative: `Закажи` |
| scheduled | заказано | | |
| save | сачувати | imperative: `Сачувај` |
| close | затворити | imperative: `Затвори` |
| open | отворити | imperative: `Отвори` |
| edit | уредити | imperative: `Уреди` |
| delete | обрисати | imperative: `Обриши` |
| remove | уклонити | imperative: `Уклони` |
| add | додати | imperative: `Додај` |
| create | креирати | imperative: `Креирај` |
| cancel | отказати | imperative: `Откажи` |
| confirm | потврдити | imperative: `Потврди` |
| submit | послати | imperative: `Пошаљи` |
| filter | филтер | |
| search | претрага | noun; verb `претражити`, imperative `Претражи` |
| vocabulary | вокабулар | distinct from `dictionary`; coded value sets (topics, priorities) |
| dictionary | речник | language dictionary (spell-check) |
| settings | подешавања | |
| preferences | поставке | |
| user | корисник | |
| group | група | |
| role | улога | |
| permission | дозвола | |
| language | језик | |
| translation | превод | |
| translate | превести | imperative: `Преведи` |
| profile | профил | |
| content profile | профил садржаја | |

## Common UI labels

| English | Serbian Cyrillic | Notes |
|---|---|---|
| OK | У реду | |
| Yes | Да | |
| No | Не | |
| Name | Назив / Име | |
| Date | Датум | |
| Time | Време | |
| Status | Статус | |
| Type | Тип | alternative: `Врста` |
| Value | Вредност | |
| Default | Подразумевано | |
| None | Ниједан / Ништа | |
| All | Сви / Све | |
| Required | Обавезно | |
| Optional | Опционо | |
| Loading… | Учитавање… | |
| Error | Грешка | |
| Warning | Упозорење | |
| Success | Успех | alternative: `Урађено` |
| Info | Информација | alternative: `Обавештење` |

## Tone

- Keep labels short and UI-friendly.
- Use imperative verbs for action buttons: `Сачувај`, `Затвори`, `Објави`, `Откажи`, `Обриши`.
- Keep product names untranslated: **Superdesk**, **Newshub**, etc.
- Keep technical identifiers and field codes untranslated (e.g. `slug`, `guid`, `urgency`, field names in API).
- Prefer neutral Serbian. Do not use regionalisms.
- Use Ekavian pronunciation (standard in Serbia): `време` not `вријеме`, `мрежа` not `мрежа` (same), `превод` not `пријевод`.

## Consistency rules

- Preserve established translations already present in `po/sr.po` once a baseline exists.
- Do not translate placeholders (`{{name}}`, `{{ count }}`, `{{user.full_name}}`).
- Do not translate field identifiers, system codes, or internal keys.
- If a source term is ambiguous or journalism-domain specific and not in this glossary, leave it untranslated and flag for manual review rather than guessing.
- When a source string contains both UI terms and journalism jargon, prefer the UI translation for button/label context and the journalism term for content context.

## Placeholders and formatting

- Preserve every `{{...}}` exactly, including internal spacing.
- Preserve HTML tags and markup exactly.
- Preserve plural structures exactly (`msgstr[n]` slots).
- Serbian has 3 plural forms (one, few, other). The POT plural forms header will determine the expected slots — do not add or remove slots.

## Script note

This glossary is Cyrillic-first. A mechanical Cyrillic → Latin transliteration (Вук mapping: а→a, б→b, в→v, г→g, д→d, ђ→đ, е→e, ж→ž, з→z, и→i, ј→j, к→k, л→l, љ→lj, м→m, н→n, њ→nj, о→o, п→p, р→r, с→s, т→t, ћ→ć, у→u, ф→f, х→h, ц→c, ч→č, џ→dž, ш→š) will produce the `sr_Latn` variant later.
