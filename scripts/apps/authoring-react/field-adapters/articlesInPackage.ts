import {IArticle, IAuthoringFieldV2, IFieldAdapter, IEditor3Config, IPackageItemsValueOperational} from 'superdesk-api';
import {gettext} from 'core/utils';
import {ARTICLES_IN_PACKAGE_FIELD_TYPE} from '../fields/package-items';

export const articles_in_package: IFieldAdapter<IArticle> = {
    getFieldV2: () => {
        const fieldV2: IAuthoringFieldV2 = {
            id: 'groups',
            name: gettext('Related articles'),
            fieldType: ARTICLES_IN_PACKAGE_FIELD_TYPE,
            fieldConfig: {},
        };

        return fieldV2;
    },
    retrieveStoredValue: (item: IArticle): IPackageItemsValueOperational => {
        return item.groups[1].refs;
    },
    storeValue: (value: IPackageItemsValueOperational, article: IArticle, config: IEditor3Config) => {
        return {
            ...article,
            groups: [
                {
                    'role': 'grpRole:NEP',
                    'refs': [
                        {
                            'idRef': 'main',
                            'label': 'main',
                        },
                    ],
                    'id': 'root',
                },
                {
                    refs: value,
                    id: 'main',
                    'role': 'grpRole:main',
                },
            ],
        };
    },
};
