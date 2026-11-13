import {test, expect, type Locator, type Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, SUPERDESK_API_URL} from './utils';
import {setEditor3FieldValue} from './utils/editor3';

/**
 * QA case "Create new article with a keyboard shortcut" (1310851155).
 *
 * The shortcut persists the article to `archive` at version 0 before anything is typed,
 * and typing only reaches `archive_autosave`. Every monitoring and search query filters
 * version-0 drafts out, so "not created" is checked against the `archive` resource,
 * the only place a surviving stub would show.
 */

interface IArticleFields {
    slugline: string;
    headline: string;
    abstract: string;
    body: string;
}

const DISCARDED: IArticleFields = {
    slugline: 'discarded shortcut slugline',
    headline: 'discarded shortcut story',
    abstract: 'discarded shortcut abstract',
    body: 'discarded shortcut body',
};

const SAVED: IArticleFields = {
    slugline: 'saved shortcut slugline',
    headline: 'saved shortcut story',
    abstract: 'saved shortcut abstract',
    body: 'saved shortcut body',
};

const UPDATED_ABSTRACT = 'saved shortcut abstract, edited';

// Snapshot article of the Sports desk, the "list has loaded" anchor.
const ANCHOR_ARTICLE = 'test sports story';

const SEARCH_TERM = 'story';

// The label is exposed as `data-test-value` only, so `filter({hasText})` cannot match it.
function withLabel(items: Locator, label: string): Locator {
    return items.and(items.page().locator(`[data-test-value="${label}"]`));
}

function monitoringItems(page: Page): Locator {
    return page.getByTestId('monitoring-view').getByTestId('article-item');
}

// Waits for ANCHOR_ARTICLE so a later absence assertion cannot pass on a list that never loaded.
async function openSportsMonitoring(page: Page, monitoring: Monitoring): Promise<void> {
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await expect(withLabel(monitoringItems(page), ANCHOR_ARTICLE)).toBeVisible();
}

async function openGlobalSearch(page: Page): Promise<Locator> {
    await page.goto('/#/search');

    const results = page.getByTestId('article-item');

    await expect(results.first()).toBeVisible();

    return results;
}

function sluglineField(page: Page): Locator {
    return page.getByTestId('authoring').getByTestId('field-slugline');
}

function openArticleId(page: Page): string {
    const match = page.url().match(/[?&]item=([^&]+)/);

    if (match == null) {
        throw new Error(`no article is open in ${page.url()}`);
    }

    return decodeURIComponent(match[1]);
}

async function recordStatus(page: Page, resource: string, articleId: string): Promise<number> {
    const token = await page.evaluate(() => window.localStorage.getItem('sess:token'));

    if (token == null) {
        throw new Error('no session token in localStorage');
    }

    const response = await page.request.get(`${SUPERDESK_API_URL}/${resource}/${articleId}`, {
        headers: {Authorization: token},
        failOnStatusCode: false,
    });

    return response.status();
}

async function fillArticleFields(authoring: Authoring, page: Page, fields: IArticleFields): Promise<void> {
    await sluglineField(page).fill(fields.slugline);
    await setEditor3FieldValue(authoring.field('field--headline'), fields.headline);
    await setEditor3FieldValue(authoring.field('authoring-field=abstract'), fields.abstract);
    await setEditor3FieldValue(authoring.field('authoring-field=body_html'), fields.body);
}

async function expectArticleFields(authoring: Authoring, page: Page, fields: IArticleFields): Promise<void> {
    await expect(sluglineField(page)).toHaveValue(fields.slugline);
    await expect(authoring.field('field--headline')).toHaveText(fields.headline);
    await expect(authoring.field('authoring-field=abstract')).toHaveText(fields.abstract);
    await expect(authoring.field('authoring-field=body_html')).toHaveText(fields.body);
}

