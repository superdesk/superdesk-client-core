/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

function printUsage() {
    console.error('Usage: npm run gettext-next-batch -- <language-code> [--limit <number>]');
}

function parseArgs(argv) {
    const args = argv.slice(2);
    const languageCode = args[0];
    let limit = 50;

    for (let i = 1; i < args.length; i++) {
        if (args[i] === '--limit') {
            const value = Number(args[i + 1]);

            if (!Number.isInteger(value) || value < 1) {
                console.error(`Invalid limit: ${args[i + 1]}`);
                process.exit(1);
            }

            limit = value;
            i++;
        } else {
            console.error(`Unknown argument: ${args[i]}`);
            printUsage();
            process.exit(1);
        }
    }

    return {languageCode, limit};
}

function unquotePoString(input) {
    return JSON.parse(input);
}

function parsePoString(lines, startIndex) {
    let index = startIndex;
    let value = '';

    while (index < lines.length) {
        const trimmed = lines[index].trim();

        if (!trimmed.startsWith('"')) {
            break;
        }

        value += unquotePoString(trimmed);
        index++;
    }

    return {value, nextIndex: index};
}

function parsePoEntries(content) {
    const lines = content.split(/\r?\n/);
    const entries = [];
    let current = null;
    let obsolete = false;

    function finishEntry() {
        if (current != null && current.msgid != null) {
            current.obsolete = obsolete;
            entries.push(current);
        }

        current = null;
        obsolete = false;
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.trim() === '') {
            finishEntry();
            continue;
        }

        if (line.startsWith('#~')) {
            obsolete = true;
            continue;
        }

        if (line.startsWith('#:')) {
            current = current ?? {references: [], comments: [], msgstr: {}};
            current.references.push(line);
            continue;
        }

        if (line.startsWith('#')) {
            current = current ?? {references: [], comments: [], msgstr: {}};
            current.comments.push(line);
            continue;
        }

        if (line.startsWith('msgctxt ')) {
            current = current ?? {references: [], comments: [], msgstr: {}};
            const parsed = parsePoString(lines, i + 1);

            current.msgctxt = unquotePoString(line.slice('msgctxt '.length)) + parsed.value;
            i = parsed.nextIndex - 1;
            continue;
        }

        if (line.startsWith('msgid_plural ')) {
            current = current ?? {references: [], comments: [], msgstr: {}};
            const parsed = parsePoString(lines, i + 1);

            current.msgidPlural = unquotePoString(line.slice('msgid_plural '.length)) + parsed.value;
            i = parsed.nextIndex - 1;
            continue;
        }

        if (line.startsWith('msgid ')) {
            finishEntry();
            current = {references: [], comments: [], msgstr: {}};
            const parsed = parsePoString(lines, i + 1);

            current.msgid = unquotePoString(line.slice('msgid '.length)) + parsed.value;
            i = parsed.nextIndex - 1;
            continue;
        }

        const msgstrMatch = line.match(/^msgstr(?:\[(\d+)])? (".*")$/);

        if (msgstrMatch != null) {
            current = current ?? {references: [], comments: [], msgstr: {}};
            const key = msgstrMatch[1] ?? '0';
            const parsed = parsePoString(lines, i + 1);

            current.msgstr[key] = unquotePoString(msgstrMatch[2]) + parsed.value;
            i = parsed.nextIndex - 1;
        }
    }

    finishEntry();

    return entries;
}

function getPlaceholders(input) {
    return Array.from(input.matchAll(/{{.*?}}/g), (match) => match[0]);
}

function isHtmlHeavy(input) {
    return /<\/?[a-z][\s\S]*>/i.test(input);
}

function isLikelyNonTranslatable(input) {
    return /^[\d\s.,:;+\-/()[\]%#_A-Z]+$/.test(input)
        || /^\d+\s?(B|KB|MB|GB|TB|h|ms|s|min|px|%)$/i.test(input)
        || /^\d+(st|nd|rd|th)$/i.test(input)
        || /^[A-Z][A-Za-z_]+(?:\/[A-Z][A-Za-z_ ]+)+$/.test(input);
}

function formatPoString(value) {
    return JSON.stringify(value);
}

const {languageCode, limit} = parseArgs(process.argv);

if (languageCode == null || languageCode.trim() === '') {
    printUsage();
    process.exit(1);
}

const lang = languageCode.trim();

if (!/^[A-Za-z0-9_.@-]+$/.test(lang)) {
    console.error(`Invalid language code: ${lang}`);
    process.exit(1);
}

const poFile = path.join(__dirname, '..', 'po', `${lang}.po`);

if (!fs.existsSync(poFile)) {
    console.error(`PO file not found for language "${lang}": ${poFile}`);
    process.exit(1);
}

const entries = parsePoEntries(fs.readFileSync(poFile, 'utf8'));
const activeEntries = entries.filter((entry) => !entry.obsolete && entry.msgid !== '');
const missingEntries = activeEntries.filter((entry) => {
    const msgstrValues = Object.values(entry.msgstr);

    return msgstrValues.length > 0 && msgstrValues.some((value) => value === '');
});
const translatableMissingEntries = missingEntries.filter((entry) => (
    !isLikelyNonTranslatable(entry.msgid)
    && !isHtmlHeavy(entry.msgid)
));
const selectedEntries = translatableMissingEntries.slice(0, limit);

console.log(`Language: ${lang}`);
console.log(`PO file: po/${lang}.po`);
console.log(`Total active untranslated entries: ${missingEntries.length}`);
console.log(`Likely safe untranslated entries: ${translatableMissingEntries.length}`);
console.log(`Selected batch size: ${selectedEntries.length}`);
console.log('');

selectedEntries.forEach((entry, index) => {
    const placeholders = Array.from(new Set([
        ...getPlaceholders(entry.msgid),
        ...(entry.msgidPlural == null ? [] : getPlaceholders(entry.msgidPlural)),
    ]));

    console.log(`--- Entry ${index + 1} ---`);

    entry.references.forEach((line) => console.log(line));

    if (entry.msgctxt != null) {
        console.log(`msgctxt ${formatPoString(entry.msgctxt)}`);
    }

    console.log(`msgid ${formatPoString(entry.msgid)}`);

    if (entry.msgidPlural != null) {
        console.log(`msgid_plural ${formatPoString(entry.msgidPlural)}`);
    }

    Object.keys(entry.msgstr).sort((a, b) => Number(a) - Number(b)).forEach((key) => {
        const prefix = entry.msgidPlural == null ? 'msgstr' : `msgstr[${key}]`;

        console.log(`${prefix} ${formatPoString(entry.msgstr[key])}`);
    });

    if (placeholders.length > 0) {
        console.log(`placeholders: ${placeholders.join(', ')}`);
    }

    console.log('');
});
