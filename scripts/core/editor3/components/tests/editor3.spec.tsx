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
import ng from 'core/services/ng';
import {isMacOS} from 'core/utils';
import {customEditorControls} from 'core/editor3/CustomEditorControls';
import {appConfig} from 'appConfig';

const NDASH_CHAR = '\u2013';
const THIN_SPACE_CHAR = '\u2009';

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
    beforeEach(() => {
        // spying rather than calling `ng.register` keeps the fake out of the
        // other specs; `ng` is a singleton and there is no way to read back
        // the injector it held before
        spyOn(ng, 'get').and.callFake((serviceName: string) => {
            if (serviceName === 'session') {
                return {identity: {_id: 'test-user'}};
            }

            throw new Error(`Unexpected service requested: ${serviceName}`);
        });
    });

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

    describe('keyboard shortcuts', () => {
        const resetcustomEditorControls = () => {
            const registry = customEditorControls as any;

            registry.features = new Map();
            registry.keyBindings = new Map();
            registry.initialized = false;
        };

        beforeEach(() => {
            Object.assign(appConfig, {
                authoring: {
                    ...(appConfig.authoring ?? {}),
                    customEditorFeatures: {
                        inlineStyles: [],
                        characterInsertions: [
                            {
                                id: 'ndash',
                                icon: 'dash',
                                label: 'N dash',
                                character: NDASH_CHAR,
                                shortcut: {
                                    key: '-',
                                    modifiers: ['primary', 'alt'],
                                },
                            },
                            {
                                id: 'thin-space',
                                icon: 'thin_space',
                                label: 'Thin space',
                                character: THIN_SPACE_CHAR,
                                shortcut: {
                                    key: ' ',
                                    modifiers: ['primary', 'alt', 'shift'],
                                },
                            },
                        ],
                    },
                },
            });

            resetcustomEditorControls();
        });

        afterEach(() => {
            resetcustomEditorControls();
        });

        const renderComponent = (extraProps = {}) => shallow(
            <Editor3Component
                {...editor3mandatoryProps}
                editorState={EditorState.createEmpty()}
                {...stubForHighlights}
                {...extraProps}
            />,
        );

        it('maps Cmd/Ctrl + Alt + - to insert-ndash', () => {
            const wrapper = renderComponent({
                editorFormat: ['INSERT_CHAR_ndash'],
            });
            const instance = wrapper.instance() as any;
            const preventDefault = jasmine.createSpy('preventDefault');
            const isMac = isMacOS();

            const command = instance.keyBindingFn({
                key: '-',
                altKey: true,
                ctrlKey: !isMac,
                shiftKey: false,
                metaKey: !!isMac,
                preventDefault,
            });

            expect(command).toBe('insert-ndash');
            expect(preventDefault).toHaveBeenCalled();
        });

        it('maps Cmd/Ctrl + Alt + Shift + Space to insert-thin-space', () => {
            const wrapper = renderComponent({
                editorFormat: ['INSERT_CHAR_thin-space'],
            });
            const instance = wrapper.instance() as any;
            const preventDefault = jasmine.createSpy('preventDefault');
            const isMac = isMacOS();

            const command = instance.keyBindingFn({
                key: ' ',
                altKey: true,
                ctrlKey: !isMac,
                shiftKey: true,
                metaKey: !!isMac,
                preventDefault,
            });

            expect(command).toBe('insert-thin-space');
            expect(preventDefault).toHaveBeenCalled();
        });

        it('handleKeyCommand inserts ndash and calls onChange', () => {
            const onChange = jasmine.createSpy('onChange');
            const wrapper = renderComponent({onChange});
            const instance = wrapper.instance() as any;

            const result = instance.handleKeyCommand('insert-ndash');

            expect(result).toBe('handled');
            expect(onChange).toHaveBeenCalled();
            const newState = onChange.calls.mostRecent().args[0];

            expect(newState.getCurrentContent().getPlainText()).toBe(NDASH_CHAR);
        });

        it('handleKeyCommand inserts thin space and calls onChange', () => {
            const onChange = jasmine.createSpy('onChange');
            const wrapper = renderComponent({onChange});
            const instance = wrapper.instance() as any;

            const result = instance.handleKeyCommand('insert-thin-space');

            expect(result).toBe('handled');
            expect(onChange).toHaveBeenCalled();
            const newState = onChange.calls.mostRecent().args[0];

            expect(newState.getCurrentContent().getPlainText()).toBe(THIN_SPACE_CHAR);
        });
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
        ).toBe('Connect(DraggableEditor3BlockComponent)');
    });
});
