import React from 'react';
import {shallow, mount} from 'enzyme';
import {EditorState} from 'draft-js';
import {LinkButtonComponent as LinkButton} from '../links/LinkButton';
import {LinkInput, LinkPopover} from '../links';
import {stateWithLink, cursorAtPosition} from './utils';

const getShallowWrapper = (es) => getWrapper(es, true);

// returns a wrapper around the link button, along with two spies
// for the applyLink and removeLink property
function getWrapper(es = null, shallowMount = false) {
    const editorState = es || EditorState.createEmpty();
    const mountFunc = shallowMount ? shallow : mount;
    const applyLink = jasmine.createSpy();
    const removeLink = jasmine.createSpy();
    const wrapper = mountFunc(
        <LinkButton
            editorRect={{top: 1, left: 2}}
            applyLink={applyLink}
            removeLink={removeLink}
            editorState={editorState} />);

    return {wrapper, applyLink, removeLink};
}

describe('editor3.components.link-button', () => {
    it('should render button text', () => {
        const {wrapper} = getShallowWrapper();

        expect(wrapper.find('LinkPopover').length).toBe(0);
    });

    it('should show popover when selection is link', () => {
        const editorState = cursorAtPosition(stateWithLink(), 0);
        const {wrapper} = getWrapper(editorState);

        expect(wrapper.find('LinkPopover').length).toBe(0);

        wrapper.setProps({
            editorState: cursorAtPosition(editorState, 7)
        });

        expect(wrapper.find('LinkPopover').length).toBe(1);
    });

    it('should have class "inactive" when selection is collapsed', () => {
        const editorState = cursorAtPosition(stateWithLink(), 0);
        const {wrapper} = getShallowWrapper(editorState);

        expect(wrapper.find('span.link-button').hasClass('inactive')).toBeTruthy();
    });

    it('should not have class "inactive" when selection is not collapsed', () => {
        const editorState = cursorAtPosition(stateWithLink(), 1, 3);
        const {wrapper} = getShallowWrapper(editorState);

        expect(wrapper.find('span.link-button').hasClass('inactive')).toBeFalsy();
    });

    it('should display link input when clicking button', () => {
        const editorState = cursorAtPosition(stateWithLink(), 0, 3);
        const {wrapper} = getShallowWrapper(editorState);

        expect(wrapper.state().showInput).toBe(null);
        expect(wrapper.find('LinkInput').length).toBe(0);

        wrapper.find('span.link-button').simulate('click');

        expect(wrapper.state().showInput).toBe('');
        expect(wrapper.find('LinkInput').length).toBe(1);
    });
});

describe('editor3.components.link-input', () => {
    it('should render given value', () => {
        const wrapper = shallow(
            <LinkInput
                editorState={stateWithLink()}
                value={'abc'}
                onSubmit={() => ({})}
                onCancel={() => ({})} />);

        expect(wrapper.find('input').props().defaultValue).toBe('abc');
    });

    it('should call onCancel prop when "x" button is clicked', () => {
        const onCancel = jasmine.createSpy();
        const wrapper = mount(
            <LinkInput
                editorState={stateWithLink()}
                value={'abc'}
                onSubmit={() => ({})}
                onCancel={onCancel} />);

        wrapper.find('.icon-close-small').simulate('click');

        expect(onCancel).toHaveBeenCalled();
    });

    it('should not call onCancel when keys other than "Escape" are pressed', () => {
        const onCancel = jasmine.createSpy();
        const wrapper = mount(
            <LinkInput
                editorState={stateWithLink()}
                value={'abc'}
                onSubmit={() => ({})}
                onCancel={onCancel} />);

        wrapper.simulate('keyup', {key: 'A'});

        expect(onCancel).not.toHaveBeenCalled();
    });

    it('should call onCancel when "Escape" is pressed', () => {
        const onCancel = jasmine.createSpy();
        const wrapper = mount(
            <LinkInput
                editorState={stateWithLink()}
                value={'abc'}
                onSubmit={() => ({})}
                onCancel={onCancel} />);

        wrapper.simulate('keyup', {key: 'Escape'});

        expect(onCancel).toHaveBeenCalled();
    });

    it('should call onSubmit & onCancel when form is submitted', () => {
        const onSubmit = jasmine.createSpy();
        const onCancel = jasmine.createSpy();
        const wrapper = mount(
            <LinkInput
                editorState={stateWithLink()}
                value={'abc'}
                onCancel={onCancel}
                onSubmit={onSubmit} />);

        wrapper.simulate('submit');

        expect(onSubmit.calls.first().args[0]).toBe('abc');
        expect(onSubmit.calls.first().args[1]).not.toBe(null);
        expect(onCancel).toHaveBeenCalled();
    });
});

describe('editor3.components.link-popover', () => {
    function fakePosition(obj = null) {
        spyOn(LinkPopover.prototype, 'updatePosition')
            .and
            .callFake(function() {
                this.position = obj;
            });
    }

    it('should not render when position is null', () => {
        fakePosition(null);
        const wrapper = mount(
            <LinkPopover
                url={'abc'}
                editorRect={{}}
                onEdit={() => ({})}
                onRemove={() => ({})} />);

        expect(wrapper.find('.link-editor').length).toBe(0);
    });

    it('should render when it can obtain a position', () => {
        fakePosition({top: 1, left: 2});
        const wrapper = mount(
            <LinkPopover
                url={'abc'}
                editorRect={{}}
                onEdit={() => ({})}
                onRemove={() => ({})} />);

        expect(wrapper.find('.link-editor').length).toBe(1);
    });

    it('should call onRemove prop when trash icon is clicked', () => {
        fakePosition({top: 1, left: 2});

        const onRemove = jasmine.createSpy();
        const wrapper = mount(
            <LinkPopover
                url={'abc'}
                editorRect={{}}
                onEdit={() => ({})}
                onRemove={onRemove} />);

        wrapper.find('.icon-trash').simulate('click');

        expect(onRemove).toHaveBeenCalled();
    });

    it('should call onEdit prop when pencil icon is clicked, passing URL', () => {
        fakePosition({top: 1, left: 2});

        const onEdit = jasmine.createSpy();
        const wrapper = mount(
            <LinkPopover
                url={'abc'}
                editorRect={{}}
                onEdit={onEdit}
                onRemove={() => ({})} />);

        wrapper.find('.icon-pencil').simulate('click');

        expect(onEdit).toHaveBeenCalledWith('abc');
    });
});
