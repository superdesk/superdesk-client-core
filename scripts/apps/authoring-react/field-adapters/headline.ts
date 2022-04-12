import {IAuthoringFieldV2} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IFieldAdapter} from '.';
import {IEditor3Config} from '../fields/editor3/interfaces';
import {storeEditor3ValueBase} from '../fields/editor3';

export const headline: IFieldAdapter = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const fieldConfig: IEditor3Config = {
            readOnly: fieldEditor.readonly,
            required: fieldEditor.required,
            editorFormat: fieldEditor.formatOptions ?? [],
            minLength: fieldSchema?.minlength,
            maxLength: fieldSchema?.maxlength,
            cleanPastedHtml: fieldEditor?.cleanPastedHTML,
            singleLine: true,
            disallowedCharacters: [],
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'headline',
            name: gettext('Headline'),
            fieldType: 'editor3',
            fieldConfig,
        };

        return fieldV2;
    },

    storeValue: (value, item, config) => {
        const result = storeEditor3ValueBase(
            'headline',
            item,
            value,
            config,
        );

        const articleUpdated = {...result.article};

        articleUpdated.headline = result.stringValue;

        return articleUpdated;
    },
};
