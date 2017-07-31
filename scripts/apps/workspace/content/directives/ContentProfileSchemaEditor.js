import {LABEL_MAP, HAS_FORMAT_OPTIONS} from 'apps/workspace/content/constants';
import _ from 'lodash';

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
ContentProfileSchemaEditor.$inject = ['content'];
export function ContentProfileSchemaEditor(content) {
    return {
        restrict: 'E',
        templateUrl: 'scripts/apps/workspace/content/views/schema-editor.html',
        require: '^form',
        scope: {model: '='},
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
                scope.fields = _.keyBy(content.allFields(), '_id');
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
                const getOrder = (f) => _.get(scope.model.editor[f], 'order') || 99;

                scope.schemaKeys = _.filter(Object.keys(scope.model.editor),
                        (value) => scope.model.editor[value].enabled).sort((a, b) => getOrder(a) - getOrder(b));

                scope.schemaKeysDisabled = _.filter(Object.keys(scope.model.editor),
                        (value) => !scope.model.editor[value].enabled).sort((a, b) => getOrder(a) - getOrder(b));

                scope.schemaKeysOrdering = _.clone(scope.schemaKeys);
                scope.updateOrder();
            };

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
             * @description Set form dirty
             */
            scope.setDirty = function(dirty) {
                form.$dirty = !!dirty;
            };

            /**
             * @description Enable fiels in content profile
             * @param {String} id the key of the field to toggle.
             */
            scope.toggle = (id, order, position) => {
                if (scope.model.editor[id]) {
                    scope.model.editor[id].enabled = true;
                    scope.model.schema[id].enabled = true;
                } else {
                    scope.model.editor[id] = {enabled: true};
                    scope.model.schema[id] = {enabled: true};
                }

                scope.schemaKeys.splice(position === 'before' ? order - 1 : order + 1, 0, id);
                scope.schemaKeysDisabled.splice(scope.schemaKeysDisabled.indexOf(id), 1);
                scope.schemaKeysOrdering = _.clone(scope.schemaKeys);

                scope.updateOrder();
                scope.setDirty(true);
            };

            /**
             * @description Disable field in content profile
             * @param {String} id the key of the field to toggle.
             */
            scope.remove = (id) => {
                scope.model.editor[id].enabled = false;
                scope.model.schema[id].enabled = false;

                scope.schemaKeys.splice(scope.schemaKeys.indexOf(id), 1);
                scope.schemaKeysDisabled.unshift(id);
                scope.schemaKeysOrdering = _.clone(scope.schemaKeys);

                scope.updateOrder();
                form.$dirty = true;
            };

            /**
             * Test if given field should have format options config
             *
             * @param {string} field
             * @return {Boolean}
             */
            scope.hasFormatOptions = (field) => !!HAS_FORMAT_OPTIONS[field] || hasCustomFieldFormatOptions(field);

            /**
             * Test if given field is custom field
             *
             * @param {string} field
             * @return {Boolean}
             */
            const hasCustomFieldFormatOptions = (field) =>
                scope.fields[field] && scope.fields[field].field_type === 'text';

            /*
             * @description Drag&Drop sorting functionality
             * @param {int} start position of item before drag
             * @param {int} end position of item after drop
             */
            scope.reorder = (start, end) => {
                scope.schemaKeysOrdering.splice(end, 0, scope.schemaKeysOrdering.splice(start, 1)[0]);
                scope.updateOrder();
                scope.setDirty(true);
            };

            /*
             * @description Update order on input change
             * @param {string} id key of the field to toggle
             */
            scope.updateOrder = (key) => {
                if (key) {
                    scope.schemaKeysOrdering.splice(scope.model.editor[key].order - 1, 0,
                            scope.schemaKeysOrdering.splice(scope.schemaKeysOrdering.indexOf(key), 1)[0]);
                }

                angular.forEach(scope.schemaKeys, (id) => {
                    scope.model.editor[id].order = scope.schemaKeysOrdering.indexOf(id) + 1;
                });
            };
        }
    };
}
