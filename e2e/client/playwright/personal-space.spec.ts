import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test.describe('Personal Space', async () => {
    test('Create article in Personal space', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/personal');

        await monitoring.createArticleFromTemplate('article 1');
        await page.locator(s('authoring-topbar')).locator(s('save')).click();
        await expect(page.locator(s('monitoring-group=Personal Items', 'article-item=article 1'))).toBeVisible();
    });

    test('Edit article in Personal space', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/personal');

        //TODO: need to fix executeActionOnMonitoringItem function
        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=personal space article 1')),
            'Edit',
        );
        await page.locator(s('authoring')).locator(s('field-slugline')).fill('personal space article 1.1');
        await page.locator(s('authoring-topbar')).locator(s('save')).click();
        await expect(page.locator(s('monitoring-group=Personal Items', 'article-item=personal space article 1'))).not.toBeVisible();
        await expect(
            page.locator(s('monitoring-group=Personal Items', 'article-item=personal space article 1.1')),
        ).toBeVisible();
    });

    test('Copy article in Personal space', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/personal');

        await expect(page.locator(s('article-item=personal space article 1'))).toHaveCount(1);

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=personal space article 1')),
            'Copy',
        );

        await expect(page.locator(s('article-item=personal space article 1'))).toHaveCount(2);
    });

    test('Send item from Personal space', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await page.locator(s('Personal space')).click();

        // send article to desk
        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=personal space article 1')),
            'Send to',
        );
        await page.locator(s('interactive-actions-panel')).locator(s('item'), {hasText: 'Working Stage'}).check();
        await page.locator(s('interactive-actions-panel')).locator(s('send')).click();

        // check if article removed from personal space
        await expect(
            page.locator(s('monitoring-group=Personal Items', 'article-item=personal space article 1')),
        ).not.toBeVisible();

        // go to monitoring and check visibility of article
        await page.goto('/#/workspace/monitoring');
        await expect(page.locator(s('monitoring-view', 'monitoring-group=Sports / Working Stage'))).toBeVisible();
    });
});
