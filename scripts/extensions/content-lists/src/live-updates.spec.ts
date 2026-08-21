import {
    addArticleChangesListener,
    addContentListsChangeListener,
    addListItemsChangeListener,
} from './live-updates';
import {dispatchWebsocketEvent, getWebsocketListenersCount} from './tests/superdesk-mock';

describe('addContentListsChangeListener', () => {
    it('fires the handler for every content list event', () => {
        const handler = jasmine.createSpy('handler');

        addContentListsChangeListener(handler);

        dispatchWebsocketEvent('content_list:created');
        dispatchWebsocketEvent('content_list:updated');
        dispatchWebsocketEvent('content_list:deleted');
        dispatchWebsocketEvent('content_list:items_updated');

        expect(handler).toHaveBeenCalledTimes(4);
    });

    it('does not fire for unrelated events', () => {
        const handler = jasmine.createSpy('handler');

        addContentListsChangeListener(handler);

        dispatchWebsocketEvent('content:update');

        expect(handler).not.toHaveBeenCalled();
    });

    it('removes all listeners when the returned function is called', () => {
        const handler = jasmine.createSpy('handler');
        const removeListener = addContentListsChangeListener(handler);

        removeListener();

        expect(getWebsocketListenersCount('content_list:created')).toBe(0);
        expect(getWebsocketListenersCount('content_list:updated')).toBe(0);
        expect(getWebsocketListenersCount('content_list:deleted')).toBe(0);
        expect(getWebsocketListenersCount('content_list:items_updated')).toBe(0);

        dispatchWebsocketEvent('content_list:created');

        expect(handler).not.toHaveBeenCalled();
    });
});

describe('addListItemsChangeListener', () => {
    it('fires only for events addressed to the given list', () => {
        const handler = jasmine.createSpy('handler');

        addListItemsChangeListener('list-1', handler);

        dispatchWebsocketEvent('content_list:items_updated', {list_id: 'list-2'});
        expect(handler).not.toHaveBeenCalled();

        dispatchWebsocketEvent('content_list:items_updated', {list_id: 'list-1'});
        expect(handler).toHaveBeenCalledTimes(1);

        dispatchWebsocketEvent('content_list:items_updated');
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('stops firing after the listener is removed', () => {
        const handler = jasmine.createSpy('handler');
        const removeListener = addListItemsChangeListener('list-1', handler);

        removeListener();

        dispatchWebsocketEvent('content_list:items_updated', {list_id: 'list-1'});

        expect(handler).not.toHaveBeenCalled();
    });
});

describe('addArticleChangesListener', () => {
    it('fires on the public content update event', () => {
        const handler = jasmine.createSpy('handler');

        addArticleChangesListener(handler);

        dispatchWebsocketEvent('content:update');

        expect(handler).toHaveBeenCalledTimes(1);
    });
});
