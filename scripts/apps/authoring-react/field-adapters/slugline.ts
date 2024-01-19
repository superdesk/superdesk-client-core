import {IArticle, IAuthoringFieldV2, IFieldAdapter, IEditor3Config} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {gettext} from 'core/utils';
import {retrieveStoredValueEditor3Generic, storeEditor3ValueBase} from '.';

export const slugline: IFieldAdapter<IArticle> = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const fieldConfig: IEditor3Config = {
            editorFormat: [],
            minLength: fieldSchema?.minlength,
            maxLength: fieldSchema?.maxlength,
            cleanPastedHtml: fieldEditor?.cleanPastedHTML,
            singleLine: true,
            disallowedCharacters: appConfig.disallowed_characters ?? [],
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'slugline',
            name: gettext('Slugline'),
            fieldType: 'editor3',
            fieldConfig,
        };

        return fieldV2;
    },

    retrieveStoredValue: (item: IArticle, authoringStorage) => retrieveStoredValueEditor3Generic(
        'slugline',
        item,
        authoringStorage,
    ),

    storeValue: (value, item, config) => {
        const result = storeEditor3ValueBase(
            'slugline',
            item,
            value,
            config,
        );

        const articleUpdated = {...result.article};

        articleUpdated.slugline = result.stringValue;

        return articleUpdated;
    },
};
