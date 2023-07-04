import {includes} from 'lodash';
import {getLabelForFieldId} from '../../helpers/getLabelForFieldId';
import {appConfig} from 'appConfig';
import {IArticleField, FORMATTING_OPTION, RICH_FORMATTING_OPTION} from 'superdesk-api';
import {gettext} from 'core/utils';

interface IScope extends ng.IScope {
    getEditor3FormattingOptions: (fieldName: string) => Dictionary<string, string>;
    model: any;
    fields: {[key: string]: IArticleField};
    form: any;
    formattingOptions: Dictionary<FORMATTING_OPTION, string>;
    schemaKeysOrdering: any;
    schemaKeysDisabled: any;
    characterValidationEnabled: boolean;
    hasFormatOptions(field): boolean;
    hasImageSelected(field): boolean;
    label(id): string;
    remove(key: string): void;
    toggle(schema: { key: string; }, key: string, position: 'before' | 'after'): void;
    onChange(value: Array<string>, fieldId: string): void;
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

export const HAS_RICH_FORMATTING_OPTIONS = Object.freeze({
    abstract: true,
    body_html: true,
    footer: true,
    body_footer: true,
});

const getFormattingOptions = (): Dictionary<FORMATTING_OPTION, string> => {
    return {
        'h1': gettext('h1'),
        'h2': gettext('h2'),
        'h3': gettext('h3'),
        'h4': gettext('h4'),
        'h5': gettext('h5'),
        'h6': gettext('h6'),
        'justifyLeft': gettext('justifyLeft'),
        'justifyCenter': gettext('justifyCenter'),
        'justifyRight': gettext('justifyRight'),
        'justifyFull': gettext('justifyFull'),
        'outdent': gettext('outdent'),
        'indent': gettext('indent'),
        'unordered list': gettext('h1'),
        'ordered list': gettext('unordered list'),
        'pre': gettext('pre'),
        'quote': gettext('quote'),
        'media': gettext('media'),
        'link': gettext('link'),
        'superscript': gettext('superscript'),
        'subscript': gettext('subscript'),
        'strikethrough': gettext('strikethrough'),
        'underline': gettext('underline'),
        'italic': gettext('italic'),
        'bold': gettext('bold'),
        'table': gettext('table'),
        'multi-line quote': gettext('multi-line quote'),
    };
};

export type PLAINTEXT_FORMATTING_OPTION = 'uppercase' | 'lowercase';

export const getEditor3PlainTextFormattingOptions = (): Dictionary<PLAINTEXT_FORMATTING_OPTION, string> => ({
    'uppercase': gettext('uppercase'),
    'lowercase': gettext('lowercase'),
});

export const getFormattingOptionsUnsafeToParseFromHTML = (): Dictionary<RICH_FORMATTING_OPTION, string> => ({
    // these aren't outputted to HTML at all
    'comments': gettext('comments'),
    'suggestions': gettext('suggestions'),

    // no standard in HTML, parsing according to our output format is not implemented
    'annotation': gettext('annotation'),

    // may not be parsed well
    'pre': gettext('pre'),
    'embed': gettext('embed'),
    'media': gettext('media'),
    'table': gettext('table'),
});

export const getEditor3RichFormattingOptions = (): Dictionary<RICH_FORMATTING_OPTION, string> => ({
    ...getEditor3PlainTextFormattingOptions(),
    'h1': gettext('h1'),
    'h2': gettext('h2'),
    'h3': gettext('h3'),
    'h4': gettext('h4'),
    'h5': gettext('h5'),
    'h6': gettext('h6'),
    'justifyLeft': gettext('justifyLeft'),
    'justifyCenter': gettext('justifyCenter'),
    'justifyRight': gettext('justifyRight'),
    'justifyFull': gettext('justifyFull'),
    'outdent': gettext('outdent'),
    'indent': gettext('indent'),
    'unordered list': gettext('unordered list'),
    'ordered list': gettext('ordered list'),
    'pre': gettext('pre'),
    'quote': gettext('quote'),
    'media': gettext('media'),
    'link': gettext('link'),
    'superscript': gettext('superscript'),
    'subscript': gettext('subscript'),
    'strikethrough': gettext('strikethrough'),
    'underline': gettext('underline'),
    'italic': gettext('italic'),
    'bold': gettext('bold'),
    'table': gettext('table'),
    'multi-line quote': gettext('multi-line quote'),
    'formatting marks': gettext('formatting marks'),
    'remove format': gettext('remove format'),
    'remove all format': gettext('remove all format'),
    'annotation': gettext('annotation'),
    'comments': gettext('comments'),
    'suggestions': gettext('suggestions'),
    'tab': gettext('tab'),
    'tab as spaces': gettext('tab as space'),
    'undo': gettext('undo'),
    'redo': gettext('redo'),
});

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
            scope.formattingOptions = getFormattingOptions();
            scope.characterValidationEnabled = appConfig?.disallowed_characters != null;

            scope.getEditor3FormattingOptions = (fieldName) => {
                const isCustomPlainTextField = typeof scope.fields[fieldName] === 'object'
                    && scope.fields[fieldName].field_type === 'text';

                if (Object.keys(HAS_RICH_FORMATTING_OPTIONS).includes(fieldName) || isCustomPlainTextField) {
                    return getEditor3RichFormattingOptions();
                } else {
                    return getEditor3PlainTextFormattingOptions();
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

            scope.onChange = (value, fieldId) => {
                scope.model.editor[fieldId].formatOptions = value;
                scope.setDirty();
                scope.$applyAsync();
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
