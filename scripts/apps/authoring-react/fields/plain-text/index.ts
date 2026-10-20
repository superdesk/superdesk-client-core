import {
    ICustomFieldType,
    IPlainTextFieldConfig,
    IPlainTextFieldUserPreferences,
    IPlainTextFieldValueOperational,
    IPlainTextFieldValueStorage,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Preview} from './preview';
import {Difference} from './difference';

type IPlainTextField = ICustomFieldType<
    IPlainTextFieldValueOperational,
    IPlainTextFieldValueStorage,
    IPlainTextFieldConfig,
    IPlainTextFieldUserPreferences
>;

export const getPlainTextField = (): IPlainTextField => {
    return {
        id: 'plain-text',
        generic: false,
        label: gettext('Plain text'),
        editorComponent: Editor,
        previewComponent: Preview,
        differenceComponent: Difference,
        hasValue: (val) => typeof val === 'string' && val.length > 0,
        getEmptyValue: () => null,
    };
};
