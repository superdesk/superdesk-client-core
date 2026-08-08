import {test, expect, type Locator, type Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, SUPERDESK_API_URL} from './utils';
import {setEditor3FieldValue} from './utils/editor3';

/**
 * QA case "Create new article with a keyboard shortcut" (1310851155).
 *
 * Ctrl+M on the monitoring view creates an article from the active desk's default
 * content template and opens it for editing. The case is split by what happens to
 * that article: it is either thrown away (and then must exist nowhere) or kept.
 *
 * The shortcut persists the article to `archive` before anything is typed into it,
 * at version 0, and the typing that follows only reaches `archive_autosave`. Every
 * monitoring and search query filters version-0 drafts out, so the article is
 * missing from all lists whether or not the discard removed it. "Not created" is
 * therefore checked against the `archive` resource, which is the only place a
 * surviving stub would show.
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

/** Main-snapshot article of the Sports desk, used as the "list has loaded" anchor. */
const ANCHOR_ARTICLE = 'test sports story';

/** Matches SAVED.headline, and snapshot articles besides, so the filtered list is never empty. */
const SEARCH_TERM = 'story';

/**
 * Narrows a list of `article-item`s to the one labelled `label`.
 *
 * The label is the item's headline (`getArticleLabel` in core/utils), exposed as
 * `data-test-value`, which is an attribute rather than text so it cannot be matched
 * with `filter({hasText})`.
 */
function withLabel(items: Locator, label: string): Locator {
    return items.and(items.page().locator(`[data-test-value="${label}"]`));
}

function monitoringItems(page: Page): Locator {
    return page.getByTestId('monitoring-view').getByTestId('article-item');
}

/**
 * Opens the Sports monitoring view and waits for its list to carry ANCHOR_ARTICLE,
 * so that a later absence assertion cannot pass against a list that never loaded.
 */
async function openSportsMonitoring(page: Page, monitoring: Monitoring): Promise<void> {
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await expect(withLabel(monitoringItems(page), ANCHOR_ARTICLE)).toBeVisible();
}

/**
 * Opens global search and returns its result items, with the unfiltered list
 * awaited for the same reason as in `openSportsMonitoring`.
 */
async function openGlobalSearch(page: Page): Promise<Locator> {
    await page.goto('/#/search');

    const results = page.getByTestId('article-item');

    await expect(results.first()).toBeVisible();

    return results;
}

function sluglineField(page: Page): Locator {
    return page.getByTestId('authoring').getByTestId('field-slugline');
}

/** Id of the article authoring has open, from the `item` parameter opening one writes into the URL. */
function openArticleId(page: Page): string {
    const match = page.url().match(/[?&]item=([^&]+)/);

    if (match == null) {
        throw new Error(`no article is open in ${page.url()}`);
    }

    return decodeURIComponent(match[1]);
}

/**
 * Response status of `<resource>/<articleId>`, so 200 means the record exists and 404
 * means it is gone. Authenticated with the session token the client keeps in
 * localStorage, already in the form the API expects as an Authorization header.
 */
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

        // the article is already in archive at this point, which is what makes the
        // absence check after Ignore mean something
        expect(await recordStatus(page, 'archive', articleId)).toBe(200);

        // an article straight from the template has no edits of its own to persist
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

        // expected result 2 in full: Ignore took the stub back out of archive.
        // Polled because the delete is still in flight while the view closes
        await expect.poll(() => recordStatus(page, 'archive', articleId)).toBe(404);
    });

    test('a saved article is listed, searchable, and reopens with its data', async ({page}) => {
        // the global-search retry below can outlast the 30s default on its own
        test.setTimeout(90000);

        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot();
        await openSportsMonitoring(page, monitoring);

        await monitoring.createArticleWithKeyboardShortcut();

        const articleId = openArticleId(page);

        await fillArticleFields(authoring, page, SAVED);

        await authoring.save();

        // saving from the topbar keeps the article open; only Close leaves it
        await expect(page.getByTestId('authoring')).toBeVisible();
        await expect(withLabel(monitoringItems(page), SAVED.headline)).toBeVisible();

        const abstractAutosaved = page.waitForRequest(
            (request) => request.method() === 'POST' && request.url().includes('/archive_autosave'),
        );

        await setEditor3FieldValue(authoring.field('authoring-field=abstract'), UPDATED_ABSTRACT);

        // Save re-enabling is the signal that the edit reached the article model,
        // which is what makes the "Save changes?" prompt appear on close
        await expect(page.getByTestId('authoring-topbar').getByTestId('save')).toBeEnabled();

        /*
         * The edit also autosaves on a debounce. Waiting for that to fire before
         * closing leaves nothing pending that could write a fresh autosave record
         * after the prompt's Save has cleared the old one; such a record would make
         * the article dirty the moment it is reopened, and the clean close at the
         * end of this test is exactly what the case expects there.
         */
        await abstractAutosaved;

        await authoring.closeAndSave();

        await expect(page.getByTestId('authoring')).toBeHidden();
        await expect(withLabel(monitoringItems(page), SAVED.headline)).toBeVisible();
        await expect.poll(() => recordStatus(page, 'archive_autosave', articleId)).toBe(404);

        const results = await openGlobalSearch(page);

        await page.locator('#search-input').fill(SEARCH_TERM);
        await page.locator('#search-button').click();

        /*
         * The article reaches the search index asynchronously and the results list
         * refetches only when the search parameters change, so clicking the button
         * again with the same query would do nothing. Reloading re-runs the query
         * that is now in the URL, which is what lets the retry see the new item.
         */
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
