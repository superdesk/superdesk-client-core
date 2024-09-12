import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

test.describe('internal destinations', async () => {
    test('display and removal of active filters', async ({page}) => {
        await restoreDatabaseSnapshot();

        await page.goto('/#/settings/internal-destinations');
        await expect(page.locator(s('list-page--filters-active', 'tag-label'))).toHaveCount(0);

        await page.locator(s('toggle-filters')).click();

        await page.locator(s('list-page--filters-form', 'gform-input--desk'))
            .getByRole('combobox').click();
        await page.locator(s('list-page--filters-form', 'gform-input--desk'))
            .getByRole('combobox').fill('Sports');
        await page.locator(s('list-page--filters-form', 'gform-input--desk'))
            .getByRole('button', {name: 'Sports'}).click();
        await page.locator(s('list-page--filters-form', 'filters-submit')).click();
        await expect(page.locator(s('list-page--filters-active', 'tag-label'))).toHaveCount(1);

        await page.locator(s('list-page--filters-active', 'tag-label', 'tag-label--remove')).click();
        await expect(page.locator(s('list-page--filters-active', 'tag-label'))).toHaveCount(0);
    });
});
