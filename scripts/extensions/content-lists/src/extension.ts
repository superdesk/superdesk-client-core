import {IExtension, IExtensionActivationResult} from 'superdesk-api';
import {CONTENT_LISTS_PAGE_URL, CONTENT_LISTS_PRIVILEGE} from './constants';
import {ContentListsPage} from './page';

import {superdesk} from './superdesk';

const {gettext} = superdesk.localization;
const {privileges} = superdesk;

const extension: IExtension = {
    activate: () => {
        const result: IExtensionActivationResult = privileges.hasPrivilege(CONTENT_LISTS_PRIVILEGE)
            ? {
                contributions: {
                    pages: [
                        {
                            title: gettext('Content lists'),
                            url: CONTENT_LISTS_PAGE_URL,
                            component: ContentListsPage,

                            showTopMenu: false,
                            showSideMenu: true,
                            addToMainMenu: false,

                            addToSideMenu: {
                                icon: 'add-to-list',
                                order: 1010,
                            },
                        },
                    ],
                },
            }
            : {};

        return Promise.resolve(result);
    },
};

export default extension;
