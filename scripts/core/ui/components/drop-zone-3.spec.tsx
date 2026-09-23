import React from 'react';
import {mount} from 'enzyme';
import {DropZone3} from './drop-zone-3';

// The empty drop zone has to read like angular's `.item-association`: 65px tall, label centred and
// dimmed. Every empty drop zone in authoring-react is this component, so it is asserted once here.
function renderEmpty() {
    return mount(
        <DropZone3
            canDrop={() => true}
            onDrop={() => undefined}
            onFileSelect={() => undefined}
        />,
    );
}

describe('DropZone3 placeholder', () => {
    it('offers the whole box as the click target, not just the line of text', () => {
        const style = renderEmpty().find('div[data-test-id="drop-zone-placeholder"]').prop('style');

        expect(style.minHeight).toBe(65);
        expect(style.boxSizing).toBe('border-box');
        expect(style.cursor).toBe('pointer');
    });

    it('centres and dims the label', () => {
        const style = renderEmpty().find('div[data-test-id="drop-zone-placeholder"]').prop('style');

        expect(style.justifyContent).toBe('center');
        expect(style.alignItems).toBe('center');
        expect(style.textAlign).toBe('center');
        expect(style.opacity).toBe(0.4);
    });

    it('leaves a drop zone that already holds something unstyled', () => {
        const wrapper = mount(
            <DropZone3 canDrop={() => true} onDrop={() => undefined}>
                <span>content</span>
            </DropZone3>,
        );

        expect(wrapper.find('div[data-test-id="drop-zone-placeholder"]').exists()).toBe(false);
    });
});
