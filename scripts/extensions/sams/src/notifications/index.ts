// Types
import {superdeskApi} from '../apis';
import {ISAMSWebsocketEvent} from '../interfaces';

import {onSetCreated, onSetUpdated, onSetDeleted} from './sets';
import {
    onAssetCreated,
    onAssetUpdated,
    onAssetDeleted,
    onAssetLocked,
    onAssetUnlocked,
    onSessionUnlocked,
} from './assets';

const websocketNotificationMap: {[key: string]: (event: ISAMSWebsocketEvent) => void} = {
    'sams:set:created': onSetCreated,
    'sams:set:updated': onSetUpdated,
    'sams:set:deleted': onSetDeleted,
    'sams:asset:created': onAssetCreated,
    'sams:asset:updated': onAssetUpdated,
    'sams:asset:deleted': onAssetDeleted,
    'sams:asset:lock_asset': onAssetLocked,
    'sams:asset:unlock_asset': onAssetUnlocked,
    'sams:asset:session_unlock': onSessionUnlocked,
};

let websocketDeregistrationArray: Array<() => void> = [];

export function registerWebsocketNotifications() {
    // To make sure that callbacks don't get registered multiple times.
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
