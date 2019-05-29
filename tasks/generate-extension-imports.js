/* eslint-disable max-len */

var fs = require('fs');
var path = require('path');

var merge = require('lodash/object').merge;

var getExtensionDirectoriesSync = require('./get-extension-directories-sync');

const directories = getExtensionDirectoriesSync();
const directoryNamingViolation = directories.find(({extensionName}) => extensionName.match(/^\w+$/g) == null);

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

const defaultConfig = require('../superdesk.config')();
let customConfig = {};

try {
    customConfig = require('../../../superdesk.config')();
} catch (e) {
    console.warn('custom `superdesk.config` not found');
}

const mergedConfig = merge(defaultConfig, customConfig);
const enabledExtensions = [];

for (const key in mergedConfig.enabledExtensions) {
    if (mergedConfig.enabledExtensions[key] === 1) {
        enabledExtensions.push(key);
    }
}

directories
    .filter(({extensionName}) => enabledExtensions.includes(extensionName))
    .forEach(({extensionName, relativePath, absolutePath}) => {
        const manifestFile = JSON.parse(
            fs.readFileSync(`${absolutePath}/${extensionName}/package.json`).toString()
        );

        importStatements.push(`import * as ${extensionName} from '../${relativePath}/${extensionName}/${manifestFile.main}';`);

        insertIntoObjectStatements.push(
            `extensions['${extensionName}'] = {extension: ${extensionName}.default, manifest: ${JSON.stringify(manifestFile)}, activationResult: {}}`
        );
    });

codeToImportExtensions += importStatements.join('\n') + '\n\n' + insertIntoObjectStatements.join('\n') + '\n';

fs.writeFileSync(path.resolve(`${__dirname}/../scripts/core/extension-imports.generated.ts`), codeToImportExtensions);

