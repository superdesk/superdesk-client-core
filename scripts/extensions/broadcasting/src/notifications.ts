import {IExtensionActivationResult} from 'superdesk-api';
import {BROADCASTING_MODULE_PATH} from './constants';
import {events} from './events';
import {IRundown, IRundownItem} from './interfaces';

import {superdesk} from './superdesk';
const {gettext} = superdesk.localization;

interface IRundownItemCommentNotification {
    message: string;

    data: {
        rundownId: IRundown['_id'];
        rundownItemId: IRundownItem['_id'];
    };
}

type IExtensionNotifications = Required<Required<IExtensionActivationResult>['contributions']>['notifications'];

export const notifications: IExtensionNotifications = {
    'rundown-item-comment': (notification: IRundownItemCommentNotification) => ({
        body: notification.message,
        actions: [
            {
                label: gettext('Open item'),
                onClick: () => {
                    const {rundownId, rundownItemId} = notification.data;

                    function openRundownItem() {
                        events.dispatchEvent('openRundownItem', {
                            rundownId: rundownId,
                            rundownItemId: rundownItemId,
                        });
                    }

                    if (superdesk.browser.location.getPage() === BROADCASTING_MODULE_PATH) {
                        openRundownItem();
                    } else {
                        events.addListener('broadcastingPageDidLoad', () => openRundownItem(), {once: true});

                        superdesk.browser.location.setPage(BROADCASTING_MODULE_PATH);
                    }
                },
            },
        ],
    }),
};
