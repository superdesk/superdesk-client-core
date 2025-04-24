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

test('can mark/unmark for desk', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story')),
        'Mark for desk',
        'Finances',
    );

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story', 'mark-for-desk--bell'),
    ).click();

    await expect(page.locator(s('marked-desk-list'))).toContainText('Finances');

    // unmark from a desk
    await page.locator(s(
        'monitoring-group=Sports / Working Stage',
        'article-item=test sports story',
        'mark-for-desk--bell',
    )).click();

    await page.locator(s('marked-desk-list')).getByRole('button', {name: 'remove'}).click();

    await expect(
        page.locator(s(
            'monitoring-group=Sports / Working Stage',
            'article-item=test sports story',
            'mark-for-desk--bell',
        )),
    ).not.toBeVisible();
});

test('Switching between desks', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await expect(page.locator(s('monitoring-view', 'article-item=test sports story'))).toBeVisible();
    await expect(page.locator(s('monitoring-view', 'article-item=Finances Story'))).not.toBeVisible();
    await page.goto('/#/workspace/spike-monitoring');
    await expect(page.locator(s('monitoring-view', 'article-item=Story 4'))).toBeVisible();

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Finances');

    await expect(page.locator(s('monitoring-view', 'article-item=test sports story'))).not.toBeVisible();
    await expect(page.locator(s('monitoring-view', 'article-item=Finances Story'))).toBeVisible();
    await page.goto('/#/workspace/spike-monitoring');
    await expect(page.locator(s('monitoring-view', 'article-item=Story 4'))).not.toBeVisible();
});

test('Removing desks', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/desks');

    // desk Education is empty one and can be removed
    await page.locator(s('desk--Education', 'desk-actions')).click();
    await page.locator(s('desk-actions--options')).getByRole('button', {name: 'Remove'}).click();
    await page.locator(s('modal-confirm')).getByRole('button', {name: 'Ok'}).click();
    await expect(page.locator(s('desk--Education'))).not.toBeVisible();

    // desk Sports is NOT empty and can NOT be removed
    await page.locator(s('desk--Sports', 'desk-actions')).click();
    await page.locator(s('desk-actions--options')).getByRole('button', {name: 'Remove'}).click();
    await page.locator(s('modal-confirm')).getByRole('button', {name: 'Ok'}).click();
    await expect(page.locator(s('notification--error'))).toBeVisible();
    await expect(page.locator(s('desk--Sports'))).toBeVisible();
});
