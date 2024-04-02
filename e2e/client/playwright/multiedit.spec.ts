import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test.describe('Multiedit', async () => {
    test('Can open article in multiedit', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=test sports story')),
            'Edit',
        );
        await monitoring.executeActionInEditor(
            'Multiedit',
            'OK',
        );
        await expect(page.locator(s('multiedit-screen', 'multiedit-article=test sports story'))).toBeVisible();
    });

    test('Can edit article in multiedit', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=test sports story')),
            'Edit',
        );
        await monitoring.executeActionInEditor(
            'Multiedit',
            'OK',
        );

        await page
            .locator(s('multiedit-screen', 'multiedit-article', 'field--headline'))
            .getByRole('textbox')
            .fill('test sports story 1.1');
        await page.locator(s('multiedit-screen', 'multiedit-article=test sports story')).hover();
        await page
            .locator(s('multiedit-screen', 'multiedit-article=test sports story'))
            .getByRole('button', {name: 'save'})
            .click();
        await page.locator(s('multiedit-subnav')).getByRole('button', {name: 'exit'}).click();

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=test sports story 1.1')),
            'Edit',
        );
        await expect(
            page.locator(s('authoring', 'field--headline')).getByRole('textbox'),
        ).toHaveText('test sports story 1.1');
    });

    test('Can remove article in multiedit', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=test sports story')),
            'Edit',
        );
        await monitoring.executeActionInEditor(
            'Multiedit',
            'OK',
        );

        await page.locator(s('multiedit-screen', 'multiedit-article=test sports story')).hover();
        await page
            .locator(s('multiedit-screen', 'multiedit-article=test sports story'))
            .getByRole('button', {name: 'remove item'})
            .click();
        await expect(page.locator(s('multiedit-screen', 'multiedit-article=test sports story'))).not.toBeVisible();
    });
});
