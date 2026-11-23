import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getEditor3Field, pressRepeatedly} from './utils/editor3';

test.describe('links in the article body', () => {
    const URL = 'https://example.com/sourcefabric';
    const LINK_TEXT = 'linked words';

    test('a URL link added from the toolbar is stored and survives save and reopen', {
        annotation: [
            {type: 'confluence', description: '1327759495 complete'}, // Add link to Body Editor3 (automated)
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.getArticleLocator('test sports story').dblclick();

        const body = getEditor3Field(page, 'body_html');
        const text = body.getByRole('textbox');
        const link = text.locator(`a[href="${URL}"]`);

        await expect(text.locator('a')).toHaveCount(0);

        // the autosave re-renders the editor, which would drop an open link popup
        await authoring.withAutosave(async () => {
            await text.click();
            await page.keyboard.type(LINK_TEXT);
        });
        await pressRepeatedly(page, 'Shift+ArrowLeft', LINK_TEXT.length);

        await body.getByTestId('toolbar').getByRole('button', {name: 'Link (Ctrl+K)'}).click();

        const form = page.getByTestId('link-url');
        const urlInput = form.getByRole('textbox');

        await expect(async () => {
            await urlInput.fill(URL);
            await expect(urlInput).toHaveValue(URL, {timeout: 1000});
        }).toPass();

        await authoring.withAutosave(() => form.getByRole('button', {name: 'Insert'}).click());

        await expect(form).toBeHidden();
        await expect(link).toHaveText(LINK_TEXT);

        const {response} = await authoring.saveAndGetRequest();

        expect(response.body_html).toContain(`<a href="${URL}">${LINK_TEXT}</a>`);

        await authoring.close();
        await monitoring.getArticleLocator('test sports story').dblclick();

        await expect(link).toHaveText(LINK_TEXT);
    });
});
