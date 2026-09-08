import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

/**
 * QA case "Open article in preview mode".
 *
 * A single click on a monitoring item opens the read-only preview pane. The pane
 * exposes the content/metadata/history tabs, the created/by/modified info line,
 * the 3-dot actions menu and the close control. Previewing must not lock the item
 * (no red stripe in the list) nor open it for editing.
 *
 * The Duplicates tab is intentionally not asserted: it only renders when the item
 * has related items (see ItemPreview's showRelatedTab), which the snapshot's
 * "test sports story" does not have.
 */
test.describe('opening an article in preview mode', {
    annotation: [
        {type: 'confluence', description: '1333690440 complete'}, // Item preview
    ],
}, () => {
    const ARTICLE = 'test sports story';

    test.beforeEach(async () => {
        await restoreDatabaseSnapshot();
    });

    test('single click previews the item read-only and the close icon dismisses it', {
        annotation: [
            {type: 'confluence', description: '1311835227 partial'}, // 🤖 Open article in preview mode (AUTOMATED)
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const item = monitoring.getArticleLocator(ARTICLE);

        // Wait for the list to populate (the post-restore reindex empties it briefly)
        // so the first click does not race the rebuild.
        await expect(item).toBeVisible();

        await item.click();

        const preview = monitoring.getPreviewPane();

        await expect(preview).toBeVisible();

        await expect(preview.getByRole('tab', {name: 'Content'})).toBeVisible();
        await expect(preview.getByRole('tab', {name: 'Metadata'})).toBeVisible();
        await expect(preview.getByRole('tab', {name: 'Item history'})).toBeVisible();

        await expect(preview.getByText('Created', {exact: true})).toBeVisible();
        await expect(preview.getByText('by', {exact: true})).toBeVisible();
        await expect(preview.getByText('Modified', {exact: true})).toBeVisible();

        // 3-dot actions menu (aria-label "More actions") and the close control.
        await expect(preview.getByRole('button', {name: 'More actions'})).toBeVisible();
        await expect(preview.getByRole('button', {name: 'Close preview'})).toBeVisible();

        // Content tab is active by default; headline and body prove content fields render.
        await expect(preview.getByTestId('field--headline')).toContainText(ARTICLE);
        await expect(preview.getByText('test sport story body')).toBeVisible();

        // Metadata tab: a metadata-only label and the slugline value prove the tab body renders.
        await monitoring.openPreviewTab('Metadata');
        await expect(preview.getByText('Word Count', {exact: true})).toBeVisible();
        await expect(preview.getByText(ARTICLE)).toBeVisible();

        // Item history tab: the snapshot item has history, so at least one entry renders.
        await monitoring.openPreviewTab('Item history');
        await expect(preview.getByTestId('history-item').first()).toBeVisible();

        // Preview must not lock the item: no `locked` class (the red stripe) in the
        // list and no authoring editor opened.
        await expect(item.locator('.locked')).toHaveCount(0);
        await expect(page.getByTestId('authoring-topbar')).toHaveCount(0);

        await preview.getByRole('button', {name: 'Close preview'}).click();

        await expect(preview).not.toBeVisible();
    });
});
