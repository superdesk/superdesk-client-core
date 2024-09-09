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

test('deleting a desk', async ({page}) => {
    await restoreDatabaseSnapshot();

    await page.goto('/#/settings/desks');

    await page.locator('[data-test-id="desk--Education"] [data-test-id="desk-actions"]').click();
    await page.locator('[data-test-id="desk--Education"] [data-test-id="desk-actions--remove"]').click();
    await page.locator('[data-test-id="modal-confirm"]').getByRole('button', {name: 'OK'}).click();
    await expect(page.locator('[data-test-id="desk--Education"]')).not.toBeVisible();
});

test('desk deletion being blocked if desk has published articles', async ({page}) => {
    await restoreDatabaseSnapshot();

    await page.goto('/#/settings/desks');

    await page.locator('[data-test-id="desk--Finance"] [data-test-id="desk-actions"]').click();
    await page.locator('[data-test-id="desk--Finance"] [data-test-id="desk-actions--remove"]').click();
    await page.locator('[data-test-id="modal-confirm"]').getByRole('button', {name: 'OK'}).click();
    await expect(page.getByText(
        'Error: Cannot delete desk as it has article(s) or referenced by versions of the article(s).',
    )).toBeVisible();

    await page.reload();

    await expect(page.locator('[data-test-id="desk--Finance"]')).toBeVisible({timeout: 5000});
});


test('desk deletion being blocked if a user has it assigned as default desk', async ({page}) => {
    await restoreDatabaseSnapshot();

    await page.goto('/#/settings/desks');

    await page.locator('[data-test-id="desk--Sports"] [data-test-id="desk-actions"]').click();
    await page.locator('[data-test-id="desk--Sports"] [data-test-id="desk-actions--remove"]').click();
    await page.locator('[data-test-id="modal-confirm"]').getByRole('button', {name: 'OK'}).click();
    await expect(page.getByText(
        'Error: Cannot delete desk as it is assigned as default desk to user(s).',
    )).toBeVisible();

    await page.reload();

    await expect(page.locator('[data-test-id="desk--Sports"]')).toBeVisible({timeout: 5000});
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
