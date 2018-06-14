import {HAS_FORMAT_OPTIONS} from 'apps/workspace/content/constants';
import _ from 'lodash';
import {getLabelNameResolver} from '../../helpers/getLabelForFieldId';

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
ContentProfileSchemaEditor.$inject = ['content', 'config'];
export function ContentProfileSchemaEditor(content, config) {
    return {
        restrict: 'E',
        templateUrl: 'scripts/apps/workspace/content/views/schema-editor.html',
        require: '^form',
        scope: {model: '='},
        link: function(scope, elem, attr, form) {
            scope.loading = true;

            Promise.all([content.getCustomFields(), getLabelNameResolver()]).then((res) => {
                const [customFields, getLabelForFieldId] = res;

                scope.model.schema = angular.extend({}, content.contentProfileSchema);
                scope.model.editor = angular.extend({}, content.contentProfileEditor);
                scope.schemaKeys = null;

                content.getTypeMetadata(scope.model._id).then((typeMetadata) => {
                    scope.model.schema = angular.extend({}, typeMetadata.schema);
                    scope.model.editor = angular.extend({}, typeMetadata.editor);
                    scope.loading = false;
                    getSchemaKeys();
                    scope.fields = _.keyBy(customFields, '_id');
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

                    scope.schemaKeysDisabled = [];
                    scope.schemaKeys = _.filter(Object.keys(scope.model.editor),
                        (value) => scope.model.editor[value].enabled).sort((a, b) => getOrder(a) - getOrder(b));

                    _.each(_.difference(Object.keys(scope.model.editor), scope.schemaKeys), (value) =>
                        scope.schemaKeysDisabled.push(
                            {key: value, name: scope.model.editor[value].field_name || scope.label(value)}
                        ));

                    scope.schemaKeysOrdering = _.clone(scope.schemaKeys);
                    scope.updateOrder();
                };

                scope.formattingOptions = [
                    'h1',
                    'h2',
                    'h3',
                    'h4',
                    'h5',
                    'h6',
                    'justifyLeft',
                    'justifyCenter',
                    'justifyRight',
                    'justifyFull',
                    'outdent',
                    'indent',
                    'unordered list',
                    'ordered list',
                    'pre',
                    'quote',
                    'media',
                    'link',
                    'superscript',
                    'subscript',
                    'strikethrough',
                    'underline',
                    'italic',
                    'bold',
                    'table',
                ];

                scope.formattingOptionsEditor3 = [
                    'h1',
                    'h2',
                    'h3',
                    'h4',
                    'h5',
                    'h6',
                    'ordered list',
                    'unordered list',
                    'quote',
                    'media',
                    'link',
                    'embed',
                    'underline',
                    'italic',
                    'bold',
                    'table',
                    'formatting marks',
                    'remove format',
                    'annotation',
                    'comments',
                    'suggestions',
                    'pre',
                    'superscript',
                    'subscript',
                    'strikethrough',
                ];

                scope.label = (id) => getLabelForFieldId(id);

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
                scope.toggle = (schema, order, position) => {
                    if (scope.model.editor[schema.key]) {
                        scope.model.editor[schema.key].enabled = true;
                        scope.model.schema[schema.key].enabled = true;
                    } else {
                        scope.model.editor[schema.key] = {enabled: true};
                        scope.model.schema[schema.key] = {enabled: true};
                    }

                    scope.schemaKeys.splice(position === 'before' ? order - 1 : order + 1, 0, schema.key);
                    _.remove(scope.schemaKeysDisabled, schema);
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
                    scope.schemaKeysDisabled.push({
                        key: id, name: scope.model.editor[id].field_name || scope.label(id),
                    });
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
                 * Test if given field should have format options config
                 *
                 * @param {string} field
                 * @return {Boolean}
                 */
                scope.hasImageSelected = (field) => scope.hasFormatOptions(field) &&
                            _.includes(scope.model.editor[field].formatOptions, 'media');

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
            });
        },
    };
}
