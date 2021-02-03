// Types
import {superdeskApi} from '../apis';
import {ISAMSWebsocketEvent} from '../interfaces';

import {onSetCreated, onSetUpdated, onSetDeleted} from './sets';

const websocketNotificationMap: {[key: string]: (event: ISAMSWebsocketEvent) => void} = {
    'sams:set:created': onSetCreated,
    'sams:set:updated': onSetUpdated,
    'sams:set:deleted': onSetDeleted,
};

let websocketDeregistrationArray: Array<() => void> = [];

export function registerWebsocketNotifications() {
    if (websocketDeregistrationArray.length > 0) {
        return;
    }

    Object.keys(websocketNotificationMap).forEach((name) => {
        const deregisterListener = superdeskApi.addWebsocketMessageListener(name, websocketNotificationMap[name]);

        websocketDeregistrationArray.push(deregisterListener);
    });
}

export function deregisterWebsocketListeners() {
    websocketDeregistrationArray.forEach((deregisterListener) => {
        deregisterListener();
    });

    websocketDeregistrationArray = [];
}
