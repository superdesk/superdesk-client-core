import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';
import {login} from 'end-to-end-testing-helpers';

test.describe('internal destinations', async () => {
    test('display and removal of active filters', async ({page}) => {
        await login('admin', 'admin');
        await restoreDatabaseSnapshot();
        await page.goto('/#/settings/internal-destinations');

        await expect(page.locator(s('list-page--filters-active', 'tag-label'))).toHaveCount(0);
        await page.locator(s('toggle-filters')).click();

        await page.locator(s('list-page--filters-form', 'gform-input--desk')).click();
        await page.locator(s('list-page--filters-form', 'gform-input--desk')).getByRole('button', {name: 'Sports'}).click();
        await page.locator(s('list-page--filters-form', 'filters-submit')).click();
        await expect(page.locator(s('list-page--filters-active', 'tag-label'))).toHaveCount(1);

        const activeFilter = page.locator(s('list-page--filters-active', 'tag-label')).first();

        await page.getByText(await activeFilter.textContent()).click();
        await expect(page.locator(s('list-page--filters-active', 'tag-label'))).toHaveCount(0);
    });
})
