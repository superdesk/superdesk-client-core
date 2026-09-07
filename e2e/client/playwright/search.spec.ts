import {test, expect, Page} from '@playwright/test';
import {login, restoreDatabaseSnapshot, s} from './utils';
import {Monitoring} from './page-object-models/monitoring';

test.use({storageState: {cookies: [], origins: []}});

async function openGlobalSearchListView(page: Page): Promise<void> {
    await page.goto('/#/search');
    await page.locator(s('view-select')).click();
    await page.locator(s('view-select'))
        .locator('.dropdown__menu')
        .getByRole('button', {name: 'List View'})
        .click();
}

async function openFilterPanel(page: Page): Promise<void> {
    if (await page.locator(s('repo--ingest')).count() === 0) {
        await page.locator('.filter-trigger').click();
    }
    await expect(page.locator(s('repo--ingest'))).toBeVisible();
}

async function openParametersTab(page: Page): Promise<void> {
    await openFilterPanel(page);
    await page.locator('#parameters-tab').click();
}

async function clickGoSearch(page: Page): Promise<void> {
    // The "Search" submit lives outside [data-test-id="advanced-search-panel"]
    // (rendered by sd-save-search as a sibling); scope to the parent aside.
    await page.locator('#advanced_search_filters button.search:visible').first().click();
}

async function submitRawSearch(page: Page): Promise<void> {
    // Raw search has no submit button; the textarea runs the query on ENTER.
    await page.locator(s('raw-query')).press('Enter');
}

async function clearFilters(page: Page): Promise<void> {
    await page.locator('#clear_filters').click();
}

function items(page: Page) {
    return page.locator(s('article-item'));
}

test.describe('global search (legacy snapshot)', () => {
    test.beforeEach(async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'legacy'});
        await login(page);
        await openGlobalSearchListView(page);
    });

    test('searches by free-text, byline, slugline, creator and ingest provider', {
        annotation: [
            {type: 'confluence', description: '1308524892 partial'}, // Advanced Search (Alice)
            {type: 'confluence', description: '1308524890 partial'}, // Search function
        ],
    }, async ({page}) => {
        await expect(items(page)).toHaveCount(16);

        await page.locator('#search-input').click();
        await page.locator('#search-input').fill('item3');
        await page.locator('#search-button').click();
        await expect(items(page)).toHaveCount(3);

        await openFilterPanel(page);
        await clearFilters(page);
        await expect(items(page)).toHaveCount(16);

        await openParametersTab(page);
        await page.locator('#search-byline').fill('Billy The Fish');
        await clickGoSearch(page);
        await expect(items(page)).toHaveCount(1);
        await clearFilters(page);
        await expect(items(page)).toHaveCount(16);

        await openParametersTab(page);
        await page.locator('#search-slugline').fill('one/two');
        await clickGoSearch(page);
        await expect(items(page)).toHaveCount(1);
        await clearFilters(page);
        await expect(items(page)).toHaveCount(16);

        await openParametersTab(page);
        await page.locator('#search-creator').selectOption({label: 'first name last name'});
        await clickGoSearch(page);
        await expect(items(page)).toHaveCount(12);
        await clearFilters(page);
        await expect(items(page)).toHaveCount(16);

        await openParametersTab(page);
        await page.locator('#search-ingest-provider').selectOption({label: 'aap'});
        await clickGoSearch(page);
        await expect(items(page)).toHaveCount(1);
    });

    test('toggles repo filters and runs a raw query', async ({page}) => {
        await openParametersTab(page);

        await page.locator(s('repo--ingest')).click();
        await expect(items(page)).toHaveCount(15);

        await page.locator(s('repo--production')).click();
        await expect(items(page)).toHaveCount(3);

        await page.locator(s('repo--archived')).click();
        await expect(items(page)).toHaveCount(0);

        await clearFilters(page);
        await page.locator(s('repo--production')).click();
        await page.locator(s('repo--archived')).click();

        await page.locator(s('raw-search-tab')).click();
        await page.locator(s('raw-query')).fill('type:text AND (item1 OR item4)');
        await submitRawSearch(page);
        await expect(items(page)).toHaveCount(0);
    });

    test('does not open preview pane when invoking Edit from the context menu', async ({page}) => {
        const monitoring = new Monitoring(page);

        await expect(items(page)).toHaveCount(16);

        const previewPane = page.locator(s('authoring-preview'));

        await expect(previewPane).toHaveCount(0);

        const item1 = page.locator(s('article-item=item1'));

        await expect(item1).toBeVisible();
        await monitoring.executeActionOnMonitoringItem(item1, 'Edit');

        await expect(page.locator(s('authoring'))).toBeVisible();
        await expect(previewPane).toHaveCount(0);

        await page.locator(s('authoring-topbar', 'close')).click();

        const item3 = page.locator(s('article-item=item3'));

        await item3.click();
        await expect(previewPane).toBeVisible();

        const item2 = page.locator(s('article-item=item2'));

        await monitoring.executeActionOnMonitoringItem(item2, 'Edit');

        await expect(page.locator(s('authoring'))).toBeVisible();
        await expect(previewPane).toHaveCount(0);
    });
});
