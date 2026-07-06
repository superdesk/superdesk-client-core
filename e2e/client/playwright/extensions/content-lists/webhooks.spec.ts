import {test, expect, Page} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from '../../utils';
import {createContentList, createWebhook} from './api-helpers';

async function openWebhooksModal(page: Page): Promise<void> {
    await page.goto('/#/content-lists');
    await page.locator(s('content-lists--settings-menu')).locator('button').click();
    await page.getByRole('button', {name: 'Webhooks', exact: true}).click();
    await expect(page.locator(s('manage-webhooks'))).toBeVisible();
}

test.describe('content lists webhooks', () => {
    test('adding a webhook via the modal', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createContentList('excluded one');

        await openWebhooksModal(page);

        await page.getByRole('button', {name: 'Add New Webhook'}).click();

        const panel = page.locator(s('webhook-edit-panel'));

        await expect(panel).toBeVisible();

        // save is disabled while the URL is empty
        await expect(panel.getByRole('button', {name: 'Save'})).toBeDisabled();

        await panel.locator(s('webhook-edit-panel--url')).fill('https://example.com/hook');
        await panel.getByRole('button', {name: 'Save'}).click();

        await expect(page.locator(s('webhook-item=https://example.com/hook'))).toBeVisible();
    });

    test('webhooks are grouped by enabled state', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createWebhook({url: 'https://example.com/enabled', enabled: true});
        await createWebhook({url: 'https://example.com/disabled', enabled: false});

        await openWebhooksModal(page);

        await expect(page.getByText('Enabled webhooks')).toBeVisible();
        await expect(page.getByText('Disabled webhooks')).toBeVisible();

        await expect(
            page.locator(s('webhook-item=https://example.com/enabled')).getByText('enabled', {exact: true}),
        ).toBeVisible();
        await expect(
            page.locator(s('webhook-item=https://example.com/disabled')).getByText('disabled', {exact: true}),
        ).toBeVisible();
    });

    test('editing a webhook', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createWebhook({url: 'https://example.com/initial', enabled: true});

        await openWebhooksModal(page);

        await page
            .locator(s('webhook-item=https://example.com/initial'))
            .getByRole('button', {name: 'Edit'})
            .click();

        const panel = page.locator(s('webhook-edit-panel'));

        await panel.locator(s('webhook-edit-panel--url')).fill('https://example.com/updated');
        await panel.getByRole('button', {name: 'Save'}).click();

        await expect(page.locator(s('webhook-item=https://example.com/updated'))).toBeVisible();
        await expect(page.locator(s('webhook-item=https://example.com/initial'))).toHaveCount(0);
    });

    test('deleting a webhook with confirmation', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createWebhook({url: 'https://example.com/doomed', enabled: true});

        await openWebhooksModal(page);

        const item = page.locator(s('webhook-item=https://example.com/doomed'));

        await item.getByRole('button', {name: 'Remove'}).click();
        await page.locator(s('confirmation-modal')).getByRole('button', {name: 'Confirm'}).click();

        await expect(item).toHaveCount(0);
    });
});
