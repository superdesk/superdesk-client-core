import {IAuthoringFieldV2} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {gettext} from 'core/utils';
import {IFieldAdapter} from '.';
import {IEditor3Config} from '../fields/editor3/interfaces';

export const slugline: IFieldAdapter = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const fieldConfig: IEditor3Config = {
            readOnly: fieldEditor.readonly,
            required: fieldEditor.required,
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
};
