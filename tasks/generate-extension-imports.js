var fs = require('fs');
var path = require('path');

var directories = fs.readdirSync(path.resolve(`${__dirname}/../scripts/extensions`));

const directoryNamingViolation = directories.find((name) => name.match(/^\w+$/g) == null);

if (directoryNamingViolation != null) {
    console.error(`"${directoryNamingViolation}" - extension directory names \
must only contain alphanumerical characters and underscores`);
    return;
}

let codeToImportExtensions = 'export const extensions = {};\n\n';
const importStatements = [];
const insertIntoObjectStatements = [];

directories.forEach((extensionName) => {
    importStatements.push(`import * as ${extensionName} from '../extensions/${extensionName}/dist/extension';`);
    insertIntoObjectStatements.push(`extensions['${extensionName}'] = ${extensionName};`);
});

codeToImportExtensions += importStatements.join('\n') + '\n\n' + insertIntoObjectStatements.join('\n') + '\n';

fs.writeFileSync(path.resolve(`${__dirname}/../scripts/core/extension-imports.generated.ts`), codeToImportExtensions);

