// tslint:disable-next-line: no-var-requires
var path = require('path');

export function getAbsoluteFilePath(
    relativePath: string, // relative to e2e/client dir
) {
    return path.join(__dirname, `../${relativePath}`);
}
