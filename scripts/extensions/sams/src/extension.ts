// Types
import {ISuperdesk, IExtension, IExtensionActivationResult} from 'superdesk-api';

// Apps
import {SamsWorkspaceApp} from './apps/samsWorkspace';
import {superdeskApi} from './apis';

const extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;

        Object.assign(superdeskApi, superdesk);

        const result: IExtensionActivationResult = {
            contributions: {
                pages: [{
                    title: gettext('SAMS'),
                    url: '/workspace/sams',
                    component: SamsWorkspaceApp,
                    showTopMenu: true,
                    showSideMenu: true,
                    addToMainMenu: false,
                    addToSideMenu: superdesk.privileges.hasPrivilege('sams') ? {
                        icon: 'picture',
                        keyBinding: 'ctrl+alt+s',
                        order: 1000,
                    } : undefined,
                }],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
