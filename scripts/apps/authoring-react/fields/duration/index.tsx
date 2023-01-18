import {
    ICustomFieldType,
    IDurationValueOperational,
    IDurationValueStorage,
    IDurationFieldConfig,
    IDurationUserPreferences,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Preview} from './preview';
import {Difference} from './difference';

export const DURATION_FIELD_ID = 'duration';

export function geDurationField()
: ICustomFieldType<IDurationValueOperational, IDurationValueStorage, IDurationFieldConfig, IDurationUserPreferences> {
    const field: ReturnType<typeof geDurationField> = {
        id: DURATION_FIELD_ID,
        label: gettext('Duration (authoring-react)'),
        editorComponent: Editor,
        previewComponent: Preview,

        hasValue: (valueOperational) => valueOperational != null,
        getEmptyValue: () => null,

        differenceComponent: Difference,
        configComponent: null,
    };

    return field;
}
