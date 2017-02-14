import React from 'react';
import {shallow, mount} from 'enzyme';
import {EditorState} from 'draft-js';
import {Editor3Component as Editor3} from '../Editor3';
import {blockRenderer} from '../blockRenderer';

describe('editor3.component', () => {
    it('should hide toolbar when disabled', () => {
        const wrapper = shallow(<Editor3 showToolbar={false} />);

        expect(wrapper.find('DraftEditor').length).toBe(1);
        expect(wrapper.find('Toolbar').length).toBe(0);
    });

    it('should show toolbar when enabled', () => {
        const wrapper = shallow(<Editor3 showToolbar={true} />);

        expect(wrapper.find('DraftEditor').length).toBe(1);
        expect(wrapper.find('Toolbar').length).toBe(1);
    });

    it('should mount and put client rect inside attribute on update', () => {
        const editorState = EditorState.createEmpty();

        spyOn(Editor3.prototype, 'componentDidMount');

        const wrapper = mount(<Editor3 editorState={editorState} />);
        const instance = wrapper.instance();

        expect(Editor3.prototype.componentDidMount.calls.count()).toEqual(1);
        expect(instance.editorRect).toEqual({top: 0, left: 0});

        wrapper.update();

        expect(instance.editorRect).toEqual(jasmine.any(ClientRect));
    });

    it('should not accept dragging over invalid items', () => {
        const wrapper = shallow(<Editor3 />);
        const {onDragOver} = wrapper.instance();
        const makeEvent = (t) => ({originalEvent: {dataTransfer: {types: [t]}}});

        [
            'application/superdesk.item.picture',
            'application/superdesk.item.graphic',
            'application/superdesk.item.video',
            'text/html'
        ].forEach((validType) => {
            expect(onDragOver(makeEvent(validType))).toBe(false);
        });

        [
            'text/md',
            'application/javascript',
            'invalid'
        ].forEach((invalidType) => {
            expect(onDragOver(makeEvent(invalidType))).toBe(true);
        });
    });
});

describe('editor3.blockRenderer', () => {
    it('should return null for non-atomic blocks', () => {
        expect(blockRenderer({getType: () => 'non-atomic'})).toBe(null);
    });

    it('should return null as component for unrecognised blocks', () => {
        const block = {getType: () => 'atomic', getEntityAt: () => 'entity_key'};
        const contentState = {getEntity: () => ({getType: () => 'not an image'})};
        const {component, editable} = blockRenderer(block);

        expect(component({block, contentState})).toBe(null);
        expect(editable).toEqual(false);
    });

    it('should return non-null as component for recognised blocks', () => {
        const block = {getType: () => 'atomic', getEntityAt: () => 'entity_key'};
        const contentState = {getEntity: () => ({getType: () => 'EMBED', getData: () => ({data: {html: 'abc'}})})};
        const component = blockRenderer(block).component({block, contentState});

        expect(component).not.toBe(null);
        expect(mount(component).name()).toBe('EmbedBlock');
    });
});
