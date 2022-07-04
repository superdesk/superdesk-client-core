import {IArticle, IAuthoringFieldV2} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IFieldAdapter, retrieveStoredValueEditor3Generic} from '.';
import {IEditor3Config} from '../fields/editor3/interfaces';
import {storeEditor3ValueBase} from '../fields/editor3';

export const usageterms: IFieldAdapter = {
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
            id: 'usageterms',
            name: gettext('Terms of use'),
            fieldType: 'editor3',
            fieldConfig,
        };

        return fieldV2;
    },

    retrieveStoredValue: (item: IArticle) => retrieveStoredValueEditor3Generic(
        'usageterms',
        item,
    ),

    storeValue: (value, item, config) => {
        const result = storeEditor3ValueBase(
            'usageterms',
            item,
            value,
            config,
        );

        const articleUpdated = {...result.article};

        articleUpdated.usageterms = result.stringValue;

        return articleUpdated;
    },
};
