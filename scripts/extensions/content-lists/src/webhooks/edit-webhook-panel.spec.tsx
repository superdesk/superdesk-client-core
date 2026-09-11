import * as React from 'react';
import {Button, Input, MultiSelect, Switch} from 'superdesk-ui-framework/react';
import {IContentList, IWebhook} from '../interfaces';
import {flushPromises, mountWithCleanup} from '../tests/helpers';
import {superdeskMock} from '../tests/superdesk-mock';
import {EditWebhookPanel} from './edit-webhook-panel';

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

function webhook(overrides: Partial<IWebhook> = {}): IWebhook {
    return {
        _id: 'webhook-1',
        _created: '2024-01-01T00:00:00+0000',
        _updated: '2024-01-01T00:00:00+0000',
        _etag: 'etag-webhook-1',
        _links: {},
        url: 'https://example.com/hook',
        ...overrides,
    };
}

const LISTS = [list('list-1', 'Alpha'), list('list-2', 'Beta')];

interface IMountOptions {
    webhook?: IWebhook | null;
    lists?: Array<IContentList>;
    onClose?: jasmine.Spy;
    onSaved?: jasmine.Spy;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mountPanel(options: IMountOptions = {}): any {
    return mountWithCleanup(
        <EditWebhookPanel
            webhook={options.webhook === undefined ? null : options.webhook}
            lists={options.lists ?? LISTS}
            onClose={options.onClose ?? jasmine.createSpy('onClose')}
            onSaved={options.onSaved ?? jasmine.createSpy('onSaved').and.returnValue(Promise.resolve())}
        />,
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findSaveButton(wrapper: any): any {
    return wrapper.find(Button).filterWhere((button: {prop: (name: string) => unknown}) =>
        button.prop('text') === 'Save');
}

describe('EditWebhookPanel', () => {
    it('starts empty when creating a new webhook', () => {
        const wrapper = mountPanel();

        expect(wrapper.find(Input).prop('value')).toBe('');
        expect(wrapper.find(Switch).prop('value')).toBe(true);
        expect(wrapper.find(MultiSelect).prop('value')).toEqual([]);
        expect(findSaveButton(wrapper).prop('disabled')).toBe(true);
    });

    it('is initialized from an existing webhook', () => {
        const wrapper = mountPanel({
            webhook: webhook({enabled: false, excluded_lists: ['list-2']}),
        });

        expect(wrapper.find(Input).prop('value')).toBe('https://example.com/hook');
        expect(wrapper.find(Switch).prop('value')).toBe(false);
        expect(wrapper.find(MultiSelect).prop('value')).toEqual([LISTS[1]]);
    });

    it('creates a new webhook', async () => {
        const httpSpy = spyOn(superdeskMock, 'httpRequestJsonLocal')
            .and.returnValue(Promise.resolve(webhook()));
        const onClose = jasmine.createSpy('onClose');
        const onSaved = jasmine.createSpy('onSaved').and.returnValue(Promise.resolve());
        const wrapper = mountPanel({onClose, onSaved});

        wrapper.find(Input).prop('onChange')('  https://example.com/new-hook  ');
        wrapper.find(MultiSelect).prop('onChange')([LISTS[0]]);
        wrapper.update();

        findSaveButton(wrapper).find('button').simulate('click');

        await flushPromises();

        expect(httpSpy).toHaveBeenCalledWith({
            method: 'POST',
            path: '/content_list_webhooks',
            payload: {
                url: 'https://example.com/new-hook',
                enabled: true,
                excluded_lists: ['list-1'],
            },
        });
        expect(onSaved).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('updates an existing webhook using its etag', async () => {
        const httpSpy = spyOn(superdeskMock, 'httpRequestJsonLocal')
            .and.returnValue(Promise.resolve(webhook()));
        const wrapper = mountPanel({webhook: webhook()});

        wrapper.find(Switch).prop('onChange')(false);
        wrapper.update();

        findSaveButton(wrapper).find('button').simulate('click');

        await flushPromises();

        expect(httpSpy).toHaveBeenCalledWith({
            method: 'PATCH',
            path: '/content_list_webhooks/webhook-1',
            payload: {
                url: 'https://example.com/hook',
                enabled: false,
                excluded_lists: [],
            },
            headers: {'If-Match': 'etag-webhook-1'},
        });
    });

    it('notifies when saving fails and stays open', async () => {
        spyOn(superdeskMock, 'httpRequestJsonLocal').and.returnValue(Promise.reject(new Error('failed')));

        const notifyErrorSpy = spyOn(superdeskMock, 'notifyError');
        const onClose = jasmine.createSpy('onClose');
        const wrapper = mountPanel({webhook: webhook(), onClose});

        findSaveButton(wrapper).find('button').simulate('click');

        await flushPromises();
        wrapper.update();

        expect(notifyErrorSpy).toHaveBeenCalledWith('Could not save the webhook.');
        expect(onClose).not.toHaveBeenCalled();
        expect(findSaveButton(wrapper).prop('disabled')).toBe(false);
    });

    it('closes without saving from the cancel button', () => {
        const httpSpy = spyOn(superdeskMock, 'httpRequestJsonLocal');
        const onClose = jasmine.createSpy('onClose');
        const wrapper = mountPanel({onClose});

        wrapper.find(Button)
            .filterWhere((button: {prop: (name: string) => unknown}) => button.prop('text') === 'Cancel')
            .find('button')
            .simulate('click');

        expect(onClose).toHaveBeenCalled();
        expect(httpSpy).not.toHaveBeenCalled();
    });
});
