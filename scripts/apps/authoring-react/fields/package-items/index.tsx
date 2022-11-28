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
import {sdApi} from 'api';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {Difference} from './difference';

type IPackageItemsField = ICustomFieldType<
    IPackageItemsValueOperational,
    IPackageItemsValueStorage,
    IPackageItemsConfig,
    IPackageItemsUserPreferences
>;

export const ARTICLES_IN_PACKAGE_FIELD_TYPE = 'articles-in-package';

export function getArticlesInPackageField(): IPackageItemsField {
    const field: IPackageItemsField = {
        id: ARTICLES_IN_PACKAGE_FIELD_TYPE,
        label: gettext('Articles in package (authoring-react)'),

        editorComponent: Editor,
        previewComponent: Preview,
        differenceComponent: Difference,

        hasValue: (valueOperational) => valueOperational != null && valueOperational.length > 0,
        getEmptyValue: () => [],

        configComponent: () => null,

        contributions: {
            authoring: {
                onCloseAfter: (item) => {
                    const itemId = item.guid;
                    const storedItemId = sdApi.localStorage.getItem(`open-item-after-related-closed--${itemId}`);

                    /**
                     * If related item was just created and saved, open the original item
                     * that triggered the creation of this related item.
                     */
                    if (storedItemId != null) {
                        openArticle(storedItemId, 'edit');
                    }
                },
            },
        },
    };

    return field;
}
