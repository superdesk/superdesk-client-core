import {test, expect, Page, Locator} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from '../../utils';
import {createContentList, createWebhook} from './api-helpers';

async function openWebhooksModal(page: Page): Promise<void> {
    await page.goto('/#/content-lists');
    await page.locator(s('content-lists--settings-menu')).locator('button').click();

    // not an exact match: the item's icon is a font glyph rendered through a
    // ::before pseudo-element, and Chromium folds it into the accessible name
    await page.getByRole('menuitem', {name: 'Webhooks'}).click();
    await expect(page.locator(s('manage-webhooks'))).toBeVisible();
}

// the row element; hover actions live outside the content wrapper carrying the test id
function webhookRow(page: Page, url: string): Locator {
    return page.locator('li').filter({has: page.locator(s(`webhook-item=${url}`))});
}

test.describe('content lists webhooks', () => {
    test('adding a webhook via the modal', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createContentList('excluded one');

        await openWebhooksModal(page);

        await page.getByRole('button', {name: 'Create new webhook'}).click();

        const panel = page.locator(s('webhook-edit-panel'));

        await expect(panel).toBeVisible();

        // save is disabled while the URL is empty
        await expect(panel.getByRole('button', {name: 'Save'})).toBeDisabled();

        await panel.locator(s('webhook-edit-panel--url')).fill('https://example.com/hook');
        await panel.getByRole('button', {name: 'Save'}).click();

        await expect(page.locator(s('webhook-item=https://example.com/hook'))).toBeVisible();
    });

    test('disabled webhooks are labeled', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createWebhook({url: 'https://example.com/enabled', enabled: true});
        await createWebhook({url: 'https://example.com/disabled', enabled: false});

        await openWebhooksModal(page);

        await expect(
            page.locator(s('webhook-item=https://example.com/disabled')).getByText('Disabled', {exact: true}),
        ).toBeVisible();
        await expect(page.locator(s('webhook-item=https://example.com/enabled'))).toBeVisible();
        await expect(
            page.locator(s('webhook-item=https://example.com/enabled')).getByText('Disabled', {exact: true}),
        ).toHaveCount(0);
    });

    test('filtering webhooks by enabled state', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createWebhook({url: 'https://example.com/enabled', enabled: true});
        await createWebhook({url: 'https://example.com/disabled', enabled: false});

        await openWebhooksModal(page);

        await page.locator(s('manage-webhooks')).getByRole('button', {name: 'All'}).click();
        await page.getByRole('menuitem', {name: 'Enabled', exact: true}).click();

        await expect(page.locator(s('webhook-item=https://example.com/enabled'))).toBeVisible();
        await expect(page.locator(s('webhook-item=https://example.com/disabled'))).toHaveCount(0);
    });

    test('editing a webhook by clicking the item', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createWebhook({url: 'https://example.com/initial', enabled: true});

        await openWebhooksModal(page);

        await page.locator(s('webhook-item=https://example.com/initial')).click();

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

        const row = webhookRow(page, 'https://example.com/doomed');

        await row.hover();
        await row.getByRole('button', {name: 'Actions'}).click();
        await page.getByRole('menuitem', {name: 'Remove'}).click();
        await page.locator(s('confirmation-modal')).getByRole('button', {name: 'Confirm'}).click();

        await expect(row).toHaveCount(0);
    });
});
