import {test, expect, type Page} from '@playwright/test';
import {AuthoringReact} from './page-object-models/authoring-react';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';
import {editArticle} from './scenarios/authoring-react-article';

test.use({storageState: getStorageState({}, {authoringReact: true})});
test.setTimeout(60000);

const ARTICLE = 'test sports story';

async function openArticle(page: Page): Promise<AuthoringReact> {
    await restoreDatabaseSnapshot();

    return (await editArticle(page, ARTICLE)).authoring;
}

test('the "Populate Abstract" macro copies the body into the abstract and stores it', {
    annotation: [
        {type: 'confluence', description: '1332117825 complete'}, // Populate Abstract
        {type: 'confluence', description: '1344443792 complete'}, // Macros
    ],
}, async ({page}) => {
    const authoring = await openArticle(page);

    await expect(authoring.input('body_html')).toHaveText('test sport story body');
    await expect(authoring.input('abstract')).toHaveText('');

    await authoring.openWidgetByIcon('macros');

    const stored = page.waitForResponse(
        (r) => r.url().includes('/api/archive/') && r.request().method() === 'PATCH',
    );

    await authoring.runMacro('Populate Abstract');

    await expect(authoring.input('abstract')).toHaveText('test sport story body');
    expect((await (await stored).json()).abstract).toContain('test sport story body');
});

test.describe('validate for publish macro (authoring-react)', {
    annotation: [
        {type: 'confluence', description: '1332117823 complete'}, // Validate For Publish
    ],
}, () => {
    test('reports the validation errors a publish attempt would raise', async ({page}) => {
        const authoring = await openArticle(page);

        // the Story profile caps slugline at 24 characters; saving does not check it, publishing does
        await authoring.input('slugline').fill('a slugline well past the profile limit');
        await authoring.saveAndGetItem();

        const error = page.getByTestId('notification--error').filter({hasText: 'SLUGLINE is too long'});

        await authoring.openWidgetByIcon('macros');
        await authoring.runMacro('Validate for Publish');
        await expect(error).toBeVisible();

        // toasts are de-duplicated by text: dismiss this one or the next assertion could pass on it
        await error.click();
        await expect(error).toBeHidden();

        const publishPanel = await authoring.openActionsPanel();

        await publishPanel.getByTestId('publish').click();
        await expect(error).toBeVisible();
        await expect(authoring.root).toBeVisible();
    });

    test('reports no error when the item passes publish validation', async ({page}) => {
        const authoring = await openArticle(page);

        await authoring.openWidgetByIcon('macros');

        const response = await authoring.runMacro('Validate for Publish');

        expect(response.ok()).toBe(true);
        await expect(page.getByTestId('notification--error')).toHaveCount(0);
        await expect(authoring.root).toBeVisible();
    });

    test('closes the macros widget after a macro ran', async ({page}) => {
        // React gap: angular closes the widget once a macro has run, authoring-react keeps it open
        test.fixme();

        const authoring = await openArticle(page);
        const panel = await authoring.openWidgetByIcon('macros');

        expect((await authoring.runMacro('Validate for Publish')).ok()).toBe(true);
        await expect(panel).toBeHidden();
    });
});
