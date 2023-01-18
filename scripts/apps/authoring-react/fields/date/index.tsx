import {
    ICustomFieldType, IDateFieldConfig, IDateUserPreferences, IDateValueOperational, IDateValueStorage,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Preview} from './preview';
import {Difference} from './difference';
import {Config} from './config';

export const DATE_FIELD_ID = 'date';

export function getDateField()
: ICustomFieldType<IDateValueOperational, IDateValueStorage, IDateFieldConfig, IDateUserPreferences> {
    const field: ICustomFieldType<IDateValueOperational, IDateValueStorage, IDateFieldConfig, IDateUserPreferences> = {
        id: DATE_FIELD_ID,
        label: gettext('Date (authoring-react)'),
        editorComponent: Editor,
        previewComponent: Preview,

        hasValue: (valueOperational) => valueOperational != null,
        getEmptyValue: () => null,

        differenceComponent: Difference,
        configComponent: Config,
    };

    return field;
}
