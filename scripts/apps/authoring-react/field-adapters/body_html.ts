import {IAuthoringFieldV2} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IFieldAdapter} from '.';
import {IEditor3Config} from '../fields/editor3/interfaces';

export const body_html: IFieldAdapter = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const fieldConfig: IEditor3Config = {
            readOnly: fieldEditor.readonly,
            required: fieldEditor.required,
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
};
