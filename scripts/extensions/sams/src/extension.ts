// Types
import {ISuperdesk} from 'superdesk-api';
import {ISamsExtension} from './interfaces';

// Apps
import {getSamsApp} from './apps/samsApp';
import {getSamsWorkspaceComponent} from './apps/samsWorkspace';

const extension: ISamsExtension = {
    id: 'sams',
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;

        return Promise.resolve({
            contributions: {
                pages: [{
                    title: gettext('SAMS'),
                    url: '/workspace/sams',
                    component: getSamsApp(superdesk, getSamsWorkspaceComponent),
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
    exposes: {
        store: undefined,
    },
};

export default extension;
