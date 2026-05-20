import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

test.describe('subscribers', () => {
    const subscriberName = 'Subscriber 1';

    test.beforeEach(async ({page}) => {
        await restoreDatabaseSnapshot();
        await page.goto('/#/settings/publish');
    });

    test('lists the default subscriber', async ({page}) => {
        await expect(page.locator(s('subscriber-item'))).toHaveCount(1);
        await expect(page.locator(s(`subscriber-item=${subscriberName}`))).toBeVisible();
    });

    test('save button is disabled until subscriber type changes', async ({page}) => {
        const subscriberItem = page.locator(s(`subscriber-item=${subscriberName}`));

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
