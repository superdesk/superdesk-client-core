import {IWebsocketMessage} from 'superdesk-api';
import {superdesk} from './superdesk';

/**
 * Custom websocket events pushed by the content-lists backend
 * (apps/content_lists/service.py).
 *
 * NOTE: for these to reach the extension, the backend must address them to it
 * by passing `extension="content-lists"` to its `push_notification` calls —
 * the client only forwards non-public websocket events to the extension
 * they are addressed to (scripts/core/notification/notification.ts).
 */
const CONTENT_LIST_EVENTS = [
    'content_list:created',
    'content_list:updated',
    'content_list:deleted',
    'content_list:items_updated',
];

export function addContentListsChangeListener(handler: () => void): () => void {
    const removeListenerFunctions = CONTENT_LIST_EVENTS.map(
        (eventName) => superdesk.addWebsocketMessageListener(eventName, handler),
    );

    return () => {
        removeListenerFunctions.forEach((removeListener) => removeListener());
    };
}

export function addListItemsChangeListener(listId: string, handler: () => void): () => void {
    return superdesk.addWebsocketMessageListener(
        'content_list:items_updated',
        (event: CustomEvent<IWebsocketMessage<{list_id?: string}>>) => {
            if (event.detail.extra?.list_id === listId) {
                handler();
            }
        },
    );
}

export function addArticleChangesListener(handler: () => void): () => void {
    return superdesk.addWebsocketMessageListener('content:update', handler);
}
