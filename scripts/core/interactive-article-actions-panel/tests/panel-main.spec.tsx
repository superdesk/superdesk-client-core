import React from 'react';
import {mount} from 'enzyme';
import {Panel} from '../panel/panel-main';

/**
 * Selectors are scoped to `div` on purpose: enzyme also matches React elements by prop,
 * so an unscoped selector would match the props handed to the ui-framework component
 * whether or not they reach the DOM.
 */
function renderPanel(markupV2: boolean, width?: string) {
    return mount(
        <Panel markupV2={markupV2} width={width} data-test-id="interactive-actions-panel">
            <div />
        </Panel>,
    );
}

describe('interactive article actions panel markup', () => {
    it('renders the authoring-react panel on a dark surface, like the legacy one', () => {
        const wrapper = renderPanel(true);

        // `data-theme` is what flips the design tokens the panel background is painted from
        expect(wrapper.find('div[data-theme="dark-ui"]').exists()).toBe(true);
        expect(wrapper.find('div.side-panel--dark-ui').exists()).toBe(true);
    });

    it('exposes the authoring-react panel to tests under the same id as the legacy one', () => {
        const markupV2 = renderPanel(true);
        const legacy = renderPanel(false);

        expect(markupV2.find('div[data-test-id="interactive-actions-panel"]').exists()).toBe(true);
        expect(legacy.find('div[data-test-id="interactive-actions-panel"]').exists()).toBe(true);
    });

    it('keeps the dark theme on the legacy panel', () => {
        const wrapper = renderPanel(false);

        expect(wrapper.find('div[data-theme="dark-ui"]').exists()).toBe(true);
        expect(wrapper.find('div.side-panel--dark-ui').exists()).toBe(true);
    });

    /**
     * `InteractiveArticleActionsPanel` widens the publish tab by handing down
     * `singleColumnWidthRem * columnCount`. That only reaches the user if the width
     * lands on the element the panel is actually sized by.
     */
    it('sizes the authoring-react panel by the width it is given, like the legacy one', () => {
        const markupV2 = renderPanel(true, '80rem');
        const legacy = renderPanel(false, '80rem');

        expect(markupV2.find('div[data-test-id="interactive-actions-panel"]').prop('style'))
            .toEqual(jasmine.objectContaining({width: '80rem'}));
        expect(legacy.find('div[data-test-id="interactive-actions-panel"]').prop('style'))
            .toEqual(jasmine.objectContaining({width: '80rem'}));
    });
});
