import {
    ICustomFieldType,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {
    ILinkedItemsUserPreferences,
    ILinkedItemsValueOperational,
    ILinkedItemsValueStorage,
    ILinkedItemsConfig,
} from './interfaces';
import {Preview} from './preview';
import {Difference} from './difference';

type ILinkedItemsField = ICustomFieldType<
    ILinkedItemsValueOperational,
    ILinkedItemsValueStorage,
    ILinkedItemsConfig,
    ILinkedItemsUserPreferences
>;

export function getLinkedItemsField(): ILinkedItemsField {
    const field: ILinkedItemsField = {
        id: 'linked-items',
        label: gettext('Linked items (authoring-react)'),
        editorComponent: Editor,
        previewComponent: Preview,

        hasValue: (valueOperational) => valueOperational != null && valueOperational.length > 0,
        getEmptyValue: () => [],

        differenceComponent: Difference,
        configComponent: () => null,
    };

    return field;
}
