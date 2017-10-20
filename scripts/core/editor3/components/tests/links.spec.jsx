import React from 'react';
import {createStore} from 'redux';
import {shallow, mount} from 'enzyme';
import {EditorState} from 'draft-js';
import {LinkToolbarComponent as LinkToolbar} from '../links/LinkToolbar';
import {LinkInput} from '../links';
import {stateWithLink, cursorAtPosition} from './utils';

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

// TODO(gbbr): Fix this test.
xdescribe('editor3.components.link-input', () => {
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
