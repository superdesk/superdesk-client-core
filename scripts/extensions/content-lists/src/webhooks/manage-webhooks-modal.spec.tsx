import * as React from 'react';
import {CreateButton, Dropdown, EmptyState, SearchBar, SubNav} from 'superdesk-ui-framework/react';
import {IWebhook} from '../interfaces';
import {flushPromises, mountWithCleanup} from '../tests/helpers';
import {superdeskMock} from '../tests/superdesk-mock';
import {EditWebhookPanel} from './edit-webhook-panel';
import {ManageWebhooksModal} from './manage-webhooks-modal';
import {WebhookItem} from './webhook-item';

function webhook(id: string, overrides: Partial<IWebhook> = {}): IWebhook {
    return {
        _id: id,
        _created: '2024-01-01T00:00:00+0000',
        _updated: '2024-01-01T00:00:00+0000',
        _etag: `etag-${id}`,
        _links: {},
        url: `https://example.com/${id}`,
        ...overrides,
    };
}

function stubWebhooks(webhooks: Array<IWebhook>): jasmine.Spy {
    return spyOn(superdeskMock, 'httpRequestJsonLocal').and.returnValue(
        Promise.resolve({_items: webhooks, _meta: {total: webhooks.length}}),
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mountModal(closeModal?: jasmine.Spy): Promise<any> {
    const wrapper = mountWithCleanup(
        <ManageWebhooksModal
            lists={[]}
            closeModal={closeModal ?? jasmine.createSpy('closeModal')}
        />,
    );

    return flushPromises().then(() => {
        wrapper.update();

        return wrapper;
    });
}

describe('ManageWebhooksModal', () => {
    it('loads and lists the webhooks', async () => {
        const httpSpy = stubWebhooks([webhook('w1'), webhook('w2')]);

        const wrapper = await mountModal();

        expect(httpSpy).toHaveBeenCalledWith({
            method: 'GET',
            path: '/content_list_webhooks',
            urlParams: {max_results: 200},
        });
        expect(wrapper.find(WebhookItem).length).toBe(2);
    });

    it('shows an empty state when there are no webhooks', async () => {
        stubWebhooks([]);

        const wrapper = await mountModal();

        expect(wrapper.find(EmptyState).prop('title')).toBe('There are no webhooks yet');
    });

    it('notifies when the webhooks cannot be loaded', async () => {
        spyOn(superdeskMock, 'httpRequestJsonLocal').and.returnValue(Promise.reject(new Error('failed')));

        const notifyErrorSpy = spyOn(superdeskMock, 'notifyError');

        await mountModal();

        expect(notifyErrorSpy).toHaveBeenCalledWith('Could not load webhooks.');
    });

    it('sorts enabled webhooks first, then by url', async () => {
        stubWebhooks([
            webhook('w1', {url: 'https://example.com/b', enabled: false}),
            webhook('w2', {url: 'https://example.com/c'}),
            webhook('w3', {url: 'https://example.com/a'}),
        ]);

        const wrapper = await mountModal();

        expect(wrapper.find(WebhookItem).map((item: {prop: (name: string) => IWebhook}) => item.prop('webhook').url))
            .toEqual([
                'https://example.com/a',
                'https://example.com/c',
                'https://example.com/b',
            ]);
    });

    it('filters by the search string', async () => {
        stubWebhooks([
            webhook('w1', {url: 'https://example.com/first'}),
            webhook('w2', {url: 'https://example.com/second'}),
        ]);

        const wrapper = await mountModal();

        (wrapper.find(SearchBar).prop('onSubmit') as (value: string) => void)('FIRST');
        wrapper.update();

        expect(wrapper.find(WebhookItem).length).toBe(1);
        expect(wrapper.find(WebhookItem).prop('webhook').url).toBe('https://example.com/first');
    });

    it('filters by the enabled state', async () => {
        stubWebhooks([
            webhook('w1', {url: 'https://example.com/on'}),
            webhook('w2', {url: 'https://example.com/off', enabled: false}),
        ]);

        const wrapper = await mountModal();

        // each WebhookItem renders its own actions dropdown; the filter
        // dropdown is the one inside the sub navigation
        const dropdownGroup = wrapper.find(SubNav).find(Dropdown).prop('items')[0] as {
            items: Array<string | {label: string; onSelect: () => void}>;
        };
        const filterItems = dropdownGroup.items.filter(
            (item): item is {label: string; onSelect: () => void} => typeof item !== 'string',
        );

        expect(filterItems.map(({label}) => label)).toEqual(['All', 'Enabled', 'Disabled']);

        filterItems[1].onSelect();
        wrapper.update();
        expect(wrapper.find(WebhookItem).prop('webhook').url).toBe('https://example.com/on');

        filterItems[2].onSelect();
        wrapper.update();
        expect(wrapper.find(WebhookItem).prop('webhook').url).toBe('https://example.com/off');
    });

    it('opens the editor to create a new webhook', async () => {
        stubWebhooks([webhook('w1')]);

        const wrapper = await mountModal();

        expect(wrapper.find(EditWebhookPanel).length).toBe(0);

        wrapper.find(CreateButton).find('button').simulate('click');
        wrapper.update();

        expect(wrapper.find(EditWebhookPanel).length).toBe(1);
        expect(wrapper.find(EditWebhookPanel).prop('webhook')).toBe(null);

        // items are not editable while the editor is open
        expect(wrapper.find(WebhookItem).prop('onEdit')).toBe(null);
    });

    it('opens the editor for an existing webhook when its item is clicked', async () => {
        stubWebhooks([webhook('w1')]);

        const wrapper = await mountModal();

        (wrapper.find(WebhookItem).prop('onEdit') as () => void)();
        wrapper.update();

        expect(wrapper.find(EditWebhookPanel).prop('webhook')?._id).toBe('w1');
        expect(wrapper.find(WebhookItem).prop('selected')).toBe(true);
    });

    it('closes the editor and reloads after saving', async () => {
        const httpSpy = stubWebhooks([webhook('w1')]);

        const wrapper = await mountModal();

        wrapper.find(CreateButton).find('button').simulate('click');
        wrapper.update();

        httpSpy.calls.reset();
        await wrapper.find(EditWebhookPanel).prop('onSaved')();

        wrapper.find(EditWebhookPanel).prop('onClose')();
        wrapper.update();

        expect(httpSpy).toHaveBeenCalled();
        expect(wrapper.find(EditWebhookPanel).length).toBe(0);
    });

    it('deletes a webhook after confirmation and reloads', async () => {
        stubWebhooks([webhook('w1')]);

        const confirmSpy = spyOn(superdeskMock, 'confirm').and.returnValue(Promise.resolve(true));
        const deleteSpy = spyOn(superdeskMock, 'httpRequestVoidLocal').and.returnValue(Promise.resolve());

        const wrapper = await mountModal();

        wrapper.find(WebhookItem).prop('onDelete')();

        await flushPromises();

        expect(confirmSpy).toHaveBeenCalledWith('Please confirm you want to delete the webhook.');
        expect(deleteSpy).toHaveBeenCalledWith({
            method: 'DELETE',
            path: '/content_list_webhooks/w1',
            headers: {'If-Match': 'etag-w1'},
        });
    });

    it('closes the editor when the webhook being edited is deleted', async () => {
        stubWebhooks([webhook('w1'), webhook('w2')]);

        spyOn(superdeskMock, 'confirm').and.returnValue(Promise.resolve(true));
        spyOn(superdeskMock, 'httpRequestVoidLocal').and.returnValue(Promise.resolve());

        const wrapper = await mountModal();

        (wrapper.find(WebhookItem).at(0).prop('onEdit') as () => void)();
        wrapper.update();

        expect(wrapper.find(EditWebhookPanel).prop('webhook')?._id).toBe('w1');

        // deleting another webhook keeps the editor open
        wrapper.find(WebhookItem).at(1).prop('onDelete')();
        await flushPromises();
        wrapper.update();

        expect(wrapper.find(EditWebhookPanel).prop('webhook')?._id).toBe('w1');

        wrapper.find(WebhookItem).at(0).prop('onDelete')();
        await flushPromises();
        wrapper.update();

        expect(wrapper.find(EditWebhookPanel).length).toBe(0);
    });

    it('does not delete a webhook when the confirmation is declined', async () => {
        stubWebhooks([webhook('w1')]);

        spyOn(superdeskMock, 'confirm').and.returnValue(Promise.resolve(false));

        const deleteSpy = spyOn(superdeskMock, 'httpRequestVoidLocal');

        const wrapper = await mountModal();

        wrapper.find(WebhookItem).prop('onDelete')();

        await flushPromises();

        expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('notifies when deleting fails', async () => {
        stubWebhooks([webhook('w1')]);

        spyOn(superdeskMock, 'confirm').and.returnValue(Promise.resolve(true));
        spyOn(superdeskMock, 'httpRequestVoidLocal').and.returnValue(Promise.reject(new Error('failed')));

        const notifyErrorSpy = spyOn(superdeskMock, 'notifyError');
        const wrapper = await mountModal();

        wrapper.find(WebhookItem).prop('onDelete')();

        await flushPromises();

        expect(notifyErrorSpy).toHaveBeenCalledWith('Could not delete the webhook.');
    });

    it('closes from the footer button', async () => {
        stubWebhooks([]);

        const closeModal = jasmine.createSpy('closeModal');
        const wrapper = await mountModal(closeModal);

        (wrapper.find('Button').filterWhere(
            (button: {prop: (name: string) => unknown}) => button.prop('text') === 'Close',
        ).prop('onClick') as () => void)();

        expect(closeModal).toHaveBeenCalled();
    });
});
