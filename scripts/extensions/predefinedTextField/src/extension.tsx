import {ICustomFieldType, IExtension, IExtensionActivationResult} from 'superdesk-api';
import {superdesk} from './superdesk';
import {Editor} from './editor';
import {Config} from './config';
import {Preview} from './preview';
import {IConfig, IUserPreferences, IValueOperational, IValueStorage} from './interfaces';

const {gettext} = superdesk.localization;

const predefinedField: ICustomFieldType<IValueOperational, IValueStorage, IConfig, IUserPreferences> = {
    id: 'predefined-text',
    label: gettext('Predefined text field'),
    editorComponent: Editor,
    previewComponent: Preview,
    configComponent: Config,
    hasValue: (val) => typeof val === 'string' && val.length > 0,
    getEmptyValue: () => '',
};

const extension: IExtension = {
    activate: () => {
        const result: IExtensionActivationResult = {
            contributions: {
                customFieldTypes: [
                    predefinedField as unknown as ICustomFieldType<unknown, unknown, unknown, unknown>,
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
