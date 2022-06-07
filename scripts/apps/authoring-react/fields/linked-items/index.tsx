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
import {sdApi} from 'api';
import {openArticle} from 'core/get-superdesk-api-implementation';

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

        contributions: {
            authoring: {
                onCloseAfter: (item) => {
                    const itemId = item._id;
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
