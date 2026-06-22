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
import {Difference} from './difference';

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
        differenceComponent: Difference,
        hasValue: (val) => val != null,
        getEmptyValue: () => null,
    };
};

