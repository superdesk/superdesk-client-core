import {
    IExtension,
    IExtensionActivationResult,
    ICustomFieldType,
    ICommonFieldConfig,
} from 'superdesk-api';
import {Editor} from './editor';
import {superdesk} from './superdesk';
import {IUserPreferences, IValueOperational, IValueStorage} from './interfaces';
import {Preview} from './preview';

const {gettext} = superdesk.localization;

const booleanField: ICustomFieldType<IValueOperational, IValueStorage, ICommonFieldConfig, IUserPreferences> = {
    id: 'boolean',
    label: gettext('Boolean'),
    editorComponent: Editor,
    previewComponent: Preview,
    hasValue: (val) => val != null,
    getEmptyValue: () => null,
};

const extension: IExtension = {
    activate: () => {
        const result: IExtensionActivationResult = {
            contributions: {
                customFieldTypes: [
                    booleanField as unknown as ICustomFieldType<unknown, unknown, unknown, unknown>,
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
