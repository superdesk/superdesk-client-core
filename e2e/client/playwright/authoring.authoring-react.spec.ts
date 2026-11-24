import {test, expect, Page} from '@playwright/test';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {OpenedArticles} from './page-object-models/opened-articles';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';
import {createArticleFromTemplate, editArticle} from './scenarios/authoring-react-article';

test.use({storageState: getStorageState({}, {authoringReact: true})});

const WORKING_STAGE = 'Sports / Working Stage';

// the list anchor that proves the group has loaded before an absence is asserted
const ANCHOR = 'test sports story';

async function createStory(page: Page): Promise<{monitoring: Monitoring; authoring: AuthoringReact}> {
    await restoreDatabaseSnapshot();

    return createArticleFromTemplate(page, 'story');
}

function workingStageItem(monitoring: Monitoring, slugline: string) {
    return monitoring.getGroupLocator(WORKING_STAGE).getByTestId('article-item').filter({hasText: slugline});
}

test.describe('creating, saving and closing an article (authoring-react)', {
    annotation: [
        {type: 'confluence', description: '1310851153 complete'}, // Create new article
        {type: 'confluence', description: '1310851164 complete'}, // Create, save and close new article
    ],
}, () => {
    test('Cancel in the unsaved changes prompt keeps the article open, Ignore discards it', async ({page}) => {
        const {monitoring, authoring} = await createStory(page);

        await authoring.input('slugline').fill('discarded article');
        await authoring.closeButton.click();
        await expect(authoring.unsavedChangesDialog).toBeVisible();

        await authoring.unsavedChangesDialog.getByRole('button', {name: 'Cancel', exact: true}).click();
        await expect(authoring.unsavedChangesDialog).toHaveCount(0);
        await expect(authoring.input('slugline')).toHaveText('discarded article');

        await authoring.closeButton.click();
        await authoring.unsavedChangesDialog.getByRole('button', {name: 'Ignore', exact: true}).click();

        await expect(authoring.root).toHaveCount(0);
        await expect(monitoring.getGroupedArticleLocator(WORKING_STAGE, ANCHOR)).toBeVisible();
        await expect(workingStageItem(monitoring, 'discarded article')).toHaveCount(0);
    });

    test('Save in the unsaved changes prompt saves and closes the article', async ({page}) => {
        const {monitoring, authoring} = await createStory(page);

        await authoring.input('slugline').fill('saved article');
        await authoring.replaceEditor3FieldText(authoring.input('headline'), 'saved article headline');
        await authoring.closeButton.click();

        const saved = page.waitForResponse(
            (response) => response.url().includes('/api/archive/') && response.request().method() === 'PATCH',
        );

        await authoring.unsavedChangesDialog.getByRole('button', {name: 'Save', exact: true}).click();
        expect((await saved).ok()).toBe(true);

        await expect(authoring.root).toHaveCount(0);
        await expect(workingStageItem(monitoring, 'saved article')).toBeVisible();

        await workingStageItem(monitoring, 'saved article').dblclick();
        await authoring.waitUntilOpen();
        await expect(authoring.input('headline')).toHaveText('saved article headline');
    });

    test('Save keeps the article open with Save disabled, and Close then closes without a prompt', async ({page}) => {
        const {monitoring, authoring} = await createStory(page);

        await authoring.input('slugline').fill('saved from the toolbar');

        const saved = await authoring.saveAndGetItem();

        expect(saved.slugline).toBe('saved from the toolbar');
        await expect(authoring.root).toBeVisible();
        await expect(workingStageItem(monitoring, 'saved from the toolbar')).toBeVisible();

        await authoring.closeExpectingNoPrompt();
    });

    // `main` ships two headline-less articles open in the bar, which it also labels "Untitled"
    test('closing a new article nothing was typed into takes it off the open items bar', async ({page}) => {
        const {monitoring, authoring} = await createStory(page);
        const untitled = new OpenedArticles(page).getBarItem('Untitled');

        await expect(untitled).toHaveCount(3);

        await authoring.closeExpectingNoPrompt();

        await expect(monitoring.getGroupedArticleLocator(WORKING_STAGE, ANCHOR)).toBeVisible();
        await expect(untitled).toHaveCount(2);
    });
});

test('editing an existing article saves the change and shows it after a reopen', {
    annotation: [
        {type: 'confluence', description: '1308524765 complete'}, // Edit existing item
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();

    const {monitoring, authoring} = await editArticle(page, ANCHOR);

    await expect(authoring.input('body_html')).toHaveText('test sport story body');
    await authoring.replaceEditor3FieldText(authoring.input('headline'), 'edited headline');

    const saved = await authoring.saveAndGetItem();

    expect(saved.headline).toBe('edited headline');

    await authoring.closeExpectingNoPrompt();
    await monitoring.getGroupedArticleLocator(WORKING_STAGE, ANCHOR).dblclick();
    await authoring.waitUntilOpen();
    await expect(authoring.input('headline')).toHaveText('edited headline');
});
