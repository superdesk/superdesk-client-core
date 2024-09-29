import {
    ICustomFieldType,
    IUrlsFieldUserPreferences,
    IUrlsFieldValueOperational,
    IUrlsFieldValueStorage,
    IUrlsFieldConfig,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Preview} from './preview';
import {Difference} from './difference';

export const URL_FIELD_ID = 'urls';

export function getUrlsField()
: ICustomFieldType<IUrlsFieldValueOperational, IUrlsFieldValueStorage, IUrlsFieldConfig, IUrlsFieldUserPreferences> {
    const field: ReturnType<typeof getUrlsField> = {
        id: URL_FIELD_ID,
        generic: true,
        label: gettext('Urls (authoring-react)'),
        editorComponent: Editor,
        previewComponent: Preview,

        hasValue: (valueOperational) => valueOperational != null && valueOperational.length > 0,
        getEmptyValue: () => [],

        differenceComponent: Difference,
        configComponent: () => null,
    };

    return field;
}
