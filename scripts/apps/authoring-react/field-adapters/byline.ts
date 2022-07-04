import {IArticle, IAuthoringFieldV2} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IFieldAdapter, retrieveStoredValueEditor3Generic} from '.';
import {IEditor3Config} from '../fields/editor3/interfaces';
import {storeEditor3ValueBase} from '../fields/editor3';

export const byline: IFieldAdapter = {
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
            id: 'byline',
            name: gettext('Byline'),
            fieldType: 'editor3',
            fieldConfig,
        };

        return fieldV2;
    },

    retrieveStoredValue: (item: IArticle) => retrieveStoredValueEditor3Generic(
        'byline',
        item,
    ),

    storeValue: (value, item, config) => {
        const result = storeEditor3ValueBase(
            'byline',
            item,
            value,
            config,
        );

        const articleUpdated = {...result.article};

        articleUpdated.byline = result.stringValue;

        return articleUpdated;
    },
};
