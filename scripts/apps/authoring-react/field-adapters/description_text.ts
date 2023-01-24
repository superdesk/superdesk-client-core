import {IArticle, IAuthoringFieldV2, IFieldAdapter, IEditor3Config} from 'superdesk-api';
import {gettext} from 'core/utils';
import {retrieveStoredValueEditor3Generic, storeEditor3ValueBase} from '.';

export const byline: IFieldAdapter<IArticle> = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const fieldConfig: IEditor3Config = {
            editorFormat: [],
            minLength: fieldSchema?.minlength,
            maxLength: fieldSchema?.maxlength,
            cleanPastedHtml: fieldEditor?.cleanPastedHTML,
            singleLine: true,
            disallowedCharacters: [],
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'description_text',
            name: gettext('Description'),
            fieldType: 'editor3',
            fieldConfig,
        };

        return fieldV2;
    },

    retrieveStoredValue: (item: IArticle, authoringStorage) => retrieveStoredValueEditor3Generic(
        'description_text',
        item,
        authoringStorage,
    ),

    storeValue: (value, item, config) => {
        const result = storeEditor3ValueBase(
            'description_text',
            item,
            value,
            config,
        );

        const articleUpdated = {...result.article};

        articleUpdated.description_text = result.stringValue;

        return articleUpdated;
    },
};
