import {
    ICustomFieldType,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {IDateFieldConfig, IDateUserPreferences, IDateValueOperational, IDateValueStorage} from './interfaces';
import {Preview} from './preview';
import {Difference} from './difference';
import {Config} from './config';

export function getDateField()
: ICustomFieldType<IDateValueOperational, IDateValueStorage, IDateFieldConfig, IDateUserPreferences> {
    const field: ICustomFieldType<IDateValueOperational, IDateValueStorage, IDateFieldConfig, IDateUserPreferences> = {
        id: 'date',
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
