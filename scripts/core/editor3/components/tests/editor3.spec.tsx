import React from 'react';
import {Store} from 'redux';
import {Provider} from 'react-redux';
import {shallow, mount} from 'enzyme';
import {Editor3Component, getValidMediaType} from '../Editor3Component';
import {EditorState, ContentBlock} from 'draft-js';
import mockStore from './utils';
import {CustomEditor3Entity} from 'core/editor3/constants';
import {getBlockRenderer} from '../blockRenderer';
import {IEditorStore} from 'core/editor3/store';

const spellchecking: IEditorStore['spellchecking'] = {
    enabled: false,
    language: 'en',
    inProgress: false,
    warningsByBlock: {},
};

const blockRenderer = getBlockRenderer(spellchecking);

const editorState = EditorState.createEmpty();

const editor3mandatoryProps = {
    spellchecking: {
        language: 'en',
        enabled: false,
        inProgress: false,
        warningsByBlock: {},
    },
};

const stubForHighlights = {
    highlightsManager: {
        styleMap: {},
    },
};

describe('editor3.component', () => {
    it('should hide toolbar when disabled', () => {
        const wrapper = shallow(
            <Editor3Component
                {...editor3mandatoryProps}
                showToolbar={false}
                editorState={editorState}
                {...stubForHighlights}
            />,
        );

        expect(wrapper.find('DraftEditor').length).toBe(1);
        expect(wrapper.find('.Editor3-controls').length).toBe(0);
    });

    it('should not accept dragging over invalid items', () => {
        const wrapper = shallow(
            <Editor3Component
                {...editor3mandatoryProps}
                editorFormat={['media']}
                editorState={editorState}
                {...stubForHighlights}
            />,
        );
        const {onDragOver} = wrapper.instance() as any;
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
            <Editor3Component
                {...editor3mandatoryProps}
                readOnly
                editorFormat={['media']}
                editorState={editorState}
                {...stubForHighlights}
            />,
        );
        const {onDragOver} = wrapper.instance() as any;
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
        const wrapper = shallow(
            <Editor3Component
                {...editor3mandatoryProps}
                editorState={editorState}
                {...stubForHighlights}
            />,
        );
        const {onDragOver} = wrapper.instance() as any;
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
            <Editor3Component
                {...editor3mandatoryProps}
                singleLine
                editorFormat={['media']}
                editorState={editorState}
                {...stubForHighlights}
            />,
        );
        const {onDragOver} = wrapper.instance() as any;
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

    it('should prefer superdesk media when dropping', () => {
        const event = {dataTransfer: {types: ['text/html', 'application/superdesk.item.picture']}};

        expect(getValidMediaType(event)).toBe('application/superdesk.item.picture');

        event.dataTransfer.types.reverse();

        expect(getValidMediaType(event)).toBe('application/superdesk.item.picture');
    });
});

describe('editor3.blockRenderer', () => {
    it('should return null for non-atomic blocks', () => {
        const block = {getType: () => 'non-atomic'} as unknown as ContentBlock;

        expect(blockRenderer(block)).toBe(null);
    });

    it('should return null as component for unrecognised blocks', () => {
        const block = {getType: () => 'atomic', getEntityAt: () => 'entity_key'} as unknown as ContentBlock;
        const contentState: any = {getEntity: () => ({getType: () => 'not an image'})};
        const {component, editable} = blockRenderer(block);

        expect(component({block, contentState, blockProps: {spellchecking}})).toBe(null);
        expect(editable).toEqual(false);
    });

    it('should return non-null as component for recognised blocks', () => {
        const block = {getType: () => 'atomic', getEntityAt: () => 'entity_key'} as unknown as ContentBlock;
        const contentState: any = {getEntity: () => ({
            getType: () => CustomEditor3Entity.EMBED,
            getData: () => ({data: {html: 'abc'}}),
        })};
        const component = blockRenderer(block)
            .component({block, contentState, blockProps: {spellchecking}});
        const store = mockStore().store as unknown as Store;

        expect(component).not.toBe(null);
        expect(
            mount(<Provider store={store}>{component}</Provider>)
                .childAt(0)
                .name(),
        ).toBe('Connect(DragableEditor3BlockComponent)');
    });
});
