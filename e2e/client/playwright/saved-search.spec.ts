import {test, expect, Page} from '@playwright/test';
import {login, restoreDatabaseSnapshot, s} from './utils';

// 'legacy' snapshot replaces the user database; override storageState and
// log in fresh per test (same pattern as archived.spec.ts).
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

function items(page: Page) {
    return page.locator(s('article-item'));
}

function priorityFilters(page: Page) {
    return page.locator('[ng-repeat="(key,value) in aggregations.priority"]');
}

test('can save a private search', {
    annotation: [
        {type: 'confluence', description: '1318322985 complete'}, // Create a new private saved search
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'legacy'});
    await login(page);
    await openGlobalSearchListView(page);

    await expect(items(page)).toHaveCount(16);

    await openFilterPanel(page);
    await page.locator('#filters-tab').click();
    await expect(priorityFilters(page)).toHaveCount(3);

    await priorityFilters(page).first().click();
    await expect(items(page)).toHaveCount(1);

    await page.locator('#save_search_init').click();

    const panel = page.locator('.save-search-panel');

    await expect(panel).toBeVisible();
    await panel.locator('#search_name').fill('A Search');
    await panel.locator('#search_description').fill('Description for search');
    await panel.locator('#search_save').click();

    const userSavedSearches = page.locator('[ng-repeat^="search in userSavedSearches"]');

    await expect(userSavedSearches.first().locator('.search-name')).toContainText('A Search');
});

test('can save a global search and another user sees it', {
    annotation: [
        {type: 'confluence', description: '1318322983 complete'}, // Create a new global saved search
    ],
}, async ({browser, page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'legacy'});
    await login(page);
    await openGlobalSearchListView(page);

    await expect(items(page)).toHaveCount(16);

    await openFilterPanel(page);
    await page.locator('#filters-tab').click();
    await expect(priorityFilters(page)).toHaveCount(3);

    await priorityFilters(page).first().click();
    await expect(items(page)).toHaveCount(1);

    await page.locator('#save_search_init').click();

    const panel = page.locator('.save-search-panel');

    await expect(panel).toBeVisible();
    await panel.locator('#search_name').fill('A Global Search');
    await panel.locator('#search_description').fill('Description for search');
    await panel.locator('#search_global').click();
    await panel.locator('#search_save').click();

    const userSavedSearches = page.locator('[ng-repeat^="search in userSavedSearches"]');

    await expect(userSavedSearches.first().locator('.search-name')).toContainText('A Global Search');
    await expect(userSavedSearches.first().locator('.search-name')).toContainText('[Global]');

    // Fresh context emulates the Protractor logout + admin1 login flow.
    const admin1Context = await browser.newContext({storageState: {cookies: [], origins: []}});
    const admin1Page = await admin1Context.newPage();

    await admin1Page.goto('/');
    await admin1Page.locator(s('login-page', 'username')).fill('admin1');
    await admin1Page.locator(s('login-page', 'password')).fill('admin');
    await admin1Page.locator(s('login-page', 'submit')).click();

    await expect(admin1Page.locator(s('dashboard'))).toBeVisible({timeout: 15000});

    await openGlobalSearchListView(admin1Page);
    await openFilterPanel(admin1Page);
    await admin1Page.locator('#saved_searches_tab').click();

    const globalSavedSearches = admin1Page.locator('[ng-repeat^="search in globalSavedSearches"]');

    await expect(globalSavedSearches.first().locator('.search-name')).toContainText('A Global Search');
    await expect(globalSavedSearches.first().locator('.search-name')).toContainText('by first name last name');

    await admin1Context.close();
});
