import {
    ICustomFieldType,
    ITimeValueOperational,
    ITimeValueStorage,
    ITimeFieldConfig,
    ITimeUserPreferences,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Preview} from './preview';
import {Difference} from './difference';

export function getTimeField()
: ICustomFieldType<ITimeValueOperational, ITimeValueStorage, ITimeFieldConfig, ITimeUserPreferences> {
    const field: ICustomFieldType<ITimeValueOperational, ITimeValueStorage, ITimeFieldConfig, ITimeUserPreferences> = {
        id: 'time',
        label: gettext('Time (authoring-react)'),
        editorComponent: Editor,
        previewComponent: Preview,

        hasValue: (valueOperational) => valueOperational != null,
        getEmptyValue: () => null,

        differenceComponent: Difference,
        configComponent: null,
    };

    return field;
}
