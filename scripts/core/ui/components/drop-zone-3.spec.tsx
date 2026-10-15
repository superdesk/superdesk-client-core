import React from 'react';
import {mount} from 'enzyme';
import {DropZone3} from './drop-zone-3';

describe('DropZone3 placeholder', () => {
    it('leaves a drop zone that already holds something unstyled', () => {
        const wrapper = mount(
            <DropZone3 canDrop={() => true} onDrop={() => undefined}>
                <span>content</span>
            </DropZone3>,
        );

        expect(wrapper.find('div[data-test-id="drop-zone-placeholder"]').exists()).toBe(false);
    });
});
