import {applyCustomEditorTagStyles, customEditorTagStyleMap} from '../customStyleMap';

describe('applyCustomEditorTagStyles', () => {
    const TEST_TAG = 'EDITOR_TAG_TEST';

    beforeEach(() => {
        customEditorTagStyleMap[TEST_TAG] = {
            display: 'inline-block',
            borderBlockEnd: '4px double blue',
        };
    });

    afterEach(() => {
        delete customEditorTagStyleMap[TEST_TAG];
    });

    it('applies the visual style from the style map', () => {
        const element = document.createElement('span');

        applyCustomEditorTagStyles(element, TEST_TAG);

        expect(element.style.borderBlockEnd).toBe('4px double blue');
    });

    it('applies no display override so the span stays inline and preserves trailing whitespace', () => {
        // Any block-level display (inline-block, block, flex, grid, table) trims its
        // own edge whitespace under the preview's default white-space, dropping a
        // trailing space that was part of the styled range. The span must stay inline.
        const element = document.createElement('span');

        applyCustomEditorTagStyles(element, TEST_TAG);

        expect(element.style.display).toBe('');
    });

    it('leaves the element untouched for an unknown tag', () => {
        const element = document.createElement('span');

        applyCustomEditorTagStyles(element, 'UNKNOWN_TAG');

        expect(element.getAttribute('style')).toBeNull();
    });
});
