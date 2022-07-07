import {IArticle, IAuthoringFieldV2, IFieldAdapter} from 'superdesk-api';
import {gettext} from 'core/utils';
import {retrieveStoredValueEditor3Generic, storeEditor3ValueBase} from '.';
import {IEditor3Config} from '../fields/editor3/interfaces';

export const body_html: IFieldAdapter<IArticle> = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const fieldConfig: IEditor3Config = {
            editorFormat: fieldEditor.formatOptions ?? [],
            minLength: fieldSchema?.minlength,
            maxLength: fieldSchema?.maxlength,
            cleanPastedHtml: fieldEditor?.cleanPastedHTML,
            singleLine: false,
            disallowedCharacters: [],
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'body_html',
            name: gettext('Body HTML'),
            fieldType: 'editor3',
            fieldConfig,
        };

        return fieldV2;
    },

    retrieveStoredValue: (item: IArticle, authoringStorage) => retrieveStoredValueEditor3Generic(
        'body_html',
        item,
        authoringStorage,
    ),

    storeValue: (value, item, config) => {
        const result = storeEditor3ValueBase(
            'body_html',
            item,
            value,
            config,
        );

        const articleUpdated = {...result.article};

        articleUpdated.body_html = result.stringValue;

        // Keep compatibility with existing output format.
        // (only applicable to body_html field)
        articleUpdated.annotations = result.annotations;

        return articleUpdated;
    },
};
