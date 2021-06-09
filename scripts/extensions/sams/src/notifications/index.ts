// Types
import {IPublicWebsocketMessages} from 'superdesk-api';
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
import {onActiveDeskChanged, onDeskUpdated} from './desks';

type ISamsWebsocketCallback = (event: ISAMSWebsocketEvent) => void;
type IPublicWebsocketCallback = (event: CustomEvent<IPublicWebsocketMessages['resource:updated']>) => void;
type IWebsocketCallback = ISamsWebsocketCallback | IPublicWebsocketCallback;

const websocketNotificationMap: {[key: string]: IWebsocketCallback} = {
    'sams:set:created': onSetCreated,
    'sams:set:updated': onSetUpdated,
    'sams:set:deleted': onSetDeleted,
    'sams:asset:created': onAssetCreated,
    'sams:asset:updated': onAssetUpdated,
    'sams:asset:deleted': onAssetDeleted,
    'sams:asset:lock_asset': onAssetLocked,
    'sams:asset:unlock_asset': onAssetUnlocked,
    'sams:asset:session_unlock': onSessionUnlocked,
    'resource:updated': onResourceUpdated,
};

let websocketDeregistrationArray: Array<() => void> = [];

function onResourceUpdated(event: CustomEvent<IPublicWebsocketMessages['resource:updated']>) {
    if (event.detail.extra.resource === 'desks') {
        onDeskUpdated(event);
    }
}

export function registerWebsocketNotifications() {
    // To make sure that callbacks don't get registered multiple times.
    if (websocketDeregistrationArray.length > 0) {
        return;
    }

    Object.keys(websocketNotificationMap).forEach((name) => {
        const deregisterListener = superdeskApi.addWebsocketMessageListener(name, websocketNotificationMap[name]);

        websocketDeregistrationArray.push(deregisterListener);
    });

    superdeskApi.addEventListener('activeDeskChanged', onActiveDeskChanged);
}

export function deregisterWebsocketListeners() {
    websocketDeregistrationArray.forEach((deregisterListener) => {
        deregisterListener();
    });

    websocketDeregistrationArray = [];

    superdeskApi.removeEventListener('activeDeskChanged', onActiveDeskChanged);
}
