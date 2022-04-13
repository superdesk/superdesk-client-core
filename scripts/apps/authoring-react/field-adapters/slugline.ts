import {IAuthoringFieldV2} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {gettext} from 'core/utils';
import {IFieldAdapter} from '.';
import {IEditor3Config} from '../fields/editor3/interfaces';
import {storeEditor3ValueBase} from '../fields/editor3';

export const slugline: IFieldAdapter = {
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
