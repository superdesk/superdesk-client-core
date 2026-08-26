import * as React from 'react';
import {BoxedListItem, Dropdown, Label} from 'superdesk-ui-framework/react';
import {IWebhook} from '../interfaces';
import {mountWithCleanup} from '../tests/helpers';
import {WebhookItem} from './webhook-item';

function webhook(overrides: Partial<IWebhook> = {}): IWebhook {
    return {
        _id: 'webhook-1',
        _created: '2024-01-01T00:00:00+0000',
        _updated: '2024-01-02T00:00:00+0000',
        _etag: 'etag-webhook-1',
        _links: {},
        url: 'https://example.com/hook',
        ...overrides,
    };
}

interface IMountOptions {
    webhook?: IWebhook;
    selected?: boolean;
    onEdit?: (() => void) | null;
    onDelete?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mountItem(options: IMountOptions = {}): any {
    return mountWithCleanup(
        <WebhookItem
            webhook={options.webhook ?? webhook()}
            selected={options.selected ?? false}
            onEdit={options.onEdit === undefined ? null : options.onEdit}
            onDelete={options.onDelete ?? (() => undefined)}
        />,
    );
}

describe('WebhookItem', () => {
    it('shows the webhook url and the last update time', () => {
        const wrapper = mountItem();

        expect(wrapper.text()).toContain('https://example.com/hook');

        // formatted via the getRelativeOrAbsoluteDateTime test mock
        expect(wrapper.text()).toContain('updated 2024-01-02T00:00:00+0000|HH:mm, DD.MM.YYYY');
    });

    it('marks disabled webhooks', () => {
        const enabled = mountItem();
        const disabled = mountItem({webhook: webhook({enabled: false})});

        expect(enabled.find(Label).length).toBe(0);
        expect(disabled.find(Label).prop('text')).toBe('Disabled');
        expect(enabled.find(BoxedListItem).prop('type')).toBe('success');
        expect(disabled.find(BoxedListItem).prop('type')).toBe('warning');
    });

    it('fires onEdit when clicked', () => {
        const onEdit = jasmine.createSpy('onEdit');
        const wrapper = mountItem({onEdit});

        expect(wrapper.find(BoxedListItem).prop('clickable')).toBe(true);

        (wrapper.find(BoxedListItem).prop('onClick') as () => void)();

        expect(onEdit).toHaveBeenCalled();
    });

    it('is not clickable while the editor is open', () => {
        const wrapper = mountItem({onEdit: null});

        expect(wrapper.find(BoxedListItem).prop('clickable')).toBe(false);

        // clicking must not throw
        (wrapper.find(BoxedListItem).prop('onClick') as () => void)();
    });

    it('offers edit and remove actions in the dropdown', () => {
        const onEdit = jasmine.createSpy('onEdit');
        const onDelete = jasmine.createSpy('onDelete');
        const wrapper = mountItem({onEdit, onDelete});

        const items = wrapper.find(Dropdown).prop('items') as Array<{label: string; onSelect: () => void}>;

        expect(items.map(({label}) => label)).toEqual(['Edit', 'Remove']);

        items[0].onSelect();
        expect(onEdit).toHaveBeenCalled();

        items[1].onSelect();
        expect(onDelete).toHaveBeenCalled();
    });

    it('offers only remove while the editor is open', () => {
        const wrapper = mountItem({onEdit: null});

        const items = wrapper.find(Dropdown).prop('items') as Array<{label: string}>;

        expect(items.map(({label}) => label)).toEqual(['Remove']);
    });
});
