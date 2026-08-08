import {test, expect, type Locator} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {runEditor3InlineStyleToggleScenario} from './utils/editor3';

test.describe('underline formatting in the article body', () => {
    async function expectUnderlined(run: Locator, underlined: boolean): Promise<void> {
        await expect(run).toHaveCSS('text-decoration-line', underlined ? 'underline' : 'none');
    }

    test('toolbar toggle underlines typed text and a selection, and the result survives reopen', {
        annotation: [
            // Partial: only body_html is covered. The case's purpose also names custom text fields,
            // which no snapshot puts on the Story content profile.
            {type: 'confluence', description: '1313669372 partial'}, // Underline
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        await runEditor3InlineStyleToggleScenario(page, {
            styleName: 'underline',
            headline: 'underline formatting test',
            expectStyled: expectUnderlined,
        });
    });
});
