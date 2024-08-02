import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s, withTestContext} from './utils';
import {Monitoring} from './page-object-models/monitoring';

test('adding a desk', async ({page}) => {
    await restoreDatabaseSnapshot();

    await page.goto('/#/settings/desks');

    await page.locator(s('add-new-desk')).click();

    await withTestContext('desk-config-modal', async ({cs}) => {
        await page.locator(cs('field--name')).fill('desk 7');
        await page.locator(cs('field--source')).fill('from desk 7');
        await page.locator(cs('field--default-content-template')).selectOption('story 2');
        await page.locator(cs('field--default-content-profile')).selectOption('Story');
        await page.locator(cs('field--desk-type')).selectOption('production');
        await page.locator(cs('done')).click();
    });

    await expect(page.locator(s('desk--desk 7'))).toBeVisible();
});

/**
 * when a desk is mentioned in article comments,
 * a notification must show up next to an incoming stage of that desk
 */
test('desk notifications', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');
    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    await page.locator(
        s('authoring-widget=Comments'),
    ).click();

    await page.locator(
        s('comments-widget', 'new-comment-input'),
    ).fill('#Sports hello');

    await page.locator(
        s('comments-widget', 'new-comment-submit'),
    ).click();

    await expect(
        page.locator(
            s('monitoring-group=Sports / Incoming Stage', 'desk-notifications'),
        ),
    ).toContainText('1', {timeout: 10000});
});
