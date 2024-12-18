import {
    IBooleanFieldUserPreferences,
    IBooleanFieldValueOperational,
    IBooleanFieldValueStorage,
    ICommonFieldConfig,
    ICustomFieldType,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Preview} from './preview';

type IBooleanField = ICustomFieldType<
    IBooleanFieldValueOperational,
    IBooleanFieldValueStorage,
    ICommonFieldConfig,
    IBooleanFieldUserPreferences
>;

export const getBooleanField = (): IBooleanField => {
    return {
        id: 'boolean',
        generic: true,
        label: gettext('Boolean'),
        editorComponent: Editor,
        previewComponent: Preview,
        hasValue: (val) => val != null,
        getEmptyValue: () => null,
    };
};

