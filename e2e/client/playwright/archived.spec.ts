import {test, expect} from '@playwright/test';
import {login, restoreDatabaseSnapshot, s} from './utils';

// The 'legacy' snapshot replaces the user database too, which invalidates
// the storageState the suite uses for 'main', so this whole file logs in
// fresh each test.
test.use({storageState: {cookies: [], origins: []}});

async function openSearchAndShowOnlyArchived(page: import('@playwright/test').Page): Promise<void> {
    await page.goto('/#/search');

    // Switch to list view so context menu actions and previews behave consistently.
    // The dropdown's toggle and the menu's option both have the name "List View",
    // so scope the menu pick to within the menu.
    await page.locator(s('view-select')).click();
    await page.locator(s('view-select')).locator('.dropdown__menu')
        .getByRole('button', {name: 'List View'}).click();

    // Open the filter side panel if it isn't already open. The repo toggles
    // live inside it.
    if (await page.locator(s('repo--archived')).count() === 0) {
        await page.locator('.filter-trigger').click();
    }

    // Leave only the Archived repo selected so we list archived items only.
    await page.locator(s('repo--ingest')).click();
    await page.locator(s('repo--production')).click();
    await page.locator(s('repo--published')).click();
}

test('archived items are listed under the Archived repo filter and open in preview', async ({page}) => {
    // The 'main' snapshot has no items in the archived repo; fall back to the
    // 'legacy' snapshot the Protractor suite used for the same scenario, and
    // log in fresh since storageState targets the 'main' user database.
    await restoreDatabaseSnapshot({snapshotName: 'legacy'});
    await login(page);
    await openSearchAndShowOnlyArchived(page);

    // The Archived repo isn't empty in the main snapshot; at least one item
    // should appear after the filter is applied.
    const items = page.locator(s('article-item'));

    await expect(items.first()).toBeVisible();

    const firstItem = items.first();
    const firstItemHeadline = await firstItem.getAttribute('data-test-value');

    expect(firstItemHeadline).not.toBeNull();

    await firstItem.click();

    await expect(
        page.locator(s('authoring-preview', 'field--headline')),
    ).toHaveText(firstItemHeadline!);
});

test(
    'archived items open as read-only authoring (Close visible, no Save/Edit/Correct/Kill/Takedown/Send)',
    async ({page}) => {
    // The 'main' snapshot has no items in the archived repo; fall back to the
    // 'legacy' snapshot the Protractor suite used for the same scenario, and
    // log in fresh since storageState targets the 'main' user database.
        await restoreDatabaseSnapshot({snapshotName: 'legacy'});
        await login(page);
        await openSearchAndShowOnlyArchived(page);

        const items = page.locator(s('article-item'));

        await expect(items.first()).toBeVisible();

        const firstItem = items.first();

        await firstItem.hover();
        await firstItem.locator(s('context-menu-button')).click();
        await page.locator(s('context-menu')).getByRole('button', {name: 'Open', exact: true}).click();

        const topbar = page.locator(s('authoring-topbar'));

        await expect(topbar).toBeVisible();
        await expect(topbar.locator(s('close'))).toBeVisible();

        // Save / Edit / Correct / Kill / Takedown / Send-To-Publish / Create-new buttons
        // must not be available on an archived (read-only) item. `data-test-id="save"` and
        // `data-test-id="open-send-publish-pane"` exist in the topbar markup; the
        // remaining buttons are identified by role+name (assertions, not
        // interactions). Some of the action buttons stay in the DOM but
        // get hidden via ng-show, so .not.toBeVisible() is the right check.
        await expect(topbar.locator(s('save'))).not.toBeVisible();
        await expect(topbar.locator(s('open-send-publish-pane'))).not.toBeVisible();
        await expect(topbar.getByRole('button', {name: 'Edit', exact: true})).not.toBeVisible();
        await expect(topbar.getByRole('button', {name: 'Correct', exact: true})).not.toBeVisible();
        await expect(topbar.getByRole('button', {name: 'Kill', exact: true})).not.toBeVisible();
        await expect(topbar.getByRole('button', {name: 'Takedown', exact: true})).not.toBeVisible();
        await expect(page.locator(s('content-create'))).not.toBeVisible();
    },
);
