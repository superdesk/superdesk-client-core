import * as React from 'react';
import {CreateButton, EmptyState, IconButton, Input, SearchBar} from 'superdesk-ui-framework/react';
import {IContentList} from '../interfaces';
import {flushPromises, mountWithCleanup} from '../tests/helpers';
import {superdeskMock} from '../tests/superdesk-mock';
import {ListCard} from './list-card';
import {ListsGrid} from './lists-grid';

function list(id: string, name: string): IContentList {
    return {
        _id: id,
        _created: '2024-01-01T00:00:00+0000',
        _updated: '2024-01-01T00:00:00+0000',
        _etag: `etag-${id}`,
        _links: {},
        name,
        type: 'manual',
    };
}

function stubHttp(): jasmine.Spy {
    return spyOn(superdeskMock, 'httpRequestJsonLocal').and.callFake((request) => {
        if (request.method === 'GET') {
            // list card previews and webhooks
            return Promise.resolve({_items: [], _meta: {total: 0}});
        }

        if (request.method === 'POST' && request.path === '/content_lists') {
            return Promise.resolve(list('new-list', 'New list'));
        }

        return Promise.reject(new Error(`unexpected request: ${request.method} ${request.path}`));
    });
}

interface IMountOptions {
    lists?: Array<IContentList>;
    onOpenList?: jasmine.Spy;
    refreshLists?: jasmine.Spy;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mountGrid(options: IMountOptions = {}): any {
    return mountWithCleanup(
        <ListsGrid
            lists={options.lists ?? [list('list-1', 'Alpha'), list('list-2', 'Beta')]}
            onOpenList={options.onOpenList ?? jasmine.createSpy('onOpenList')}
            refreshLists={options.refreshLists ?? jasmine.createSpy('refreshLists').and.returnValue(Promise.resolve())}
        />,
    );
}

describe('ListsGrid', () => {
    it('renders a card per list', async () => {
        stubHttp();

        const wrapper = mountGrid();

        await flushPromises();
        wrapper.update();

        expect(wrapper.find(ListCard).length).toBe(2);

        // no grid-level empty state (the cards may render their own for items)
        expect(wrapper.find(EmptyState).filter('[title="No content lists yet"]').length).toBe(0);
    });

    it('shows an empty state when there are no lists', () => {
        stubHttp();

        const wrapper = mountGrid({lists: []});

        expect(wrapper.find(EmptyState).prop('title')).toBe('No content lists yet');
    });

    it('filters the lists by the search string', async () => {
        stubHttp();

        const wrapper = mountGrid();

        await flushPromises();

        (wrapper.find(SearchBar).prop('onSubmit') as (value: string) => void)('beta');
        wrapper.update();

        expect(wrapper.find(ListCard).length).toBe(1);
        expect(wrapper.find(ListCard).prop('list').name).toBe('Beta');
    });

    it('opens a list when its card asks for it', async () => {
        stubHttp();

        const onOpenList = jasmine.createSpy('onOpenList');
        const wrapper = mountGrid({onOpenList});

        await flushPromises();
        wrapper.update();

        wrapper.find(ListCard).at(0).prop('onOpenList')('list-1');

        expect(onOpenList).toHaveBeenCalledWith('list-1');
    });

    it('creates a new list from the new-list card', async () => {
        const httpSpy = stubHttp();
        const refreshLists = jasmine.createSpy('refreshLists').and.returnValue(Promise.resolve());
        const wrapper = mountGrid({refreshLists});

        await flushPromises();
        wrapper.update();

        expect(wrapper.find('[data-test-id="content-lists--new-list"]').hostNodes().length).toBe(0);

        wrapper.find(CreateButton).find('button').simulate('click');
        wrapper.update();

        expect(wrapper.find('[data-test-id="content-lists--new-list"]').hostNodes().length).toBe(1);

        wrapper.find(Input).prop('onChange')('  My new list  ');
        wrapper.update();

        wrapper.find(IconButton).filter('[icon="ok"]').find('button').simulate('click');

        await flushPromises();
        wrapper.update();

        expect(httpSpy).toHaveBeenCalledWith({
            method: 'POST',
            path: '/content_lists',
            payload: {name: 'My new list', type: 'manual'},
        });
        expect(refreshLists).toHaveBeenCalled();
        expect(wrapper.find('[data-test-id="content-lists--new-list"]').hostNodes().length).toBe(0);
    });

    it('does not create a list with an empty name', async () => {
        const httpSpy = stubHttp();
        const wrapper = mountGrid();

        await flushPromises();
        wrapper.update();

        wrapper.find(CreateButton).find('button').simulate('click');
        wrapper.update();

        httpSpy.calls.reset();
        wrapper.find(IconButton).filter('[icon="ok"]').find('button').simulate('click');

        expect(httpSpy).not.toHaveBeenCalled();
    });

    it('cancels the new-list card', async () => {
        stubHttp();

        const wrapper = mountGrid();

        await flushPromises();
        wrapper.update();

        wrapper.find(CreateButton).find('button').simulate('click');
        wrapper.update();
        wrapper.find(IconButton).filter('[icon="close-small"]').find('button').simulate('click');
        wrapper.update();

        expect(wrapper.find('[data-test-id="content-lists--new-list"]').hostNodes().length).toBe(0);
    });

    it('notifies when creating the list fails', async () => {
        spyOn(superdeskMock, 'httpRequestJsonLocal').and.callFake((request) => {
            return request.method === 'GET'
                ? Promise.resolve({_items: [], _meta: {total: 0}})
                : Promise.reject(new Error('failed'));
        });

        const notifyErrorSpy = spyOn(superdeskMock, 'notifyError');
        const wrapper = mountGrid();

        await flushPromises();
        wrapper.update();

        wrapper.find(CreateButton).find('button').simulate('click');
        wrapper.update();
        wrapper.find(Input).prop('onChange')('My new list');
        wrapper.update();
        wrapper.find(IconButton).filter('[icon="ok"]').find('button').simulate('click');

        await flushPromises();
        wrapper.update();

        expect(notifyErrorSpy).toHaveBeenCalledWith('Could not create the list.');

        // the card stays open so the user can retry
        expect(wrapper.find('[data-test-id="content-lists--new-list"]').hostNodes().length).toBe(1);
    });

    it('opens the settings modal for a list', async () => {
        stubHttp();

        const wrapper = mountGrid();

        await flushPromises();
        wrapper.update();

        wrapper.find(ListCard).at(0).prop('onOpenSettings')();

        await flushPromises();

        expect(document.querySelector('[data-test-id="content-list-settings"]')).not.toBe(null);
    });

    it('opens the webhooks modal from the settings menu', async () => {
        stubHttp();

        const wrapper = mountGrid();

        await flushPromises();
        wrapper.update();

        const grid = wrapper.find(ListsGrid).instance() as ListsGrid;

        grid.openWebhooksModal();

        await flushPromises();

        expect(document.querySelector('[data-test-id="manage-webhooks"]')).not.toBe(null);
    });
});
