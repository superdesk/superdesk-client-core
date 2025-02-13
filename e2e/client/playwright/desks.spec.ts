import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';
import {Monitoring} from './page-object-models/monitoring';

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
        s('widget-icon=comments-widget'),
    ).click();

    await page.locator(
        s('authoring-widget-panel'),
    ).getByPlaceholder('Type your comment').fill('#Sports hello');

    await page.locator(
        s('authoring-widget-panel'),
    ).getByRole('button', {name: 'Post'}).click();

    await expect(
        page.locator(
            s('monitoring-group=Sports / Incoming Stage', 'desk-notifications'),
        ),
    ).toContainText('1', {timeout: 10000});
});
