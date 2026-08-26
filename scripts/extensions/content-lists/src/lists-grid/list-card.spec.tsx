import * as React from 'react';
import {Dropdown, EmptyState, Label} from 'superdesk-ui-framework/react';
import {IContentList, IContentListItem} from '../interfaces';
import {flushPromises, mountWithCleanup} from '../tests/helpers';
import {dispatchWebsocketEvent, superdeskMock} from '../tests/superdesk-mock';
import {ListCard} from './list-card';

function list(overrides: Partial<IContentList> = {}): IContentList {
    return {
        _id: 'list-1',
        _created: '2024-01-01T00:00:00+0000',
        _updated: '2024-01-01T00:00:00+0000',
        _etag: 'etag-list-1',
        _links: {},
        name: 'My list',
        type: 'manual',
        ...overrides,
    };
}

function listItem(title: string | null, position: number): IContentListItem {
    return {
        _id: `item-${position}`,
        _created: '2024-01-01T00:00:00+0000',
        _updated: '2024-01-01T00:00:00+0000',
        _etag: `etag-${position}`,
        _links: {},
        content: `content-${position}`,
        position,
        article_content: title == null ? null : {title, state: 'published'},
    };
}

function stubItems(items: Array<IContentListItem>, total?: number): jasmine.Spy {
    return spyOn(superdeskMock, 'httpRequestJsonLocal').and.returnValue(
        Promise.resolve({_items: items, _meta: {total: total ?? items.length}}),
    );
}

