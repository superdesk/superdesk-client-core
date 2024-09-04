import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';
import {Monitoring} from './page-object-models/monitoring';

test.describe('internal destinations', async () => {
    test('display and removal of active filters', async ({page}) => {
        new Monitoring(page);
        await restoreDatabaseSnapshot();
        await restoreDatabaseSnapshot();
        await page.goto('/#/settings/internal-destinations');

        await expect(page.locator(s('list-page--filters-active', 'tag-label'))).toHaveCount(0);

        await page.locator(s('toggle-filters')).click();
        await page.locator(s('list-page--filters-form', 'gform-input--desk')).click();

        // FIXME: Scroll so element doesn't collide with form button. scrollIntoViewIfNeeded doesn't work.
        // setting zindex 99999 to select2 component doesn't work as well.
        await page.locator(s('list-page--filters-form', 'gform-input--desk')).getByRole('button', {name: 'Sports'}).click();
        await page.locator(s('list-page--filters-form', 'filters-submit')).click();
        await expect(page.locator(s('list-page--filters-active', 'tag-label'))).toHaveCount(1);

        await page.locator(s('list-page--filters-active', 'tag-label', 'tag-label--remove')).click();
        await expect(page.locator(s('list-page--filters-active', 'tag-label'))).toHaveCount(0);
    });
})
