import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {AIProviders} from './page-object-models/ai-providers';
import {EditorialActions} from './page-object-models/ai-studio';

test.describe('AI Studio editorial actions', () => {
    test.beforeEach(async ({page}) => {
        await restoreDatabaseSnapshot();

        const providers = new AIProviders(page);

        await providers.open();
        await providers.createProvider({
            name: 'Local OpenAI',
            baseUrl: 'https://example.test/v1',
            apiKey: 'secret-key',
            defaultModel: 'gpt-4o-mini',
        });
    });

    test('creates, renames, filters and deletes a suggestion action', async ({page}) => {
        const actions = new EditorialActions(page);

        await actions.open();
        await expect(actions.items).toHaveCount(0);

        await actions.startNew('suggestion');

        const editor = actions.editor;

        await editor.getByTestId('ai-action-name').fill('Headline ideas');
        await actions.addInputField('Body HTML');
        await editor.getByTestId('ai-action-output-field').selectOption({label: 'Headline'});
        await editor.getByTestId('ai-action-max-characters').fill('120');

        await actions.openTab('AI Settings');
        await editor.getByTestId('ai-action-provider').selectOption({label: 'Local OpenAI'});
        await editor.getByTestId('ai-action-extra-instructions').fill('Write in British English.');

        await actions.save();

        await expect(actions.items).toHaveCount(1);
        await expect(actions.item('Headline ideas')).toContainText('Max. characters: 120');

        await actions.openTab('Configuration');
        await editor.getByTestId('ai-action-name').fill('Headline options');
        await actions.save();

        await expect(actions.item('Headline options')).toBeVisible();
        await expect(actions.item('Headline ideas')).toHaveCount(0);

        await actions.filterBy('Summaries');
        await expect(actions.items).toHaveCount(0);

        await actions.filterBy('All');
        await expect(actions.items).toHaveCount(1);

        await actions.delete('Headline options');

        await expect(actions.items).toHaveCount(0);
        await expect(page.getByText('No editorial actions yet')).toBeVisible();
    });
});
