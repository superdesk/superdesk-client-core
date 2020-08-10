// Types
import {IExtension, IExtensionActivationResult, ISuperdesk} from 'superdesk-api';

// Apps
import {getSamsApp} from './apps/samsApp';
import {getSamsWorkspaceComponent} from './apps/samsWorkspace';

const extension: IExtension = {
    id: 'sams',
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;

        const result: IExtensionActivationResult = {
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
                    if: 'workspaceConfig.sams && privileges.sams',
                    order: 1000,
                }],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
