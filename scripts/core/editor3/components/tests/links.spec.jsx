import React from 'react';
import {createStore} from 'redux';
import {shallow, mount} from 'enzyme';
import {EditorState} from 'draft-js';
import {LinkButtonComponent as LinkButton} from '../links/LinkButton';
import {LinkToolbarComponent as LinkToolbar} from '../links/LinkToolbar';
import {LinkInput} from '../links';
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
            onClick={() => { /* no-op */ }}
            removeLink={removeLink}
            editorState={editorState} />);

    return {wrapper, applyLink, removeLink};
}

describe('editor3.components.link-toolbar', () => {
    it('should render correctly', () => {
        const editorState = EditorState.createEmpty();
        const wrapper = shallow(
            <LinkToolbar
                editorState={editorState}
                removeLink={() => { /* no-op */ }}
                onEdit={() => { /* no-op */ }} />);

        expect(wrapper.find('div.link-toolbar').exists()).toBe(true);
        expect(wrapper.find('a').length).toBe(0);
    });

    it('should not show controls when not hovering link', () => {
        const editorState = cursorAtPosition(stateWithLink(), 0);
        const wrapper = shallow(
            <LinkToolbar
                editorState={editorState}
                removeLink={() => { /* no-op */ }}
                onEdit={() => { /* no-op */ }} />);

        expect(wrapper.find('div.link-toolbar').exists()).toBe(true);
        expect(wrapper.find('div.link-toolbar').hasClass('is-link')).toBe(false);
        expect(wrapper.find('a').length).toBe(0);
    });

    it('should show controls when not hovering link', () => {
        const editorState = cursorAtPosition(stateWithLink(), 6);
        const wrapper = shallow(
            <LinkToolbar
                editorState={editorState}
                removeLink={() => { /* no-op */ }}
                onEdit={() => { /* no-op */ }} />);

        expect(wrapper.find('div.link-toolbar').exists()).toBe(true);
        expect(wrapper.find('a').length).toBe(3);
    });

    it('should reference correct link', () => {
        const editorState = cursorAtPosition(stateWithLink(), 6);
        const wrapper = shallow(
            <LinkToolbar
                editorState={editorState}
                removeLink={() => { /* no-op */ }}
                onEdit={() => { /* no-op */ }} />);

        expect(wrapper.find('a[href="entity-url"]').exists()).toBe(true);
    });

    it('should call onEdit prop when clicking "Edit"', () => {
        const editorState = cursorAtPosition(stateWithLink(), 6);
        const onEdit = jasmine.createSpy();
        const wrapper = shallow(
            <LinkToolbar
                editorState={editorState}
                removeLink={() => { /* no-op */ }}
                onEdit={onEdit} />);

        wrapper.find('a').at(1)
            .simulate('click');

        expect(onEdit).toHaveBeenCalledWith({href: 'entity-url'});
    });

    it('should call onRemove prop when clicking "Remove"', () => {
        const editorState = cursorAtPosition(stateWithLink(), 6);
        const onRemove = jasmine.createSpy();
        const wrapper = shallow(
            <LinkToolbar
                editorState={editorState}
                removeLink={onRemove}
                onEdit={() => { /* no-op */ }} />);

        wrapper.find('a').at(2)
            .simulate('click');

        expect(onRemove).toHaveBeenCalled();
    });
});

describe('editor3.components.link-button', () => {
    it('should render button text', () => {
        const {wrapper} = getShallowWrapper();

        expect(wrapper.find('LinkPopover').length).toBe(0);
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
});

describe('editor3.components.link-input', () => {
    const value = {href: 'abc'};
    const store = createStore(() => ({}), {item: {}});

    it('should render given value', () => {
        const wrapper = mount(
            <LinkInput
                store={store}
                editorState={stateWithLink()}
                value={value}
                onSubmit={() => ({})}
                onCancel={() => ({})} />);

        expect(wrapper.find('input').props().defaultValue).toBe(value.href);
    });

    it('should call onCancel prop when "x" button is clicked', () => {
        const onCancel = jasmine.createSpy();
        const wrapper = mount(
            <LinkInput
                store={store}
                editorState={stateWithLink()}
                value={value}
                onSubmit={() => ({})}
                onCancel={onCancel} />);

        wrapper.find('.btn--cancel').simulate('click');

        expect(onCancel).toHaveBeenCalled();
    });

    it('should not call onCancel when keys other than "Escape" are pressed', () => {
        const onCancel = jasmine.createSpy();
        const wrapper = mount(
            <LinkInput
                store={store}
                editorState={stateWithLink()}
                value={value}
                onSubmit={() => ({})}
                onCancel={onCancel} />);

        wrapper.simulate('keyup', {key: 'A'});

        expect(onCancel).not.toHaveBeenCalled();
    });

    it('should call onCancel when "Escape" is pressed', () => {
        const onCancel = jasmine.createSpy();
        const wrapper = mount(
            <LinkInput
                store={store}
                editorState={stateWithLink()}
                value={value}
                onSubmit={() => ({})}
                onCancel={onCancel} />);

        wrapper.find('form').simulate('keyup', {key: 'Escape'});

        expect(onCancel).toHaveBeenCalled();
    });

    it('should call onSubmit & onCancel when form is submitted', () => {
        const onSubmit = jasmine.createSpy();
        const onCancel = jasmine.createSpy();
        const wrapper = mount(
            <LinkInput
                store={store}
                editorState={stateWithLink()}
                value={value}
                onCancel={onCancel}
                onSubmit={onSubmit} />);

        wrapper.find('form').simulate('submit');

        expect(onSubmit.calls.first().args[0]).toEqual({href: 'abc'});
        expect(onSubmit.calls.first().args[1]).not.toBe(null);
        expect(onCancel).toHaveBeenCalled();
    });
});
