import {includes} from 'lodash';
import {getLabelForFieldId} from '../../helpers/getLabelForFieldId';
import {appConfig} from 'appConfig';
import {IArticleField} from 'superdesk-api';

interface IScope extends ng.IScope {
    getEditor3FormattingOptions: (fieldName: string) => Array<string>;
    model: any;
    fields: {[key: string]: IArticleField};
    form: any;
    formattingOptions: Array<string>;
    schemaKeysOrdering: any;
    schemaKeysDisabled: any;
    characterValidationEnabled: boolean;
    hasFormatOptions(field): boolean;
    hasImageSelected(field): boolean;
    label(id): string;
    remove(key: string): void;
    toggle(schema: { key: string; }, key: string, position: 'before' | 'after'): void;
    reorder(start: number, end: number, key: string): void;
    setDirty(): void;
    updateOrder(key?: any): void;
    onRemove(locals: { key: string; }): void;
    onOrderUpdate(locals: { key: string; }): any;
    onDrag(locals: { start: number; end: number; key: string; }): any;
    onToggle(locals: { key: string; dest: string; position: string; }): any;
    showPreviewConfig(field: IArticleField): boolean;
}

const HAS_PLAINTEXT_FORMATTING_OPTIONS = Object.freeze({
    headline: true,
});

const HAS_RICH_FORMATTING_OPTIONS = Object.freeze({
    abstract: true,
    body_html: true,
    footer: true,
    body_footer: true,
});

const FORMATTING_OPTIONS = [
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
    'tab',
    'tab as spaces',
];

const EDITOR3_PLAINTEXT_FORMATTING_OPTIONS = [
    'uppercase',
    'lowercase',
];

const EDITOR3_RICH_FORMATTING_OPTIONS = [
    ...EDITOR3_PLAINTEXT_FORMATTING_OPTIONS,
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
    'tab',
    'tab as spaces',
    'undo',
    'redo',
];

/**
 * @ngdoc directive
 * @module superdesk.apps.workspace
 * @name ContentProfileSchemaEditor
 *
 * @requires content
 *
 * @description Handles content profile schema editing
 */
ContentProfileSchemaEditor.$inject = ['vocabularies'];
export function ContentProfileSchemaEditor(vocabularies) {
    return {
        restrict: 'E',
        templateUrl: 'scripts/apps/workspace/content/views/schema-editor.html',
        require: '^form',
        scope: {
            model: '=',
            fields: '=',
            available: '=',
            enabled: '=',
            onRemove: '&',
            onToggle: '&',
            onOrderUpdate: '&',
            onDrag: '&',
        },
        link: function(scope: IScope, elem, attr, form) {
            scope.formattingOptions = FORMATTING_OPTIONS;
            scope.characterValidationEnabled = appConfig?.disallowed_characters != null;

            scope.getEditor3FormattingOptions = (fieldName) => {
                const isCustomPlainTextField = typeof scope.fields[fieldName] === 'object'
                    && scope.fields[fieldName].field_type === 'text';

                if (Object.keys(HAS_RICH_FORMATTING_OPTIONS).includes(fieldName) || isCustomPlainTextField) {
                    return EDITOR3_RICH_FORMATTING_OPTIONS;
                } else {
                    return EDITOR3_PLAINTEXT_FORMATTING_OPTIONS;
                }
            };

            scope.remove = (key) => {
                scope.onRemove({key});
                scope.setDirty();
            };

            scope.toggle = (schema, key, position) => {
                scope.onToggle({key: schema.key, dest: key, position: position});
                scope.setDirty();
            };

            scope.updateOrder = (key) => {
                scope.onOrderUpdate({key});
                scope.setDirty();
            };

            scope.reorder = (start, end, key) => {
                scope.onDrag({start, end, key});
                scope.setDirty();
            };

            scope.setDirty = () => {
                form.$setDirty();
            };

            /**
             * Test if given field should have format options config
             *
             * @param {string} field
             * @return {Boolean}
             */
            scope.hasFormatOptions = (field) =>
                Object.keys(HAS_RICH_FORMATTING_OPTIONS).includes(field)
                || (
                    scope.model.editor.body_html.editor3 === true
                    && Object.keys(HAS_PLAINTEXT_FORMATTING_OPTIONS).includes(field)
                )
                || hasCustomFieldFormatOptions(field);

            /**
             * Test if given field should have format options config
             *
             * @param {string} field
             * @return {Boolean}
             */
            scope.hasImageSelected = (field) => scope.hasFormatOptions(field) &&
                includes(scope.model.editor[field].formatOptions, 'media');

            /**
             * Test if given field is custom field
             *
             * @param {string} field
             * @return {Boolean}
             */
            const hasCustomFieldFormatOptions = (field) =>
                scope.fields[field] && scope.fields[field].field_type === 'text';

            vocabularies.getVocabularies().then((vocabulariesCollection) => {
                scope.label = (id) => getLabelForFieldId(id, vocabulariesCollection);
            });

            // enable preview config for CVs
            // we display other fields by default already
            scope.showPreviewConfig = (field) => field != null && field.field_type == null;
        },
    };
}
