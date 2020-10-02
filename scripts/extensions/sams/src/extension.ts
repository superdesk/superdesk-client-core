// Types
import {ISuperdesk, IExtension} from 'superdesk-api';

// Apps
import {getSamsApp} from './apps/samsApp';
import {SamsWorkspace, onStoreInit} from './apps/samsWorkspace';

import {superdeskApi} from './apis';

const extension: IExtension = {
    id: 'sams',
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;

        Object.assign(superdeskApi, superdesk);

        return Promise.resolve({
            contributions: {
                pages: [{
                    title: gettext('SAMS'),
                    url: '/workspace/sams',
                    component: getSamsApp(SamsWorkspace, onStoreInit),
                    showTopMenu: true,
                    showSideMenu: true,
                    addToMainMenu: false,
                }],
                workspaceMenuItems: [{
                    label: gettext('SAMS'),
                    href: '/workspace/sams',
                    icon: 'picture',
                    shortcut: 'ctrl+alt+s',
                    order: 1000,
                    privileges: ['sams'],
                }],
            },
        });
    },
};

export default extension;
