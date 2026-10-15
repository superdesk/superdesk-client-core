import {test, expect, Page} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';

/**
 * The `main` snapshot has no `ai_providers` and the resource has no fixture, so tests create one
 * through the form. Resolves with the server-assigned `_id`, which the URL assertions need.
 */
async function createProvider(
    page: Page,
    provider: {name: string; baseUrl: string; apiKey: string; defaultModel?: string},
): Promise<string> {
    await page.getByTestId('list-page--add-item').click();

    const form = page.getByTestId('list-page--new-item');

    await form.getByTestId('gform-input--name').fill(provider.name);
    await form.getByTestId('gform-input--provider_type').selectOption('openai_compatible');
    await form.getByTestId('gform-input--base_url').fill(provider.baseUrl);
    await form.getByTestId('gform-input--api_key').fill(provider.apiKey);

    if (provider.defaultModel != null) {
        // the create form has a plain text input here: listing the models needs the stored key
        await form.getByTestId('gform-input--default_model').fill(provider.defaultModel);
    }

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

        // The key is write-only, so the edit form starts empty even though one was set.
        await expect(form.getByTestId('gform-input--api_key')).toHaveValue('');
        await expect(form.getByTestId('gform-alert--api_key_alert')).toBeVisible();

        await form.getByTestId('gform-input--api_key').fill('rotated-key');
        await form.getByTestId('gform-input--name').fill('Renamed provider');
        await form.getByTestId('gform-input--base_url').fill('https://renamed.test/v1');

        const patchRequest = waitForProviderPatch(page, providerId);

        await form.getByTestId('item-view-edit--save').click();

        // Asserted on the request: the server never returns a stored key, so the list cannot show it.
        expect((await patchRequest).postDataJSON().api_key).toBe('rotated-key');

        await expect(firstItem.getByTestId('gform-output--name')).toHaveText('Renamed provider');
        await expect(firstItem.getByTestId('ai-providers-item--base-url'))
            .toHaveText('https://renamed.test/v1');
    });

    test('reports a successful connection test', async ({page}) => {
        const testRequestUrls: Array<string> = [];

        // The provider is unreachable from the test environment, only the client handling is tested.
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

        // The row action must test this provider, not another value the row carries.
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

    test('offers the models of the provider as the default model', async ({page}) => {
        const modelsRequestUrls: Array<string> = [];

        // The provider is unreachable here, so the picker is fed the answer the backend would relay.
        await page.route('**/ai_providers/*/models', (route) => {
            modelsRequestUrls.push(route.request().url());

            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({models: ['gpt-4o-mini', 'gpt-4o']}),
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
        await firstItem.getByTestId('edit').click();

        const form = page.getByTestId('list-page--view-edit');
        const defaultModel = form.getByTestId('gform-input--default_model');

        await defaultModel.getByTestId('open-popover').click();

        const popover = page.getByTestId('tree-select-popover');

        await expect(popover.getByTestId('option')).toHaveText(['gpt-4o-mini', 'gpt-4o']);

        // The picker must ask for this provider's models, not another value on the form.
        expect(modelsRequestUrls.length).toBeGreaterThan(0);
        expect(modelsRequestUrls[0]).toContain(`/ai_providers/${providerId}/models`);

        await popover.getByTestId('option').filter({hasText: /^gpt-4o$/}).click();
        await form.getByTestId('item-view-edit--save').click();

        await firstItem.hover();
        await firstItem.getByTestId('edit').click();

        await expect(defaultModel.getByTestId('item')).toHaveText('gpt-4o');
    });

    test('offers every model as the default model, whatever the available models hold', async ({page}) => {
        // The provider is unreachable here, so the pickers are fed the answer the backend would relay.
        await page.route('**/ai_providers/*/models', (route) => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({models: ['gpt-4o-mini', 'gpt-4o', 'o1-mini']}),
        }));

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
        const availableModels = form.getByTestId('gform-input--available_models');
        const defaultModel = form.getByTestId('gform-input--default_model');
        const popover = page.getByTestId('tree-select-popover');

        for (const model of ['gpt-4o-mini', 'o1-mini']) {
            await availableModels.getByTestId('open-popover').click();
            await popover.getByTestId('option').filter({hasText: new RegExp(`^${model}$`)}).click();
        }

        await expect(availableModels.getByTestId('item')).toHaveText(['gpt-4o-mini', 'o1-mini']);

        await defaultModel.getByTestId('open-popover').click();

        // The shortlist restricts the AI actions, not the fallback the provider hands them, so
        // `gpt-4o` is still on offer here despite being left out of it.
        await expect(popover.getByTestId('option')).toHaveText(['gpt-4o-mini', 'gpt-4o', 'o1-mini']);

        await popover.getByTestId('option').filter({hasText: /^gpt-4o$/}).click();

        const patchRequest = waitForProviderPatch(page, providerId);

        await form.getByTestId('item-view-edit--save').click();

        const payload = (await patchRequest).postDataJSON();

        expect(payload.available_models).toEqual(['gpt-4o-mini', 'o1-mini']);
        expect(payload.default_model).toBe('gpt-4o');

        await firstItem.hover();
        await firstItem.getByTestId('edit').click();

        await expect(availableModels.getByTestId('item')).toHaveText(['gpt-4o-mini', 'o1-mini']);
        await expect(defaultModel.getByTestId('item')).toHaveText('gpt-4o');
    });

    test('clears the default model of a provider that has available models', async ({page}) => {
        await page.route('**/ai_providers/*/models', (route) => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({models: ['gpt-4o-mini', 'gpt-4o', 'o1-mini']}),
        }));

        const items = page.getByTestId('list-page--items').getByTestId('ai-providers-item');

        const providerId = await createProvider(page, {
            name: 'Local OpenAI',
            baseUrl: 'https://example.test/v1',
            apiKey: 'secret-key',
            defaultModel: 'gpt-4o',
        });

        await expect(items).toHaveCount(1);

        const firstItem = items.first();

        await firstItem.hover();
        await firstItem.getByTestId('edit').click();

        const form = page.getByTestId('list-page--view-edit');
        const availableModels = form.getByTestId('gform-input--available_models');
        const defaultModel = form.getByTestId('gform-input--default_model');
        const popover = page.getByTestId('tree-select-popover');

        await availableModels.getByTestId('open-popover').click();
        await popover.getByTestId('option').filter({hasText: /^o1-mini$/}).click();

        await defaultModel.getByTestId('clear-value').click();
        await expect(defaultModel.getByTestId('item')).toHaveCount(0);

        const patchRequest = waitForProviderPatch(page, providerId);

        await form.getByTestId('item-view-edit--save').click();

        // Emptying the picker is the only way the form can say "no default", so it sends an empty
        // string and the server stores no model.
        expect((await patchRequest).postDataJSON().default_model).toBe('');

        await firstItem.hover();
        await firstItem.getByTestId('edit').click();

        await expect(availableModels.getByTestId('item')).toHaveText(['o1-mini']);
        await expect(defaultModel.getByTestId('item')).toHaveCount(0);
    });

    test('keeps editing possible when the models cannot be listed', async ({page}) => {
        await page.route('**/ai_providers/*/models', (route) => route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({_error: {message: 'provider unreachable'}}),
        }));

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

        await expect(form.getByTestId('gform-message--default_model')).toBeVisible();

        // With the models out of reach the picker becomes a text input, so an id can still be typed.
        await form.getByTestId('gform-input--default_model').fill('hand-typed-model');
        await form.getByTestId('gform-input--name').fill('Renamed provider');

        const patchRequest = waitForProviderPatch(page, providerId);

        await form.getByTestId('item-view-edit--save').click();

        expect((await patchRequest).postDataJSON().default_model).toBe('hand-typed-model');

        await expect(firstItem.getByTestId('gform-output--name')).toHaveText('Renamed provider');
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
