import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

/**
 * when a desk is mentioned in article comments,
 * a notification must show up next to an incoming stage of that desk
 */
test('desk notifications', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

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
