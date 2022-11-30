import {ICustomFieldType, IExtension, IExtensionActivationResult} from 'superdesk-api';
import {getSubItemsField} from './authoring-fields/subitems';
import {RundownsPage} from './page';

import {superdesk} from './superdesk';

const {gettext} = superdesk.localization;
const {privileges} = superdesk;

const extension: IExtension = {
    activate: () => {
        const result: IExtensionActivationResult = privileges.hasPrivilege('rundowns')
            ? {
                contributions: {
                    pages: privileges.hasPrivilege('rundowns')
                        ? [
                            {
                                title: gettext('Broadcasting'),
                                url: '/broadcasting',
                                component: RundownsPage,

                                showTopMenu: false,
                                showSideMenu: true,
                                addToMainMenu: false,

                                addToSideMenu: {
                                    icon: 'rundown',
                                    order: 1000,
                                },
                            },
                        ]
                        : [],
                    customFieldTypes: [
                        getSubItemsField() as unknown as ICustomFieldType<unknown, unknown, unknown, unknown>,
                    ],
                },
            }
            : {};

        return Promise.resolve(result);
    },
};

export default extension;
