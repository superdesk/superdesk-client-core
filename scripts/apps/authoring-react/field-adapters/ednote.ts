import {IArticle, IAuthoringFieldV2} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IFieldAdapter, retrieveStoredValueEditor3Generic, storeEditor3ValueBase} from '.';
import {IEditor3Config} from '../fields/editor3/interfaces';

export const ednote: IFieldAdapter = {
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
            id: 'ednote',
            name: gettext('Ed. Note'),
            fieldType: 'editor3',
            fieldConfig,
        };

        return fieldV2;
    },

    retrieveStoredValue: (item: IArticle) => retrieveStoredValueEditor3Generic(
        'ednote',
        item,
    ),

    storeValue: (value, item, config) => {
        const result = storeEditor3ValueBase(
            'ednote',
            item,
            value,
            config,
        );

        const articleUpdated = {...result.article};

        articleUpdated.ednote = result.stringValue;

        return articleUpdated;
    },
};
