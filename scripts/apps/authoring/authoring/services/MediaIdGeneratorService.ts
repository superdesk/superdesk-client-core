
const MEDIA_FIELD_FORMAT = /(\S+)--(\d+)/i;

// Generates a new identifer based on the root field and the last version
function getFieldVersionName(rootField: string, lastVersion: string): string {
    return lastVersion == null ? rootField : rootField + '--' + lastVersion;
}

// Splits an association field containing versioning in the
// root part and the version number and returns them in an array.
function getFieldParts(fieldId: string): Array<any> {
    var match = MEDIA_FIELD_FORMAT.exec(fieldId);

    if (!match) {
        return [fieldId, null];
    }
    if (match.length === 3) {
        return [match[1], parseInt(match[2], 10)];
    }
    return [match[1], null];
}

export const mediaIdGenerator = {
    getFieldVersionName,
    getFieldParts,
};
