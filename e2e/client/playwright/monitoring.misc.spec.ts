import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

/**
 * Preview pane:
 *  - clicking an article opens preview with the article's headline,
 *  - close button hides the preview.
 */
test('opening and closing the preview pane', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    const item = page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2'));

    await item.click();

    const preview = page.locator(s('authoring-preview'));

    await expect(preview).toBeVisible();
    await expect(preview).toContainText('story 2');

    await preview.locator('.close-preview').click();
    await expect(preview).not.toBeVisible();
});

/**
 * The preview pane closes when the previewed article is opened for editing
 * via the 3-dot menu.
 */
test('preview closes when the article is opened for editing', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    const item = page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2'));

    await item.click();

    const preview = page.locator(s('authoring-preview'));

    await expect(preview).toBeVisible();

    await monitoring.executeActionOnMonitoringItem(item, 'Edit');

    await expect(preview).not.toBeVisible();
});

/**
 * Upload-media item from the create dropdown opens the upload modal.
 */
test('open upload-media modal from the content-create menu', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.openMediaUploadView();

    await expect(page.locator('.upload-media')).toBeVisible();
});

/**
 * Searching the monitoring list narrows results across all groups to matching items.
 */
test('searching the monitoring list filters items across groups', {
    annotation: [
        {type: 'confluence', description: '1308524885 complete'}, // Search field (AUTOMATED)
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    const sportsStory = page.locator(s('article-item=test sports story'));

    await expect(sportsStory).toBeVisible();
    await expect(page.locator(s('article-item=story 2'))).toBeVisible();

    await page.locator('#search-input').fill('test sports story');
    await page.keyboard.press('Enter');

    await expect(sportsStory).toBeVisible();
    await expect(page.locator(s('article-item=story 2'))).toHaveCount(0);
});

/**
 * "Open" on a published item loads authoring with no Save and no Publish —
 * the fields are not directly editable. The Correct/Kill/Takedown workflow
 * buttons remain available (those are the only way to mutate a published item).
 */
test('Open on a published item loads authoring read-only', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('monitoring-group=Sports desk output', 'article-item=Story 5')),
        'Open',
    );

    const topbar = page.locator(s('authoring-topbar'));

    await expect(topbar).toBeVisible();
    // ng-show keeps action buttons in the DOM, so assert not-visible rather
    // than toHaveCount(0).
    await expect(topbar.locator(s('save'))).not.toBeVisible();
    await expect(topbar.locator(s('open-send-publish-pane'))).not.toBeVisible();
});

/**
 * Show personal: switching to personal space lists items the user owns personally.
 *
 * Given the main snapshot has "personal space article 1" in the admin's personal space,
 * When the user navigates to /workspace/personal,
 * Then that article is visible.
 */
test('show personal space items', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/personal');

    await expect(
        page.locator(s('monitoring-group=Personal Items', 'article-item=personal space article 1')),
    ).toBeVisible();
});
