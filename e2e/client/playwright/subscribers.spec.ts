import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

test.describe('subscribers', () => {
    test.beforeEach(async ({page}) => {
        await restoreDatabaseSnapshot();
        await page.goto('/#/settings/publish');
    });

    test('lists the default subscriber', {
        annotation: [
            {type: 'confluence', description: '1311834381 complete'}, // Subscribers
            {type: 'confluence', description: '1344443887 complete'}, // Creating Subscribers and Associating Products
            {type: 'confluence', description: '1344444319 partial'}, // Subscribers_ PASS
        ],
    }, async ({page}) => {
        const subscriberItems = page.locator(s('subscriber-item'));

        await expect(subscriberItems).toHaveCount(1);
        await expect(subscriberItems.first()).toBeVisible();
    });

    test('save button is disabled until subscriber type changes', async ({page}) => {
        const subscriberItem = page.locator(s('subscriber-item')).first();

        await subscriberItem.click();
        await subscriberItem.locator(s('edit-subscriber-button')).click();

        const saveButton = page.getByRole('button', {name: 'Save'});

        await expect(saveButton).toBeDisabled();

        await page.locator('#subType').selectOption('string:wire');
        await page.locator('#destination-format').selectOption('nitf');

        await expect(saveButton).toBeEnabled();
        await page.getByRole('button', {name: 'Cancel'}).click();
    });
});
