import React from 'react';
import ReactDOM from 'react-dom';
import {ActionsPanelOverlay, ACTIONS_PANEL_OVERLAY_TEST_ID} from '../actions-panel-overlay';

const PANEL = '[data-test-id="panel-body"]';

/**
 * Stands in for the authoring frame: a box narrower than the panel that clips whatever
 * overflows it. Rendering the panel into it is what the frame's side widget slots do,
 * and it is what sliced the publish form's inline-start edge.
 */
function renderInClippingEditor(): {editor: HTMLElement, cleanUp(): void} {
    const editor = document.createElement('div');

    editor.style.cssText = 'width: 200px; height: 400px; overflow: hidden;';

    document.body.appendChild(editor);

    ReactDOM.render(
        (
            <ActionsPanelOverlay>
                <div data-test-id="panel-body" style={{width: 800, height: 300}} />
            </ActionsPanelOverlay>
        ),
        editor,
    );

    return {
        editor,
        cleanUp: () => {
            ReactDOM.unmountComponentAtNode(editor);
            editor.remove();
        },
    };
}

describe('send to / publish panel host', () => {
    let rendered: ReturnType<typeof renderInClippingEditor>;

    beforeEach(() => {
        rendered = renderInClippingEditor();
    });

    afterEach(() => {
        rendered.cleanUp();
    });

    it('leaves nothing behind in the editor that mounted it', () => {
        expect(rendered.editor.querySelector(PANEL)).toBe(null);
    });

    it('attaches the panel to the document body instead', () => {
        const overlay = document.body.querySelector(`[data-test-id="${ACTIONS_PANEL_OVERLAY_TEST_ID}"]`);

        expect(overlay).not.toBe(null);
        expect(overlay.parentElement).toBe(document.body);
        expect(overlay.querySelector(PANEL)).not.toBe(null);
    });

    /**
     * The overlay is only useful if nothing between it and the viewport clips. Ancestor
     * clipping does not shrink `getBoundingClientRect`, so the check has to be structural:
     * no ancestor of the panel may scroll or hide its overflow.
     */
    it('has no ancestor that could clip it', () => {
        const panel = document.body.querySelector(PANEL);
        const clipping: Array<string> = [];

        for (let element = panel.parentElement; element != null; element = element.parentElement) {
            const {overflowX, overflowY} = window.getComputedStyle(element);

            if (overflowX !== 'visible' || overflowY !== 'visible') {
                clipping.push(`${element.tagName}.${element.className} (${overflowX}/${overflowY})`);
            }
        }

        expect(clipping).toEqual([]);
    });

    /**
     * A portal outlives its React parent's DOM node, so closing authoring has to take the
     * panel with it rather than leave it stranded on the body.
     */
    it('unmounts the panel with the editor that opened it', () => {
        rendered.cleanUp();

        expect(document.body.querySelector(PANEL)).toBe(null);
        expect(
            document.body.querySelector(`[data-test-id="${ACTIONS_PANEL_OVERLAY_TEST_ID}"]`),
        ).toBe(null);
    });
});