interface IMountOptions {
    list?: IContentList;
    onOpenList?: jasmine.Spy;
    onOpenSettings?: jasmine.Spy;
    refreshLists?: jasmine.Spy;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mountCard(options: IMountOptions = {}): any {
    return mountWithCleanup(
        <ListCard
            list={options.list ?? list()}
            onOpenList={options.onOpenList ?? jasmine.createSpy('onOpenList')}
            onOpenSettings={options.onOpenSettings ?? jasmine.createSpy('onOpenSettings')}
            refreshLists={options.refreshLists ?? jasmine.createSpy('refreshLists').and.returnValue(Promise.resolve())}
        />,
    );
}

describe('ListCard', () => {
    it('shows the list name and a preview of its items', async () => {
        const httpSpy = stubItems([listItem('First article', 0), listItem('Second article', 1)]);

        const wrapper = mountCard();

        await flushPromises();
        wrapper.update();

        expect(httpSpy).toHaveBeenCalledWith({
            method: 'GET',
            path: '/content_lists/list-1/items',
            urlParams: {max_results: 5, page: 1},
        });
        expect(wrapper.find('[data-test-id="content-list-card--name"]').hostNodes().text()).toBe('My list');
        expect(wrapper.text()).toContain('First article');
        expect(wrapper.text()).toContain('Second article');
    });

    it('shows a placeholder title for unresolvable articles', async () => {
        stubItems([listItem(null, 0)]);

        const wrapper = mountCard();

        await flushPromises();
        wrapper.update();

        expect(wrapper.text()).toContain('Article no longer available');
    });

    it('shows an empty state when the list has no items', async () => {
        stubItems([]);

        const wrapper = mountCard();

        await flushPromises();
        wrapper.update();

        expect(wrapper.find(EmptyState).prop('title')).toBe('No articles in this list');
    });

    it('shows how many items exceed the preview', async () => {
        stubItems(
            [0, 1, 2, 3, 4].map((index) => listItem(`Article ${index}`, index)),
            8,
        );

        const wrapper = mountCard();

        await flushPromises();
        wrapper.update();

        expect(wrapper.text()).toContain('+3 more');
    });

    it('shows when the items were last updated', async () => {
        stubItems([]);

        const withDate = mountCard({
            list: list({content_list_items_updated_at: '2024-05-01T00:00:00+0000'}),
        });
        const withoutDate = mountCard();

        await flushPromises();
        withDate.update();
        withoutDate.update();

        // the date is formatted via superdesk.localization.getRelativeOrAbsoluteDateTime,
        // which the test mock renders as `${date}|${format}`
        expect(withDate.text()).toContain('2024-05-01T00:00:00+0000|HH:mm, DD.MM.YYYY');
        expect(withoutDate.text()).toContain('never');
    });

    it('marks the list as active or disabled', async () => {
        stubItems([]);

        const active = mountCard();
        const disabled = mountCard({list: list({enabled: false})});

        await flushPromises();
        active.update();
        disabled.update();

        expect(active.find(Label).prop('text')).toBe('active');
        expect(disabled.find(Label).prop('text')).toBe('disabled');
    });

    it('opens the list from the edit button', async () => {
        stubItems([]);

        const onOpenList = jasmine.createSpy('onOpenList');
        const wrapper = mountCard({onOpenList});

        await flushPromises();
        wrapper.update();

        wrapper.find('[data-test-id="content-list-card--edit"]').hostNodes().find('button').simulate('click');

        expect(onOpenList).toHaveBeenCalledWith('list-1');
    });

    it('opens the settings from the dropdown', async () => {
        stubItems([]);

        const onOpenSettings = jasmine.createSpy('onOpenSettings');
        const wrapper = mountCard({onOpenSettings});

        await flushPromises();
        wrapper.update();

        const dropdownItems = wrapper.find(Dropdown).prop('items') as Array<{label: string; onSelect: () => void}>;

        expect(dropdownItems.map(({label}) => label)).toEqual(['Settings', 'Remove']);

        dropdownItems[0].onSelect();

        expect(onOpenSettings).toHaveBeenCalled();
    });

    it('deletes the list after confirmation', async () => {
        stubItems([]);

        const confirmSpy = spyOn(superdeskMock, 'confirm').and.returnValue(Promise.resolve(true));
        const deleteSpy = spyOn(superdeskMock, 'httpRequestVoidLocal').and.returnValue(Promise.resolve());
        const refreshLists = jasmine.createSpy('refreshLists').and.returnValue(Promise.resolve());
        const wrapper = mountCard({refreshLists});

        await flushPromises();
        wrapper.update();

        const dropdownItems = wrapper.find(Dropdown).prop('items') as Array<{label: string; onSelect: () => void}>;

        dropdownItems[1].onSelect();

        await flushPromises();

        expect(confirmSpy).toHaveBeenCalledWith('Please confirm you want to delete the list.');
        expect(deleteSpy).toHaveBeenCalledWith({
            method: 'DELETE',
            path: '/content_lists/list-1',
            headers: {'If-Match': 'etag-list-1'},
        });
        expect(refreshLists).toHaveBeenCalled();
    });

    it('does not delete the list when the confirmation is declined', async () => {
        stubItems([]);

        spyOn(superdeskMock, 'confirm').and.returnValue(Promise.resolve(false));

        const deleteSpy = spyOn(superdeskMock, 'httpRequestVoidLocal');
        const wrapper = mountCard();

        await flushPromises();
        wrapper.update();

        const dropdownItems = wrapper.find(Dropdown).prop('items') as Array<{label: string; onSelect: () => void}>;

        dropdownItems[1].onSelect();

        await flushPromises();

        expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('notifies when deleting fails', async () => {
        stubItems([]);

        spyOn(superdeskMock, 'confirm').and.returnValue(Promise.resolve(true));
        spyOn(superdeskMock, 'httpRequestVoidLocal').and.returnValue(Promise.reject(new Error('failed')));

        const notifyErrorSpy = spyOn(superdeskMock, 'notifyError');
        const wrapper = mountCard();

        await flushPromises();
        wrapper.update();

        const dropdownItems = wrapper.find(Dropdown).prop('items') as Array<{label: string; onSelect: () => void}>;

        dropdownItems[1].onSelect();

        await flushPromises();

        expect(notifyErrorSpy).toHaveBeenCalledWith('Could not delete the list.');
    });

    it('reloads the preview when the list items change', async () => {
        const httpSpy = stubItems([]);

        const wrapper = mountCard();

        await flushPromises();

        httpSpy.calls.reset();
        wrapper.setProps({list: list({content_list_items_updated_at: '2024-06-01T00:00:00+0000'})});

        expect(httpSpy).toHaveBeenCalled();
    });

    it('shows an error instead of the empty state when the preview fails to load', async () => {
        const httpSpy = spyOn(superdeskMock, 'httpRequestJsonLocal').and.returnValue(
            Promise.reject(new Error('server error')),
        );

        const wrapper = mountCard();

        await flushPromises();
        wrapper.update();

        expect(wrapper.find('[data-test-id="content-list-card--preview-error"]').length).toBeGreaterThan(0);
        expect(wrapper.find(EmptyState).prop('title')).toBe('Could not load the preview');

        // retrying loads the preview again
        httpSpy.and.returnValue(Promise.resolve({_items: [listItem('one', 1)], _meta: {total: 1}}));

        (wrapper.find('Button[text="Retry"]').prop('onClick') as () => void)();

        await flushPromises();
        wrapper.update();

        expect(wrapper.find('[data-test-id="content-list-card--preview-error"]').length).toBe(0);
        expect(wrapper.text()).toContain('one');
    });

    it('reloads the preview only for article changes it displays', async () => {
        const httpSpy = stubItems([listItem('one', 1)]);

        mountCard();

        await flushPromises();

        jasmine.clock().install();
        jasmine.clock().mockDate();

        try {
            httpSpy.calls.reset();

            dispatchWebsocketEvent('content:update', {items: {'content-2': 1}});
            jasmine.clock().tick(1000);

            expect(httpSpy).not.toHaveBeenCalled();

            dispatchWebsocketEvent('content:update', {items: {'content-1': 1, 'content-2': 1}});
            jasmine.clock().tick(1000);

            expect(httpSpy).toHaveBeenCalledTimes(1);
        } finally {
            jasmine.clock().uninstall();
        }
    });
});
