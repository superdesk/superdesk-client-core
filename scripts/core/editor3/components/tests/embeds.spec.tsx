import React from 'react';
import {Provider} from 'react-redux';
import {mount} from 'enzyme';
import mockStore, {embedBlockAndContent} from './utils';
import {EmbedBlock} from '../embeds/EmbedBlock';
import {EmbedInputComponent as EmbedInput} from '../embeds/EmbedInput';
import {ISuperdeskGlobalConfig} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {createStore} from 'redux';

describe('editor3.components.embed-block', () => {
    it('should render entity html', () => {
        const {block, contentState} = embedBlockAndContent();
        const wrapper = mount(
            <Provider store={createStore(() => ({}), {})}>
                <EmbedBlock
                    block={block}
                    contentState={contentState}
                />
            </Provider>,
        );

        expect(wrapper.find('.embed-block__wrapper').html())
            .toBe('<div class="embed-block__wrapper"><h1>Embed Title</h1></div>');
    });
});

describe('editor3.components.embed-input', () => {
    beforeEach(window.module(($provide) => {
        const testConfig: Partial<ISuperdeskGlobalConfig> = {iframely: {key: 'key'}};

        Object.assign(appConfig, testConfig);
    }));

    it('should render', () => {
        const {options} = mockStore();
        const noop = () => ({});
        const wrapper = mount(<EmbedInput hidePopups={noop} onSubmit={noop} />, options);

        expect(wrapper.find('.icon-ok').length).toBe(1);
        expect(wrapper.find('.icon-close-small').length).toBe(1);
        expect(wrapper.find('.embed-dialog__error').length).toBe(0);
    });

    it('should reset error and call onCancel on close', () => {
        const {options} = mockStore();
        const onCancel = jasmine.createSpy();
        const wrapper = mount(<EmbedInput hidePopups={onCancel} />, options);

        wrapper.find('.icon-close-small').simulate('click');

        expect(onCancel).toHaveBeenCalled();
    });

    it('should call onCancel when Escape is pressed', () => {
        const {options} = mockStore();
        const onCancel = jasmine.createSpy();
        const wrapper = mount(<EmbedInput hidePopups={onCancel} />, options);

        wrapper.simulate('keyup', {key: 'Escape'});

        expect(onCancel).toHaveBeenCalled();
    });

    it('should not call onCancel when other keys are pressed', () => {
        const {options} = mockStore();
        const onCancel = jasmine.createSpy();
        const wrapper = mount(<EmbedInput hidePopups={onCancel} />, options);

        wrapper.simulate('keyup', {key: '.'});

        expect(onCancel).not.toHaveBeenCalled();
    });

    it('should display error when ajax call returns it', inject(($q, $rootScope) => {
        const {options} = mockStore();
        const noop = () => ({});
        const wrapper = mount(<EmbedInput hidePopups={noop} embed={noop} />, options);

        spyOn($, 'ajax').and.returnValue($q.reject({
            responseJSON: {error: 'this is the error'},
        }));

        const instance: any = wrapper.find('input').instance();

        instance.value = 'http://will.fail';
        wrapper.simulate('submit');

        $rootScope.$apply();
        wrapper.update();

        expect(wrapper.state('error')).toBe('this is the error');
        expect(wrapper.find('.embed-dialog__error').text()).toBe('this is the error');
    }));

    it('should call onSubmit and reset error on success', inject(($q, $rootScope) => {
        const {options} = mockStore();
        const onCancel = jasmine.createSpy();
        const onSubmit = jasmine.createSpy();
        const wrapper = mount(<EmbedInput embed={onSubmit} hidePopups={onCancel} />, options);

        spyOn($, 'ajax').and.returnValue($q.resolve({html: 'foo'}));

        wrapper.setState({error: 'some error'});

        const instance: any = wrapper.find('input').instance();

        instance.value = 'http://will.fail';
        wrapper.simulate('submit');

        $rootScope.$apply();

        expect(onSubmit).toHaveBeenCalledWith({html: 'foo'});
        expect(onCancel).toHaveBeenCalled();
        expect(wrapper.state('error')).toBe('');
    }));
});
