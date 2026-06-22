#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const lang = (process.argv[2] || '').trim();
const translationsFile = process.argv[3];
const poFileOverride = process.argv[4];

if (!lang || !translationsFile) {
    console.error('Usage: node tasks/apply-po-translations.js <lang> <translations.json> [po-file]');
    console.error('  <lang>             PO filename stem, e.g. uk_UA, ja, es (resolves to po/<lang>.po)');
    console.error('  <translations.json> JSON map of msgid -> translation (use "<msgid>|plural" for plural forms)');
    console.error('  [po-file]          optional explicit PO path, overrides po/<lang>.po');
    process.exit(1);
}

if (!/^[A-Za-z0-9_.@-]+$/.test(lang)) {
    console.error(`Invalid language code: ${lang}`);
    process.exit(1);
}

const poFilePath = poFileOverride || path.join(__dirname, '..', 'po', `${lang}.po`);

if (!fs.existsSync(translationsFile)) {
    console.error(`Translations file not found: ${translationsFile}`);
    process.exit(1);
}

if (!fs.existsSync(poFilePath)) {
    console.error(`PO file not found: ${poFilePath}`);
    process.exit(1);
}

const translations = JSON.parse(fs.readFileSync(translationsFile, 'utf8'));
const content = fs.readFileSync(poFilePath, 'utf8');
const lines = content.split(/\r?\n/);

function extractQuoted(s) {
    const m = s.match(/^"(.*)"$/);

    return m ? m[1] : null;
}

// Decode PO string escapes in a single left-to-right pass so an escaped
// backslash (\\) is consumed before the following character is interpreted.
function unesc(s) {
    let out = '';

    for (let k = 0; k < s.length; k++) {
        if (s[k] !== '\\' || k === s.length - 1) {
            out += s[k];
            continue;
        }
        const next = s[++k];

        if (next === 'n') {
            out += '\n';
        } else if (next === 't') {
            out += '\t';
        } else {
            out += next;
        }
    }

    return out;
}

function esc(s) {
    return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n');
}

// Append a continuation line value to the field currently being parsed.
function appendContinuation(entry, field, val) {
    if (field === 'msgid') {
        entry.msgid += val;
    } else if (field === 'msgid_plural') {
        entry.msgidPlural += val;
    } else if (field === 'msgstr') {
        entry.msgstr += val;
    } else if (field && field.startsWith('msgstr_')) {
        const idx = parseInt(field.split('_')[1], 10);

        entry.msgstrPluralMap[idx] += val;
    }
}

// Parse one contiguous block of PO lines into an entry, tracking line indices.
function parseEntry(entryLines, start) {
    const entry = {
        msgid: null,
        msgidPlural: null,
        msgstr: null,
        msgstrPluralMap: {},
        msgstrLine: -1,
        msgstrPluralLines: {},
        obsolete: false,
    };
    let field = null;

    for (let j = 0; j < entryLines.length; j++) {
        const el = entryLines[j];
        const absLine = start + j;

        // Do not touch obsolete entries (#~ ...)
        if (el.startsWith('#~')) {
            entry.obsolete = true;
            field = null;
        } else if (el.startsWith('#')) {
            field = null;
        } else if (el.startsWith('msgctxt ')) {
            field = 'msgctxt';
        } else if (el.startsWith('msgid_plural ')) {
            field = 'msgid_plural';
            entry.msgidPlural = unesc(extractQuoted(el.substring(13)) || '');
        } else if (el.startsWith('msgid ')) {
            field = 'msgid';
            entry.msgid = unesc(extractQuoted(el.substring(6)) || '');
        } else if (el.match(/^msgstr\[\d+\] /)) {
            const idx = parseInt(el.match(/^msgstr\[(\d+)\]/)[1], 10);

            field = 'msgstr_' + idx;
            entry.msgstrPluralMap[idx] = unesc(extractQuoted(el.substring(el.indexOf('"'))) || '');
            entry.msgstrPluralLines[idx] = absLine;
        } else if (el.startsWith('msgstr ')) {
            field = 'msgstr';
            entry.msgstr = unesc(extractQuoted(el.substring(7)) || '');
            entry.msgstrLine = absLine;
        } else if (el.startsWith('"')) {
            appendContinuation(entry, field, unesc(extractQuoted(el) || ''));
        }
    }

    return entry;
}

const entries = [];
let i = 0;

while (i < lines.length) {
    // Skip blank lines
    if (lines[i].trim() === '') {
        i++;
        continue;
    }

    // Collect contiguous non-blank lines as one entry
    const start = i;

    while (i < lines.length && lines[i].trim() !== '') {
        i++;
    }

    const entry = parseEntry(lines.slice(start, i), start);

    if (entry.msgid !== null && !entry.obsolete) {
        entries.push(entry);
    }
}

// Apply translations
let applied = 0;
let skippedNonEmpty = 0;

// Fill a plural entry from a "msgid|plural" translation, leaving non-empty slots untouched.
function applyPlural(entry) {
    let trans = translations[entry.msgid + '|plural'];

    if (!trans) {
        return;
    }
    if (typeof trans === 'string') {
        trans = {'0': trans};
    }
    for (const [idx, value] of Object.entries(trans)) {
        const numIdx = parseInt(idx, 10);
        const current = entry.msgstrPluralMap[numIdx];

        if (current === '') {
            lines[entry.msgstrPluralLines[numIdx]] = `msgstr[${numIdx}] "${esc(value)}"`;
            applied++;
        } else if (current !== undefined) {
            skippedNonEmpty++;
        }
    }
}

// Fill a singular entry, leaving an existing non-empty translation untouched.
function applySingular(entry) {
    if (!translations[entry.msgid]) {
        return;
    }
    if (entry.msgstr === '') {
        lines[entry.msgstrLine] = `msgstr "${esc(translations[entry.msgid])}"`;
        applied++;
    } else {
        skippedNonEmpty++;
    }
}

for (const entry of entries) {
    if (entry.msgid === '') {
        continue; // Skip header
    }
    if (entry.msgidPlural !== null) {
        applyPlural(entry);
    } else if (entry.msgstr !== null) {
        applySingular(entry);
    }
}

fs.writeFileSync(poFilePath, lines.join('\n'));
console.log(`Language: ${lang}`);
console.log(`PO file: ${poFilePath}`);
console.log(`Applied: ${applied}`);
console.log(`Skipped (non-empty): ${skippedNonEmpty}`);
console.log(`Total translations provided: ${Object.keys(translations).length}`);
