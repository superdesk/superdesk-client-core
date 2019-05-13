var fs = require('fs');
var path = require('path');
var lstatSync = fs.lstatSync;

var directories = fs.readdirSync(path.resolve(`${__dirname}/../scripts/extensions`)).filter(
    (name) => lstatSync(path.resolve(`${__dirname}/../scripts/extensions/${name}`)).isDirectory()
);

const directoryNamingViolation = directories.find((name) => name.match(/^\w+$/g) == null);

if (directoryNamingViolation != null) {
    console.error(`"${directoryNamingViolation}" - extension directory names \
must only contain alphanumerical characters and underscores`);
    return;
}

let codeToImportExtensions =
`
/* tslint:disable */

import {IExtensions} from 'superdesk-api';

export const extensions: IExtensions = {};
`;

const importStatements = [];
const insertIntoObjectStatements = [];

directories.forEach((extensionName) => {
    const manifestFile = JSON.parse(
        fs.readFileSync(
            path.resolve(`${__dirname}/../scripts/extensions/${extensionName}/package.json`)
        ).toString()
    );

    importStatements.push(`import * as ${extensionName} from '../extensions/${extensionName}/${manifestFile.main}';`);

    insertIntoObjectStatements.push(
        `extensions['${extensionName}'] = {extension: ${extensionName}, manifest: ${JSON.stringify(manifestFile)}}`
    );
});

codeToImportExtensions += importStatements.join('\n') + '\n\n' + insertIntoObjectStatements.join('\n') + '\n';

fs.writeFileSync(path.resolve(`${__dirname}/../scripts/core/extension-imports.generated.ts`), codeToImportExtensions);

