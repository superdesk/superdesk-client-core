import {ICustomFieldType, IExtension, IExtensionActivationResult} from 'superdesk-api';
import {getSubItemsField} from './authoring-fields/subitems';
import {BROADCASTING_MODULE_PATH} from './constants';
import {notifications} from './notifications';
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
                                url: BROADCASTING_MODULE_PATH,
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
                    notifications: notifications,
                },
            }
            : {};

        return Promise.resolve(result);
    },
};

export {setCustomizations} from './customization';

export default extension;
