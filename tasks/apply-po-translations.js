#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const lang = process.argv[2];
const translationsFile = process.argv[3];
const poFilePath = process.argv[4]
    || (lang ? path.join(__dirname, '..', 'po', `${lang}.po`) : null);

if (!lang || !translationsFile) {
    console.error('Usage: node tasks/apply-po-translations.js <lang> <translations.json> [po-file]');
    console.error('  <lang>             PO filename stem, e.g. uk_UA, ja, es (resolves to po/<lang>.po)');
    console.error('  <translations.json> JSON map of msgid -> translation (use "<msgid>|plural" for plural forms)');
    console.error('  [po-file]          optional explicit PO path, overrides po/<lang>.po');
    process.exit(1);
}

if (!fs.existsSync(poFilePath)) {
    console.error(`PO file not found: ${poFilePath}`);
    process.exit(1);
}

const translations = JSON.parse(fs.readFileSync(translationsFile, 'utf8'));
const content = fs.readFileSync(poFilePath, 'utf8');
const lines = content.split('\n');

function extractQuoted(s) {
    const m = s.match(/^"(.*)"$/);
    return m ? m[1] : null;
}

function unesc(s) {
    return s.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

function esc(s) {
    return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\t/g, '\\t').replace(/\n/g, '\\n');
}

// Parse entries: find msgid, msgid_plural, msgstr, msgstr[n] with their line indices
let entries = [];
let i = 0;

while (i < lines.length) {
    // Skip blank lines
    if (lines[i].trim() === '') { i++; continue; }

    // Collect contiguous non-blank lines as one entry
    let start = i;
    while (i < lines.length && lines[i].trim() !== '') i++;

    let entryLines = lines.slice(start, i);
    let msgid = null, msgidPlural = null, msgstr = null;
    let msgstrPluralMap = {};
    let msgstrLine = -1, msgstrPluralLines = {};
    let field = null;
    let obsolete = false;

    for (let j = 0; j < entryLines.length; j++) {
        let el = entryLines[j];
        let absLine = start + j;

        // Do not touch obsolete entries (#~ ...)
        if (el.startsWith('#~')) { obsolete = true; field = null; continue; }
        if (el.startsWith('#')) { field = null; continue; }

        if (el.startsWith('msgctxt ')) {
            field = 'msgctxt'; continue;
        }
        if (el.startsWith('msgid_plural ')) {
            field = 'msgid_plural';
            msgidPlural = unesc(extractQuoted(el.substring(13)) || '');
            continue;
        }
        if (el.startsWith('msgid ')) {
            field = 'msgid';
            msgid = unesc(extractQuoted(el.substring(6)) || '');
            continue;
        }
        if (el.match(/^msgstr\[\d+\] /)) {
            let idx = parseInt(el.match(/^msgstr\[(\d+)\]/)[1]);
            field = 'msgstr_' + idx;
            let val = unesc(extractQuoted(el.substring(el.indexOf('"'))) || '');
            msgstrPluralMap[idx] = val;
            msgstrPluralLines[idx] = absLine;
            continue;
        }
        if (el.startsWith('msgstr ')) {
            field = 'msgstr';
            msgstr = unesc(extractQuoted(el.substring(7)) || '');
            msgstrLine = absLine;
            continue;
        }
        if (el.startsWith('"')) {
            let val = unesc(extractQuoted(el) || '');
            if (field === 'msgid') msgid += val;
            else if (field === 'msgid_plural') msgidPlural += val;
            else if (field === 'msgstr') msgstr += val;
            else if (field && field.startsWith('msgstr_')) {
                let idx = parseInt(field.split('_')[1]);
                msgstrPluralMap[idx] += val;
            }
        }
    }

    if (msgid !== null && !obsolete) {
        entries.push({ msgid, msgidPlural, msgstr, msgstrPluralMap, msgstrLine, msgstrPluralLines });
    }
}

// Apply translations
let applied = 0;
let skippedNonEmpty = 0;

for (const entry of entries) {
    if (entry.msgid === '') continue; // Skip header

    if (entry.msgidPlural !== null) {
        // Plural entry - look up by "msgid|plural" key
        let key = entry.msgid + '|plural';
        if (translations[key]) {
            let trans = translations[key];
            if (typeof trans === 'string') trans = { '0': trans };
            for (const [idx, value] of Object.entries(trans)) {
                let numIdx = parseInt(idx);
                if (entry.msgstrPluralMap[numIdx] === '') {
                    lines[entry.msgstrPluralLines[numIdx]] = `msgstr[${numIdx}] "${esc(value)}"`;
                    applied++;
                } else if (entry.msgstrPluralMap[numIdx] !== '') {
                    skippedNonEmpty++;
                }
            }
        }
    } else if (entry.msgstr !== null) {
        // Singular entry
        if (translations[entry.msgid]) {
            if (entry.msgstr === '') {
                lines[entry.msgstrLine] = `msgstr "${esc(translations[entry.msgid])}"`;
                applied++;
            } else {
                skippedNonEmpty++;
            }
        }
    }
}

fs.writeFileSync(poFilePath, lines.join('\n'));
console.log(`Language: ${lang}`);
console.log(`PO file: ${poFilePath}`);
console.log(`Applied: ${applied}`);
console.log(`Skipped (non-empty): ${skippedNonEmpty}`);
console.log(`Total translations provided: ${Object.keys(translations).length}`);
