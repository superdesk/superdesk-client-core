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
        // handle nested properties
        branch.properties[property] = addTranslations(branch.properties[property]);

        // handle nested properties inside arrays
        if (branch.properties[property].items != null && branch.properties[property].items.properties != null) {
            branch.properties[property].items = addTranslations(branch.properties[property].items);
        }

        // translate description
        if (typeof branch.properties[property].description === 'string') {
            branch.properties[property].description = `gettext('${branch.properties[property].description}')`;
        }
    }

    return branch;
}

function generateInstanceConfigurationSchema(mainClientDir, currentDir) {
    const clientDirAbs = path.join(currentDir, mainClientDir);
    const file = path.join(clientDirAbs, 'node_modules/superdesk-core/scripts/core/instance-settings-interface.ts');
    const configFile = path.join(
        currentDir,
        mainClientDir,
        'node_modules/superdesk-core/scripts/instance-settings.generated.ts'
    );
    const generatedSchema = JSON.parse(
        execSync(`npx typescript-json-schema "${file}" IInstanceSettings --strictNullChecks --required`).toString()
    );
    const schemaWithTranslations = JSON.stringify(addTranslations(generatedSchema), null, 4)
        .replace(/"(gettext.+?)"/g, '$1');

    const contents =
`/* eslint-disable quotes, comma-dangle */
/* tslint:disable: trailing-comma max-line-length */

export const getInstanceConfigSchema = (gettext) => (${schemaWithTranslations});
`;

    fs.writeFileSync(configFile, contents, 'utf-8');
}

module.exports = {
    generateInstanceConfigurationSchema,
};