/**
 * Directive which adds support for editing JSON objects
 *
 * It converts Object into string for rendering and string to JSON for storage.
 *
 * Use with ng-model on input/textarea fields.
 */
export function VocabularyObjectField() {
    return {
        require: 'ngModel',
        link: (scope, elem, attrs, ngModel) => {
            ngModel.$parsers.push(parseJson);
            ngModel.$formatters.push(formatJson);
            ngModel.$validators.json = validateJson;
        },
    };

    /**
     * Validate if string can be converted to JSON
     *
     * @param {String} modelValue
     * @param {String} viewValue
     * @return {Boolean}
     */
    function validateJson(modelValue, viewValue) {
        let value = modelValue || viewValue;

        try {
            angular.fromJson(value);
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * Format JSON object as string
     *
     * @param {Object} value
     * @return {String}
     */
    function formatJson(value) {
        if (value) {
            return angular.toJson(value, true);
        }
    }

    /**
     * Parse given string into json object
     *
     * @param {String} value
     * @return {Object}
     */
    function parseJson(value) {
        if (value) {
            try {
                return angular.fromJson(value);
            } catch (err) {
                // noop
            }
        }
    }
}