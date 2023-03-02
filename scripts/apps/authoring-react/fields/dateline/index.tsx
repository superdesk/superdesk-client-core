import {
    ICommonFieldConfig,
    ICustomFieldType,
    IDatelineUserPreferences,
    IDatelineValueOperational,
    IDatelineValueStorage,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Preview} from './preview';
import {Difference} from './difference';

export const DATELINE_FIELD_ID = 'dateline';

type DatelineFieldType = ICustomFieldType<
    IDatelineValueOperational,
    IDatelineValueStorage,
    ICommonFieldConfig,
    IDatelineUserPreferences
>;

export function getDatelineField()
: DatelineFieldType {
    const field: DatelineFieldType = {
        id: DATELINE_FIELD_ID,
        label: gettext('Dateline (authoring-react)'),
        editorComponent: Editor,
        previewComponent: Preview,

        hasValue: (valueOperational) => valueOperational != null,
        getEmptyValue: () => null,

        differenceComponent: Difference,
        configComponent: () => null,
    };

    return field;
}
