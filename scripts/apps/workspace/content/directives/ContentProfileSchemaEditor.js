import {LABEL_MAP, HAS_FORMAT_OPTIONS} from 'apps/workspace/content/constants';
/**
 * @ngdoc directive
 * @module superdesk.apps.workspace
 * @name ContentProfileSchemaEditor
 *
 * @requires gettext
 * @requires content
 *
 * @description Handles content profile schema editing
 */
ContentProfileSchemaEditor.$inject = ['gettext', 'content'];
export function ContentProfileSchemaEditor(gettext, content) {
    return {
        restrict: 'E',
        templateUrl: 'scripts/apps/workspace/content/views/schema-editor.html',
        require: '^form',
        scope: {
            model: '=ngModel'
        },
        link: function(scope, elem, attr, form) {
            scope.loading = true;
            scope.model.schema = angular.extend({}, content.contentProfileSchema);
            scope.model.editor = angular.extend({}, content.contentProfileEditor);
            scope.schemaKeys = null;

            content.getTypeMetadata(scope.model._id).then((typeMetadata) => {
                scope.model.schema = angular.extend({}, typeMetadata.schema);
                scope.model.editor = angular.extend({}, typeMetadata.editor);
                scope.loading = false;
                getSchemaKeys();
            });

            /**
             * @ngdoc method
             * @name ContentProfileSchemaEditor#getSchemaKeys
             * @private
             * @description Creates a list of field names of the schema sorted by 'order' value
             * and assigns it to schemaKeys
             */
            const getSchemaKeys = () => {
                // inner function to return the value of 'order' of a given field
                const getOrder = (f) => scope.model.editor[f] && scope.model.editor[f].order || 99;

                scope.schemaKeys = Object.keys(scope.model.schema).sort((a, b) => getOrder(a) - getOrder(b));
            };

            scope.directive = this.name;

            scope.formattingOptions = [
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull',
                'outdent', 'indent', 'unorderedlist', 'orderedlist',
                'pre', 'quote', 'image', 'anchor', 'superscript', 'subscript', 'strikethrough',
                'underline', 'italic', 'bold', 'table'
            ];

            scope.formattingOptionsEditor3 = [
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'orderedlist', 'unorderedlist', 'quote', 'image', 'anchor',
                'embed', 'underline', 'italic', 'bold', 'table'
            ];

            /**
             * @description label returns the display name for a key.
             */
            scope.label = function(id) {
                if (LABEL_MAP.hasOwnProperty(id)) {
                    return LABEL_MAP[id];
                }

                console.warn(`could not find label for ${id}. Please add it in ` +
                    '(apps/workspace/content/content/directives/ContentProfileSchemaEditor).' +
                    'ContentProfileSchemaEditor/labelMap');

                return id.charAt(0).toUpperCase() + id.substr(1).toLowerCase();
            };

            /**
             * @description Toggles whether a field is enabled or not.
             * @param {String} id the key of the field to toggle.
             */
            scope.toggle = function(id) {
                scope.model.editor[id].enabled = !scope.model.editor[id].enabled;
                scope.model.schema[id].enabled = !scope.model.schema[id].enabled;
                form.$dirty = true;
            };

            scope.setDirty = function(dirty) {
                form.$dirty = !!dirty;
            };

            /**
             * Test if given field should have format options config
             *
             * @param {string} field
             * @return {Boolean}
             */
            scope.hasFormatOptions = (field) => !!HAS_FORMAT_OPTIONS[field]; // return boolean so :: will work
        }
    };
}
