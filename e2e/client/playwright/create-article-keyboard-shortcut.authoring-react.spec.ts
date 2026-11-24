import {test, expect, type Page} from '@playwright/test';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, SUPERDESK_API_URL} from './utils';
import {getStorageState} from './utils/storage-state';

/**
 * QA case "Create new article with a keyboard shortcut" (1310851155) on authoring-react.
 *
 * The shortcut stores the article in `archive` at version 0 before anything is typed, and
 * monitoring hides version-0 items, so "not created" is checked against `archive` itself.
 */

test.use({storageState: getStorageState({}, {authoringReact: true})});
test.setTimeout(60000);

const ANCHOR_ARTICLE = 'test sports story';

function openArticleId(page: Page): string {
    const match = page.url().match(/[?&]item=([^&]+)/);

    if (match == null) {
        throw new Error(`no article is open in ${page.url()}`);
    }

    return decodeURIComponent(match[1]);
}

async function archiveStatus(page: Page, articleId: string): Promise<number> {
    const token = await page.evaluate(() => window.localStorage.getItem('sess:token'));
    const response = await page.request.get(`${SUPERDESK_API_URL}/archive/${articleId}`, {
        headers: {Authorization: token ?? ''},
        failOnStatusCode: false,
    });

    return response.status();
}

async function openSportsAndPressShortcut(page: Page): Promise<{monitoring: Monitoring; authoring: AuthoringReact}> {
    const monitoring = new Monitoring(page);
    const authoring = new AuthoringReact(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await expect(monitoring.getListedArticle(ANCHOR_ARTICLE)).toBeVisible();

    await page.keyboard.press('Control+m');
    await authoring.waitUntilOpen();

    return {monitoring, authoring};
}

test.describe('creating a new article with the Ctrl+M shortcut (authoring-react)', {
    annotation: [
        // Create new article with a keyboard shortcut
        {type: 'confluence', description: '1310851155 complete'},
    ],
}, () => {
    test('Cancel returns to the article and Ignore discards it without creating anything', async ({page}) => {
        const {monitoring, authoring} = await openSportsAndPressShortcut(page);
        const articleId = openArticleId(page);

        expect(await archiveStatus(page, articleId)).toBe(200);
        await expect(authoring.saveButtonReact).toBeDisabled();

        await authoring.input('slugline').fill('discarded shortcut slugline');
        await authoring.replaceEditor3FieldText(authoring.input('headline'), 'discarded shortcut story');

        await authoring.closeButton.click();
        await expect(authoring.unsavedChangesDialog).toBeVisible();
        await authoring.unsavedChangesDialog.getByRole('button', {name: 'Cancel', exact: true}).click();

        await expect(authoring.unsavedChangesDialog).toHaveCount(0);
        await expect(authoring.input('headline')).toHaveText('discarded shortcut story');

        await authoring.closeButton.click();
        await authoring.unsavedChangesDialog.getByRole('button', {name: 'Ignore', exact: true}).click();

        await expect(authoring.root).toHaveCount(0);
        await expect(monitoring.getListedArticle(ANCHOR_ARTICLE)).toBeVisible();
        await expect.poll(() => archiveStatus(page, articleId)).toBe(404);
    });

    test('a saved article is listed and reopens with its data', async ({page}) => {
        const {monitoring, authoring} = await openSportsAndPressShortcut(page);

        await authoring.input('slugline').fill('saved shortcut slugline');
        await authoring.replaceEditor3FieldText(authoring.input('headline'), 'saved shortcut story');
        await authoring.replaceEditor3FieldText(authoring.input('body_html'), 'saved shortcut body');

        const saved = await authoring.saveAndGetItem();

        expect(saved.headline).toBe('saved shortcut story');
        await expect(monitoring.getListedArticle('saved shortcut story')).toBeVisible();

        await authoring.closeExpectingNoPrompt();
        await monitoring.getListedArticle('saved shortcut story').dblclick();
        await authoring.waitUntilOpen();

        await expect(authoring.input('slugline')).toHaveText('saved shortcut slugline');
        await expect(authoring.input('body_html')).toHaveText('saved shortcut body');
    });
});
