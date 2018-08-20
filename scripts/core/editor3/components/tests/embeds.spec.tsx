import React from 'react';
import {shallow, mount} from 'enzyme';
import mockStore, {embedBlockAndContent} from './utils';
import {EmbedBlockComponent as EmbedBlock} from '../embeds/EmbedBlock';
import {EmbedInputComponent as EmbedInput} from '../embeds/EmbedInput';

describe('editor3.components.embed-block', () => {
    it('should render entity html', () => {
        const {block, contentState} = embedBlockAndContent();
        const wrapper = shallow(<EmbedBlock block={block} contentState={contentState} />);

        expect(wrapper.find('.embed-block__wrapper').html())
            .toBe('<div class="embed-block__wrapper"><h1>Embed Title</h1></div>');
    });
});

describe('editor3.components.embed-input', () => {
    beforeEach(window['module'](($provide) => {
        $provide.constant('config', {iframely: {key: 'key'}});
    }));

    it('should render', () => {
        const {options} = mockStore();
        const noop = () => ({});
        const wrapper = mount(<EmbedInput embedCode={noop} onCancel={noop} onSubmit={noop} />, options);

        expect(wrapper.find('.icon-ok').length).toBe(1);
        expect(wrapper.find('.icon-close-small').length).toBe(1);
        expect(wrapper.find('.embed-dialog__error').length).toBe(0);
    });

    it('should reset error and call onCancel on close', () => {
        const {options} = mockStore();
        const noop = () => ({});
        const onCancel = jasmine.createSpy();
        const wrapper = mount(<EmbedInput embedCode={noop} hidePopups={onCancel} />, options);

        wrapper.find('.icon-close-small').simulate('click');

        expect(onCancel).toHaveBeenCalled();
    });

    it('should call onCancel when Escape is pressed', () => {
        const {options} = mockStore();
        const noop = () => ({});
        const onCancel = jasmine.createSpy();
        const wrapper = mount(<EmbedInput embedCode={noop} hidePopups={onCancel} />, options);

        wrapper.simulate('keyup', {key: 'Escape'});

        expect(onCancel).toHaveBeenCalled();
    });

    it('should not call onCancel when other keys are pressed', () => {
        const {options} = mockStore();
        const noop = () => ({});
        const onCancel = jasmine.createSpy();
        const wrapper = mount(<EmbedInput embedCode={noop} onCancel={onCancel} />, options);

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

        wrapper.find('input').instance().value = 'http://will.fail';
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

        spyOn($, 'ajax').and.returnValue($q.resolve('resolve-value'));

        wrapper.setState({error: 'some error'});
        wrapper.find('input').instance().value = 'http://will.fail';
        wrapper.simulate('submit');

        $rootScope.$apply();

        expect(onSubmit).toHaveBeenCalledWith('resolve-value');
        expect(onCancel).toHaveBeenCalled();
        expect(wrapper.state('error')).toBe('');
    }));
});

