MediaIdGeneratorService.$inject = ['$q', 'api'];
export function MediaIdGeneratorService($q, api) {
    const MEDIA_FIELD_FORMAT = /(\S+)--(\d+)/i;

    /**
     * @ngdoc method
     * @name MediaIdGeneratorService#getFieldVersionName
     * @public
     * @description Generates a new identifer based on the root field and the last version
     *
     * @param {String} rootField
     * @param {Integer} lastVersion
     * @return {String}
     */
    this.getFieldVersionName = (rootField, lastVersion) =>
        lastVersion === null || lastVersion === undefined ? rootField : rootField + '--' + lastVersion;

    /**
     * @ngdoc method
     * @name MediaIdGeneratorService#getFieldParts
     * @public
     * @description Splits an association field containing versioning in the
     *              root part and the version number and returns them in an array.
     * @param {string} fieldId
     * @return {Array}
     */
    this.getFieldParts = (fieldId) => {
        var match = MEDIA_FIELD_FORMAT.exec(fieldId);

        if (!match) {
            return [fieldId, null];
        }
        if (match.length === 3) {
            return [match[1], parseInt(match[2], 10)];
        }
        return [match[1], null];
    };
}
