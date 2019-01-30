import {HAS_FORMAT_OPTIONS} from 'apps/workspace/content/constants';
import _ from 'lodash';
import {getLabelForFieldId} from '../../helpers/getLabelForFieldId';
import {getTypeForFieldId} from '../../helpers/getTypeForFieldId';
import {IArticle} from 'superdesk-interfaces/Article';
import {IVocabulary} from 'superdesk-interfaces/Vocabulary';
import {assertNever} from 'core/helpers/typescript-helpers';

interface IScope extends ng.IScope {
    model: any;
    loading: boolean;
    sectionToRender: 'header' | 'content';
    fields: any;
    form: any;
    formattingOptions: Array<string>;
    formattingOptionsEditor3: Array<string>;
    schemaKeysOrdering: any;
    schemaKeysDisabled: any;
    vocabularies: Array<IVocabulary>;
    hasFormatOptions(field): boolean;
    hasImageSelected(field): boolean;
    remove(id): void;
    label(id): string;
    toggle(schema, order, position): void;
    reorder(start: any, end: any): void;
    setDirty(dirty: boolean): void;
    updateOrder(key?: any): void;
}

const articleHeaderHardcodedFields = new Set<keyof IArticle>([
    'slugline',
    'keywords',
    'genre',
    'anpa_take_key',
    'place',
    'language',
    'priority',
    'urgency',
    'anpa_category',
    'subject',
    'company_codes',
    'ednote',
    'authors',
]);

/**
 * @ngdoc directive
 * @module superdesk.apps.workspace
 * @name ContentProfileSchemaEditor
 *
 * @requires content
 *
 * @description Handles content profile schema editing
 */
ContentProfileSchemaEditor.$inject = ['content', 'metadata', 'vocabularies'];
export function ContentProfileSchemaEditor(content, metadata, vocabularies) {
    return {
        restrict: 'E',
        templateUrl: 'scripts/apps/workspace/content/views/schema-editor.html',
        require: '^form',
        scope: {model: '=', sectionToRender: '='},
        link: function(scope: IScope, elem, attr, form) {
            scope.loading = true;
            scope.schemaKeysDisabled = [];
            let schemaKeys = [];
            let numberOfHeaderSchemaKeys = 0;

            Promise.all([
                content.getCustomFields(),
                content.getTypeMetadata(scope.model._id),
                vocabularies.getVocabularies(),
            ]).then((res) => {
                const [customFields, typeMetadata, vocabulariesCollection] = res;

                scope.vocabularies = vocabulariesCollection;
                scope.label = (id) => getLabelForFieldId(id, scope.vocabularies);

                let headerFields = [];

                const updateSchemaKeys = (customVocabulariesForArticleHeader) => {
                    // Creates a list of field names of the schema sorted by 'order' value
                    // and assigns it to schemaKeys

                    // inner function to return the value of 'order' of a given field
                    const getOrder = (f) => _.get(scope.model.editor[f], 'order') || 99;

                    let sectionFilter = (function() {
                        switch (scope.sectionToRender) {
                        case 'header':
                            return (key) => articleHeaderFields.has(key);
                        case 'content':
                            return (key) => articleHeaderFields.has(key) === false;
                        default:
                            assertNever(scope.sectionToRender);
                        }
                    })();

                    const articleHeaderFields = new Set();

                    articleHeaderHardcodedFields.forEach((id) => {
                        articleHeaderFields.add(id);
                    });

                    customVocabulariesForArticleHeader.forEach((filteredCustomField) => {
                        articleHeaderFields.add(filteredCustomField._id);
                    });

                    const keysForSection = Object.keys(scope.model.editor).filter(sectionFilter);
                    headerFields = Object.keys(scope.model.editor).filter((key) => articleHeaderFields.has(key));

                    schemaKeys = keysForSection
                        .filter((value) => scope.model.editor[value].enabled)
                        .sort((a, b) => getOrder(a) - getOrder(b));

                    scope.schemaKeysDisabled = [];
                    _.each(_.difference(keysForSection, schemaKeys), (value) => {
                        scope.schemaKeysDisabled.push({
                            key: value,
                            name: scope.model.editor[value].field_name || scope.label(value),
                            type: getTypeForFieldId(value, scope.vocabularies),
                        });
                    });

                    scope.schemaKeysOrdering = _.clone(schemaKeys);
                    scope.updateOrder();
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

                    let orderIndent = scope.sectionToRender === 'content' ?
                        headerFields.filter((value) => scope.model.editor[value].enabled).length : 0;

                    angular.forEach(schemaKeys, (id) => {
                        scope.model.editor[id].order = orderIndent + scope.schemaKeysOrdering.indexOf(id) + 1;
                    });
                };

                scope.model.schema = angular.extend({}, content.contentProfileSchema);
                scope.model.editor = angular.extend({}, content.contentProfileEditor);
                schemaKeys = [];

                scope.model.schema = angular.extend({}, typeMetadata.schema);
                scope.model.editor = angular.extend({}, typeMetadata.editor);
                scope.fields = _.keyBy(customFields, '_id');

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

                    schemaKeys.splice(position === 'before' ? order - 1 : order + 1, 0, schema.key);
                    _.remove(scope.schemaKeysDisabled, schema);
                    scope.schemaKeysOrdering = _.clone(schemaKeys);

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

                    schemaKeys.splice(schemaKeys.indexOf(id), 1);
                    scope.schemaKeysDisabled.push({
                        key: id, name: scope.model.editor[id].field_name || scope.label(id),
                    });
                    scope.schemaKeysOrdering = _.clone(schemaKeys);

                    scope.updateOrder();
                    form.$dirty = true;
                };

                /**
                 * Test if given field should have format options config
                 *
                 * @param {string} field
                 * @return {Boolean}
                 */
                scope.hasFormatOptions = (field) =>
                    !!HAS_FORMAT_OPTIONS[field] || hasCustomFieldFormatOptions(field);

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

                metadata.getAllCustomVocabulariesForArticleHeader(
                    scope.model.editor,
                    scope.model.schema,
                ).then((customVocabulariesForArticleHeader) => {
                    updateSchemaKeys(customVocabulariesForArticleHeader);

                    scope.loading = false;
                });
            });
        },
    };
}
