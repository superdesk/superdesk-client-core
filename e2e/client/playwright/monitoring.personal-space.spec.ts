import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test('creating an article in personal space', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/personal');

    await monitoring.createArticleFromTemplate('story', 'article 1');
    await page.locator(s('authoring-topbar', 'save')).click();
    await expect(page.locator(s('monitoring-group=Personal Items', 'article-item=article 1'))).toBeVisible();
});

test('editing an article in personal space', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/personal');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=personal space article 1')),
        'Edit',
    );
    await page.locator(s('authoring', 'field-slugline')).fill('personal space article 1.1');
    await page.locator(s('authoring-topbar', 'save')).click();
    await expect(
        page.locator(s('monitoring-group=Personal Items', 'article-item=personal space article 1')),
    ).not.toBeVisible();
    await expect(
        page.locator(s('monitoring-group=Personal Items', 'article-item=personal space article 1.1')),
    ).toBeVisible();
});

test('copying an article in personal space', async ({page}) => {
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

test('sending an item from personal space', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/personal');

    // send article to desk
    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=personal space article 1')),
        'Send to',
    );
    await page.locator(s('interactive-actions-panel')).locator(s('item'), {hasText: 'Working Stage'}).check();
    await page.locator(s('interactive-actions-panel', 'send')).click();

    // check if article removed from personal space
    await expect(
        page.locator(s('monitoring-group=Personal Items', 'article-item=personal space article 1')),
    ).not.toBeVisible();

    // go to monitoring and check visibility of article
    await page.goto('/#/workspace/monitoring');
    await expect(page.locator(s('monitoring-view', 'monitoring-group=Sports / Working Stage'))).toBeVisible();
});