import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {ContentLists} from './page-object-models/content-lists';
import {createContentList, createWebhook} from './utils/content-lists-api';

test.describe('content lists webhooks', () => {
    test('adding a webhook via the modal', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createContentList('excluded one');

        const contentLists = new ContentLists(page);

        await contentLists.openWebhooksModal();
        await contentLists.openNewWebhookPanel();

        // save is disabled while the URL is empty
        await expect(contentLists.webhookEditPanel.getByTestId('webhook-edit-panel--save')).toBeDisabled();

        await contentLists.fillWebhookUrl('https://example.com/hook');
        await contentLists.saveWebhook();

        await expect(contentLists.getWebhookItem('https://example.com/hook')).toBeVisible();
    });

    test('disabled webhooks are labeled', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createWebhook({url: 'https://example.com/enabled', enabled: true});
        await createWebhook({url: 'https://example.com/disabled', enabled: false});

        const contentLists = new ContentLists(page);

        await contentLists.openWebhooksModal();

        await expect(
            contentLists.getWebhookItem('https://example.com/disabled').getByText('Disabled', {exact: true}),
        ).toBeVisible();
        await expect(contentLists.getWebhookItem('https://example.com/enabled')).toBeVisible();
        await expect(
            contentLists.getWebhookItem('https://example.com/enabled').getByText('Disabled', {exact: true}),
        ).toHaveCount(0);
    });

    test('filtering webhooks by enabled state', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createWebhook({url: 'https://example.com/enabled', enabled: true});
        await createWebhook({url: 'https://example.com/disabled', enabled: false});

        const contentLists = new ContentLists(page);

        await contentLists.openWebhooksModal();
        await contentLists.filterWebhooks('enabled');

        await expect(contentLists.getWebhookItem('https://example.com/enabled')).toBeVisible();
        await expect(contentLists.getWebhookItem('https://example.com/disabled')).toHaveCount(0);
    });

    test('editing a webhook by clicking the item', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createWebhook({url: 'https://example.com/initial', enabled: true});

        const contentLists = new ContentLists(page);

        await contentLists.openWebhooksModal();
        await contentLists.getWebhookItem('https://example.com/initial').click();
        await expect(contentLists.webhookEditPanel).toBeVisible();

        await contentLists.fillWebhookUrl('https://example.com/updated');
        await contentLists.saveWebhook();

        await expect(contentLists.getWebhookItem('https://example.com/updated')).toBeVisible();
        await expect(contentLists.getWebhookItem('https://example.com/initial')).toHaveCount(0);
    });

    test('deleting a webhook with confirmation', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createWebhook({url: 'https://example.com/doomed', enabled: true});

        const contentLists = new ContentLists(page);

        await contentLists.openWebhooksModal();
        await contentLists.removeWebhook('https://example.com/doomed');

        await expect(contentLists.getWebhookItem('https://example.com/doomed')).toHaveCount(0);
    });
});
