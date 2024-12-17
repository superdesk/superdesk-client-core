import {
    ICommonFieldConfig,
    ICustomFieldType,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {IUserPreferences, IValueOperational, IValueStorage} from './interfaces';
import {Preview} from './preview';

type IBooleanField = ICustomFieldType<IValueOperational, IValueStorage, ICommonFieldConfig, IUserPreferences>;

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

