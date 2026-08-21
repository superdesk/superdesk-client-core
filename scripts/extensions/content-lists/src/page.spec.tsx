import * as React from 'react';
import {Loader} from 'superdesk-ui-framework/react';
import {LIST_ID_URL_PARAM} from './constants';
import {ListEditor} from './list-editor/list-editor';
import {ListsGrid} from './lists-grid/lists-grid';
import {ContentListsPage, getSelectedListId, openListUrl} from './page';
import {flushPromises, mountWithCleanup} from './tests/helpers';
import {dispatchWebsocketEvent, getUrlParam, setUrlParam, superdeskMock} from './tests/superdesk-mock';

function list(id: string) {
    return {
        _id: id,
        _created: '2024-01-01T00:00:00+0000',
        _updated: '2024-01-01T00:00:00+0000',
        _etag: `etag-${id}`,
        _links: {},
        name: id,
        type: 'manual',
    };
}

function stubHttp(): jasmine.Spy {
    return spyOn(superdeskMock, 'httpRequestJsonLocal').and.callFake((request) => {
        if (request.method === 'GET' && request.path === '/content_lists') {
            return Promise.resolve({_items: [list('list-1')], _meta: {total: 1}});
        }

        if (request.method === 'GET' && request.path === '/content_lists/list-1') {
            return Promise.resolve(list('list-1'));
        }

        if (request.method === 'GET') {
            // list items / article search fired by child components
            return Promise.resolve({_items: [], _meta: {total: 0}});
        }

        return Promise.reject(new Error(`unexpected request: ${request.method} ${request.path}`));
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pageProps: any = {setupFullWidthCapability: () => undefined};

describe('url helpers', () => {
    it('getSelectedListId reads the list url parameter', () => {
        expect(getSelectedListId()).toBe(null);

        setUrlParam(LIST_ID_URL_PARAM, 'list-1');

        expect(getSelectedListId()).toBe('list-1');
    });

    it('openListUrl writes and clears the list url parameter', () => {
        openListUrl('list-1');
        expect(getUrlParam(LIST_ID_URL_PARAM)).toBe('list-1');

        openListUrl(null);
        expect(getUrlParam(LIST_ID_URL_PARAM)).toBeUndefined();
    });
});

describe('ContentListsPage', () => {
    it('shows a loader until the lists are fetched, then the grid', async () => {
        stubHttp();

        const wrapper = mountWithCleanup(<ContentListsPage {...pageProps} />);

        expect(wrapper.find(Loader).length).toBe(1);
        expect(wrapper.find(ListsGrid).length).toBe(0);

        await flushPromises();
        wrapper.update();

        expect(wrapper.find(ListsGrid).length).toBe(1);
        expect(wrapper.find(ListsGrid).prop('lists').length).toBe(1);
    });

    it('shows the editor when a list is selected in the url', async () => {
        stubHttp();
        setUrlParam(LIST_ID_URL_PARAM, 'list-1');

        const wrapper = mountWithCleanup(<ContentListsPage {...pageProps} />);

        await flushPromises();
        wrapper.update();

        expect(wrapper.find(ListEditor).length).toBe(1);
        expect(wrapper.find(ListEditor).prop('listId')).toBe('list-1');
        expect(wrapper.find(ListsGrid).length).toBe(0);
    });

    it('opens a list when the grid asks for it', async () => {
        stubHttp();

        const wrapper = mountWithCleanup(<ContentListsPage {...pageProps} />);

        await flushPromises();
        wrapper.update();

        wrapper.find(ListsGrid).prop('onOpenList')('list-1');

        expect(getUrlParam(LIST_ID_URL_PARAM)).toBe('list-1');
    });

    it('re-renders on hash changes so url navigation takes effect', async () => {
        stubHttp();

        const wrapper = mountWithCleanup(<ContentListsPage {...pageProps} />);

        await flushPromises();
        wrapper.update();

        expect(wrapper.find(ListsGrid).length).toBe(1);

        setUrlParam(LIST_ID_URL_PARAM, 'list-1');
        window.dispatchEvent(new HashChangeEvent('hashchange'));

        await flushPromises();
        wrapper.update();

        expect(wrapper.find(ListEditor).length).toBe(1);
    });

    it('refreshes the lists on content list websocket events, debounced', async () => {
        const httpSpy = stubHttp();

        mountWithCleanup(<ContentListsPage {...pageProps} />);

        await flushPromises();

        jasmine.clock().install();
        jasmine.clock().mockDate();

        try {
            httpSpy.calls.reset();

            dispatchWebsocketEvent('content_list:created');
            dispatchWebsocketEvent('content_list:updated');

            expect(httpSpy).not.toHaveBeenCalled();

            jasmine.clock().tick(1001);

            // two events, one debounced refresh
            expect(httpSpy.calls.allArgs().filter(([request]) => request.path === '/content_lists').length)
                .toBe(1);
        } finally {
            jasmine.clock().uninstall();
        }
    });
});
