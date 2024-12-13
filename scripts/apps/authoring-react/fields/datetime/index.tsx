import {
    ICustomFieldType,
    IDateTimeValueOperational,
    IDateTimeValueStorage,
    IDateTimeFieldConfig,
    IDateTimeUserPreferences,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Preview} from './preview';
import {Difference} from './difference';

export const DATETIME_FIELD_ID = 'datetime';

export function getDatetimeField()
: ICustomFieldType<IDateTimeValueOperational, IDateTimeValueStorage, IDateTimeFieldConfig, IDateTimeUserPreferences> {
    const field: ICustomFieldType<
        IDateTimeValueOperational,
        IDateTimeValueStorage,
        IDateTimeFieldConfig,
        IDateTimeUserPreferences
    > = {
        id: DATETIME_FIELD_ID,
        label: gettext('Datetime (authoring-react)'),
        editorComponent: Editor,
        previewComponent: Preview,
        generic: true,

        hasValue: (valueOperational) => valueOperational != null,
        getEmptyValue: () => null,

        differenceComponent: Difference,
        configComponent: null,
    };

    return field;
}
