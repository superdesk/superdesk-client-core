import {test, expect, type Locator, type Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {setEditor3FieldValue} from './utils/editor3';

/**
 * QA case "Create new article with a keyboard shortcut" (1310851155).
 *
 * Ctrl+M on the monitoring view creates an article from the active desk's default
 * content template and opens it for editing. The case is split by what happens to
 * that article: it is either thrown away (and then must exist nowhere) or kept.
 *
 * The article the shortcut creates already exists server-side before anything is
 * typed into it, so "not created" means the discard actually removed it; that is
 * why the discard test also queries global search rather than trusting the
 * monitoring list alone.
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

/** Matches ANCHOR_ARTICLE and both headlines above, so one query covers anchor and subject. */
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

        const topbar = page.getByTestId('authoring-topbar');

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
        await expect(withLabel(monitoringItems(page), DISCARDED.headline)).toHaveCount(0);

        const results = await openGlobalSearch(page);

        await page.locator('#search-input').fill(SEARCH_TERM);
        await page.locator('#search-button').click();

        await expect(withLabel(results, ANCHOR_ARTICLE)).toBeVisible();
        await expect(withLabel(results, DISCARDED.headline)).toHaveCount(0);
    });

    test('a saved article is listed, searchable, and reopens with its data', async ({page}) => {
        // the global-search retry below can outlast the 30s default on its own
        test.setTimeout(90000);

        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot();
        await openSportsMonitoring(page, monitoring);

        await monitoring.createArticleWithKeyboardShortcut();
        await fillArticleFields(authoring, page, SAVED);

        await authoring.save();

        // saving from the topbar keeps the article open; only Close leaves it
        await expect(page.getByTestId('authoring')).toBeVisible();
        await expect(withLabel(monitoringItems(page), SAVED.headline)).toBeVisible();

        await setEditor3FieldValue(authoring.field('authoring-field=abstract'), UPDATED_ABSTRACT);

        // Save re-enabling is the signal that the edit reached the article model,
        // which is what makes the "Save changes?" prompt appear on close
        await expect(page.getByTestId('authoring-topbar').getByTestId('save')).toBeEnabled();

        await authoring.closeAndSave();

        await expect(page.getByTestId('authoring')).toBeHidden();
        await expect(withLabel(monitoringItems(page), SAVED.headline)).toBeVisible();

        const results = await openGlobalSearch(page);

        await page.locator('#search-input').fill(SEARCH_TERM);

        // the article reaches the search index asynchronously, so re-run the query
        // instead of waiting for a list that will not update on its own
        await expect(async () => {
            await page.locator('#search-button').click();
            await expect(withLabel(results, SAVED.headline)).toBeVisible({timeout: 2000});
        }).toPass({timeout: 30000});

        await openSportsMonitoring(page, monitoring);
        await withLabel(monitoringItems(page), SAVED.headline).dblclick();

        await expect(page.getByTestId('authoring')).toBeVisible();
        await expectArticleFields(authoring, page, {...SAVED, abstract: UPDATED_ABSTRACT});

        await authoring.close();

        await expect(page.getByTestId('authoring')).toBeHidden();
    });
});
