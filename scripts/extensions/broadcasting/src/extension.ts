import {IExtension, IExtensionActivationResult} from 'superdesk-api';
import {Page} from './page';

import {superdesk} from './superdesk';

const {gettext} = superdesk.localization;
const {privileges} = superdesk;

const extension: IExtension = {
    activate: () => {
        const result: IExtensionActivationResult = {
            contributions: {
                pages: privileges.hasPrivilege('rundowns')
                    ? [
                        {
                            title: gettext('Broadcasting'),
                            url: '/broadcasting',
                            component: Page,

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
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
