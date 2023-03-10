import {
    IExtension,
    IExtensionActivationResult,
    ICustomFieldType,
} from 'superdesk-api';
import {Editor} from './editor';
import {Config} from './config';
import {TemplateEditor} from './template-editor';
import {superdesk} from './superdesk';
import {IConfig, IUserPreferences, IValueOperational, IValueStorage} from './interfaces';
import {Preview} from './preview';

const {gettext} = superdesk.localization;

function onTemplateCreate(_value: string, config: IConfig) {
    const initialOffset = config.initial_offset_minutes;

    if (_value == null) {
        return null;
    } else {
        return `{{ now|add_timedelta(minutes=${initialOffset})|iso_datetime }}`;
    }
}

const datetimeField: ICustomFieldType<IValueOperational, IValueStorage, IConfig, IUserPreferences> = {
    id: 'datetime',
    label: gettext('Datetime'),
    editorComponent: Editor,
    previewComponent: Preview,
    configComponent: Config,
    templateEditorComponent: TemplateEditor,
    onTemplateCreate: onTemplateCreate,
    hasValue: (val) => val != null,
    getEmptyValue: () => null,
};

const extension: IExtension = {
    activate: () => {
        const result: IExtensionActivationResult = {
            contributions: {
                customFieldTypes: [
                    datetimeField as unknown as ICustomFieldType<unknown, unknown, unknown, unknown>,
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
