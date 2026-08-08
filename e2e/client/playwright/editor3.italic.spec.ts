import {test, expect, type Locator} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {runEditor3InlineStyleScenario} from './utils/editor3';

test.describe('italic formatting in the article body', () => {
    const HEADLINE = 'italic formatting test';

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

        await runEditor3InlineStyleScenario(page, {
            styleValue: 'italic',
            headline: HEADLINE,
            expectStyled: expectItalic,
        });
    });
});
