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

export function getUrlsField()
: ICustomFieldType<IUrlsFieldValueOperational, IUrlsFieldValueStorage, IUrlsFieldConfig, IUrlsFieldUserPreferences> {
    const field: ReturnType<typeof getUrlsField> = {
        id: 'urls',
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
