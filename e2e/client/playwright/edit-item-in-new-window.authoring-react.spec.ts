import {test, expect, type Page} from '@playwright/test';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

/**
 * QA case "Edit item in new window" (1311835229) on authoring-react. The popup shares the
 * opener's localStorage, so it opens authoring-react too.
 */

test.use({storageState: getStorageState({}, {authoringReact: true})});

// the popup loads the whole client a second time
test.setTimeout(90000);

const ARTICLE = 'test sports story';

async function openMonitoring(page: Page): Promise<Monitoring> {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await expect(monitoring.getArticleLocator(ARTICLE)).toBeVisible();

    return monitoring;
}

async function editInNewWindow(page: Page, monitoring: Monitoring): Promise<{popup: Page; authoring: AuthoringReact}> {
    const menu = await monitoring.openArticleActionsMenu(monitoring.getArticleLocator(ARTICLE));

    const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        menu.getByRole('button', {name: 'Edit in new Window', exact: true}).click(),
    ]);

    const authoring = new AuthoringReact(popup);

    await expect(authoring.root).toBeVisible({timeout: 30000});
    await authoring.waitUntilOpen();
    await expect(authoring.saveButtonReact).toBeVisible();

    return {popup, authoring};
}

// the popup closes itself only after its save or discard and its unlock have resolved
async function expectWindowClosed(popup: Page): Promise<void> {
    await expect.poll(() => popup.isClosed(), {timeout: 30000}).toBe(true);
}

async function reopenInOpener(page: Page, monitoring: Monitoring): Promise<AuthoringReact> {
    const item = monitoring.getArticleLocator(ARTICLE);
    const authoring = new AuthoringReact(page);

    await expect(item.getByTestId('article-item-locked')).toHaveCount(0);
    await item.dblclick();
    await authoring.waitUntilOpen();

    return authoring;
}

test.describe('editing an item in a new window (authoring-react)', {
    annotation: [
        {type: 'confluence', description: '1311835229 complete'}, // Edit item in new window
    ],
}, () => {
    test('locks the item in the list; Cancel returns to the article and Ignore discards the change',
        async ({page}) => {
            const monitoring = await openMonitoring(page);
            const {popup, authoring} = await editInNewWindow(page, monitoring);

            await expect(monitoring.getArticleLocator(ARTICLE).getByTestId('article-item-locked')).toHaveCount(1);

            await authoring.replaceEditor3FieldText(authoring.input('headline'), 'edited in new window');
            await authoring.closeButton.click();
            await expect(authoring.unsavedChangesDialog).toBeVisible();

            await authoring.unsavedChangesDialog.getByRole('button', {name: 'Cancel', exact: true}).click();
            await expect(authoring.unsavedChangesDialog).toHaveCount(0);
            await expect(authoring.input('headline')).toHaveText('edited in new window');

            await authoring.closeButton.click();
            await authoring.unsavedChangesDialog.getByRole('button', {name: 'Ignore', exact: true}).click();
            await expectWindowClosed(popup);

            const reopened = await reopenInOpener(page, monitoring);

            await expect(reopened.input('headline')).toHaveText('test sports story');
        });

    test('Save keeps the window open, Close then closes it and the change survives a reopen', async ({page}) => {
        const monitoring = await openMonitoring(page);
        const {popup, authoring} = await editInNewWindow(page, monitoring);

        await authoring.replaceEditor3FieldText(authoring.input('body_html'), 'body edited in the new window');

        const saved = await authoring.saveAndGetItem();

        expect(saved.body_html).toContain('body edited in the new window');
        await expect(authoring.root).toBeVisible();

        await authoring.closeButton.click();
        await expectWindowClosed(popup);

        const reopened = await reopenInOpener(page, monitoring);

        await expect(reopened.input('body_html')).toHaveText('body edited in the new window');
    });

    test('Save in the unsaved changes prompt saves and closes the window', async ({page}) => {
        const monitoring = await openMonitoring(page);
        const {popup, authoring} = await editInNewWindow(page, monitoring);

        await authoring.replaceEditor3FieldText(authoring.input('headline'), 'saved from the prompt');
        await authoring.closeButton.click();
        await authoring.unsavedChangesDialog.getByRole('button', {name: 'Save', exact: true}).click();
        await expectWindowClosed(popup);

        const reopened = await reopenInOpener(page, monitoring);

        await expect(reopened.input('headline')).toHaveText('saved from the prompt');
    });
});
