import {IAuthoringFieldV2} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IFieldAdapter} from '.';
import {IEditor3Config} from '../fields/editor3/interfaces';
import {storeEditor3ValueBase} from '../fields/editor3';

export const sms_message: IFieldAdapter = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const fieldConfig: IEditor3Config = {
            editorFormat: fieldEditor.formatOptions ?? [],
            minLength: fieldSchema?.minlength,
            maxLength: fieldSchema?.maxlength,
            cleanPastedHtml: fieldEditor?.cleanPastedHTML,
            singleLine: true,
            disallowedCharacters: [],
            copyFromFieldOnToggle: fieldEditor.sourceField?.length > 0 ? fieldEditor.sourceField : 'abstract',
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'sms_message',
            name: gettext('SMS Message'),
            fieldType: 'editor3',
            fieldConfig,
        };

        return fieldV2;
    },

    storeValue: (value, item, config) => {
        const result = storeEditor3ValueBase(
            'sms_message',
            item,
            value,
            config,
        );

        const articleUpdated = {...result.article};

        articleUpdated.sms_message = result.stringValue;

        articleUpdated.flags = {
            ...(articleUpdated.flags ?? {}),
            marked_for_sms: articleUpdated.sms_message?.length > 0,
        };

        return articleUpdated;
    },
};
