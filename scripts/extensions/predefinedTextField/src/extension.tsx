import {ICustomFieldType, IExtension, IExtensionActivationResult} from 'superdesk-api';
import {superdesk} from './superdesk';
import {PredefinedFieldEditor} from './editor';
import {PredefinedFieldConfig} from './config';
import {PredefinedFieldPreview} from './preview';
import {IUserPreferences, IConfig, IValueOperational, IValueStorage} from './interfaces';

const {gettext} = superdesk.localization;

const extension: IExtension = {
    activate: () => {
        const predefinedTextField: ICustomFieldType<IValueOperational, IValueStorage, IConfig, IUserPreferences> = {
            id: 'predefined-text',
            label: gettext('Predefined text field'),
            editorComponent: PredefinedFieldEditor,
            previewComponent: PredefinedFieldPreview,
            configComponent: PredefinedFieldConfig,
            hasValue: (val) => typeof val === 'string' && val.length > 0,
            getEmptyValue: () => '',
        };

        const result: IExtensionActivationResult = {
            contributions: {
                customFieldTypes: [
                    predefinedTextField as unknown as ICustomFieldType<unknown, unknown, unknown, unknown>,
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
