import React from 'react';
import {shallow, mount} from 'enzyme';
import {Editor3Component as Editor3} from '../Editor3Component';
import {getBlockRenderer} from '../blockRenderer';
import {EditorState} from 'draft-js';
import mockStore from './utils';

const editorState = EditorState.createEmpty();
const stubForHighlights = {
    highlightsManager: {
        styleMap: {},
    },
};

describe('editor3.component', () => {
    it('should hide toolbar when disabled', () => {
        const wrapper = shallow(<Editor3 showToolbar={false} editorState={editorState} {...stubForHighlights} />);

        expect(wrapper.find('DraftEditor').length).toBe(1);
        expect(wrapper.find('.Editor3-controls').length).toBe(0);
    });

    it('should not accept dragging over invalid items', () => {
        const wrapper = shallow(<Editor3 editorFormat={['media']} editorState={editorState} {...stubForHighlights} />);
        const {onDragOver} = wrapper.instance();
        const makeEvent = (t) => ({originalEvent: {dataTransfer: {types: ['foo', t]}}});

        [
            'application/superdesk.item.picture',
            'application/superdesk.item.graphic',
            'application/superdesk.item.video',
            'application/superdesk.item.audio',
            'text/html',
        ].forEach((validType) => {
            expect(onDragOver(makeEvent(validType))).toBe(false);
        });

        [
            'text/md',
            'application/javascript',
            'invalid',
        ].forEach((invalidType) => {
            expect(onDragOver(makeEvent(invalidType))).toBeTruthy();
        });
    });

    it('should not accept dragging when editor is readOnly', () => {
        const wrapper = shallow(
            <Editor3 readOnly editorFormat={['media']} editorState={editorState} {...stubForHighlights} />
        );
        const {onDragOver} = wrapper.instance();
        const makeEvent = (t) => ({originalEvent: {dataTransfer: {types: [t]}}});

        [
            'application/superdesk.item.picture',
            'application/superdesk.item.graphic',
            'application/superdesk.item.video',
            'application/superdesk.item.audio',
            'text/html',
        ].forEach((validType) => {
            expect(onDragOver(makeEvent(validType))).toBeTruthy();
        });
    });

    it('should not accept dragging when editor does not support images', () => {
        const wrapper = shallow(<Editor3 editorState={editorState} {...stubForHighlights} />);
        const {onDragOver} = wrapper.instance();
        const makeEvent = (t) => ({originalEvent: {dataTransfer: {types: [t]}}});

        [
            'application/superdesk.item.picture',
            'application/superdesk.item.graphic',
            'application/superdesk.item.video',
            'application/superdesk.item.audio',
            'text/html',
        ].forEach((validType) => {
            expect(onDragOver(makeEvent(validType))).toBeTruthy();
        });
    });

    it('should not accept dragging when editor is single line', () => {
        const wrapper = shallow(
            <Editor3 singleLine editorFormat={['media']} editorState={editorState} {...stubForHighlights} />
        );
        const {onDragOver} = wrapper.instance();
        const makeEvent = (t) => ({originalEvent: {dataTransfer: {types: [t]}}});

        [
            'application/superdesk.item.picture',
            'application/superdesk.item.graphic',
            'application/superdesk.item.video',
            'application/superdesk.item.audio',
            'text/html',
        ].forEach((validType) => {
            expect(onDragOver(makeEvent(validType))).toBeTruthy();
        });
    });
});

describe('editor3.blockRenderer', () => {
    it('should return null for non-atomic blocks', () => {
        expect(getBlockRenderer()({getType: () => 'non-atomic'})).toBe(null);
    });

    it('should return null as component for unrecognised blocks', () => {
        const block = {getType: () => 'atomic', getEntityAt: () => 'entity_key'};
        const contentState = {getEntity: () => ({getType: () => 'not an image'})};
        const {component, editable} = getBlockRenderer()(block);

        expect(component({block, contentState})).toBe(null);
        expect(editable).toEqual(false);
    });

    it('should return non-null as component for recognised blocks', () => {
        const block = {getType: () => 'atomic', getEntityAt: () => 'entity_key'};
        const contentState = {getEntity: () => ({getType: () => 'EMBED', getData: () => ({data: {html: 'abc'}})})};
        const component = getBlockRenderer()(block).component({block, contentState});
        const {options} = mockStore();

        expect(component).not.toBe(null);
        expect(mount(component, options).name()).toBe('Connect(EmbedBlockComponent)');
    });
});
