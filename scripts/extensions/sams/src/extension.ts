// Types
import {ISuperdesk, IExtension, IAttachmentsWidgetProps} from 'superdesk-api';

// Apps
import {getSamsApp} from './apps/samsApp';
import {getSamsWorkspaceComponent, onWorkspaceInit} from './apps/samsWorkspace';
import {getSamsAttachmentsWidget, onAttachmentsWidgetInit} from './apps/samsAttachmentsWidget';

const extension: IExtension = {
    id: 'sams',
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;

        return Promise.resolve({
            contributions: {
                pages: [{
                    title: gettext('SAMS'),
                    url: '/workspace/sams',
                    component: getSamsApp(
                        superdesk,
                        getSamsWorkspaceComponent,
                        onWorkspaceInit,
                    ),
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
                configurableUiComponents: {
                    AuthoringAttachmentsWidget: getSamsApp<IAttachmentsWidgetProps>(
                        superdesk,
                        getSamsAttachmentsWidget,
                        onAttachmentsWidgetInit,
                    ),
                },
            },
        });
    },
};

export default extension;