test.describe('creating a new article with the Ctrl+M shortcut', {
    annotation: [
        // Create new article with a keyboard shortcut
        {type: 'confluence', description: '1310851155 complete'},
    ],
}, () => {
    test('Cancel returns to the article and Ignore discards it without creating anything', async ({page}) => {
        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot();
        await openSportsMonitoring(page, monitoring);

        await monitoring.createArticleWithKeyboardShortcut();

        const articleId = openArticleId(page);
        const topbar = page.getByTestId('authoring-topbar');

        // Without this, the absence check after Ignore would prove nothing.
        expect(await recordStatus(page, 'archive', articleId)).toBe(200);

        await expect(topbar.getByTestId('save')).toBeDisabled();

        await fillArticleFields(authoring, page, DISCARDED);

        await topbar.getByTestId('close').click();

        const prompt = page.getByTestId('unsaved-changes-dialog');

        await expect(prompt).toBeVisible();
        await expect(prompt.getByRole('button', {name: 'Ignore', exact: true})).toBeVisible();
        await expect(prompt.getByRole('button', {name: 'Cancel', exact: true})).toBeVisible();
        await expect(prompt.getByRole('button', {name: 'Save', exact: true})).toBeVisible();

        await prompt.getByRole('button', {name: 'Cancel', exact: true}).click();

        await expect(prompt).toBeHidden();
        await expect(page.getByTestId('authoring')).toBeVisible();
        await expectArticleFields(authoring, page, DISCARDED);

        await topbar.getByTestId('close').click();
        await prompt.getByRole('button', {name: 'Ignore', exact: true}).click();

        await expect(page.getByTestId('authoring')).toBeHidden();
        await expect(withLabel(monitoringItems(page), ANCHOR_ARTICLE)).toBeVisible();

        // The delete is still in flight while the view closes.
        await expect.poll(() => recordStatus(page, 'archive', articleId)).toBe(404);
    });

    test('a saved article is listed, searchable, and reopens with its data', async ({page}) => {
        test.setTimeout(90000);

        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot();
        await openSportsMonitoring(page, monitoring);

        await monitoring.createArticleWithKeyboardShortcut();

        const articleId = openArticleId(page);

        await fillArticleFields(authoring, page, SAVED);

        await authoring.save();

        await expect(page.getByTestId('authoring')).toBeVisible();
        await expect(page.getByTestId('authoring-topbar').getByTestId('save')).toBeDisabled();
        await expect(withLabel(monitoringItems(page), SAVED.headline)).toBeVisible();

        const abstractAutosaved = page.waitForRequest(
            (request) => request.method() === 'POST' && request.url().includes('/archive_autosave'),
        );

        await setEditor3FieldValue(authoring.field('authoring-field=abstract'), UPDATED_ABSTRACT);

        // Save re-enabling means the edit reached the article model, so closing prompts.
        await expect(page.getByTestId('authoring-topbar').getByTestId('save')).toBeEnabled();

        // Wait out the debounced autosave: a late one would write a new autosave record
        // after the prompt's Save cleared the old one, and the reopened article would be dirty.
        await abstractAutosaved;

        await authoring.closeAndSave();

        await expect(page.getByTestId('authoring')).toBeHidden();
        await expect(withLabel(monitoringItems(page), SAVED.headline)).toBeVisible();
        await expect.poll(() => recordStatus(page, 'archive_autosave', articleId)).toBe(404);

        const results = await openGlobalSearch(page);

        await page.locator('#search-input').fill(SEARCH_TERM);
        await page.locator('#search-button').click();

        // The index updates asynchronously and the list refetches only when the search
        // parameters change, so re-clicking does nothing. Reload re-runs the URL's query.
        await expect(async () => {
            await page.reload();
            await expect(withLabel(results, SAVED.headline)).toBeVisible({timeout: 5000});
        }).toPass({timeout: 30000});

        await openSportsMonitoring(page, monitoring);
        await withLabel(monitoringItems(page), SAVED.headline).dblclick();

        await expect(page.getByTestId('authoring')).toBeVisible();
        await expectArticleFields(authoring, page, {...SAVED, abstract: UPDATED_ABSTRACT});

        await authoring.close();

        await expect(page.getByTestId('authoring')).toBeHidden();
    });
});
