import {test, expect, type Locator} from '@playwright/test';
import {runEditor3InlineStyleToggleScenario} from './scenarios/editor3-inline-style';
import {restoreDatabaseSnapshot} from './utils';

test.describe('italic formatting in the article body', () => {
    async function expectItalic(run: Locator, italic: boolean): Promise<void> {
        await expect(run).toHaveCSS('font-style', italic ? 'italic' : 'normal');
    }

    test('toolbar toggle italicizes typed text and a selection, and the result survives reopen', {
        annotation: [
            // Partial: only body_html is covered. The case's purpose also names custom text fields,
            // which no snapshot puts on the Story content profile.
            {type: 'confluence', description: '1313669363 partial'}, // Italic
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        await runEditor3InlineStyleToggleScenario(page, {
            styleName: 'italic',
            headline: 'italic formatting test',
            expectStyled: expectItalic,
        });
    });
});
