// Types
import {ISuperdesk, IExtension} from 'superdesk-api';

// Apps
import {SamsWorkspaceApp} from './apps/samsWorkspace';
import {superdeskApi} from './apis';
import {onSetCreated, onSetUpdated, onSetDeleted} from '../src/notifications/sets'

const extension: IExtension = {
    id: 'sams',
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;

        Object.assign(superdeskApi, superdesk);

        // Then using the following to test (inside the extension.activate function):
        superdesk.addWebsocketMessageListener('sams:set:created', onSetCreated);
        superdesk.addWebsocketMessageListener('sams:set:updated', onSetUpdated);
        superdesk.addWebsocketMessageListener('sams:set:deleted', onSetDeleted);
        return Promise.resolve({
            contributions: {
                pages: [{
                    title: gettext('SAMS'),
                    url: '/workspace/sams',
                    component: SamsWorkspaceApp,
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
