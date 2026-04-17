const {execFileSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const languageCode = process.argv[2];

if (languageCode == null || languageCode.trim() === '') {
    console.error('Usage: npm run gettext-update-po -- <language-code>');
    process.exit(1);
}

const lang = languageCode.trim();

if (!/^[A-Za-z0-9_.@-]+$/.test(lang)) {
    console.error(`Invalid language code: ${lang}`);
    process.exit(1);
}

const poFile = path.join(__dirname, '..', 'po', `${lang}.po`);
const potFile = path.join(__dirname, '..', 'po', 'superdesk.pot');

if (!fs.existsSync(potFile)) {
    console.error(`POT file not found: ${potFile}`);
    process.exit(1);
}

if (!fs.existsSync(poFile)) {
    console.error(`PO file not found for language "${lang}": ${poFile}`);
    process.exit(1);
}

try {
    execFileSync(
        'msgmerge',
        [
            '--update',
            '--backup=none',
            '--no-fuzzy-matching',
            poFile,
            potFile,
        ],
        {stdio: 'inherit'}
    );
} catch (error) {
    if (error.code === 'ENOENT') {
        console.error('GNU gettext tools are required. Ensure "msgmerge" is installed.');
    }

    process.exit(error.status ?? 1);
}
