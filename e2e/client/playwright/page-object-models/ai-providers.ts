import {Page} from '@playwright/test';

export interface IAIProviderFields {
    name: string;
    baseUrl: string;
    apiKey: string;
    defaultModel?: string;
}

export class AIProviders {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async open() {
        await this.page.goto('/#/settings/ai-providers');
    }

    /** The `main` snapshot has no providers, so tests create one. Resolves with its `_id` */
    async createProvider(provider: IAIProviderFields): Promise<string> {
        await this.page.getByTestId('list-page--add-item').click();

        const form = this.page.getByTestId('list-page--new-item');

        await form.getByTestId('gform-input--name').fill(provider.name);
        await form.getByTestId('gform-input--provider_type').selectOption('openai_compatible');
        await form.getByTestId('gform-input--base_url').fill(provider.baseUrl);
        await form.getByTestId('gform-input--api_key').fill(provider.apiKey);

        if (provider.defaultModel != null) {
            // the create form has a plain text input here: listing the models needs the stored key
            await form.getByTestId('gform-input--default_model').fill(provider.defaultModel);
        }

        const [createResponse] = await Promise.all([
            this.page.waitForResponse((response) => response.request().method() === 'POST'
                && new URL(response.url()).pathname.endsWith('/ai_providers')),
            form.getByTestId('item-view-edit--save').click(),
        ]);

        return (await createResponse.json())._id;
    }
}
