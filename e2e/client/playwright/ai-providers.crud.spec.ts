import {test, expect, Page} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';

/**
 * The `main` snapshot carries no `ai_providers`, and the resource has no fixture, so every
 * test that needs a provider creates one through the form first.
 *
 * Resolves with the `_id` the server assigned, which the tests that assert on request URLs and
 * payloads need.
 */
async function createProvider(
    page: Page,
    provider: {name: string; baseUrl: string; apiKey: string},
): Promise<string> {
    await page.getByTestId('list-page--add-item').click();

    const form = page.getByTestId('list-page--new-item');

    await form.getByTestId('gform-input--name').fill(provider.name);
    await form.getByTestId('gform-input--provider_type').selectOption('openai_compatible');
    await form.getByTestId('gform-input--base_url').fill(provider.baseUrl);
    await form.getByTestId('gform-input--api_key').fill(provider.apiKey);

    const [createResponse] = await Promise.all([
        page.waitForResponse((response) => response.request().method() === 'POST'
            && new URL(response.url()).pathname.endsWith('/ai_providers')),
        form.getByTestId('item-view-edit--save').click(),
    ]);

    return (await createResponse.json())._id;
}

function waitForProviderPatch(page: Page, providerId: string) {
    return page.waitForRequest((request) => request.method() === 'PATCH'
        && new URL(request.url()).pathname.endsWith(`/ai_providers/${providerId}`));
}

test.describe('AI providers settings', () => {
    test.beforeEach(async ({page}) => {
        await restoreDatabaseSnapshot();

        await page.goto('/#/settings/ai-providers');
    });

    test('creates a provider', async ({page}) => {
        const items = page.getByTestId('list-page--items').getByTestId('ai-providers-item');

        await expect(items).toHaveCount(0);

        await createProvider(page, {
            name: 'Local OpenAI',
            baseUrl: 'https://example.test/v1',
            apiKey: 'secret-key',
        });

        await expect(items).toHaveCount(1);
        await expect(items.first().getByTestId('gform-output--name')).toHaveText('Local OpenAI');
        await expect(items.first().getByTestId('ai-providers-item--type')).toHaveText('OpenAI compatible');
        await expect(items.first().getByTestId('ai-providers-item--base-url'))
            .toHaveText('https://example.test/v1');
    });

    test('edits a provider and replaces its stored api key', async ({page}) => {
        const items = page.getByTestId('list-page--items').getByTestId('ai-providers-item');

        const providerId = await createProvider(page, {
            name: 'Local OpenAI',
            baseUrl: 'https://example.test/v1',
            apiKey: 'secret-key',
        });

        await expect(items).toHaveCount(1);

        const firstItem = items.first();

        await firstItem.hover();
        await firstItem.getByTestId('edit').click();

        const form = page.getByTestId('list-page--view-edit');

        // The stored key is write-only on the server, so the edit form starts with an empty input
        // even though the provider was created with a key.
        await expect(form.getByTestId('gform-input--api_key')).toHaveValue('');
        await expect(form.getByTestId('gform-alert--api_key_alert')).toBeVisible();

        await form.getByTestId('gform-input--api_key').fill('rotated-key');
        await form.getByTestId('gform-input--name').fill('Renamed provider');
        await form.getByTestId('gform-input--base_url').fill('https://renamed.test/v1');

        const patchRequest = waitForProviderPatch(page, providerId);

        await form.getByTestId('item-view-edit--save').click();

        // The typed key has to reach the server; the list cannot show whether it did, since the
        // server never returns a stored key.
        expect((await patchRequest).postDataJSON().api_key).toBe('rotated-key');

        await expect(firstItem.getByTestId('gform-output--name')).toHaveText('Renamed provider');
        await expect(firstItem.getByTestId('ai-providers-item--base-url'))
            .toHaveText('https://renamed.test/v1');
    });

    test('reports a successful connection test', async ({page}) => {
        const testRequestUrls: Array<string> = [];

        // The provider is not reachable from the test environment; only the client handling
        // of the backend's answer is under test here.
        await page.route('**/ai_providers/*/test', (route) => {
            testRequestUrls.push(route.request().url());

            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ok: true, models_count: 3}),
            });
        });

        const items = page.getByTestId('list-page--items').getByTestId('ai-providers-item');

        const providerId = await createProvider(page, {
            name: 'Local OpenAI',
            baseUrl: 'https://example.test/v1',
            apiKey: 'secret-key',
        });

        await expect(items).toHaveCount(1);

        const firstItem = items.first();

        await firstItem.hover();
        await firstItem.getByTestId('test-connection').click();

        await expect(
            page.getByTestId('notification--success').filter({hasText: 'Models available: 3'}),
        ).toBeVisible();

        // The row action has to test this provider, not some other value the row carries.
        expect(testRequestUrls.length).toBeGreaterThan(0);
        expect(testRequestUrls[0]).toContain(`/ai_providers/${providerId}/test`);
    });

    test('reports a failed connection test', async ({page}) => {
        await page.route('**/ai_providers/*/test', (route) => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ok: false, error: 'invalid api key'}),
        }));

        const items = page.getByTestId('list-page--items').getByTestId('ai-providers-item');

        await createProvider(page, {
            name: 'Local OpenAI',
            baseUrl: 'https://example.test/v1',
            apiKey: 'secret-key',
        });
        await expect(items).toHaveCount(1);

        const firstItem = items.first();

        await firstItem.hover();
        await firstItem.getByTestId('test-connection').click();

        await expect(
            page.getByTestId('notification--error').filter({hasText: 'invalid api key'}),
        ).toBeVisible();
    });

    test('deletes a provider', async ({page}) => {
        const items = page.getByTestId('list-page--items').getByTestId('ai-providers-item');

        await createProvider(page, {
            name: 'Local OpenAI',
            baseUrl: 'https://example.test/v1',
            apiKey: 'secret-key',
        });
        await expect(items).toHaveCount(1);

        const firstItem = items.first();

        await firstItem.hover();
        await firstItem.getByTestId('delete').click();

        await page.getByTestId('confirmation-modal').getByRole('button', {name: 'Delete'}).click();

        await expect(items).toHaveCount(0);
    });
});
