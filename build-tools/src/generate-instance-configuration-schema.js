const fs = require('fs');
const path = require('path');
var execSync = require('child_process').execSync;
var _ = require('lodash');

function addTranslations(branch) {
    if (branch.properties == null) {
        return branch;
    }

    branch.translations = Object.keys(branch.properties).reduce((acc, property) => {
        // gettext call will be unwrapped from the string later with regex
        acc[property] = `gettext('${_.lowerCase(property)}')`;

        return acc;
    }, {});

    for (const property of Object.keys(branch.properties)) {
        branch.properties[property] = addTranslations(branch.properties[property]);
    }

    return branch;
}

function generateInstanceConfigurationSchema(mainClientDir, currentDir) {
    const clientDirAbs = path.join(currentDir, mainClientDir);
    const file = path.join(clientDirAbs, 'node_modules/superdesk-core/scripts/core/core-config.ts');
    const configFile = path.join(currentDir, mainClientDir, 'node_modules/superdesk-core/scripts/instance-settings.ts');
    const generatedSchema = JSON.parse(
        execSync(`npx typescript-json-schema "${file}" ICoreSettings --strictNullChecks --required`).toString()
    );
    const schemaWithTranslations = JSON.stringify(addTranslations(generatedSchema), null, 4)
        .replace(/"(gettext.+?)"/g, '$1');

    const contents =
`/* eslint-disable quotes, comma-dangle */
/* tslint:disable: trailing-comma */

export const getInstanceConfigSchema = (gettext) => (${schemaWithTranslations});
`;

    fs.writeFileSync(configFile, contents, 'utf-8');
}

module.exports = {
    generateInstanceConfigurationSchema,
};