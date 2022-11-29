import {
    ICustomFieldType,
    IPackageItemsUserPreferences,
    IPackageItemsValueOperational,
    IPackageItemsValueStorage,
    IPackageItemsConfig,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Preview} from './preview';
import {Difference} from './difference';

type IPackageItemsField = ICustomFieldType<
    IPackageItemsValueOperational,
    IPackageItemsValueStorage,
    IPackageItemsConfig,
    IPackageItemsUserPreferences
>;

export const PACKAGE_ITEMS_FIELD_ID = 'package_items';

export function getArticlesInPackageField(): IPackageItemsField {
    const field: IPackageItemsField = {
        id: PACKAGE_ITEMS_FIELD_ID,
        label: gettext('Package items (authoring-react)'),

        editorComponent: Editor,
        previewComponent: Preview,
        differenceComponent: Difference,

        hasValue: (valueOperational) => valueOperational != null && valueOperational.length > 0,
        getEmptyValue: () => [],

        configComponent: () => null,
    };

    return field;
}
