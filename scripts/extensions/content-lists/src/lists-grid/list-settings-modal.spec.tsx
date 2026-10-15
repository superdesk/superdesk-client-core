import * as React from 'react';
import {Button, Input, Switch} from 'superdesk-ui-framework/react';
import {IContentList} from '../interfaces';
import {flushPromises, mountWithCleanup} from '../tests/helpers';
import {superdeskMock} from '../tests/superdesk-mock';
import {ListSettingsModal} from './list-settings-modal';

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

interface IMountOptions {
    list?: IContentList;
    closeModal?: jasmine.Spy;
    onSaved?: jasmine.Spy;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mountModal(options: IMountOptions = {}): any {
    return mountWithCleanup(
        <ListSettingsModal
            list={options.list ?? list()}
            closeModal={options.closeModal ?? jasmine.createSpy('closeModal')}
            onSaved={options.onSaved ?? jasmine.createSpy('onSaved').and.returnValue(Promise.resolve())}
        />,
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findInput(wrapper: any, testId: string): any {
    return wrapper.find(Input).filter(`[data-test-id="${testId}"]`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findSaveButton(wrapper: any): any {
    return wrapper.find(Button).filterWhere((button: {prop: (name: string) => unknown}) =>
        button.prop('text') === 'Save');
}

describe('ListSettingsModal', () => {
    it('is initialized from the list', () => {
        const wrapper = mountModal({
            list: list({limit: 10, description: 'A description', enabled: false}),
        });

        expect(findInput(wrapper, 'content-list-settings--name').prop('value')).toBe('My list');
        expect(findInput(wrapper, 'content-list-settings--limit').prop('value')).toBe(10);
        expect(findInput(wrapper, 'content-list-settings--description').prop('value')).toBe('A description');
        expect(wrapper.find(Switch).prop('value')).toBe(false);
    });

    it('saves the settings using the list etag and closes', async () => {
        const httpSpy = spyOn(superdeskMock, 'httpRequestJsonLocal')
            .and.returnValue(Promise.resolve(list()));
        const closeModal = jasmine.createSpy('closeModal');
        const onSaved = jasmine.createSpy('onSaved').and.returnValue(Promise.resolve());
        const wrapper = mountModal({closeModal, onSaved});

        findInput(wrapper, 'content-list-settings--name').prop('onChange')('  Renamed  ');
        findInput(wrapper, 'content-list-settings--limit').prop('onChange')(5);
        findInput(wrapper, 'content-list-settings--description').prop('onChange')('New description');
        wrapper.update();

        findSaveButton(wrapper).find('button').simulate('click');

        await flushPromises();

        expect(httpSpy).toHaveBeenCalledWith({
            method: 'PATCH',
            path: '/content_lists/list-1',
            payload: {
                name: 'Renamed',
                limit: 5,
                description: 'New description',
                enabled: true,
            },
            headers: {'If-Match': 'etag-list-1'},
        });
        expect(onSaved).toHaveBeenCalled();
        expect(closeModal).toHaveBeenCalled();
    });

    it('saves a cleared or invalid limit as null', async () => {
        const httpSpy = spyOn(superdeskMock, 'httpRequestJsonLocal')
            .and.returnValue(Promise.resolve(list()));
        const wrapper = mountModal({list: list({limit: 10})});

        findInput(wrapper, 'content-list-settings--limit').prop('onChange')(0);
        wrapper.update();

        findSaveButton(wrapper).find('button').simulate('click');

        await flushPromises();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload = httpSpy.calls.mostRecent().args[0].payload as any;

        expect(payload.limit).toBe(null);
    });

    it('disables saving with an empty name', () => {
        const wrapper = mountModal();

        expect(findSaveButton(wrapper).prop('disabled')).toBe(false);

        findInput(wrapper, 'content-list-settings--name').prop('onChange')('   ');
        wrapper.update();

        expect(findSaveButton(wrapper).prop('disabled')).toBe(true);
    });

    it('does not send a request when saving with an empty name', () => {
        const httpSpy = spyOn(superdeskMock, 'httpRequestJsonLocal');
        const wrapper = mountModal();

        findInput(wrapper, 'content-list-settings--name').prop('onChange')('  ');
        wrapper.update();

        (wrapper.find(ListSettingsModal).instance() as ListSettingsModal).save();

        expect(httpSpy).not.toHaveBeenCalled();
    });

    it('notifies when saving fails and allows retrying', async () => {
        spyOn(superdeskMock, 'httpRequestJsonLocal').and.returnValue(Promise.reject(new Error('failed')));

        const notifyErrorSpy = spyOn(superdeskMock, 'notifyError');
        const closeModal = jasmine.createSpy('closeModal');
        const wrapper = mountModal({closeModal});

        findSaveButton(wrapper).find('button').simulate('click');

        await flushPromises();
        wrapper.update();

        expect(notifyErrorSpy).toHaveBeenCalledWith('Could not save list settings.');
        expect(closeModal).not.toHaveBeenCalled();
        expect(findSaveButton(wrapper).prop('disabled')).toBe(false);
    });

    it('closes without saving from the cancel button', () => {
        const httpSpy = spyOn(superdeskMock, 'httpRequestJsonLocal');
        const closeModal = jasmine.createSpy('closeModal');
        const wrapper = mountModal({closeModal});

        wrapper.find(Button)
            .filterWhere((button: {prop: (name: string) => unknown}) => button.prop('text') === 'Cancel')
            .find('button')
            .simulate('click');

        expect(closeModal).toHaveBeenCalled();
        expect(httpSpy).not.toHaveBeenCalled();
    });
});
