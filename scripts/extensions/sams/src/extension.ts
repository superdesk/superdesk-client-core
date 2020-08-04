import {IExtension, IExtensionActivationResult, ISuperdesk} from 'superdesk-api';
import {getSamsAPIs} from './api';
import {getSamsWorkspaceComponent} from './components/samsWorkspace';

const extension: IExtension = {
    id: 'sams',
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;
        const api = getSamsAPIs(superdesk);

        const result: IExtensionActivationResult = {
            contributions: {
                pages: [{
                    title: gettext('SAMS'),
                    url: '/workspace/sams',
                    component: getSamsWorkspaceComponent(superdesk, api),
                    topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
                    sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
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
